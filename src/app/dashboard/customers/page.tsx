'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/context/ToastContext';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Customer {
  id: string;
  name: string;
  phone: string;
  additional_phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
}

const emptyForm = { name: '', phone: '', additional_phone: '', email: '', area: '', street: '', house_number: '' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [deleteModal, setDeleteModal] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { showToast } = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch customers and their order totals in one go using a join
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!customersData || customersData.length === 0) {
        setCustomers([]);
        return;
      }

      // Fetch all orders for these customer IDs in one query
      const customerIds = customersData.map(c => c.id);
      const { data: ordersData } = await supabase
        .from('orders')
        .select('customer_id, total_amount, status')
        .in('customer_id', customerIds)
        .neq('status', 'cancelled');

      // Build aggregated map
      const statsMap: Record<string, { count: number; total: number }> = {};
      for (const o of ordersData || []) {
        if (!statsMap[o.customer_id]) statsMap[o.customer_id] = { count: 0, total: 0 };
        statsMap[o.customer_id].count++;
        statsMap[o.customer_id].total += Number(o.total_amount) || 0;
      }

      setCustomers(
        customersData.map(c => ({
          ...c,
          order_count: statsMap[c.id]?.count ?? 0,
          total_spent: statsMap[c.id]?.total ?? 0,
        }))
      );
    } catch (e: any) {
      console.error('fetchCustomers error:', e);
      showToast('فشل تحميل العملاء: ' + (e?.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  function openAdd() {
    setEditCustomer(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(c: Customer) {
    setEditCustomer(c);
    
    const rawAddress = c.address || '';
    const match = rawAddress.match(/^(.*?)(?:\s*\((.*?)\))?$/);
    const streetStr = match ? match[1].trim() : rawAddress;
    const houseStr = match && match[2] ? match[2].trim() : '';

    setForm({ 
      name: c.name, 
      phone: c.phone, 
      additional_phone: c.additional_phone || '',
      email: c.email || '', 
      area: c.city || '', 
      street: streetStr,
      house_number: houseStr 
    });
    setShowForm(true);
    setSelected(null);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) {
      showToast('الاسم والجوال مطلوبان', 'error');
      return;
    }
    setSaving(true);
    try {
      const combinedAddress = form.house_number ? `${form.street || ''} (${form.house_number})`.trim() : form.street;
      
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        additional_phone: form.additional_phone.trim() || null,
        email: form.email.trim() || null,
        address: combinedAddress || null,
        city: form.area.trim() || null,
      };

      if (editCustomer) {
        const { error } = await supabase.from('customers').update(payload).eq('id', editCustomer.id);
        if (error) throw error;
        showToast('تم تحديث بيانات العميل', 'success');
      } else {
        const { error } = await supabase.from('customers').insert(payload);
        if (error) {
          if (error.message.includes('unique') || error.message.includes('duplicate')) {
            throw new Error('رقم الجوال مسجل مسبقاً لعميل آخر');
          }
          throw error;
        }
        showToast('تم إضافة العميل بنجاح', 'success');
      }
      setShowForm(false);
      fetchCustomers();
    } catch (e: any) {
      showToast(e?.message || 'حدث خطأ', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    const { error } = await supabase.from('customers').delete().eq('id', deleteModal.id);
    if (!error) {
      setCustomers(prev => prev.filter(c => c.id !== deleteModal.id));
      showToast('تم حذف العميل', 'success');
    } else {
      showToast('فشل حذف العميل — قد تكون هناك طلبات مرتبطة به', 'error');
    }
    setDeleteModal(null);
  }

  async function handleBulkDelete() {
    if (!confirm('هل أنت متأكد من حذف العملاء المحددين للرد النهائي بصورة تامة؟')) return;
    try {
      const { error } = await supabase.from('customers').delete().in('id', selectedIds);
      if (error) throw error;
      showToast('تم حذف العملاء بنجاح', 'success');
      setSelectedIds([]);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء الحذف', 'error');
    }
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.city || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = customers.reduce((s, c) => s + c.total_spent, 0);
  const totalOrders = customers.reduce((s, c) => s + c.order_count, 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">العملاء</h1>
          <p className="text-gray-400">{customers.length} عميل مسجل</p>
        </div>
        <button onClick={openAdd}
          className="px-6 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold/80 transition-colors inline-flex items-center gap-2">
          <span>+</span> إضافة عميل جديد
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'إجمالي العملاء', value: customers.length, icon: '👥', color: 'text-white' },
          { label: 'إجمالي الطلبات', value: totalOrders, icon: '📦', color: 'text-luxury-gold' },
          { label: 'إجمالي الإيرادات', value: `${totalRevenue.toFixed(0)} ر.س`, icon: '💰', color: 'text-green-400' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-5 flex items-center gap-4">
            <span className="text-3xl">{s.icon}</span>
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
          className="bg-luxury-gold/10 border border-luxury-gold/30 rounded-sm p-4 flex items-center justify-between mb-4">
          <span className="text-luxury-gold font-bold">تم تحديد {selectedIds.length} عنصر</span>
          <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-sm transition-colors text-sm">
            حذف المحددين
          </button>
        </motion.div>
      )}

      {/* Search */}
      <input type="text" placeholder="بحث بالاسم أو الجوال أو المنطقة..." value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-3 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors mb-6" />

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-luxury-gold" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {search ? 'لا توجد نتائج للبحث' : 'لا يوجد عملاء مسجلون بعد'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-luxury-gold/20">
                  <th className="p-4 w-12 text-center">
                    <input type="checkbox"
                      checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      onChange={e => setSelectedIds(e.target.checked ? filtered.map(c => c.id) : [])}
                      className="accent-luxury-gold w-4 h-4 cursor-pointer" />
                  </th>
                  {['الاسم', 'الجوال', 'المنطقة/الحي', 'الطلبات', 'الإنفاق الكلي', 'التاريخ', 'إجراءات'].map(h => (
                    <th key={h} className="text-right text-gray-400 font-medium p-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <motion.tr key={c.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`border-b border-luxury-gold/10 hover:bg-luxury-gold/5 transition-colors ${selectedIds.includes(c.id) ? 'bg-luxury-gold/5' : ''}`}>
                    <td className="p-4 text-center">
                      <input type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={e => {
                          const checked = e.target.checked;
                          setSelectedIds(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id));
                        }}
                        className="accent-luxury-gold w-4 h-4 cursor-pointer" />
                    </td>
                    <td className="p-4">
                      <div className="text-white font-medium">{c.name}</div>
                      {c.email && <div className="text-gray-500 text-xs mt-0.5">{c.email}</div>}
                    </td>
                    <td className="p-4 text-gray-300 font-mono">{c.phone}</td>
                    <td className="p-4 text-gray-400">{c.city || '—'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-sm text-sm border ${
                        c.order_count > 0
                          ? 'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/30'
                          : 'bg-gray-700/30 text-gray-500 border-gray-700/30'
                      }`}>
                        {c.order_count}
                      </span>
                    </td>
                    <td className="p-4 text-luxury-gold font-bold">{c.total_spent.toFixed(0)} ر.س</td>
                    <td className="p-4 text-gray-400 text-sm whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => setSelected(c)}
                          className="px-3 py-1.5 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors text-sm">
                          تفاصيل
                        </button>
                        <button onClick={() => openEdit(c)}
                          className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-sm hover:bg-blue-500/20 transition-colors text-sm">
                          تعديل
                        </button>
                        <button onClick={() => setDeleteModal(c)}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-sm hover:bg-red-500/20 transition-colors text-sm">
                          حذف
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-luxury-gold/30 rounded-sm w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-luxury-gold">
                  {editCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'الاسم الكامل *', key: 'name', placeholder: 'محمد أحمد' },
                  { label: 'رقم الجوال *', key: 'phone', placeholder: '05XXXXXXXX', type: 'tel' },
                  { label: 'رقم جوال إضافي', key: 'additional_phone', placeholder: '05XXXXXXXX', type: 'tel' },
                  { label: 'البريد الإلكتروني', key: 'email', placeholder: 'email@example.com', type: 'email' },
                  { label: 'المنطقة (الحي)', key: 'area', placeholder: 'مثال: الملقا' },
                  { label: 'الشارع', key: 'street', placeholder: 'مثال: شارع الملك فهد' },
                  { label: 'رقم المنزل/الشقة', key: 'house_number', placeholder: 'مثال: شقة 3، الطابق الأول' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-gray-400 text-sm mb-1">{f.label}</label>
                    <input
                      type={(f as any).type || 'text'}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-2.5 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white placeholder-gray-600 focus:border-luxury-gold focus:outline-none transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-600 text-gray-400 rounded-sm hover:border-gray-500 hover:text-white transition-colors">
                  إلغاء
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold/80 disabled:opacity-50 transition-colors">
                  {saving ? 'جاري الحفظ...' : (editCustomer ? 'حفظ التعديلات' : 'إضافة العميل')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-luxury-gold/30 rounded-sm w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-luxury-gold">{selected.name}</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'رقم الجوال', value: selected.phone },
                  { label: 'جوال إضافي', value: selected.additional_phone || '—' },
                  { label: 'البريد الإلكتروني', value: selected.email || '—' },
                  { label: 'المنطقة (الحي)', value: selected.city || '—' },
                  { label: 'الشارع / رقم المنزل', value: selected.address || '—' },
                  { label: 'عدد الطلبات', value: `${selected.order_count} طلب` },
                  { label: 'إجمالي الإنفاق', value: `${selected.total_spent.toFixed(0)} ر.س` },
                  { label: 'تاريخ التسجيل', value: new Date(selected.created_at).toLocaleDateString('ar-SA') },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-luxury-gold/10">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setSelected(null); openEdit(selected); }}
                className="w-full mt-5 py-2.5 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors">
                تعديل البيانات
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] border border-luxury-gold/30 rounded-sm p-6 max-w-sm w-full">
              <h3 className="text-xl font-bold text-white mb-3">تأكيد الحذف</h3>
              <p className="text-gray-400 mb-6">
                هل أنت متأكد من حذف العميل <span className="text-white font-medium">"{deleteModal.name}"</span>؟
                <br /><span className="text-red-400 text-sm mt-1 block">تنبيه: إذا كان لديه طلبات سيفشل الحذف</span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(null)}
                  className="flex-1 py-2 border border-gray-600 text-gray-400 rounded-sm hover:border-gray-500 transition-colors">
                  إلغاء
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-2 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors">
                  حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
