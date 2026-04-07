'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/context/ToastContext';
import { Eye, Edit, Trash2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'قيد الانتظار', color: 'text-yellow-400',  bg: 'bg-yellow-400/10 border-yellow-400/30' },
  confirmed:  { label: 'مؤكد',         color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/30' },
  processing: { label: 'قيد التجهيز',  color: 'text-purple-400',  bg: 'bg-purple-400/10 border-purple-400/30' },
  shipped:    { label: 'تم الشحن',     color: 'text-cyan-400',    bg: 'bg-cyan-400/10 border-cyan-400/30' },
  delivered:  { label: 'تم التوصيل',  color: 'text-green-400',   bg: 'bg-green-400/10 border-green-400/30' },
  cancelled:  { label: 'ملغي',         color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/30' },
};

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  customers: { name: string; phone: string; city?: string | null; address?: string | null } | null;
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
  const { showToast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          id, order_number, status, subtotal, discount_amount, total_amount, notes, created_at,
          customers(name, phone, city, address),
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
    <div className="space-y-6" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">الطلبات</h1>
          <p className="text-gray-400">إدارة طلبات المتجر ({orders.length} طلب)</p>
        </div>
        <Link href="/dashboard/orders/new"
          className="px-6 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold/80 transition-colors inline-flex items-center gap-2">
          <span>+</span> إضافة طلب يدوي
        </Link>
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
          <div className="overflow-x-auto">
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
                    <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`border-b border-luxury-gold/10 hover:bg-luxury-gold/5 transition-colors ${selectedIds.includes(order.id) ? 'bg-luxury-gold/5' : ''}`}>
                      <td className="p-4 text-center">
                        <input type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={e => {
                            const checked = e.target.checked;
                            setSelectedIds(prev => checked ? [...prev, order.id] : prev.filter(id => id !== order.id));
                          }}
                          className="accent-luxury-gold w-4 h-4 cursor-pointer" />
                      </td>
                      <td className="p-4 font-mono text-luxury-gold text-sm">{order.order_number}</td>
                      <td className="p-4">
                        <div className="text-white font-medium">{order.customers?.name || '—'}</div>
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
                        <span className={`px-2 py-1 rounded-sm text-xs border ${st.bg} ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedOrder(order)} title="تفاصيل"
                            className="p-2 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors">
                            <Eye size={16} />
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
                  <h2 className="text-xl font-bold text-luxury-gold">{selectedOrder.order_number}</h2>
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
                  <div className="bg-luxury-black/50 rounded-sm p-4 space-y-2">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{selectedOrder.customers?.name || '—'}</span>
                      <span className="text-gray-400 text-sm mt-1">{selectedOrder.customers?.phone}</span>
                    </div>
                    
                    {/* Conditionally render address */}
                    {(selectedOrder.customers?.city || selectedOrder.customers?.address) && (
                      <div className="pt-2 border-t border-luxury-gold/10 mt-2">
                        <span className="text-gray-400 text-sm block mb-1">العنوان:</span>
                        <span className="text-white text-sm">
                          {[selectedOrder.customers?.city, selectedOrder.customers?.address].filter(Boolean).join(' - ')}
                        </span>
                      </div>
                    )}

                    {/* Conditionally render notes */}
                    {selectedOrder.notes && (
                      <div className="pt-2 border-t border-luxury-gold/10 mt-2">
                        <span className="text-gray-400 text-sm block mb-1">ملاحظات الطلب / الجوال الإضافي:</span>
                        <span className="text-white text-sm whitespace-pre-line">{selectedOrder.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Changer */}
                <div>
                  <h3 className="text-gray-400 text-sm mb-2 font-medium">تغيير الحالة</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <button key={k} disabled={updatingStatus || selectedOrder.status === k}
                        onClick={() => handleStatusChange(selectedOrder.id, k)}
                        className={`px-3 py-1.5 rounded-sm text-sm border transition-all ${
                          selectedOrder.status === k
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
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>الإجمالي</span>
                    <span className="text-luxury-gold">{selectedOrder.total_amount.toFixed(0)} ر.س</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <h3 className="text-gray-400 text-sm mb-2 font-medium">ملاحظات</h3>
                    <p className="text-gray-300 bg-luxury-black/50 rounded-sm p-3">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
