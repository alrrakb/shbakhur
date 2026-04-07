'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllSeoSettings, saveSeoData, type SeoData } from '@/lib/seo';
import { useToast } from '@/context/ToastContext';

const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

export default function SeoPage() {
  const [seoSettings, setSeoSettings] = useState<SeoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPage, setSelectedPage] = useState<string>('/');
  const { showToast } = useToast();

  useEffect(() => {
    fetchSeoSettings();
  }, []);

  async function fetchSeoSettings() {
    try {
      const data = await getAllSeoSettings();
      setSeoSettings(data.length > 0 ? data : getDefaultPages());
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
      setSeoSettings(getDefaultPages());
    } finally {
      setLoading(false);
    }
  }

  function getDefaultPages(): SeoData[] {
    return [
      { page_path: '/', title: 'SH للبخور - أجود البخور والعطور', description: '', keywords: '', og_image: '' },
      { page_path: '/products', title: 'جميع المنتجات | SH للبخور', description: '', keywords: '', og_image: '' },
      { page_path: '/products/best-sellers', title: 'الأكثر مبيعا | SH للبخور', description: '', keywords: '', og_image: '' },
      { page_path: '/products/best-offers', title: 'عروضنا | SH للبخور', description: '', keywords: '', og_image: '' },
      { page_path: '/products/perfumes', title: 'العطور | SH للبخور', description: '', keywords: '', og_image: '' },
      { page_path: '/products/oud', title: 'البخور والعود | SH للبخور', description: '', keywords: '', og_image: '' },
      { page_path: '/cart', title: 'السلة | SH للبخور', description: '', keywords: '', og_image: '' },
      { page_path: '/checkout', title: 'الدفع | SH للبخور', description: '', keywords: '', og_image: '' },
    ];
  }

  async function handleSave() {
    setSaving(true);
    try {
      let successCount = 0;
      for (const setting of seoSettings) {
        const result = await saveSeoData(setting);
        if (result.success) {
          successCount++;
        }
      }
      
      if (successCount === seoSettings.length) {
        showToast('تم حفظ جميع إعدادات SEO بنجاح', 'success');
      } else {
        showToast(`تم حفظ ${successCount} من ${seoSettings.length}`, 'warning');
      }
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      showToast('حدث خطأ في الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  }

  const currentPage = seoSettings.find(s => s.page_path === selectedPage) || seoSettings[0];

  const updateField = (field: keyof SeoData, value: string) => {
    setSeoSettings(prev => prev.map(s => 
      s.page_path === selectedPage ? { ...s, [field]: value } : s
    ));
  };

  const getPageDisplayName = (path: string): string => {
    const names: Record<string, string> = {
      '/': 'الرئيسية',
      '/products': 'جميع المنتجات',
      '/products/best-sellers': 'الأكثر مبيعا',
      '/products/best-offers': 'عروضنا',
      '/products/perfumes': 'العطور',
      '/products/oud': 'البخور والعود',
      '/cart': 'السلة',
      '/checkout': 'الدفع',
    };
    return names[path] || path;
  };

  const getTitleColor = (length: number) => {
    if (length === 0) return 'text-gray-400';
    if (length > TITLE_LIMIT) return 'text-red-500';
    if (length > TITLE_LIMIT - 10) return 'text-yellow-500';
    return 'text-luxury-gold';
  };

  const getDescColor = (length: number) => {
    if (length === 0) return 'text-gray-400';
    if (length > DESC_LIMIT) return 'text-red-500';
    if (length > DESC_LIMIT - 20) return 'text-yellow-500';
    return 'text-luxury-gold';
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">تحسين محركات البحث (SEO)</h1>
          <p className="text-gray-400">إدارة إعدادات SEO لكل صفحة ({seoSettings.length} صفحة)</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ جميع التغييرات'}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Page Selector */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-4"
        >
          <h3 className="text-white font-bold mb-4">صفحات الموقع</h3>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {seoSettings.map(page => (
              <button
                key={page.page_path}
                onClick={() => setSelectedPage(page.page_path)}
                className={`w-full text-right px-4 py-3 rounded-sm transition-colors ${
                  selectedPage === page.page_path
                    ? 'bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30'
                    : 'text-gray-400 hover:bg-luxury-gold/5 hover:text-white'
                }`}
              >
                <div className="font-medium">{getPageDisplayName(page.page_path)}</div>
                <div className="text-xs text-gray-500">{page.page_path}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* SEO Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-6"
        >
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-luxury-gold mb-2">
                  إعدادات SEO - {getPageDisplayName(currentPage.page_path)}
                </h3>
                <p className="text-gray-500 text-sm font-mono">{currentPage.page_path}</p>
              </div>

              {/* Page Title */}
              <div>
                <label className="block text-white font-medium mb-2">
                  عنوان الصفحة (Title)
                  <span className={`mr-2 text-xs ${getTitleColor(currentPage.title?.length || 0)}`}>
                    {(currentPage.title?.length || 0)}/{TITLE_LIMIT}
                  </span>
                </label>
                <input
                  type="text"
                  value={currentPage.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  maxLength={TITLE_LIMIT + 10}
                  className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
                  placeholder="عنوان الصفحة يظهر في محركات البحث"
                />
                {currentPage.title && currentPage.title.length > TITLE_LIMIT && (
                  <p className="text-red-500 text-xs mt-1">تجاوزت الحد المسموح ({TITLE_LIMIT} حرف)</p>
                )}
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-white font-medium mb-2">
                  وصف الصفحة (Meta Description)
                  <span className={`mr-2 text-xs ${getDescColor(currentPage.description?.length || 0)}`}>
                    {(currentPage.description?.length || 0)}/{DESC_LIMIT}
                  </span>
                </label>
                <textarea
                  value={currentPage.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  maxLength={DESC_LIMIT + 20}
                  rows={3}
                  className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
                  placeholder="وصف مختصر للصفحة يظهر في نتائج البحث..."
                />
                {currentPage.description && currentPage.description.length > DESC_LIMIT && (
                  <p className="text-red-500 text-xs mt-1">تجاوزت الحد المسموح ({DESC_LIMIT} حرف)</p>
                )}
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-white font-medium mb-2">الكلمات المفتاحية (Keywords)</label>
                <input
                  type="text"
                  value={currentPage.keywords || ''}
                  onChange={(e) => updateField('keywords', e.target.value)}
                  className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
                  placeholder="بخور, عود, عطور (افصل بفواصل)"
                />
                <p className="text-gray-500 text-xs mt-1">افصل الكلمات بفواصل</p>
              </div>

              {/* OG Image */}
              <div>
                <label className="block text-white font-medium mb-2">صورة التواصل الاجتماعي (OG Image)</label>
                <input
                  type="text"
                  value={currentPage.og_image || ''}
                  onChange={(e) => updateField('og_image', e.target.value)}
                  className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
                  placeholder="https://example.com/image.jpg"
                />
                {currentPage.og_image && (
                  <div className="mt-2">
                    <p className="text-gray-500 text-xs mb-1">معاينة:</p>
                    <img 
                      src={currentPage.og_image} 
                      alt="OG Preview" 
                      className="h-32 object-contain rounded-sm border border-luxury-gold/20"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="pt-4 border-t border-luxury-gold/20">
                <h4 className="text-white font-medium mb-3">معاينة البحث</h4>
                <div className="bg-white p-4 rounded-sm text-right">
                  <div className="text-blue-700 text-lg truncate">
                    {currentPage.title || 'عنوان الصفحة'}
                  </div>
                  <div className="text-green-700 text-sm truncate">
                    shbakhoor.com{currentPage.page_path}
                  </div>
                  <div className="text-gray-600 text-sm line-clamp-2 mt-1">
                    {currentPage.description || 'وصف الصفحة يظهر هنا في نتائج البحث...'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
