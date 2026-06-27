'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/context/ToastContext';
import { Eye, Edit, Trash2, FileText } from 'lucide-react';
import DashboardRefreshButton from '@/components/DashboardRefreshButton';
import InvoiceModal from '@/components/InvoiceModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'قيد الانتظار', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  confirmed: { label: 'مؤكد', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  processing: { label: 'قيد التجهيز', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' },
  shipped: { label: 'تم الشحن', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/30' },
  delivered: { label: 'تم التوصيل', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  cancelled: { label: 'ملغي', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
};

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  shipping_cost?: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  transfer_receipt_url?: string | null;
  sender_name?: string | null;
  sender_bank?: string | null;
  sender_account?: string | null;
  payment_method?: string | null;
  is_test?: boolean | null;
  customers: { name: string; phone: string; additional_phone?: string | null; city?: string | null; address?: string | null } | null;
  order_items: { id: string; product_name: string | null; quantity: number; unit_price: number; total_price: number }[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingTestOrders, setDeletingTestOrders] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [flashOrderIds, setFlashOrderIds] = useState<Set<string>>(new Set());   // وميض مؤقت 3 ثوانٍ
  const [readOrderIds, setReadOrderIds] = useState<Set<string>>(new Set());     // مقروء من localStorage
  const [unreadThreshold, setUnreadThreshold] = useState<string>('');          // آخر وقت زيارة
  const { showToast } = useToast();

  const isDev = process.env.NODE_ENV === 'development';

  // ── تحميل وحفظ حالة القراءة ──────────────────────────────────────────────
  useEffect(() => {
    const lastVisit = localStorage.getItem('orders_last_visit') ?? '';
    const storedRead = localStorage.getItem('orders_read_ids');
    setUnreadThreshold(lastVisit);
    if (storedRead) setReadOrderIds(new Set(JSON.parse(storedRead)));
    // حدّث وقت الزيارة ليُستخدم عند الزيارة القادمة
    localStorage.setItem('orders_last_visit', new Date().toISOString());
  }, []);

  /** هل الطلب غير مقروء؟ */
  const isUnread = (order: Order) =>
    !readOrderIds.has(order.id) &&
    unreadThreshold !== '' &&
    new Date(order.created_at) > new Date(unreadThreshold);

  /** اضبط الطلب كمقروء وأزل أي تمييز بصري فوراً */
  const markAsRead = (orderId: string) => {
    setReadOrderIds(prev => {
      const next = new Set([...prev, orderId]);
      localStorage.setItem('orders_read_ids', JSON.stringify([...next]));
      return next;
    });
    // أزل الوميض الأخضر المؤقت فوراً إن كان نشطاً
    setFlashOrderIds(prev => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  };

  const handleDeleteAllTestOrders = async () => {
    const testOrders = orders.filter(o => o.is_test);
    if (testOrders.length === 0) { showToast('لا توجد طلبات تجريبية', 'info'); return; }
    if (!confirm(`سيتم حذف ${testOrders.length} طلب تجريبي نهائياً. هل أنت متأكد؟`)) return;
    setDeletingTestOrders(true);
    const { error } = await supabase.from('orders').delete().eq('is_test', true);
    if (!error) {
      setOrders(prev => prev.filter(o => !o.is_test));
      showToast(`تم حذف ${testOrders.length} طلب تجريبي`, 'success');
    } else {
      showToast('فشل حذف الطلبات التجريبية', 'error');
    }
    setDeletingTestOrders(false);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          id, order_number, status, subtotal, discount_amount, shipping_cost, total_amount, notes, created_at, transfer_receipt_url, sender_name, sender_bank, sender_account, payment_method, is_test,
          customers(name, phone, additional_phone, city, address),
          order_items(id, product_name, quantity, unit_price, total_price)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter) query = query.eq('status', statusFilter);

      const { data, error } = await query;
      if (error) throw error;
      setOrders((data as any) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Realtime subscription ─────────────────────────────────────────────────
  const ORDER_SELECT = `
    id, order_number, status, subtotal, discount_amount, shipping_cost, total_amount, notes, created_at,
    transfer_receipt_url, sender_name, sender_bank, sender_account, payment_method, is_test,
    customers(name, phone, additional_phone, city, address),
    order_items(id, product_name, quantity, unit_price, total_price)
  `;

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          // جلب بيانات الطلب كاملةً مع الـ joins
          const { data } = await supabase
            .from('orders')
            .select(ORDER_SELECT)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setOrders(prev => [data as any, ...prev]);
            // وميض أخضر مؤقت 3 ثوانٍ للفت الانتباه
            setFlashOrderIds(prev => new Set([...prev, (data as any).id]));
            setTimeout(() => {
              setFlashOrderIds(prev => { const s = new Set(prev); s.delete((data as any).id); return s; });
            }, 3000);
            showToast(`🔔 طلب جديد: ${(data as any).order_number}`, 'success');
          }
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders(prev => prev.map(o =>
            o.id === payload.new.id ? { ...o, ...(payload.new as Partial<Order>) } : o
          ));
          setSelectedOrder(prev =>
            prev?.id === payload.new.id ? ({ ...prev, ...(payload.new as Partial<Order>) } as Order) : prev
          );
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          setSelectedOrder(prev => prev?.id === payload.old.id ? null : prev);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED')   setRealtimeStatus('connected');
        else if (status === 'CLOSED')  setRealtimeStatus('disconnected');
        else                           setRealtimeStatus('connecting');
      });

    return () => { supabase.removeChannel(channel); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      showToast('تم تحديث حالة الطلب', 'success');
    } else {
      showToast('فشل تحديث الحالة', 'error');
    }
    setUpdatingStatus(false);
  };

  const handleDeleteOrder = (orderId: string) => {
    setDeleteConfirm({ open: true, id: orderId });
  };

  const confirmDeleteOrder = async () => {
    const orderId = deleteConfirm.id;
    if (!orderId) return;
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (!error) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      showToast('تم حذف الطلب بنجاح', 'success');
    } else {
      showToast('فشل حذف الطلب', 'error');
    }
    setDeleteConfirm({ open: false, id: '' });
  };

  const handleBulkDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.length} طلب/طلبات؟`)) return;
    const { error } = await supabase.from('orders').delete().in('id', selectedIds);
    if (!error) {
      setOrders(prev => prev.filter(o => !selectedIds.includes(o.id)));
      showToast('تم حذف الطلبات المحددة', 'success');
      setSelectedIds([]);
    } else {
      showToast('فشل حذف الطلبات', 'error');
    }
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.customers?.name.toLowerCase().includes(q) ||
      o.customers?.phone.includes(q)
    );
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_amount, 0),
  };

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-3xl font-bold text-white">الطلبات</h1>
            {/* مؤشر Realtime */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium
              transition-all duration-500
              {realtimeStatus === 'connected'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : realtimeStatus === 'connecting'
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
              }"
              style={{
                backgroundColor: realtimeStatus === 'connected' ? 'rgba(34,197,94,0.1)' : realtimeStatus === 'connecting' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                borderColor:     realtimeStatus === 'connected' ? 'rgba(34,197,94,0.3)'  : realtimeStatus === 'connecting' ? 'rgba(234,179,8,0.3)'  : 'rgba(239,68,68,0.3)',
                color:           realtimeStatus === 'connected' ? 'rgb(74,222,128)'      : realtimeStatus === 'connecting' ? 'rgb(250,204,21)'      : 'rgb(248,113,113)',
              }}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                realtimeStatus === 'connected'   ? 'bg-green-400 animate-pulse' :
                realtimeStatus === 'connecting'  ? 'bg-yellow-400 animate-pulse' :
                                                   'bg-red-400'
              }`} />
              {realtimeStatus === 'connected'  ? 'مباشر' :
               realtimeStatus === 'connecting' ? 'جاري الاتصال...' : 'غير متصل'}
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            إدارة طلبات المتجر ({orders.length} طلب)
            {orders.filter(isUnread).length > 0 && (
              <span className="mr-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-luxury-gold/15 text-luxury-gold border border-luxury-gold/30">
                {orders.filter(isUnread).length} غير مقروء
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isDev && (
            <button
              onClick={handleDeleteAllTestOrders}
              disabled={deletingTestOrders}
              title="حذف كل الطلبات التجريبية دفعة واحدة"
              className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-dashed border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingTestOrders ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <span>🧪</span>
              )}
              حذف الطلبات التجريبية
              {orders.filter(o => o.is_test).length > 0 && (
                <span className="bg-purple-500/30 text-purple-200 text-xs px-1.5 py-0.5 rounded-full">
                  {orders.filter(o => o.is_test).length}
                </span>
              )}
            </button>
          )}
          <DashboardRefreshButton onRefresh={fetchOrders} loading={loading} />
          <Link href="/dashboard/orders/new"
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold/80 transition-colors inline-flex items-center justify-center gap-2 text-sm">
            <span>+</span> إضافة طلب يدوي
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الطلبات', value: stats.total, icon: '📦', color: 'text-white' },
          { label: 'قيد الانتظار', value: stats.pending, icon: '⏳', color: 'text-yellow-400' },
          { label: 'تم التوصيل', value: stats.delivered, icon: '✅', color: 'text-green-400' },
          { label: 'الإيرادات', value: `${stats.revenue.toFixed(0)} ر.س`, icon: '💰', color: 'text-luxury-gold' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-gray-400 text-sm">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-luxury-gold/10 border border-luxury-gold/30 rounded-sm p-4 flex items-center justify-between">
          <span className="text-luxury-gold font-bold">تم تحديد {selectedIds.length} طلب</span>
          <button onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-sm transition-colors text-sm">
            حذف المحددين
          </button>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="بحث برقم الطلب أو اسم العميل..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none">
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-luxury-gold" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {search || statusFilter ? 'لا توجد نتائج' : 'لا توجد طلبات بعد'}
          </div>
        ) : (
          <>
            {/* ── Mobile Cards (hidden on md+) ── */}
            <div className="md:hidden divide-y divide-luxury-gold/10">
              {filtered.map((order, i) => {
                const st = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                return (
                  <motion.div key={order.id}
                    initial={{ opacity: 0, x: flashOrderIds.has(order.id) ? -10 : 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: flashOrderIds.has(order.id) ? 0 : i * 0.03 }}
                    className={`p-4 transition-colors duration-500 ${
                      flashOrderIds.has(order.id)
                        ? 'bg-green-500/8 border-r-2 border-green-400/60'
                        : isUnread(order)
                        ? 'bg-white/[0.035] border-r-2 border-luxury-gold/50'
                        : selectedIds.includes(order.id)
                        ? 'bg-luxury-gold/5'
                        : ''
                    }`}>
                    {/* Row 1: checkbox + order number + status badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={e => {
                            const checked = e.target.checked;
                            setSelectedIds(prev => checked ? [...prev, order.id] : prev.filter(id => id !== order.id));
                          }}
                          className="accent-luxury-gold w-4 h-4 cursor-pointer" />
                        {isUnread(order) && (
                          <span className="w-2 h-2 rounded-full bg-luxury-gold flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`font-mono text-luxury-gold text-sm ${isUnread(order) ? 'font-bold' : ''}`}>
                          {order.order_number}
                        </span>
                        {flashOrderIds.has(order.id) && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/40 animate-pulse">
                            ● جديد
                          </span>
                        )}
                        {order.is_test && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            🧪 تجريبي
                          </span>
                        )}
                      </div>
                      <span className={`whitespace-nowrap px-2 py-0.5 rounded-sm text-xs border ${st.bg} ${st.color}`}>
                        {st.label}
                      </span>
                    </div>

                    {/* Row 2: customer name + phone + payment method */}
                    <div className="mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-white font-medium text-sm">{order.customers?.name || '—'}</div>
                        {order.payment_method === 'cod' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            الدفع عند الاستلام
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs">{order.customers?.phone}</div>
                    </div>

                    {/* Row 3: products summary */}
                    <div className="text-gray-400 text-xs mb-2">
                      {order.order_items.slice(0, 1).map(item => (
                        <span key={item.id}>{item.product_name || 'منتج'} × {item.quantity}</span>
                      ))}
                      {order.order_items.length > 1 && <span className="text-gray-500"> +{order.order_items.length - 1} أخرى</span>}
                    </div>

                    {/* Row 4: amount + date + actions */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-luxury-gold font-bold text-sm">{order.total_amount.toFixed(0)} ر.س</span>
                        <div className="text-gray-500 text-xs mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('ar-SA')}
                          <span className="mr-1.5 text-gray-600">{new Date(order.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setSelectedOrder(order); markAsRead(order.id); }} title="تفاصيل"
                          className="p-1.5 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => setInvoiceOrder(order)} title="إصدار فاتورة"
                          className="p-1.5 bg-white/10 text-gray-300 border border-white/20 rounded-sm hover:bg-white/20 transition-colors">
                          <FileText size={14} />
                        </button>
                        <Link href={`/dashboard/orders/${order.id}/edit`} title="تعديل"
                          className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-sm hover:bg-blue-500/20 transition-colors">
                          <Edit size={14} />
                        </Link>
                        <button onClick={() => handleDeleteOrder(order.id)} title="حذف"
                          className="p-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-sm hover:bg-red-500/20 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ── Desktop Table (hidden on mobile) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-luxury-gold/20">
                    <th className="p-4 w-12 text-center">
                      <input type="checkbox"
                        checked={filtered.length > 0 && selectedIds.length === filtered.length}
                        onChange={e => setSelectedIds(e.target.checked ? filtered.map(o => o.id) : [])}
                        className="accent-luxury-gold w-4 h-4 cursor-pointer" />
                    </th>
                    {['رقم الطلب', 'العميل', 'المنتجات', 'المبلغ', 'الحالة', 'التاريخ', 'إجراءات'].map(h => (
                      <th key={h} className="text-right text-gray-400 font-medium p-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, i) => {
                    const st = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                    return (
                      <motion.tr key={order.id}
                        initial={{ opacity: 0, y: flashOrderIds.has(order.id) ? -8 : 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: flashOrderIds.has(order.id) ? 0 : i * 0.03 }}
                        className={`border-b border-luxury-gold/10 transition-colors duration-500 ${
                          flashOrderIds.has(order.id)
                            ? 'bg-green-500/8 border-r-2 border-r-green-400/60'
                            : isUnread(order)
                            ? 'bg-white/[0.035] border-r-2 border-r-luxury-gold/50'
                            : selectedIds.includes(order.id)
                            ? 'bg-luxury-gold/5'
                            : 'hover:bg-luxury-gold/5'
                        }`}>
                        <td className="p-4 text-center">
                          <input type="checkbox"
                            checked={selectedIds.includes(order.id)}
                            onChange={e => {
                              const checked = e.target.checked;
                              setSelectedIds(prev => checked ? [...prev, order.id] : prev.filter(id => id !== order.id));
                            }}
                            className="accent-luxury-gold w-4 h-4 cursor-pointer" />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {isUnread(order) && (
                              <span className="w-2 h-2 rounded-full bg-luxury-gold flex-shrink-0" />
                            )}
                            <span className={`font-mono text-luxury-gold text-sm ${isUnread(order) ? 'font-bold' : ''}`}>
                              {order.order_number}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {flashOrderIds.has(order.id) && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/40 animate-pulse">
                                ● جديد
                              </span>
                            )}
                            {order.is_test && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                🧪 تجريبي
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-medium">{order.customers?.name || '—'}</span>
                            {order.payment_method === 'cod' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30 whitespace-nowrap">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                الدفع عند الاستلام
                              </span>
                            )}
                          </div>
                          <div className="text-gray-500 text-sm">{order.customers?.phone}</div>
                        </td>
                        <td className="p-4 text-gray-300 text-sm">
                          {order.order_items.slice(0, 2).map(item => (
                            <div key={item.id}>{item.product_name || 'منتج'} × {item.quantity}</div>
                          ))}
                          {order.order_items.length > 2 && (
                            <div className="text-gray-500">+{order.order_items.length - 2} أخرى</div>
                          )}
                        </td>
                        <td className="p-4 text-luxury-gold font-bold">{order.total_amount.toFixed(0)} ر.س</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center justify-center whitespace-nowrap px-2 py-1 rounded-sm text-xs border ${st.bg} ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="text-gray-400 text-sm">{new Date(order.created_at).toLocaleDateString('ar-SA')}</div>
                          <div className="text-gray-600 text-xs mt-0.5">{new Date(order.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setSelectedOrder(order); markAsRead(order.id); }} title="تفاصيل"
                              className="p-2 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => setInvoiceOrder(order)} title="إصدار فاتورة"
                              className="p-2 bg-white/10 text-gray-300 border border-white/20 rounded-sm hover:bg-white/20 transition-colors">
                              <FileText size={16} />
                            </button>
                            <Link href={`/dashboard/orders/${order.id}/edit`} title="تعديل"
                              className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-sm hover:bg-blue-500/20 transition-colors">
                              <Edit size={16} />
                            </Link>
                            <button onClick={() => handleDeleteOrder(order.id)} title="حذف"
                              className="p-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-sm hover:bg-red-500/20 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>


      {/* Order Detail Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-luxury-gold/30 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-luxury-gold/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-luxury-gold">{selectedOrder.order_number}</h2>
                    {selectedOrder.is_test && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        🧪 طلب تجريبي
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    {new Date(selectedOrder.created_at).toLocaleString('ar-SA')}
                  </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer */}
                <div>
                  <h3 className="text-gray-400 text-sm mb-2 font-medium">معلومات العميل</h3>
                  <div className="bg-luxury-black/50 rounded-sm p-4 space-y-3">
                    <div className="flex flex-col">
                      <span className="text-white font-medium text-lg">{selectedOrder.customers?.name || '—'}</span>
                      <span className="text-gray-400 text-sm mt-1 text-right w-full" dir="ltr">{selectedOrder.customers?.phone}</span>
                    </div>

                    <div className="pt-3 border-t border-luxury-gold/10">
                      <span className="text-gray-400 text-sm block mb-1">العنوان:</span>
                      <span className="text-white text-sm">
                        {[selectedOrder.customers?.city || '', selectedOrder.customers?.address || ''].filter(Boolean).join(' - ') || '—'}
                      </span>
                    </div>

                    {selectedOrder.customers?.additional_phone && (
                      <div className="pt-3 border-t border-luxury-gold/10">
                        <span className="text-gray-400 text-sm block mb-1">رقم الجوال الاضافي:</span>
                        <div className="text-white text-sm text-right w-full" dir="ltr">{selectedOrder.customers.additional_phone}</div>
                      </div>
                    )}

                    {selectedOrder.notes && (
                      <div className="pt-3 border-t border-luxury-gold/10">
                        <span className="text-gray-400 text-sm block mb-1">الملاحظات:</span>
                        <span className="text-white text-sm whitespace-pre-line">{selectedOrder.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method Badge */}
                <div>
                  <h3 className="text-gray-400 text-sm mb-2 font-medium">طريقة الدفع</h3>
                  <div className="bg-luxury-black/50 rounded-sm p-3">
                    {selectedOrder.payment_method === 'cod' ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        الدفع عند الاستلام
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-bold bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        التحويل البنكي
                      </span>
                    )}
                  </div>
                </div>

                {/* Transfer/Payment Details */}
                {(selectedOrder.transfer_receipt_url || selectedOrder.sender_name) && (
                  <div>
                    <h3 className="text-gray-400 text-sm mb-2 font-medium">بيانات التحويل البنكي</h3>
                    <div className="bg-luxury-black/50 border border-luxury-gold/20 rounded-sm p-4 text-sm">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-gray-500 block mb-1">اسم صاحب الحساب</span>
                          <span className="text-white">{selectedOrder.sender_name || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block mb-1">البنك</span>
                          <span className="text-white">{selectedOrder.sender_bank || '—'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500 block mb-1">رقم الحساب</span>
                          <span className="text-luxury-gold font-mono" dir="ltr">{selectedOrder.sender_account || '—'}</span>
                        </div>
                      </div>

                      {selectedOrder.transfer_receipt_url && (
                        <div className="pt-3 border-t border-luxury-gold/10">
                          <a href={selectedOrder.transfer_receipt_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2 bg-luxury-gold/10 hover:bg-luxury-gold text-luxury-gold hover:text-luxury-black border border-luxury-gold/30 rounded transition-colors font-medium">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            عرض الإيصال المرفق
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Changer */}
                <div>
                  <h3 className="text-gray-400 text-sm mb-2 font-medium">تغيير الحالة</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <button key={k} disabled={updatingStatus || selectedOrder.status === k}
                        onClick={() => handleStatusChange(selectedOrder.id, k)}
                        className={`px-3 py-1.5 rounded-sm text-sm border transition-all ${selectedOrder.status === k
                          ? `${v.bg} ${v.color} border-current`
                          : 'border-gray-700 text-gray-400 hover:border-luxury-gold/30 hover:text-white'
                          } disabled:opacity-50`}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-gray-400 text-sm mb-2 font-medium">المنتجات ({selectedOrder.order_items.length})</h3>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-luxury-black/50 rounded-sm p-3">
                        <div>
                          <div className="text-white">{item.product_name || 'منتج'}</div>
                          <div className="text-gray-400 text-sm">{item.quantity} × {item.unit_price} ر.س</div>
                        </div>
                        <div className="text-luxury-gold font-bold">{item.total_price.toFixed(0)} ر.س</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-luxury-gold/20 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-400">
                    <span>المجموع الفرعي</span>
                    <span>{selectedOrder.subtotal.toFixed(0)} ر.س</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>الخصم</span>
                      <span>-{selectedOrder.discount_amount.toFixed(0)} ر.س</span>
                    </div>
                  )}
                  {(selectedOrder.shipping_cost ?? 0) > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>رسوم التوصيل</span>
                      <span>{(selectedOrder.shipping_cost ?? 0).toFixed(0)} ر.س</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>الإجمالي</span>
                    <span className="text-luxury-gold">{selectedOrder.total_amount.toFixed(0)} ر.س</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-luxury-gold/30 rounded-sm p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-white mb-2">تأكيد الحذف</h3>
              <p className="text-gray-400 mb-6">هل أنت متأكد من حذف هذا الطلب نهائياً؟ تفاصيل هذا الطلب لن يمكن استعادتها.</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm({ open: false, id: '' })}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 rounded-sm hover:border-gray-500 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDeleteOrder}
                  className="flex-1 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/30 font-bold rounded-sm hover:bg-red-500/20 transition-colors"
                >
                  نعم، احذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
