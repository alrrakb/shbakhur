'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

interface Product {
  id: number;
  title: string;
  regular_price: string;
  sale_price: string;
  featured_image: string;
  description?: string;
  slug?: string;
  sku?: string;
  stock_status?: string;
  short_description?: string;
}

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [discountFilter, setDiscountFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [multiDeleteModal, setMultiDeleteModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importingWP, setImportingWP] = useState(false);
  const [importingGallery, setImportingGallery] = useState(false);
  const [galleryImportResult, setGalleryImportResult] = useState<{ updated: number; skipped: number; errors: number } | null>(null);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      
      setProducts((data || []).map((p: any) => ({
        id: p.id,
        title: p.title || '',
        regular_price: p.regular_price || p.price || '',
        sale_price: p.sale_price || '',
        featured_image: p.image || p.featured_image || '',
        description: p.description,
        slug: p.slug,
        sku: p.sku,
        stock_status: p.stock_status,
        short_description: p.short_description
      })));
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('فشل تحميل المنتجات', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.product) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteModal.product.id);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== deleteModal.product!.id));
      showToast('تم حذف المنتج بنجاح', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('فشل حذف المنتج', 'error');
    }
    
    setDeleteModal({ open: false, product: null });
  };

  const handleMultiDelete = async () => {
    const idsToDelete = Array.from(selectedProducts);
    if (idsToDelete.length === 0) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      setProducts(prev => prev.filter(p => !selectedProducts.has(p.id)));
      setSelectedProducts(new Set());
      showToast(`تم حذف ${idsToDelete.length} منتج بنجاح`, 'success');
    } catch (error) {
      console.error('Error deleting products:', error);
      showToast('فشل حذف المنتجات', 'error');
    }
    
    setMultiDeleteModal(false);
  };

  const toggleSelectProduct = (id: number) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;

      const exportData = data || [];
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('تم تصدير المنتجات بنجاح', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('فشل تصدير المنتجات', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const importedProducts = JSON.parse(text);

      if (!Array.isArray(importedProducts)) {
        throw new Error('Invalid format');
      }

      let successCount = 0;
      let errorCount = 0;

      for (const product of importedProducts) {
        try {
          const productData = {
            title: product.title || '',
            description: product.description || '',
            short_description: product.short_description || '',
            slug: product.slug || product.title?.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g, '-') || '',
            price: product.regular_price || product.price || '',
            sale_price: product.sale_price || '',
            regular_price: product.regular_price || product.price || '',
            sku: product.sku || '',
            image: product.featured_image || product.image || '',
            is_active: product.is_active !== false,
          };

          const { error: insertError } = await supabase
            .from('products')
            .insert(productData);

          if (insertError) {
            errorCount++;
          } else {
            successCount++;
          }
        } catch {
          errorCount++;
        }
      }

      showToast(`تم استيراد ${successCount} منتج${errorCount > 0 ? ` - فشل ${errorCount}` : ''}`, errorCount > 0 ? 'warning' : 'success');
      
      fetchProducts();
    } catch (error) {
      console.error('Import error:', error);
      showToast('تنسيق ملف غير صالح', 'error');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportGallery = async () => {
    setImportingGallery(true);
    setGalleryImportResult(null);
    try {
      const response = await fetch('/api/import-wp-gallery');
      const result = await response.json();

      if (result.success) {
        setGalleryImportResult({ updated: result.updated, skipped: result.skipped, errors: result.errors });
        showToast(`تم استيراد معرض الصور لـ ${result.updated} منتج من WordPress`, 'success');
        fetchProducts();
      } else {
        showToast(result.error || 'فشل استيراد معرض الصور من WordPress', 'error');
      }
    } catch (error) {
      console.error('Gallery import error:', error);
      showToast('فشل استيراد معرض الصور من WordPress', 'error');
    } finally {
      setImportingGallery(false);
    }
  };

  const handleImportFromWordPress = async () => {
    setImportingWP(true);
    setImportProgress({ current: 0, total: 0 });
    try {
      const response = await fetch('/api/import-wp');
      const result = await response.json();
      
      if (result.success) {
        showToast(`تم استيراد ${result.count} منتج من WordPress`, 'success');
        fetchProducts();
      } else {
        showToast(result.error || 'فشل استيراد المنتجات من WordPress', 'error');
      }
    } catch (error) {
      console.error('Import from WP error:', error);
      showToast('فشل استيراد المنتجات من WordPress', 'error');
    } finally {
      setImportingWP(false);
      setImportProgress(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStock = !stockFilter || p.stock_status === stockFilter;
    const isDiscounted = p.sale_price && p.regular_price && Number(p.sale_price) < Number(p.regular_price) && Number(p.sale_price) > 0;
    const matchesDiscount = !discountFilter || (discountFilter === 'discounted' ? isDiscounted : true);
    
    return matchesSearch && matchesStock && matchesDiscount;
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">المنتجات</h1>
          <p className="text-gray-400">إدارة منتجات المتجر ({products.length} منتج)</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={handleImportGallery}
            disabled={importingGallery}
            title="استيراد معرض صور المنتجات من WordPress"
            className="px-4 py-3 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-sm hover:bg-purple-500/20 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            {importingGallery ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري استيراد المعرض...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                استيراد معرض الصور
              </>
            )}
          </button>
          <button
            onClick={handleImportFromWordPress}
            disabled={importingWP}
            className="px-4 py-3 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            {importingWP ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري الاستيراد من WordPress...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                استيراد من WordPress
              </>
            )}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-4 py-3 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            {importing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري الاستيراد...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                استيراد
              </>
            )}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-3 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري التصدير...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                تصدير
              </>
            )}
          </button>
          {selectedProducts.size > 0 && (
            <button
              onClick={() => setMultiDeleteModal(true)}
              className="px-4 py-3 bg-red-500/10 text-red-500 border border-red-500/30 rounded-sm hover:bg-red-500/20 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              حذف ({selectedProducts.size})
            </button>
          )}
          <Link
            href="/dashboard/products/add"
            className="px-6 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors inline-flex items-center gap-2"
          >
            <span>+</span> إضافة منتج جديد
          </Link>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="البحث باسم المنتج أو الرمز (SKU)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
          />
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            className="w-full md:w-48 px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
          >
            <option value="">حالة المخزون (الكل)</option>
            <option value="instock">متوفر</option>
            <option value="outofstock">نفذت الكمية</option>
          </select>
          <select
            value={discountFilter}
            onChange={e => setDiscountFilter(e.target.value)}
            className="w-full md:w-48 px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
          >
            <option value="">الخصومات (الكل)</option>
            <option value="discounted">مخفضة فقط</option>
          </select>
        </div>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-luxury-gold/20">
                  <th className="p-4 w-12">
                    <button
                      onClick={toggleSelectAll}
                      className="w-5 h-5 flex items-center justify-center text-luxury-gold hover:bg-luxury-gold/20 rounded transition-colors"
                      title={selectedProducts.size === filteredProducts.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    >
                      {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="text-right text-gray-400 font-medium p-4">الصورة</th>
                  <th className="text-right text-gray-400 font-medium p-4">المنتج</th>
                  <th className="text-right text-gray-400 font-medium p-4">السعر</th>
                  <th className="text-right text-gray-400 font-medium p-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border-b border-luxury-gold/10 hover:bg-luxury-gold/5 transition-colors ${selectedProducts.has(product.id) ? 'bg-luxury-gold/10' : ''}`}
                  >
                    <td className="p-4">
                      <button
                        onClick={() => toggleSelectProduct(product.id)}
                        className={`w-5 h-5 flex items-center justify-center rounded border transition-colors ${
                          selectedProducts.has(product.id)
                            ? 'bg-luxury-gold border-luxury-gold text-luxury-black'
                            : 'border-gray-600 text-transparent hover:border-luxury-gold'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="w-16 h-16 rounded-sm overflow-hidden bg-luxury-black">
                        <img
                          src={product.featured_image || '/placeholder.svg'}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white font-medium truncate max-w-xs">{product.title}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        {product.sale_price && product.sale_price !== product.regular_price && product.sale_price !== '0' && (
                          <span className="text-gray-500 line-through text-sm">{product.regular_price} ر.س</span>
                        )}
                        <span className="text-luxury-gold font-bold">
                          {product.sale_price && product.sale_price !== product.regular_price && product.sale_price !== '0' 
                            ? product.sale_price 
                            : product.regular_price} ر.س
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/products/edit/${product.id}`}
                          className="px-3 py-2 bg-luxury-gold/10 text-luxury-gold rounded-sm hover:bg-luxury-gold/20 transition-colors text-sm"
                        >
                          تعديل
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ open: true, product })}
                          className="px-3 py-2 bg-red-500/10 text-red-500 rounded-sm hover:bg-red-500/20 transition-colors text-sm"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد منتجات'}
          </div>
        )}
      </motion.div>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal.open && deleteModal.product && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setDeleteModal({ open: false, product: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] border border-luxury-gold/30 rounded-sm p-6 max-w-md w-full z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">تأكيد الحذف</h3>
              <p className="text-gray-400 mb-6">
                هل أنت متأكد من حذف "{deleteModal.product.title}"؟
                <br />
                <span className="text-red-500">لا يمكن التراجع عن هذا الإجراء</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteModal({ open: false, product: null })}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 rounded-sm hover:border-gray-500 hover:text-white transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors"
                >
                  حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-Delete Modal */}
      <AnimatePresence>
        {multiDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setMultiDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] border border-luxury-gold/30 rounded-sm p-6 max-w-md w-full z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">تأكيد حذف المنتجات</h3>
              <p className="text-gray-400 mb-6">
                هل أنت متأكد من حذف {selectedProducts.size} منتجات؟
                <br />
                <span className="text-red-500">لا يمكن التراجع عن هذا الإجراء</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setMultiDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 rounded-sm hover:border-gray-500 hover:text-white transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleMultiDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors"
                >
                  حذف ({selectedProducts.size})
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
