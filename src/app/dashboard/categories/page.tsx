'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

interface Category {
  id: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent_id?: string | null;
}

interface NavLink {
  id: string;
  name: string;
  link: string;
  has_dropdown: boolean;
  sort_order: number;
}

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', addToNav: false, navLink: '', parent_id: '' });
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [catRes, navRes] = await Promise.all([
        supabase.from('categories').select('id, name, slug, taxonomy, parent_id').order('name'),
        supabase.from('navigation_links').select('id, name, link, has_dropdown, sort_order').order('sort_order')
      ]);
      
      if (catRes.data) setCategories(catRes.data);
      if (navRes.data) setNavLinks(navRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getNavLinkForCategory(catSlug: string): NavLink | undefined {
    return navLinks.find(n => n.link === `/products/${catSlug}`);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parentIdVal = formData.parent_id === '' ? null : formData.parent_id;

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ name: formData.name, slug: formData.slug, taxonomy: 'product_cat', parent_id: parentIdVal })
          .eq('id', editingCategory.id);

        if (error) throw error;
        showToast('تم تحديث التصنيف بنجاح', 'success');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({ name: formData.name, slug: formData.slug, taxonomy: 'product_cat', parent_id: parentIdVal });

        if (error) throw error;
        showToast('تم إضافة التصنيف بنجاح', 'success');
      }

      if (formData.addToNav && formData.navLink) {
        const maxOrder = navLinks.length > 0 ? Math.max(...navLinks.map(n => n.sort_order)) : 0;
        
        const existingNav = navLinks.find(n => n.link === formData.navLink);
        
        if (!existingNav) {
          await supabase.from('navigation_links').insert({
            name: formData.name,
            link: formData.navLink,
            has_dropdown: false,
            sort_order: maxOrder + 1
          });
        }
      }

      fetchData();
      closeModal();
    } catch (error) {
      console.error('Error saving:', error);
      showToast('حدث خطأ في الحفظ', 'error');
    }
  };

  const confirmDelete = (category: Category) => {
    setDeleteTarget(category);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', deleteTarget.id);
      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
      showToast('تم حذف التصنيف بنجاح', 'success');
    } catch (error) {
      console.error('Error deleting:', error);
      showToast('حدث خطأ في الحذف', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleNavLink = async (category: Category, add: boolean) => {
    try {
      const link = `/products/${category.slug}`;
      
      if (add) {
        const maxOrder = navLinks.length > 0 ? Math.max(...navLinks.map(n => n.sort_order)) : 0;
        await supabase.from('navigation_links').insert({
          name: category.name,
          link: link,
          has_dropdown: false,
          sort_order: maxOrder + 1
        });
      } else {
        await supabase.from('navigation_links').delete().eq('link', link);
      }
      
      fetchData();
      showToast(add ? 'تمت إضافة الرابط للقائمة' : 'تمت إزالة الرابط من القائمة', 'success');
    } catch (error) {
      console.error('Error toggling nav:', error);
      showToast('حدث خطأ', 'error');
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', addToNav: true, navLink: '/products/', parent_id: '' });
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    const navLink = getNavLinkForCategory(category.slug);
    setEditingCategory(category);
    setFormData({ 
      name: category.name, 
      slug: category.slug, 
      addToNav: !!navLink,
      navLink: navLink?.link || `/products/${category.slug}`,
      parent_id: category.parent_id || ''
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', slug: '', addToNav: false, navLink: '', parent_id: '' });
  };

  const generateSlug = (name: string) => {
    return name.replace(/\([^)]+\)/g, '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').trim();
  };

  const getParentName = (parentId?: string | null) => {
    if (!parentId) return null;
    const parent = categories.find(c => c.id === parentId);
    return parent ? `تابع لـ ${parent.name}` : null;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">التصنيفات</h1>
          <p className="text-gray-400">إدارة تصنيفات المنتجات ({categories.length} تصنيف)</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-6 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors inline-flex items-center gap-2"
        >
          <span>+</span> إضافة تصنيف جديد
        </button>
      </motion.div>

      {/* Categories Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
          </div>
        ) : categories.length > 0 ? (
          categories.map((category, index) => {
            const navLink = getNavLinkForCategory(category.slug);
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-4 hover:border-luxury-gold/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-white font-bold">{category.name}</h3>
                    {category.parent_id && (
                      <span className="block text-xs text-luxury-gold mt-1">{getParentName(category.parent_id)}</span>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${navLink ? 'bg-luxury-gold/20 text-luxury-gold' : 'bg-gray-700 text-gray-400'}`}>
                    {navLink ? 'في القائمة' : 'غير مرتبط'}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-2">/products/{category.slug}</p>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => toggleNavLink(category, !navLink)}
                    className={`flex-1 px-3 py-2 rounded-sm text-sm transition-colors ${
                      navLink 
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                        : 'bg-luxury-gold/10 text-luxury-gold hover:bg-luxury-gold/20'
                    }`}
                  >
                    {navLink ? 'إزالة من القائمة' : 'إضافة للقائمة'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(category)}
                    className="flex-1 px-3 py-2 bg-luxury-gold/10 text-luxury-gold rounded-sm hover:bg-luxury-gold/20 transition-colors text-sm"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => confirmDelete(category)}
                    className="px-3 py-2 bg-red-500/10 text-red-500 rounded-sm hover:bg-red-500/20 transition-colors text-sm"
                  >
                    حذف
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            لا توجد تصنيفات
          </div>
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] border border-luxury-gold/30 rounded-sm p-6 max-w-md w-full z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-6">
                {editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">اسم التصنيف</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev,
                      name: e.target.value, 
                      slug: generateSlug(e.target.value),
                      navLink: `/products/${generateSlug(e.target.value)}`
                    }))}
                    required
                    className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
                    placeholder="أدخل اسم التصنيف"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">التصنيف الأب</label>
                  <select
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                    className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors appearance-none"
                  >
                    <option value="">بدون تصنيف أب (تصنيف رئيسي)</option>
                    {categories.filter(c => c.id !== editingCategory?.id && !c.parent_id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">الرابط (Slug)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value, navLink: `/products/${e.target.value}` }))}
                    required
                    className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
                    placeholder="category-slug"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="addToNav"
                    checked={formData.addToNav}
                    onChange={(e) => setFormData(prev => ({ ...prev, addToNav: e.target.checked }))}
                    className="w-4 h-4 rounded border-luxury-gold/30 text-luxury-gold"
                  />
                  <label htmlFor="addToNav" className="text-white">إضافة للقائمة العلوية</label>
                </div>

                {formData.addToNav && (
                  <div>
                    <label className="block text-white font-medium mb-2">رابط الصفحة</label>
                    <input
                      type="text"
                      value={formData.navLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, navLink: e.target.value }))}
                      className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
                      placeholder="/products/category-slug"
                    />
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors"
                  >
                    {editingCategory ? 'حفظ' : 'إضافة'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 border border-gray-600 text-gray-400 rounded-sm hover:border-gray-500 hover:text-white transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] border border-red-500/30 rounded-sm p-6 max-w-sm w-full z-[10000] text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">تأكيد الحذف</h3>
              <p className="text-gray-400 mb-6">
                هل أنت متأكد من رغبتك في حذف التصنيف <span className="text-luxury-gold font-bold">"{deleteTarget.name}"</span>؟ لا يمكن التراجع عن هذا الإجراء مقدماً.
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={executeDelete}
                  className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-sm hover:bg-red-600 transition-colors hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-3 border border-gray-600 text-gray-400 font-bold rounded-sm hover:border-gray-500 hover:text-white transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
