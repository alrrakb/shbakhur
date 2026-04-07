'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/context/ToastContext';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Discount {
  id: string;
  code: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const emptyForm = { code: '', type: 'percentage' as 'percentage' | 'fixed', value: '', description: '', is_active: true };

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { showToast } = useToast();

  useEffect(() => { fetchDiscounts(); }, []);

  async function fetchDiscounts() {
    setLoading(true);
    const { data, error } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
    if (!error) setDiscounts(data || []);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.code.trim()) { showToast('كود الخصم مطلوب', 'error'); return; }
    if (!form.value || isNaN(Number(form.value))) { showToast('القيمة مطلوبة', 'error'); return; }

    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      description: form.description || null,
      is_active: form.is_active,
    };

    if (editId) {
      const { error } = await supabase.from('discounts').update(payload).eq('id', editId);
      if (!error) { showToast('تم تحديث الخصم', 'success'); fetchDiscounts(); closeForm(); }
      else showToast('فشل التحديث', 'error');
    } else {
      const { error } = await supabase.from('discounts').insert(payload);
      if (!error) { showToast('تم إضافة الخصم', 'success'); fetchDiscounts(); closeForm(); }
      else showToast(error.message.includes('unique') ? 'الكود مستخدم مسبقاً' : 'فشل الإضافة', 'error');
    }
    setSaving(false);
  }

  async function toggleActive(d: Discount) {
    const { error } = await supabase.from('discounts').update({ is_active: !d.is_active }).eq('id', d.id);
    if (!error) setDiscounts(prev => prev.map(x => x.id === d.id ? { ...x, is_active: !x.is_active } : x));
  }

  async function handleDelete(id: string) {
    setDeleteConfirm({ open: true, id });
  }

  async function confirmDelete() {
    const id = deleteConfirm.id;
    if (!id) return;
    const { error } = await supabase.from('discounts').delete().eq('id', id);
    if (!error) { setDiscounts(prev => prev.filter(d => d.id !== id)); showToast('تم حذف الخصم', 'success'); }
    else showToast('فشل الحذف', 'error');
    setDeleteConfirm({ open: false, id: '' });
  }

  async function handleBulkDelete() {
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.length} كود/كودات خصم؟`)) return;
    const { error } = await supabase.from('discounts').delete().in('id', selectedIds);
    if (!error) {
      setDiscounts(prev => prev.filter(d => !selectedIds.includes(d.id)));
      showToast('تم حذف الخصومات المحددة', 'success');
      setSelectedIds([]);
    } else {
      showToast('فشل حذف الخصومات', 'error');
    }
  }

  function openEdit(d: Discount) {
    setEditId(d.id);
    setForm({ code: d.code || '', type: d.type, value: String(d.value), description: d.description || '', is_active: d.is_active });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditId(null); setForm(emptyForm); }

  return (
    <div className="space-y-6" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">الخصومات</h1>
          <p className="text-gray-400">{discounts.length} كود خصم</p>
        </div>
        <button onClick={() => { closeForm(); setShowForm(true); }}
          className="px-6 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold/80 transition-colors">
          + إضافة خصم
        </button>
      </motion.div>

      {/* Search + Bulk Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="بحث بكود الخصم أو الوصف..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none" />
      </div>

      {selectedIds.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-luxury-gold/10 border border-luxury-gold/30 rounded-sm p-4 flex items-center justify-between">
          <span className="text-luxury-gold font-bold">تم تحديد {selectedIds.length} كود</span>
          <button onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-sm transition-colors text-sm">
            حذف المحددين
          </button>
        </motion.div>
      )}

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#1a1a1a] border border-luxury-gold/30 rounded-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-luxury-gold">{editId ? 'تعديل الخصم' : 'إضافة خصم جديد'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">كود الخصم *</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE20"
                  className="w-full px-4 py-2 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none uppercase" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">نوع الخصم *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                  className="w-full px-4 py-2 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none">
                  <option value="percentage">نسبة مئوية %</option>
                  <option value="fixed">مبلغ ثابت ر.س</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">القيمة *</label>
                <input type="number" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === 'percentage' ? '10' : '50'}
                  className="w-full px-4 py-2 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">الوصف</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="خصم ترحيبي للعملاء الجدد"
                  className="w-full px-4 py-2 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-luxury-gold' : 'bg-gray-600'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_active ? 'right-0.5' : 'left-0.5'}`} />
              </button>
              <span className="text-gray-400">{form.is_active ? 'مفعّل' : 'معطّل'}</span>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={closeForm} className="px-4 py-2 border border-gray-600 text-gray-400 rounded-sm hover:border-gray-500">إلغاء</button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold/80 disabled:opacity-50">
                {saving ? 'جاري الحفظ...' : (editId ? 'تحديث' : 'إضافة')}
              </button>
            </div>
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
              <p className="text-gray-400 mb-6">هل أنت متأكد من حذف كود الخصم هذا؟ هذا الإجراء لا يمكن التراجع عنه.</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm({ open: false, id: '' })}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 rounded-sm hover:border-gray-500 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/30 font-bold rounded-sm hover:bg-red-500/20 transition-colors"
                >
                  نعم، احذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-luxury-gold" />
          </div>
        ) : discounts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">لا توجد كودات خصم</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-luxury-gold/20">
                <th className="p-4 w-12 text-center">
                  <input type="checkbox"
                    checked={discounts.filter(d => d.code?.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase()) || !search).length > 0 &&
                      selectedIds.length === discounts.filter(d => !search || d.code?.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase())).length}
                    onChange={e => {
                      const visible = discounts.filter(d => !search || d.code?.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase()));
                      setSelectedIds(e.target.checked ? visible.map(d => d.id) : []);
                    }}
                    className="accent-luxury-gold w-4 h-4 cursor-pointer" />
                </th>
                {['الكود', 'النوع', 'القيمة', 'الوصف', 'الحالة', 'إجراءات'].map(h => (
                  <th key={h} className="text-right text-gray-400 font-medium p-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discounts.filter(d => !search || d.code?.toLowerCase().includes(search.toLowerCase()) || (d.description || '').toLowerCase().includes(search.toLowerCase())
              ).map((d, i) => (
                <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`border-b border-luxury-gold/10 hover:bg-luxury-gold/5 transition-colors ${selectedIds.includes(d.id) ? 'bg-luxury-gold/5' : ''}`}>
                  <td className="p-4 text-center">
                    <input type="checkbox"
                      checked={selectedIds.includes(d.id)}
                      onChange={e => {
                        const checked = e.target.checked;
                        setSelectedIds(prev => checked ? [...prev, d.id] : prev.filter(id => id !== d.id));
                      }}
                      className="accent-luxury-gold w-4 h-4 cursor-pointer" />
                  </td>
                  <td className="p-4 font-mono text-luxury-gold font-bold">{d.code || '—'}</td>
                  <td className="p-4 text-gray-300">{d.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}</td>
                  <td className="p-4 text-white font-bold">{d.value}{d.type === 'percentage' ? '%' : ' ر.س'}</td>
                  <td className="p-4 text-gray-400 max-w-xs truncate">{d.description || '—'}</td>
                  <td className="p-4">
                    <button onClick={() => toggleActive(d)}
                      className={`px-2 py-1 rounded-sm text-xs border transition-all ${
                        d.is_active ? 'bg-green-400/10 text-green-400 border-green-400/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                      }`}>
                      {d.is_active ? 'مفعّل' : 'معطّل'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(d)}
                        className="px-3 py-1 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 text-sm">
                        تعديل
                      </button>
                      <button onClick={() => handleDelete(d.id)}
                        className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-sm hover:bg-red-500/20 text-sm">
                        حذف
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
