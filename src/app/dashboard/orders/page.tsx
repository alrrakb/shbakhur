'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/context/ToastContext';
import {
  Eye,
  Edit,
  Trash2,
  FileText,
  Printer,
  Copy,
  Check,
  Truck,
  Package,
  RotateCcw,
  PlusCircle,
  Settings,
  X,
  FlaskConical,
  Search,
  Clock,
  Cog,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import DashboardRefreshButton from '@/components/DashboardRefreshButton';
import InvoiceModal from '@/components/InvoiceModal';
import { getShippingSettings, saveShippingSettings, type ShippingSettings, DEFAULT_SHIPPING_SETTINGS } from '@/lib/database';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; step: number }> = {
  pending: { label: 'قيد الانتظار', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', step: 1 },
  confirmed: { label: 'مؤكد', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30', step: 1 },
  processing: { label: 'قيد التجهيز', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30', step: 2 },
  shipped: { label: 'تم الشحن', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/30', step: 3 },
  delivered: { label: 'تم التوصيل', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30', step: 4 },
  cancelled: { label: 'ملغي', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', step: 0 },
};

const ORDER_STEPS = [
  { step: 1, key: 'pending', title: 'طلب جديد', desc: 'تم استلام الطلب' },
  { step: 2, key: 'processing', title: 'قيد التجهيز', desc: 'تجهيز وتغليف المنتجات' },
  { step: 3, key: 'shipped', title: 'تم الشحن', desc: 'إصدار البوليصة وتسليم المندوب' },
  { step: 4, key: 'delivered', title: 'تم التوصيل', desc: 'استلام العميل للشحنة' },
];

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
  tracking_number?: string | null;
  shipping_carrier?: string | null;
  bolesa_pdf_url?: string | null;
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
  const [flashOrderIds, setFlashOrderIds] = useState<Set<string>>(new Set());
  const [readOrderIds, setReadOrderIds] = useState<Set<string>>(new Set());
  const [unreadThreshold, setUnreadThreshold] = useState<string>('');
  const [copiedTracking, setCopiedTracking] = useState(false);
  const { showToast } = useToast();

  // Manual Shipping Modal State
  const [manualModal, setManualModal] = useState<{ open: boolean; orderId: string; tracking: string; carrier: string }>({
    open: false,
    orderId: '',
    tracking: '',
    carrier: 'بوليصة (Bolesa)',
  });
  const [manualSaving, setManualSaving] = useState(false);

  // ── Shipping & Free Shipping Global Settings Modal ─────────────────────────
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
  const [savingShippingSettings, setSavingShippingSettings] = useState(false);

  // تحميل إعدادات الشحن عند فتح الصفحة
  const loadShippingSettings = useCallback(async () => {
    try {
      const settings = await getShippingSettings();
      setShippingSettings(settings);
    } catch (err) {
      console.error('Failed to load shipping settings:', err);
    }
  }, []);

  useEffect(() => {
    loadShippingSettings();
  }, [loadShippingSettings]);

  // حفظ إعدادات الشحن
  const handleSaveShipping = async () => {
    setSavingShippingSettings(true);
    try {
      const res = await saveShippingSettings(shippingSettings);
      if (res.success) {
        showToast('تم حفظ إعدادات الشحن والتوصيل بنجاح', 'success');
        setIsShippingModalOpen(false);
      } else {
        showToast(res.error || 'تعذر حفظ إعدادات الشحن', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حفظ الإعدادات', 'error');
    } finally {
      setSavingShippingSettings(false);
    }
  };

  const isDev = process.env.NODE_ENV === 'development';

  // ── تحميل وحفظ حالة القراءة ──────────────────────────────────────────────
  useEffect(() => {
    const lastVisit = localStorage.getItem('orders_last_visit') ?? '';
    const storedRead = localStorage.getItem('orders_read_ids');
    setUnreadThreshold(lastVisit);
    if (storedRead) setReadOrderIds(new Set(JSON.parse(storedRead)));
    localStorage.setItem('orders_last_visit', new Date().toISOString());
  }, []);

  const isUnread = (order: Order) =>
    !readOrderIds.has(order.id) &&
    unreadThreshold !== '' &&
    new Date(order.created_at) > new Date(unreadThreshold);

  const markAsRead = (orderId: string) => {
    setReadOrderIds(prev => {
      const next = new Set([...prev, orderId]);
      localStorage.setItem('orders_read_ids', JSON.stringify([...next]));
      return next;
    });
    setFlashOrderIds(prev => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  };

  const copyTrackingNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedTracking(true);
    showToast('تم نسخ رقم التتبع', 'success');
    setTimeout(() => setCopiedTracking(false), 2000);
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

  const [shippingLoading, setShippingLoading] = useState(false);
  const [printingLabel, setPrintingLabel] = useState(false);

  // ── إصدار بوليصة عبر بوليصة ──────────────────────────────────────────────
  const handleCreateBolesaShipment = async (orderId: string) => {
    setShippingLoading(true);
    try {
      const res = await fetch('/api/shipping/bolesa/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء الشحنة في بوليصة');

      const trackingNumber = data.tracking_number || `BOL-${orderId.slice(0, 8)}`;
      const carrier = data.carrier || 'بوليصة (Bolesa)';
      const pdfUrl = data.pdf_url;

      showToast(`تم إصدار بوليصة الشحن بنجاح! رقم التتبع: ${trackingNumber}`, 'success');

      // Update state immediately
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? { ...o, status: 'shipped', tracking_number: trackingNumber, shipping_carrier: carrier, bolesa_pdf_url: pdfUrl }
            : o
        )
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev =>
          prev
            ? {
                ...prev,
                status: 'shipped',
                tracking_number: trackingNumber,
                shipping_carrier: carrier,
                bolesa_pdf_url: pdfUrl,
              }
            : null
        );
      }

      await fetchOrders();
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء الاتصال ببوليصة', 'error');
    } finally {
      setShippingLoading(false);
    }
  };

  // ── طباعة البوليصة PDF ──────────────────────────────────────────────────
  const handlePrintBolesaLabel = async (trackingNumbers: string[]) => {
    setPrintingLabel(true);
    try {
      const res = await fetch('/api/shipping/bolesa/label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumbers }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'فشل جلب ملف البوليصة');

      window.open(data.url, '_blank');
    } catch (err: any) {
      showToast(err.message || 'فشل فتح بوليصة الشحن', 'error');
    } finally {
      setPrintingLabel(false);
    }
  };

  // ── إلغاء ربط الشحنة ────────────────────────────────────────────────────
  const handleUnlinkShipment = async (orderId: string) => {
    if (!confirm('هل تريد إلغاء ربط بوليصة الشحن الحالية عن هذا الطلب؟ سيمكنك بعد ذلك إصدار بوليصة جديدة.')) return;
    try {
      const res = await fetch('/api/shipping/update-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, unlink: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إلغاء الربط');

      showToast('تم إلغاء ربط البوليصة بنجاح', 'success');

      setOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? { ...o, tracking_number: null, shipping_carrier: null, bolesa_pdf_url: null }
            : o
        )
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev =>
          prev
            ? { ...prev, tracking_number: null, shipping_carrier: null, bolesa_pdf_url: null }
            : null
        );
      }
    } catch (err: any) {
      showToast(err.message || 'فشل إلغاء ربط البوليصة', 'error');
    }
  };

  // ── حفظ رقم التتبع اليدوي ─────────────────────────────────────────────────
  const handleSaveManualShipping = async () => {
    if (!manualModal.tracking.trim()) {
      showToast('يرجى إدخال رقم التتبع', 'error');
      return;
    }
    setManualSaving(true);
    try {
      const res = await fetch('/api/shipping/update-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: manualModal.orderId,
          tracking_number: manualModal.tracking.trim(),
          shipping_carrier: manualModal.carrier.trim() || 'مندوب خاص',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ بيانات الشحن');

      showToast('تم حفظ بيانات الشحن بنجاح', 'success');

      setOrders(prev =>
        prev.map(o =>
          o.id === manualModal.orderId
            ? {
                ...o,
                tracking_number: manualModal.tracking.trim(),
                shipping_carrier: manualModal.carrier.trim() || 'مندوب خاص',
                status: o.status === 'pending' || o.status === 'processing' ? 'shipped' : o.status,
              }
            : o
        )
      );

      if (selectedOrder && selectedOrder.id === manualModal.orderId) {
        setSelectedOrder(prev =>
          prev
            ? {
                ...prev,
                tracking_number: manualModal.tracking.trim(),
                shipping_carrier: manualModal.carrier.trim() || 'مندوب خاص',
                status: prev.status === 'pending' || prev.status === 'processing' ? 'shipped' : prev.status,
              }
            : null
        );
      }

      setManualModal({ open: false, orderId: '', tracking: '', carrier: 'بوليصة (Bolesa)' });
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setManualSaving(false);
    }
  };

  // ── جلب الطلبات ──────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          id, order_number, status, subtotal, discount_amount, shipping_cost, total_amount, notes, created_at, transfer_receipt_url, sender_name, sender_bank, sender_account, payment_method, is_test, tracking_number, shipping_carrier, bolesa_pdf_url,
          customers(name, phone, additional_phone, city, address),
          order_items(id, product_name, quantity, unit_price, total_price)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders((data || []) as unknown as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('حدث خطأ في جلب الطلبات', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Realtime listener ─────────────────────────────────────────────────────
  useEffect(() => {
    setRealtimeStatus('connecting');

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const { data: newOrder } = await supabase
            .from('orders')
            .select(`
              id, order_number, status, subtotal, discount_amount, shipping_cost, total_amount, notes, created_at, transfer_receipt_url, sender_name, sender_bank, sender_account, payment_method, is_test, tracking_number, shipping_carrier, bolesa_pdf_url,
              customers(name, phone, additional_phone, city, address),
              order_items(id, product_name, quantity, unit_price, total_price)
            `)
            .eq('id', payload.new.id)
            .single();

          if (newOrder) {
            const orderObj = newOrder as unknown as Order;
            setOrders(prev => [orderObj, ...prev]);
            setFlashOrderIds(prev => new Set([...prev, orderObj.id]));
            showToast(`طلب جديد #${orderObj.order_number}`, 'info');

            setTimeout(() => {
              setFlashOrderIds(prev => {
                const next = new Set(prev);
                next.delete(newOrder.id);
                return next;
              });
            }, 3000);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders(prev =>
            prev.map(o => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
          );
          if (selectedOrder && selectedOrder.id === payload.new.id) {
            setSelectedOrder(prev => prev ? { ...prev, ...payload.new } : null);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          if (selectedOrder && selectedOrder.id === payload.old.id) {
            setSelectedOrder(null);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
        else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setRealtimeStatus('disconnected');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showToast, selectedOrder]);

  // ── تغيير الحالة ──────────────────────────────────────────────────────────
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder) {
        setSelectedOrder(prev => (prev ? { ...prev, status: newStatus } : null));
      }
      showToast('تم تحديث حالة الطلب بنجاح', 'success');
    } catch (error) {
      console.error('Error updating order:', error);
      showToast('حدث خطأ في تحديث الحالة', 'error');
    } finally {
      setUpdatingStatus(false);
    }
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
      o.customers?.phone.includes(q) ||
      (o.tracking_number && o.tracking_number.toLowerCase().includes(q))
    );
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_amount, 0),
  };

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-3xl font-bold text-white">إدارة الطلبات والشحن</h1>
            {/* مؤشر Realtime */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium transition-all duration-500"
              style={{
                backgroundColor: realtimeStatus === 'connected' ? 'rgba(34,197,94,0.1)' : realtimeStatus === 'connecting' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                borderColor: realtimeStatus === 'connected' ? 'rgba(34,197,94,0.3)' : realtimeStatus === 'connecting' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)',
                color: realtimeStatus === 'connected' ? 'rgb(74,222,128)' : realtimeStatus === 'connecting' ? 'rgb(250,204,21)' : 'rgb(248,113,113)',
              }}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                realtimeStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                realtimeStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                'bg-red-400'
              }`} />
              {realtimeStatus === 'connected' ? 'مباشر' :
               realtimeStatus === 'connecting' ? 'جاري الاتصال...' : 'غير متصل'}
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            إدارة الطلبات، إصدار بوليصات الشحن، وطباعة الملصقات ({orders.length} طلب)
            {orders.filter(isUnread).length > 0 && (
              <span className="mr-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-luxury-gold/15 text-luxury-gold border border-luxury-gold/30">
                {orders.filter(isUnread).length} غير مقروء
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* زر إعدادات الشحن والتوصيل */}
          <button
            onClick={() => setIsShippingModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#181818] border border-luxury-gold/40 hover:border-luxury-gold text-luxury-gold hover:bg-luxury-gold/10 rounded-lg transition-all text-sm font-semibold shadow-sm group"
            title="إعدادات الشحن والتوصيل المجاني"
          >
            <Settings className="w-4 h-4 text-luxury-gold group-hover:rotate-90 transition-transform duration-300" />
            <span>إعدادات الشحن</span>
          </button>

          {isDev && (
            <button
              onClick={handleDeleteAllTestOrders}
              disabled={deletingTestOrders}
              title="حذف كل الطلبات التجريبية دفعة واحدة"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors text-sm disabled:opacity-50"
            >
              <FlaskConical size={15} />
              <span>حذف الطلبات التجريبية</span>
              {orders.filter(o => o.is_test).length > 0 && (
                <span className="bg-purple-500/30 text-purple-200 text-xs px-1.5 py-0.5 rounded-full">
                  {orders.filter(o => o.is_test).length}
                </span>
              )}
            </button>
          )}
          <DashboardRefreshButton onRefresh={fetchOrders} loading={loading} />
          <Link href="/dashboard/orders/new"
            className="px-5 py-2.5 bg-gradient-to-r from-luxury-gold to-[#d4af37] text-luxury-black font-bold rounded-lg hover:brightness-110 transition-all inline-flex items-center justify-center gap-2 text-sm shadow-md">
            <span>+</span> إضافة طلب يدوي
          </Link>
        </div>
      </motion.div>

      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {[
          { label: 'إجمالي الطلبات', value: stats.total, icon: Package, color: 'text-white' },
          { label: 'جديدة (انتظار)', value: stats.pending, icon: Clock, color: 'text-yellow-400' },
          { label: 'قيد التجهيز', value: stats.processing, icon: Cog, color: 'text-purple-400' },
          { label: 'مشحونة (بوليصة)', value: stats.shipped, icon: Truck, color: 'text-cyan-400' },
          { label: 'تم التوصيل', value: stats.delivered, icon: CheckCircle2, color: 'text-green-400' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-[#181818] rounded-xl border border-luxury-gold/20 p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-xs font-medium">{s.label}</span>
              <s.icon className={`w-5 h-5 ${s.color} opacity-80`} />
            </div>
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Quick Status Filter Tabs ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {[
          { id: '', label: 'الكل', count: orders.length },
          { id: 'pending', label: 'قيد الانتظار', count: stats.pending },
          { id: 'processing', label: 'قيد التجهيز', count: stats.processing },
          { id: 'shipped', label: 'تم الشحن', count: stats.shipped },
          { id: 'delivered', label: 'تم التوصيل', count: stats.delivered },
          { id: 'cancelled', label: 'ملغي', count: orders.filter(o => o.status === 'cancelled').length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              statusFilter === tab.id
                ? 'bg-luxury-gold text-black shadow-md'
                : 'bg-[#181818] text-gray-300 hover:bg-white/5 border border-white/5'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === tab.id ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Search & Bulk Actions ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="بحث برقم الطلب، اسم العميل، رقم الجوال، أو رقم التتبع..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-[#181818] border border-luxury-gold/20 rounded-lg text-white text-sm focus:border-luxury-gold focus:outline-none transition-colors"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            <Search size={16} />
          </span>
        </div>

        {selectedIds.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-luxury-gold/15 border border-luxury-gold/40 rounded-lg px-4 py-2 flex items-center justify-between gap-3">
            <span className="text-luxury-gold font-bold text-xs sm:text-sm">محدد ({selectedIds.length})</span>
            <button onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded text-xs transition-colors">
              حذف المحددين
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Table Container ────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-[#141414] rounded-xl border border-luxury-gold/25 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-luxury-gold" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {search || statusFilter ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد طلبات مسجلة بعد'}
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-white/5">
              {filtered.map((order, i) => {
                const st = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                return (
                  <motion.div key={order.id}
                    initial={{ opacity: 0, x: flashOrderIds.has(order.id) ? -10 : 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: flashOrderIds.has(order.id) ? 0 : i * 0.02 }}
                    className={`p-4 transition-colors ${
                      flashOrderIds.has(order.id)
                        ? 'bg-green-500/8 border-r-2 border-r-green-400/60'
                        : isUnread(order)
                        ? 'bg-white/[0.035] border-r-2 border-luxury-gold/50'
                        : selectedIds.includes(order.id)
                        ? 'bg-luxury-gold/5'
                        : ''
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={e => {
                            const checked = e.target.checked;
                            setSelectedIds(prev => checked ? [...prev, order.id] : prev.filter(id => id !== order.id));
                          }}
                          className="accent-luxury-gold w-4 h-4 cursor-pointer" />
                        <span className="font-mono text-luxury-gold text-sm font-bold">
                          {order.order_number}
                        </span>
                        {order.is_test && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            تجريبي
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs border ${st.bg} ${st.color}`}>
                        {st.label}
                      </span>
                    </div>

                    <div className="mb-2">
                      <div className="text-white font-medium text-sm">{order.customers?.name || '—'}</div>
                      <div className="text-gray-500 text-xs">{order.customers?.phone} - {order.customers?.city || 'المملكة'}</div>
                    </div>

                    {/* Shipping info preview */}
                    {order.tracking_number && (
                      <div className="mb-2 flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs">
                        <span className="text-emerald-400 font-mono" dir="ltr">{order.tracking_number}</span>
                        <span className="text-emerald-300 text-[11px]">{order.shipping_carrier || 'بوليصة'}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-luxury-gold font-bold text-sm">{order.total_amount.toFixed(0)} ر.س</span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setSelectedOrder(order); markAsRead(order.id); }} title="تفاصيل"
                          className="p-1.5 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded hover:bg-luxury-gold/20 transition-colors">
                          <Eye size={14} />
                        </button>
                        {order.tracking_number && (
                          <button onClick={() => handlePrintBolesaLabel([order.tracking_number!])} title="طباعة بوليصة الشحن"
                            className="p-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/30 transition-colors">
                            <Printer size={14} />
                          </button>
                        )}
                        <button onClick={() => setInvoiceOrder(order)} title="فاتورة"
                          className="p-1.5 bg-white/10 text-gray-300 border border-white/20 rounded hover:bg-white/20 transition-colors">
                          <FileText size={14} />
                        </button>
                        <button onClick={() => handleDeleteOrder(order.id)} title="حذف"
                          className="p-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded hover:bg-red-500/20 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-luxury-gold/20 bg-luxury-black/40 text-xs">
                    <th className="p-4 w-12 text-center">
                      <input type="checkbox"
                        checked={filtered.length > 0 && selectedIds.length === filtered.length}
                        onChange={e => setSelectedIds(e.target.checked ? filtered.map(o => o.id) : [])}
                        className="accent-luxury-gold w-4 h-4 cursor-pointer" />
                    </th>
                    <th className="text-right text-gray-400 font-semibold p-4">رقم الطلب</th>
                    <th className="text-right text-gray-400 font-semibold p-4">العميل والمدينة</th>
                    <th className="text-right text-gray-400 font-semibold p-4">الشحن والتتبع</th>
                    <th className="text-right text-gray-400 font-semibold p-4">المبلغ</th>
                    <th className="text-right text-gray-400 font-semibold p-4">الحالة</th>
                    <th className="text-right text-gray-400 font-semibold p-4">التاريخ</th>
                    <th className="text-center text-gray-400 font-semibold p-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filtered.map((order, i) => {
                    const st = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                    return (
                      <motion.tr key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={`transition-colors ${
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
                            <span className="font-mono text-luxury-gold font-bold text-sm">
                              {order.order_number}
                            </span>
                          </div>
                          {order.is_test && (
                            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              <FlaskConical size={11} />
                              <span>تجريبي</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="text-white font-medium">{order.customers?.name || '—'}</div>
                          <div className="text-gray-400 text-xs mt-0.5">
                            {order.customers?.city || '—'} • <span dir="ltr">{order.customers?.phone}</span>
                          </div>
                        </td>

                        {/* Shipping & Tracking Column */}
                        <td className="p-4">
                          {order.tracking_number ? (
                            <div className="flex items-center gap-2">
                              <div>
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  {order.shipping_carrier || 'بوليصة'}
                                </span>
                                <div className="text-gray-300 font-mono text-xs mt-0.5" dir="ltr">
                                  {order.tracking_number}
                                </div>
                              </div>
                              <button
                                onClick={() => handlePrintBolesaLabel([order.tracking_number!])}
                                title="طباعة بوليصة الشحن الرسمية PDF"
                                className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded transition-colors"
                              >
                                <Printer size={13} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                              بانتظار الشحن
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-luxury-gold font-bold">{order.total_amount.toFixed(0)} ر.س</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs border ${st.bg} ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-xs text-gray-400">
                          <div>{new Date(order.created_at).toLocaleDateString('ar-SA')}</div>
                          <div className="text-gray-600 mt-0.5">{new Date(order.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => { setSelectedOrder(order); markAsRead(order.id); }} title="عرض التفاصيل والشحن"
                              className="p-2 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-lg hover:bg-luxury-gold/20 transition-colors">
                              <Eye size={15} />
                            </button>
                            <button onClick={() => setInvoiceOrder(order)} title="إصدار فاتورة"
                              className="p-2 bg-white/10 text-gray-300 border border-white/20 rounded-lg hover:bg-white/20 transition-colors">
                              <FileText size={15} />
                            </button>
                            <Link href={`/dashboard/orders/${order.id}/edit`} title="تعديل"
                              className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors">
                              <Edit size={15} />
                            </Link>
                            <button onClick={() => handleDeleteOrder(order.id)} title="حذف"
                              className="p-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors">
                              <Trash2 size={15} />
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

      {/* ── Order Detail Modal & Shipping Management ───────────────────────── */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#141414] border border-luxury-gold/40 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}>

              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-luxury-gold/20 flex items-center justify-between bg-luxury-black/60 sticky top-0 z-10 backdrop-blur-md">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold text-luxury-gold">{selectedOrder.order_number}</h2>
                    {selectedOrder.is_test && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        <FlaskConical size={13} />
                        <span>طلب تجريبي</span>
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(selectedOrder.created_at).toLocaleString('ar-SA')}
                  </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white text-2xl p-1">×</button>
              </div>

              <div className="p-5 sm:p-6 space-y-6">

                {/* ── 1. Order Lifecycle Progress Stepper ──────────────────── */}
                <div className="bg-luxury-black/70 border border-white/5 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-1.5">
                    <Package size={14} className="text-luxury-gold" />
                    مراحل معالجة الطلب
                  </h4>
                  <div className="grid grid-cols-4 gap-2 text-center relative">
                    {ORDER_STEPS.map((stepItem, idx) => {
                      const currentStep = STATUS_LABELS[selectedOrder.status]?.step || 1;
                      const isPast = currentStep > stepItem.step;
                      const isCurrent = currentStep === stepItem.step;

                      return (
                        <div key={stepItem.key} className="relative">
                          <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-all mb-1.5 ${
                            isCurrent
                              ? 'bg-luxury-gold text-black ring-4 ring-luxury-gold/20'
                              : isPast
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white/10 text-gray-500'
                          }`}>
                            {isPast ? <Check size={14} /> : stepItem.step}
                          </div>
                          <p className={`text-xs font-medium truncate ${isCurrent ? 'text-luxury-gold font-bold' : isPast ? 'text-gray-300' : 'text-gray-500'}`}>
                            {stepItem.title}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── 2. Shipping Management Card ─────────────────────────── */}
                <div className="border border-luxury-gold/30 rounded-xl overflow-hidden shadow-lg bg-gradient-to-b from-[#181818] to-[#121212]">
                  <div className="p-4 border-b border-luxury-gold/15 bg-luxury-gold/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck size={18} className="text-luxury-gold" />
                      <span className="font-bold text-sm text-white">إدارة الشحن وبوليصة (Bolesa)</span>
                    </div>
                    {selectedOrder.shipping_carrier && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        {selectedOrder.shipping_carrier}
                      </span>
                    )}
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">
                    {selectedOrder.tracking_number ? (
                      /* State A: Shipment is Already Created */
                      <div className="space-y-4">
                        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-xs text-emerald-400 block mb-0.5">رقم التتبع المسجل (AWB):</span>
                            <span className="text-white font-mono font-bold text-base sm:text-lg" dir="ltr">
                              {selectedOrder.tracking_number}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyTrackingNumber(selectedOrder.tracking_number!)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition-colors flex items-center gap-1.5"
                          >
                            {copiedTracking ? <Check size={14} /> : <Copy size={14} />}
                            {copiedTracking ? 'تم النسخ' : 'نسخ الرقم'}
                          </button>
                        </div>

                        {/* Large Action Button: Print PDF */}
                        <button
                          type="button"
                          onClick={() => handlePrintBolesaLabel([selectedOrder.tracking_number!])}
                          disabled={printingLabel}
                          className="w-full py-3.5 px-4 bg-gradient-to-r from-luxury-gold to-[#d4af37] text-luxury-black font-extrabold text-sm rounded-xl hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-luxury-gold/20"
                        >
                          <Printer size={18} />
                          <span>{printingLabel ? 'جاري جلب ملف البوليصة...' : 'طباعة ملصق الشحن الرسمي (PDF)'}</span>
                        </button>

                        {/* Secondary Options */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
                          <button
                            type="button"
                            onClick={() => setManualModal({
                              open: true,
                              orderId: selectedOrder.id,
                              tracking: selectedOrder.tracking_number || '',
                              carrier: selectedOrder.shipping_carrier || 'بوليصة (Bolesa)',
                            })}
                            className="text-gray-400 hover:text-luxury-gold transition-colors flex items-center gap-1"
                          >
                            <Edit size={13} />
                            تعديل رقم التتبع يدوياً
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUnlinkShipment(selectedOrder.id)}
                            className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={13} />
                            إلغاء ربط الشحنة
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* State B: No Shipment Yet */
                      <div className="space-y-4">
                        <div className="p-3.5 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30 text-xs text-gray-300 leading-relaxed">
                          <p className="font-bold text-luxury-gold mb-1 flex items-center gap-1.5">
                            <Lightbulb size={15} />
                            <span>متى تقوم بإصدار البوليصة؟</span>
                          </p>
                          اضغط على الزر أدناه بعد الانتهاء من تجهيز وتغليف كرتون المنتجات لتوليد ملصق الشحن وحجز استلام من مندوب شركة الشحن فوراً.
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCreateBolesaShipment(selectedOrder.id)}
                          disabled={shippingLoading}
                          className="w-full py-3.5 px-4 bg-gradient-to-r from-luxury-gold to-[#d4af37] text-luxury-black font-extrabold text-sm rounded-xl hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-luxury-gold/20 disabled:opacity-50"
                        >
                          <Package size={18} />
                          <span>{shippingLoading ? 'جاري إصدار البوليصة من بوليصة...' : 'إنشاء وإصدار بوليصة شحن عبر بوليصة'}</span>
                        </button>

                        <div className="text-center pt-2 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => setManualModal({
                              open: true,
                              orderId: selectedOrder.id,
                              tracking: '',
                              carrier: 'مندوب خاص',
                            })}
                            className="text-xs text-gray-400 hover:text-luxury-gold transition-colors inline-flex items-center gap-1"
                          >
                            <PlusCircle size={13} />
                            شحن عبر مندوب محلي أو شركة أخرى (تسجيل رقم يدوي)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 3. Customer Info ────────────────────────────────────── */}
                <div>
                  <h3 className="text-gray-400 text-xs font-semibold mb-2">بيانات العميل والتوصيل</h3>
                  <div className="bg-luxury-black/60 rounded-xl p-4 space-y-3 border border-white/5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-base">{selectedOrder.customers?.name || '—'}</span>
                      <span className="text-luxury-gold font-mono" dir="ltr">{selectedOrder.customers?.phone}</span>
                    </div>

                    <div className="pt-2.5 border-t border-white/5 text-xs space-y-1">
                      <div className="flex gap-2">
                        <span className="text-gray-400">المدينة:</span>
                        <span className="text-white font-medium">{selectedOrder.customers?.city || '—'}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-400">العنوان والحي:</span>
                        <span className="text-gray-200">{selectedOrder.customers?.address || '—'}</span>
                      </div>
                    </div>

                    {selectedOrder.notes && (
                      <div className="pt-2.5 border-t border-white/5 text-xs">
                        <span className="text-gray-400 block mb-0.5">ملاحظات العميل:</span>
                        <span className="text-yellow-200/90 whitespace-pre-line">{selectedOrder.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 4. Order Status Quick Switcher ─────────────────────── */}
                <div>
                  <h3 className="text-gray-400 text-xs font-semibold mb-2">تحديث حالة الطلب</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <button key={k} disabled={updatingStatus || selectedOrder.status === k}
                        onClick={() => handleStatusChange(selectedOrder.id, k)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selectedOrder.status === k
                          ? `${v.bg} ${v.color} border-current ring-2 ring-current/20`
                          : 'border-white/10 text-gray-400 hover:border-luxury-gold/40 hover:text-white'
                          } disabled:opacity-50`}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── 5. Items List ───────────────────────────────────────── */}
                <div>
                  <h3 className="text-gray-400 text-xs font-semibold mb-2">المنتجات ({selectedOrder.order_items.length})</h3>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-luxury-black/60 border border-white/5 rounded-xl p-3 text-sm">
                        <div>
                          <div className="text-white font-medium">{item.product_name || 'منتج'}</div>
                          <div className="text-gray-400 text-xs">{item.quantity} × {item.unit_price} ر.س</div>
                        </div>
                        <div className="text-luxury-gold font-bold">{item.total_price.toFixed(0)} ر.س</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 6. Totals ────────────────────────────────────────────── */}
                <div className="border-t border-luxury-gold/20 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>المجموع الفرعي</span>
                    <span>{selectedOrder.subtotal.toFixed(0)} ر.س</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-400">
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
                  <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/5">
                    <span>المجموع الكلي</span>
                    <span className="text-luxury-gold text-xl font-extrabold">{selectedOrder.total_amount.toFixed(0)} ر.س</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Manual Shipping Edit Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {manualModal.open && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setManualModal({ open: false, orderId: '', tracking: '', carrier: '' })}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181818] border border-luxury-gold/40 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Truck className="text-luxury-gold" size={20} />
                بيانات الشحن اليدوي
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-300 text-xs font-semibold mb-1.5">
                    شركة الشحن أو الناقل
                  </label>
                  <input
                    type="text"
                    value={manualModal.carrier}
                    onChange={e => setManualModal(prev => ({ ...prev, carrier: e.target.value }))}
                    placeholder="مثال: سمسا، أرامكس، سبل، مندوب خاص..."
                    className="w-full px-4 py-2.5 bg-luxury-black border border-luxury-gold/30 rounded-lg text-white text-sm focus:border-luxury-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-xs font-semibold mb-1.5">
                    رقم التتبع (AWB Number) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualModal.tracking}
                    onChange={e => setManualModal(prev => ({ ...prev, tracking: e.target.value }))}
                    placeholder="أدخل رقم التتبع"
                    className="w-full px-4 py-2.5 bg-luxury-black border border-luxury-gold/30 rounded-lg text-white text-sm font-mono focus:border-luxury-gold focus:outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setManualModal({ open: false, orderId: '', tracking: '', carrier: '' })}
                  className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualShipping}
                  disabled={manualSaving}
                  className="flex-1 py-2.5 bg-luxury-gold text-luxury-black font-bold rounded-xl hover:bg-luxury-gold-light transition-all text-sm disabled:opacity-50"
                >
                  {manualSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}

      {/* ── Shipping Settings Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {isShippingModalOpen && (
          <div
            className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setIsShippingModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-[#181818] border border-luxury-gold/40 rounded-2xl p-6 sm:p-7 w-full max-w-lg shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-luxury-gold/20 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-luxury-gold/15 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold shadow-inner">
                    <Settings className="w-5 h-5 animate-[spin_8s_linear_infinite]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">إعدادات الشحن والتوصيل</h3>
                    <p className="text-xs text-gray-400">التحكم في رسوم التوصيل وشروط الشحن المجاني للمتجر</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShippingModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Live Preview Summary Card */}
              <div className="bg-gradient-to-r from-luxury-black via-[#1c1a14] to-luxury-black border border-luxury-gold/25 rounded-xl p-4 mb-5 shadow-sm">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-400">الحالة المطبقة بالمتجر:</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border ${shippingSettings.free_shipping_enabled ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
                    {shippingSettings.free_shipping_enabled ? <Check size={12} /> : <X size={12} />}
                    <span>{shippingSettings.free_shipping_enabled ? 'الشحن المجاني مفعّل' : 'الشحن المجاني معطّل'}</span>
                  </span>
                </div>
                <div className="text-sm text-gray-200 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-luxury-gold flex-shrink-0" />
                  <span>
                    سعر الشحن الأساسي: <strong className="text-luxury-gold font-mono">{shippingSettings.fee} ر.س</strong>
                    {shippingSettings.free_shipping_enabled && (
                      <span className="text-gray-300"> (مجاني للمشتريات من <strong className="text-luxury-gold font-mono">{shippingSettings.free_shipping_threshold} ر.س</strong> فأكثر)</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {/* 1. Base Shipping Fee */}
                <div>
                  <label className="block text-gray-200 text-sm font-semibold mb-1.5 flex items-center justify-between">
                    <span>رسوم الشحن الافتراضية</span>
                    <span className="text-xs text-luxury-gold font-normal">تطبق على الطلبات غير المؤهلة للشحن المجاني</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={shippingSettings.fee}
                      onChange={(e) =>
                        setShippingSettings((prev) => ({
                          ...prev,
                          fee: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="w-full pl-14 pr-4 py-2.5 bg-luxury-black border border-luxury-gold/30 rounded-xl text-white font-mono text-base focus:border-luxury-gold focus:outline-none focus:ring-1 focus:ring-luxury-gold"
                      placeholder="25"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-sans font-medium pointer-events-none">
                      ر.س
                    </span>
                  </div>
                </div>

                {/* 2. Free Shipping Toggle Switch */}
                <div className="bg-luxury-black/60 border border-luxury-gold/20 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-white text-sm font-bold block">
                      تفعيل ميزة الشحن المجاني
                    </span>
                    <p className="text-xs text-gray-400">
                      إعفاء العميل من رسوم الشحن تلقائياً عند تجاوز سلة الشراء حداً معيناً
                    </p>
                  </div>
                  <button
                    type="button"
                    dir="ltr"
                    onClick={() =>
                      setShippingSettings((prev) => ({
                        ...prev,
                        free_shipping_enabled: !prev.free_shipping_enabled,
                      }))
                    }
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      shippingSettings.free_shipping_enabled ? 'bg-luxury-gold' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-luxury-black shadow ring-0 transition duration-200 ease-in-out ${
                        shippingSettings.free_shipping_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Minimum Free Shipping Threshold */}
                <div className={shippingSettings.free_shipping_enabled ? 'opacity-100 transition-opacity' : 'opacity-40 pointer-events-none transition-opacity'}>
                  <label className="block text-gray-200 text-sm font-semibold mb-1.5 flex items-center justify-between">
                    <span>الحد الأدنى لتطبيق الشحن المجاني</span>
                    <span className="text-xs text-gray-400 font-normal">مجموع المشتريات الذي يزيد عن:</span>
                  </label>
                  <div className="relative mb-2">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      disabled={!shippingSettings.free_shipping_enabled}
                      value={shippingSettings.free_shipping_threshold}
                      onChange={(e) =>
                        setShippingSettings((prev) => ({
                          ...prev,
                          free_shipping_threshold: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="w-full pl-14 pr-4 py-2.5 bg-luxury-black border border-luxury-gold/30 rounded-xl text-white font-mono text-base focus:border-luxury-gold focus:outline-none focus:ring-1 focus:ring-luxury-gold disabled:bg-gray-900/50"
                      placeholder="250"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-sans font-medium pointer-events-none">
                      ر.س
                    </span>
                  </div>

                  {/* Preset quick buttons */}
                  {shippingSettings.free_shipping_enabled && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-gray-400">خيارات سريعة:</span>
                      {[150, 200, 250, 300, 350].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            setShippingSettings((prev) => ({
                              ...prev,
                              free_shipping_threshold: val,
                            }))
                          }
                          className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                            shippingSettings.free_shipping_threshold === val
                              ? 'bg-luxury-gold text-luxury-black font-bold border-luxury-gold'
                              : 'bg-white/5 border-gray-700 text-gray-300 hover:border-luxury-gold/50'
                          }`}
                        >
                          {val} ر.س
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-luxury-gold/20">
                <button
                  type="button"
                  onClick={() => setIsShippingModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveShipping}
                  disabled={savingShippingSettings}
                  className="flex-1 py-2.5 bg-gradient-to-r from-luxury-gold to-[#d4af37] text-luxury-black font-bold rounded-xl hover:brightness-110 transition-all text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingShippingSettings ? (
                    <>
                      <div className="w-4 h-4 border-2 border-luxury-black border-t-transparent rounded-full animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>حفظ الإعدادات</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181818] border border-luxury-gold/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-2">تأكيد حذف الطلب</h3>
              <p className="text-gray-400 text-sm mb-6">هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً؟ لن يمكن استرجاع بياناته بعد الحذف.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm({ open: false, id: '' })}
                  className="flex-1 px-4 py-2.5 border border-gray-600 text-gray-300 rounded-xl hover:bg-white/5 transition-colors text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDeleteOrder}
                  className="flex-1 px-4 py-2.5 bg-red-500/20 text-red-400 border border-red-500/40 font-bold rounded-xl hover:bg-red-500/30 transition-colors text-sm"
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
