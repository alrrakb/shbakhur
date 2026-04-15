'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import {
  exportProductsToCsv,
  downloadCsv,
  type CsvExportFilters,
} from '@/lib/csv-utils';
import {
  exportProductsToJson,
  downloadJson,
  type ExportFilters,
} from '@/lib/export-utils';
import {
  parseJsonFile,
  checkForConflicts,
  processImportWithResolution,
  importProduct,
  type ImportConflict,
  type ProductExportData,
} from '@/lib/import-utils';
import { ImportConflictModal } from '@/components/ImportConflictModal';

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
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [productCategories, setProductCategories] = useState<Record<number, string[]>>({});
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [multiDeleteModal, setMultiDeleteModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [exportingCsv, setExportingCsv] = useState(false);
  const [importingWP, setImportingWP] = useState(false);
  const [importingGallery, setImportingGallery] = useState(false);
  const [galleryImportResult, setGalleryImportResult] = useState<{ updated: number; skipped: number; errors: number } | null>(null);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [importingJson, setImportingJson] = useState(false);
  const [jsonConflicts, setJsonConflicts] = useState<ImportConflict[]>([]);
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<ProductExportData[] | null>(null);
  const [conflictResolutions, setConflictResolutions] = useState<Map<string | number, 'overwrite' | 'skip'>>(new Map());
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, productCatsRes] = await Promise.all([
        supabase.from('products').select('*').order('id', { ascending: false }),
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('product_categories').select('product_id, category_id')
      ]);

      if (productsRes.error) throw productsRes.error;
      
      setProducts((productsRes.data || []).map((p: any) => ({
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

      setCategories(categoriesRes.data || []);

      const pcMap: Record<number, string[]> = {};
      (productCatsRes.data || []).forEach((pc: any) => {
        if (!pcMap[pc.product_id]) pcMap[pc.product_id] = [];
        pcMap[pc.product_id].push(pc.category_id);
      });
      setProductCategories(pcMap);
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

  const handleExportCsv = async () => {
    setExportingCsv(true);
    setExportDropdownOpen(false);
    try {
      // Build filters object from current filter state
      const hasActiveFilters = searchQuery || stockFilter || categoryFilter || discountFilter;
      const filters: CsvExportFilters | undefined = hasActiveFilters ? {
        searchQuery: searchQuery || undefined,
        stockFilter: stockFilter || undefined,
        categoryFilter: categoryFilter || undefined,
        discountFilter: discountFilter || undefined,
      } : undefined;

      const csvContent = await exportProductsToCsv(filters);
      const filename = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCsv(csvContent, filename);

      const filterMsg = hasActiveFilters ? ' (مع التصفية المطبقة)' : '';
      showToast(`تم تصدير CSV بنجاح${filterMsg}`, 'success');
    } catch (error) {
      console.error('Export CSV error:', error);
      showToast('فشل تصدير CSV', 'error');
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportJson = async () => {
    setExportingJson(true);
    setExportDropdownOpen(false);
    try {
      // Build filters object from current filter state
      const hasActiveFilters = searchQuery || stockFilter || categoryFilter || discountFilter;
      const filters: ExportFilters | undefined = hasActiveFilters ? {
        searchQuery: searchQuery || undefined,
        stockFilter: stockFilter || undefined,
        categoryFilter: categoryFilter || undefined,
        discountFilter: discountFilter || undefined,
      } : undefined;

      const jsonContent = await exportProductsToJson(filters);
      const filename = `products_export_${new Date().toISOString().split('T')[0]}.json`;
      downloadJson(jsonContent, filename);

      const filterMsg = hasActiveFilters ? ' (مع التصفية المطبقة)' : '';
      showToast(`تم تصدير JSON بنجاح${filterMsg}`, 'success');
    } catch (error) {
      console.error('Export JSON error:', error);
      showToast('فشل تصدير JSON', 'error');
    } finally {
      setExportingJson(false);
    }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingJson(true);
    try {
      const importData = await parseJsonFile(file);
      setPendingImportData(importData);

      // Check for conflicts
      const { conflicts, newProducts } = await checkForConflicts(importData);

      if (conflicts.length > 0) {
        // Show conflict resolution modal
        setJsonConflicts(conflicts);
        setCurrentConflictIndex(0);
        setConflictResolutions(new Map());
        setShowConflictModal(true);
        showToast(`تم العثور على ${conflicts.length} منتج مكرر يحتاج إلى مراجعة`, 'warning');
      } else {
        // No conflicts - proceed with import
        const result = await processImportWithResolution(
          importData,
          new Map(),
          (current, total) => setImportProgress({ current, total })
        );

        showToast(
          `تم استيراد ${result.added} جديد، ${result.updated} محدث، ${result.skipped} متخطى${result.errors > 0 ? `، ${result.errors} خطأ` : ''}`,
          result.errors > 0 ? 'warning' : 'success'
        );
        fetchProducts();
      }
    } catch (error) {
      console.error('Import JSON error:', error);
      showToast('فشل قراءة ملف JSON: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'), 'error');
    } finally {
      setImportingJson(false);
      if (jsonFileInputRef.current) {
        jsonFileInputRef.current.value = '';
      }
    }
  };

  const handleConflictResolution = async (resolution: 'overwrite' | 'skip') => {
    const currentConflict = jsonConflicts[currentConflictIndex];

    // Save resolution for this product
    setConflictResolutions(prev => {
      const newMap = new Map(prev);
      newMap.set(currentConflict.existingProduct.id, resolution);
      return newMap;
    });

    // Move to next conflict or process all if done
    if (currentConflictIndex < jsonConflicts.length - 1) {
      setCurrentConflictIndex(prev => prev + 1);
    } else {
      // All conflicts resolved - close modal and process import
      setShowConflictModal(false);

      if (pendingImportData) {
        const allResolutions = new Map(conflictResolutions);
        // Add the last resolution
        allResolutions.set(currentConflict.existingProduct.id, resolution);

        setImportingJson(true);
        try {
          const result = await processImportWithResolution(
            pendingImportData,
            allResolutions,
            (current, total) => setImportProgress({ current, total })
          );

          showToast(
            `اكتمل الاستيراد: ${result.added} جديد، ${result.updated} محدث، ${result.skipped} متخطى${result.errors > 0 ? `، ${result.errors} خطأ` : ''}`,
            result.errors > 0 ? 'warning' : 'success'
          );
          fetchProducts();
        } catch (err) {
          showToast('فشل معالجة الاستيراد', 'error');
        } finally {
          setImportingJson(false);
          setImportProgress(null);
          setPendingImportData(null);
          setJsonConflicts([]);
          setConflictResolutions(new Map());
        }
      }
    }
  };

  const handleCancelImport = () => {
    setShowConflictModal(false);
    setPendingImportData(null);
    setJsonConflicts([]);
    setConflictResolutions(new Map());
    setCurrentConflictIndex(0);
    showToast('تم إلغاء الاستيراد', 'info');
  };

  const handleOverwriteAll = async () => {
    // Set all remaining conflicts to 'overwrite'
    const allResolutions = new Map(conflictResolutions);
    for (let i = currentConflictIndex; i < jsonConflicts.length; i++) {
      allResolutions.set(jsonConflicts[i].existingProduct.id, 'overwrite');
    }
    setConflictResolutions(allResolutions);
    setShowConflictModal(false);

    if (pendingImportData) {
      setImportingJson(true);
      try {
        const result = await processImportWithResolution(
          pendingImportData,
          allResolutions,
          (current, total) => setImportProgress({ current, total })
        );

        showToast(
          `اكتمل الاستيراد: ${result.added} جديد، ${result.updated} محدث، ${result.skipped} متخطى${result.errors > 0 ? `، ${result.errors} خطأ` : ''}`,
          result.errors > 0 ? 'warning' : 'success'
        );
        fetchProducts();
      } catch (err) {
        showToast('فشل معالجة الاستيراد', 'error');
      } finally {
        setImportingJson(false);
        setImportProgress(null);
        setPendingImportData(null);
        setJsonConflicts([]);
        setConflictResolutions(new Map());
      }
    }
  };

  const handleSkipAll = async () => {
    // Set all remaining conflicts to 'skip'
    const allResolutions = new Map(conflictResolutions);
    for (let i = currentConflictIndex; i < jsonConflicts.length; i++) {
      allResolutions.set(jsonConflicts[i].existingProduct.id, 'skip');
    }
    setConflictResolutions(allResolutions);
    setShowConflictModal(false);

    if (pendingImportData) {
      setImportingJson(true);
      try {
        const result = await processImportWithResolution(
          pendingImportData,
          allResolutions,
          (current, total) => setImportProgress({ current, total })
        );

        showToast(
          `اكتمل الاستيراد: ${result.added} جديد، ${result.updated} محدث، ${result.skipped} متخطى${result.errors > 0 ? `، ${result.errors} خطأ` : ''}`,
          result.errors > 0 ? 'warning' : 'success'
        );
        fetchProducts();
      } catch (err) {
        showToast('فشل معالجة الاستيراد', 'error');
      } finally {
        setImportingJson(false);
        setImportProgress(null);
        setPendingImportData(null);
        setJsonConflicts([]);
        setConflictResolutions(new Map());
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
    const productCatIds = productCategories[p.id] || [];
    const matchesCategory = !categoryFilter || productCatIds.includes(categoryFilter);
    
    return matchesSearch && matchesStock && matchesDiscount && matchesCategory;
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Header & Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div className="flex-shrink-0">
          <h1 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">المنتجات</h1>
          <p className="text-gray-400 text-sm">إدارة منتجات المتجر ({products.length} منتج)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden file input for JSON import */}
          <input
            ref={jsonFileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJson}
            className="hidden"
          />

          {/* Import Button with conflict resolution */}
          <button
            onClick={() => jsonFileInputRef.current?.click()}
            disabled={importingJson}
            className="px-3 py-2 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 text-xs sm:text-sm"
          >
            {importingJson ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {importProgress ? `${importProgress.current}/${importProgress.total}` : 'جاري...'}
              </span>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                استيراد
              </>
            )}
          </button>

          {/* Export Dropdown */}
          <div ref={exportDropdownRef} className="relative">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              disabled={exportingCsv || exportingJson}
              className="px-3 py-2 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 text-xs sm:text-sm"
            >
              {(exportingCsv || exportingJson) ? (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري...
                </span>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  تصدير
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>

            {exportDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 mt-2 w-48 bg-[#1a1a1a] border border-luxury-gold/30 rounded-sm shadow-xl z-50 overflow-hidden"
              >
                <button
                  onClick={handleExportCsv}
                  className="w-full px-4 py-3 text-right text-white hover:bg-luxury-gold/10 transition-colors flex items-center gap-2 border-b border-luxury-gold/10"
                >
                  <svg className="w-4 h-4 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <div className="text-sm">تصدير CSV</div>
                    <div className="text-xs text-gray-500">6 حقول محددة</div>
                  </div>
                </button>
                <button
                  onClick={handleExportJson}
                  className="w-full px-4 py-3 text-right text-white hover:bg-luxury-gold/10 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <div>
                    <div className="text-sm">تصدير JSON</div>
                    <div className="text-xs text-gray-500">جميع البيانات + الصور</div>
                  </div>
                </button>
              </motion.div>
            )}
          </div>
          {selectedProducts.size > 0 && (
            <button
              onClick={() => setMultiDeleteModal(true)}
              className="px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-sm hover:bg-red-500/20 transition-colors inline-flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              حذف ({selectedProducts.size})
            </button>
          )}
          <Link
            href="/dashboard/products/add"
            className="px-4 py-2 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors inline-flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <span>+</span> إضافة
          </Link>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-3 sm:p-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <input
            type="text"
            placeholder="البحث باسم المنتج أو SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white text-sm sm:text-base focus:border-luxury-gold focus:outline-none transition-colors"
          />
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white text-sm sm:text-base focus:border-luxury-gold focus:outline-none transition-colors"
          >
            <option value="">حالة المخزون (الكل)</option>
            <option value="instock">متوفر</option>
            <option value="outofstock">نفذت الكمية</option>
          </select>
          <select
            value={discountFilter}
            onChange={e => setDiscountFilter(e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white text-sm sm:text-base focus:border-luxury-gold focus:outline-none transition-colors"
          >
            <option value="">الخصومات (الكل)</option>
            <option value="discounted">مخفضة فقط</option>
          </select>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white text-sm sm:text-base focus:border-luxury-gold focus:outline-none transition-colors"
          >
            <option value="">التصنيف (الكل)</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 overflow-hidden max-w-full"
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="w-full max-w-full overflow-x-auto">
            {/* ── Mobile Cards (hidden on md+) ── */}
            <div className="md:hidden divide-y divide-luxury-gold/10">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 flex gap-4 ${selectedProducts.has(product.id) ? 'bg-luxury-gold/5' : ''}`}
                >
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={() => toggleSelectProduct(product.id)}
                      className={`w-5 h-5 flex flex-shrink-0 items-center justify-center rounded border transition-colors ${
                        selectedProducts.has(product.id)
                          ? 'bg-luxury-gold border-luxury-gold text-luxury-black'
                          : 'border-gray-600 text-transparent hover:border-luxury-gold'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="w-20 h-20 flex-shrink-0 rounded-sm overflow-hidden bg-luxury-black border border-luxury-gold/20">
                    <img
                      src={product.featured_image || '/placeholder.svg'}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <p className="text-white font-medium text-sm line-clamp-2 leading-snug">{product.title}</p>
                    
                    <div className="flex flex-col mt-2">
                       {product.sale_price && product.sale_price !== product.regular_price && product.sale_price !== '0' && (
                         <span className="text-gray-500 line-through text-xs font-mono">{product.regular_price} ر.س</span>
                       )}
                       <span className="text-luxury-gold font-bold text-sm font-mono">
                         {product.sale_price && product.sale_price !== product.regular_price && product.sale_price !== '0' 
                           ? product.sale_price 
                           : product.regular_price} ر.س
                       </span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/dashboard/products/edit/${product.id}`}
                        className="px-3 py-1.5 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors text-xs flex-1 text-center"
                      >
                        تعديل
                      </Link>
                      <button
                        onClick={() => setDeleteModal({ open: true, product })}
                        className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-sm hover:bg-red-500/20 transition-colors text-xs flex-1 text-center"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── Medium Screen Card Grid (md to lg) ── */}
            <div className="hidden md:grid lg:hidden grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`bg-luxury-black/50 border border-luxury-gold/20 rounded-sm p-4 flex flex-col gap-3 ${selectedProducts.has(product.id) ? 'border-luxury-gold/50 bg-luxury-gold/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleSelectProduct(product.id)}
                      className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded border transition-colors mt-1 ${
                        selectedProducts.has(product.id)
                          ? 'bg-luxury-gold border-luxury-gold text-luxury-black'
                          : 'border-gray-600 text-transparent hover:border-luxury-gold'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="w-16 h-16 rounded-sm overflow-hidden bg-luxury-black flex-shrink-0">
                      <img
                        src={product.featured_image || '/placeholder.svg'}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm line-clamp-2" title={product.title}>{product.title}</p>
                      {product.sku && (
                        <p className="text-gray-500 text-xs mt-1">SKU: {product.sku}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-luxury-gold/10">
                    <div className="flex flex-col">
                      {product.sale_price && product.sale_price !== product.regular_price && product.sale_price !== '0' && (
                        <span className="text-gray-500 line-through text-xs">{product.regular_price} ر.س</span>
                      )}
                      <span className="text-luxury-gold font-bold text-sm">
                        {product.sale_price && product.sale_price !== product.regular_price && product.sale_price !== '0' 
                          ? product.sale_price 
                          : product.regular_price} ر.س
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/products/edit/${product.id}`}
                        className="px-2 py-1.5 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors text-xs"
                      >
                        تعديل
                      </Link>
                      <button
                        onClick={() => setDeleteModal({ open: true, product })}
                        className="px-2 py-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-sm hover:bg-red-500/20 transition-colors text-xs"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── Desktop Table (lg and up) ── */}
            <div className="hidden lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-luxury-gold/20">
                    <th className="p-4 w-12 whitespace-nowrap">
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
                    <th className="text-right text-gray-400 font-medium p-4 whitespace-nowrap w-20">الصورة</th>
                    <th className="text-right text-gray-400 font-medium p-4 whitespace-nowrap">المنتج</th>
                    <th className="text-right text-gray-400 font-medium p-4 whitespace-nowrap w-32 xl:w-40 hidden xl:table-cell">SKU</th>
                    <th className="text-right text-gray-400 font-medium p-4 whitespace-nowrap w-28">السعر</th>
                    <th className="text-right text-gray-400 font-medium p-4 whitespace-nowrap w-24 hidden xl:table-cell">المخزون</th>
                    <th className="text-right text-gray-400 font-medium p-4 whitespace-nowrap w-32">الإجراءات</th>
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
                      <td className="p-4 whitespace-nowrap">
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
                      <td className="p-4 whitespace-nowrap">
                        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-sm overflow-hidden bg-luxury-black flex-shrink-0">
                          <img
                            src={product.featured_image || '/placeholder.svg'}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="p-4 min-w-[200px] max-w-xs">
                        <p className="text-white font-medium truncate" title={product.title}>{product.title}</p>
                      </td>
                      <td className="p-4 whitespace-nowrap hidden xl:table-cell">
                        <p className="text-gray-400 text-sm font-mono">{product.sku || '-'}</p>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          {product.sale_price && product.sale_price !== product.regular_price && product.sale_price !== '0' && (
                            <span className="text-gray-500 line-through text-xs sm:text-sm">{product.regular_price} ر.س</span>
                          )}
                          <span className="text-luxury-gold font-bold text-sm sm:text-base">
                            {product.sale_price && product.sale_price !== product.regular_price && product.sale_price !== '0'
                              ? product.sale_price
                              : product.regular_price} ر.س
                          </span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap hidden xl:table-cell">
                        <span className={`text-sm ${product.stock_status === 'instock' ? 'text-green-400' : 'text-red-400'}`}>
                          {product.stock_status === 'instock' ? 'متوفر' : 'نفذت'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/products/edit/${product.id}`}
                            className="px-3 py-2 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors text-sm"
                          >
                            تعديل
                          </Link>
                          <button
                            onClick={() => setDeleteModal({ open: true, product })}
                            className="px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-sm hover:bg-red-500/20 transition-colors text-sm"
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

      {/* Import Conflict Resolution Modal */}
      {showConflictModal && jsonConflicts.length > 0 && (
        <ImportConflictModal
          conflict={jsonConflicts[currentConflictIndex]}
          currentIndex={currentConflictIndex}
          totalConflicts={jsonConflicts.length}
          onOverwrite={() => handleConflictResolution('overwrite')}
          onSkip={() => handleConflictResolution('skip')}
          onCancel={handleCancelImport}
          onOverwriteAll={handleOverwriteAll}
          onSkipAll={handleSkipAll}
        />
      )}
    </div>
  );
}
