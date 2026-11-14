'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Search, 
  Globe, 
  FileText, 
  Sparkles, 
  Image as ImageIcon, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  ShieldCheck,
  KeyRound,
  ShoppingBag,
  Copy,
  Check
} from 'lucide-react';
import { getAllSeoSettings, saveSeoData, type SeoData } from '@/lib/seo';
import { useToast } from '@/context/ToastContext';
import DashboardRefreshButton from '@/components/DashboardRefreshButton';
import { 
  revalidateSitemap, 
  getSitemapStats, 
  type SitemapStats,
  fetchGoogleVerificationCode,
  updateGoogleVerificationCode
} from '@/app/actions/revalidate';

const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

export default function SeoPage() {
  const [seoSettings, setSeoSettings] = useState<SeoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPage, setSelectedPage] = useState<string>('/');
  const [sitemapStats, setSitemapStats] = useState<SitemapStats | null>(null);
  const [revalidatingSitemap, setRevalidatingSitemap] = useState(false);
  
  // Google Search Console verification state
  const [googleVerificationCode, setGoogleVerificationCode] = useState<string>('');
  const [savingVerification, setSavingVerification] = useState<boolean>(false);
  
  // Google Merchant Center feed state
  const [copiedFeed, setCopiedFeed] = useState<boolean>(false);
  
  const { showToast } = useToast();

  const handleCopyFeed = async () => {
    const feedUrl = 'https://shbkhur.com/api/feeds/google-merchant';
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopiedFeed(true);
      showToast('تم نسخ رابط خلاصة Google Merchant بنجاح', 'success');
      setTimeout(() => setCopiedFeed(false), 2500);
    } catch (err) {
      showToast('تعذر نسخ الرابط إلى الحافظة', 'error');
    }
  };

  useEffect(() => {
    fetchSeoSettings();
    loadSitemapMetrics();
    loadGoogleVerification();
  }, []);

  async function loadSitemapMetrics() {
    try {
      const stats = await getSitemapStats();
      setSitemapStats(stats);
    } catch (err) {
      console.error('Error loading sitemap metrics:', err);
    }
  }

  async function loadGoogleVerification() {
    try {
      const code = await fetchGoogleVerificationCode();
      setGoogleVerificationCode(code);
    } catch (err) {
      console.error('Error loading Google verification code:', err);
    }
  }

  async function handleRevalidateSitemap() {
    setRevalidatingSitemap(true);
    try {
      const updatedStats = await revalidateSitemap();
      setSitemapStats(updatedStats);
      if (updatedStats.success) {
        showToast('تمت إعادة بناء وفهرسة خريطة الموقع بنجاح', 'success');
      } else {
        showToast(updatedStats.error || 'حدث خطأ أثناء تحديث السايت ماب', 'error');
      }
    } catch (err) {
      console.error('Revalidation error:', err);
      showToast('تعذر إكمال إعادة بناء السايت ماب', 'error');
    } finally {
      setRevalidatingSitemap(false);
    }
  }

  async function handleSaveGoogleVerification() {
    setSavingVerification(true);
    try {
      const result = await updateGoogleVerificationCode(googleVerificationCode);
      if (result.success) {
        setGoogleVerificationCode(result.cleanCode);
        showToast('تم حفظ وتفعيل كود توثيق Google Search Console بنجاح', 'success');
      } else {
        showToast(result.error || 'فشل حفظ كود التوثيق', 'error');
      }
    } catch (err) {
      console.error('Error saving Google verification:', err);
      showToast('حدث خطأ أثناء حفظ كود التوثيق', 'error');
    } finally {
      setSavingVerification(false);
    }
  }

  const ALL_STORE_PAGES = [
    { path: '/', name: 'الرئيسية' },
    { path: '/products', name: 'جميع المنتجات' },
    { path: '/best-sellers', name: 'الاكثر مبيعا' },
    { path: '/special-offers', name: 'عروضنا المميزة' },
    { path: '/oud', name: 'البخور والعود' },
    { path: '/natural-oud', name: 'عود طبيعي' },
    { path: '/enhanced-oud', name: 'عود محسن' },
    { path: '/scented-oud', name: 'عود معطر' },
    { path: '/oil-oud', name: 'دهن العود' },
    { path: '/bakhur-accessories', name: 'اكسسوارات البخور' },
    { path: '/tomford', name: 'عطور توم فورد' },
    { path: '/dior', name: 'عطور ديور' },
    { path: '/gucci', name: 'عطور جوتشي' },
    { path: '/ysl', name: 'عطور ايف سان لوران' },
    { path: '/cart', name: 'سلة المشتريات' },
    { path: '/checkout', name: 'اتمام الدفع' }
  ];

  async function fetchSeoSettings() {
    try {
      const dbData = await getAllSeoSettings();
      
      const merged: SeoData[] = ALL_STORE_PAGES.map(page => {
        const existing = dbData.find(d => d.page_path === page.path);
        if (existing) return existing;
        return {
          page_path: page.path,
          title: page.path === '/' ? 'SH للبخور - أجود البخور والعطور' : `${page.name} | SH للبخور`,
          description: '',
          keywords: '',
          og_image: ''
        };
      });

      const predefinedPaths = new Set(ALL_STORE_PAGES.map(p => p.path));
      dbData.forEach(d => {
        if (!predefinedPaths.has(d.page_path)) {
          merged.push(d);
        }
      });

      setSeoSettings(merged);
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
      setSeoSettings(ALL_STORE_PAGES.map(page => ({
        page_path: page.path,
        title: page.path === '/' ? 'SH للبخور - أجود البخور والعطور' : `${page.name} | SH للبخور`,
        description: '',
        keywords: '',
        og_image: ''
      })));
    } finally {
      setLoading(false);
    }
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
    const defaultPage = ALL_STORE_PAGES.find(p => p.path === path);
    if (defaultPage) return defaultPage.name;
    
    // Fallbacks for generic or old paths
    const legacyNames: Record<string, string> = {
      '/products/best-sellers': 'الأكثر مبيعا (قديم)',
      '/products/best-offers': 'عروضنا (قديم)',
      '/products/oud': 'البخور والعود (قديم)'
    };
    
    return legacyNames[path] || path;
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

  const isVerified = Boolean(googleVerificationCode && googleVerificationCode.trim().length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-white mb-1">تحسين محركات البحث (SEO)</h1>
          <p className="text-gray-400 text-sm">إدارة إعدادات SEO وفهرسة محركات البحث ({seoSettings.length} صفحة)</p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardRefreshButton onRefresh={() => { fetchSeoSettings(); loadSitemapMetrics(); loadGoogleVerification(); }} loading={loading} />
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold/80 transition-colors disabled:opacity-50 text-sm inline-flex items-center justify-center gap-2"
          >
            {saving ? 'جاري الحفظ...' : <><Save size={16} /> حفظ جميع التغييرات</>}
          </button>
        </div>
      </motion.div>

      {/* 👑 Royal Sitemap Control Hub */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-4 sm:p-6 shadow-xl relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-luxury-gold/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-luxury-gold/10 text-luxury-gold rounded-sm border border-luxury-gold/30">
                <Globe size={18} />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">مركز التحكم في خريطة الموقع والفهرسة (Sitemap & Robots Hub)</h2>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm">
              إدارة الفهرسة التلقائية لمحركات البحث عبر النطاق الرسمي <span className="text-luxury-gold font-mono">https://shbkhur.com</span> وتتبع الروابط النشطة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              حالة الخريطة: متصل ونشط (200 OK)
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5">
          <div className="bg-luxury-black/70 border border-luxury-gold/15 rounded-sm p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
              <span>إجمالي الروابط المفهرسة</span>
              <Layers size={14} className="text-luxury-gold" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {sitemapStats ? (
                <span className="text-luxury-gold font-mono">{sitemapStats.totalUrls}</span>
              ) : (
                <span className="text-gray-500 text-base font-normal">جاري الحساب...</span>
              )}
              <span className="text-xs text-gray-400 mr-1.5 font-normal">رابط مفهرس</span>
            </div>
            <p className="text-gray-400 text-xs">
              {sitemapStats 
                ? `${sitemapStats.staticCount} صفحة أساسية + ${sitemapStats.productsCount} منتج نشط`
                : 'يتم احتساب الصفحات والمنتجات النشطة فقط'}
            </p>
          </div>

          <div className="bg-luxury-black/70 border border-luxury-gold/15 rounded-sm p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
              <span>النطاق المعتمد للسايت ماب</span>
              <Globe size={14} className="text-luxury-gold" />
            </div>
            <div className="text-sm sm:text-base font-bold text-white font-mono truncate mb-1">
              https://shbkhur.com
            </div>
            <p className="text-gray-400 text-xs truncate font-mono text-luxury-gold/80">
              /sitemap.xml
            </p>
          </div>

          <div className="bg-luxury-black/70 border border-luxury-gold/15 rounded-sm p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
              <span>حماية روبوتات البحث (Robots.txt)</span>
              <ShieldCheck size={14} className="text-emerald-400" />
            </div>
            <div className="text-sm sm:text-base font-bold text-emerald-400 mb-1">
              محمي ومحصن بالكامل
            </div>
            <p className="text-gray-400 text-xs">
              استبعاد مسارات السلة، الدفع، ولوحة الإدارة
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-luxury-gold/15">
          <button
            onClick={handleRevalidateSitemap}
            disabled={revalidatingSitemap}
            className="px-4 py-2.5 bg-luxury-gold text-luxury-black font-bold text-xs sm:text-sm rounded-sm hover:bg-luxury-gold/80 transition-all inline-flex items-center gap-2 disabled:opacity-50 shadow-md"
          >
            <RefreshCw size={15} className={revalidatingSitemap ? 'animate-spin' : ''} />
            {revalidatingSitemap ? 'جاري إعادة البناء...' : 'تحديث وإعادة بناء السايت ماب الآن'}
          </button>

          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-luxury-black border border-luxury-gold/30 text-white hover:text-luxury-gold hover:border-luxury-gold font-medium text-xs sm:text-sm rounded-sm transition-all inline-flex items-center gap-1.5"
          >
            <ExternalLink size={14} />
            فتح ومعاينة ملف Sitemap.xml
          </a>

          <a
            href="/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 bg-luxury-black border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-medium text-xs sm:text-sm rounded-sm transition-all inline-flex items-center gap-1.5"
          >
            <FileText size={14} />
            معاينة Robots.txt
          </a>

          <a
            href="https://search.google.com/search-console/sitemaps"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/20 font-bold text-xs sm:text-sm rounded-sm transition-all inline-flex items-center gap-1.5 mr-auto"
          >
            <Sparkles size={14} />
            تقديم الرابط إلى Google Search Console
          </a>
        </div>
      </motion.div>

      {/* 🛡️ Royal Google Search Console Verification Hub */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-4 sm:p-6 shadow-xl relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-luxury-gold/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-luxury-gold/10 text-luxury-gold rounded-sm border border-luxury-gold/30">
                <ShieldCheck size={18} />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">مركز توثيق ملكية النطاق (Google Search Console Verification Hub)</h2>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm">
              ربط وتوثيق ملكية متجر SH للبخور في أدوات مشرفي المواقع من جوجل وتفعيل وسم التحقق في الرأس (<code className="text-luxury-gold text-xs">&lt;head&gt;</code>) تلقائياً.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                🟢 موثق ومتصل مع Google Search Console
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                ⚪ بانتظار إدخال رمز التحقق
              </span>
            )}
          </div>
        </div>

        {/* Input & Action Section */}
        <div className="my-5 space-y-3">
          <div>
            <label className="block text-white text-sm font-medium mb-1.5">
              رمز التحقق (Google Site Verification Token / Meta Tag)
            </label>
            <div className="relative">
              <input
                type="text"
                value={googleVerificationCode}
                onChange={(e) => setGoogleVerificationCode(e.target.value)}
                placeholder='مثال: 4z9X_... أو الصق وسم <meta name="google-site-verification" content="..." /> بالكامل'
                className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white font-mono text-sm focus:border-luxury-gold focus:outline-none focus:ring-1 focus:ring-luxury-gold transition-colors pr-10"
                dir="ltr"
              />
              <KeyRound size={16} className="absolute right-3 top-3.5 text-luxury-gold/50 pointer-events-none" />
            </div>
            <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
              💡 يقوم النظام تلقائياً باستخراج الرمز وتنظيفه حتى لو قمت بلصق وسم HTML كاملاً أو بصيغة المفتاح والقيمة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={handleSaveGoogleVerification}
              disabled={savingVerification}
              className="px-5 py-2.5 bg-luxury-gold text-luxury-black font-bold text-xs sm:text-sm rounded-sm hover:bg-luxury-gold/80 transition-all inline-flex items-center gap-2 disabled:opacity-50 shadow-md"
            >
              <Save size={15} />
              {savingVerification ? 'جاري الحفظ والتفعيل...' : 'حفظ وتفعيل رمز التحقق الآن'}
            </button>

            <a
              href="https://search.google.com/search-console?resource_id=https%3A%2F%2Fshbakhur.com%2F"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-luxury-black border border-luxury-gold/30 text-white hover:text-luxury-gold hover:border-luxury-gold font-medium text-xs sm:text-sm rounded-sm transition-all inline-flex items-center gap-1.5 mr-auto"
            >
              <ExternalLink size={14} />
              فتح أدوات مشرفي المواقع (Search Console) للفحص
            </a>
          </div>
        </div>
      </motion.div>

      {/* 🛍️ Royal Google Merchant Center Feed Hub */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-4 sm:p-6 shadow-xl relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-luxury-gold/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-luxury-gold/10 text-luxury-gold rounded-sm border border-luxury-gold/30">
                <ShoppingBag size={18} />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                خلاصة منتجات Google Shopping (Google Merchant Center Feed)
              </h2>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm">
              الرابط المعتمد لتغذية Google Merchant Center لعرض منتجات SH للبخور في نتائج التسوق المجانية والإعلانات عبر جوجل.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30">
              <span className="w-2 h-2 rounded-full bg-luxury-gold animate-pulse" />
              {sitemapStats ? `${sitemapStats.productsCount} منتج نشط بالخلاصة` : 'جاري التحقق من المنتجات...'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              🟢 جاهز للتغذية الآلية (200 OK)
            </span>
          </div>
        </div>

        {/* Input & Action Section */}
        <div className="my-5 space-y-3">
          <div>
            <label className="block text-white text-sm font-medium mb-1.5">
              رابط خلاصة المنتجات الرسمية (XML RSS 2.0 Feed URL)
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value="https://shbkhur.com/api/feeds/google-merchant"
                className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-gray-200 text-xs sm:text-sm font-mono focus:border-luxury-gold focus:outline-none"
                dir="ltr"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              💡 قم بإضافة هذا الرابط في قسم <span className="text-luxury-gold">Feeds / خلاصات البيانات</span> داخل حسابك في Google Merchant Center لتحديث المنتجات والأسعار والمخزون تلقائياً كل 24 ساعة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={handleCopyFeed}
              className="px-4 py-2.5 bg-luxury-gold text-luxury-black font-bold text-xs sm:text-sm rounded-sm hover:bg-luxury-gold/80 transition-all inline-flex items-center gap-2 shadow-md cursor-pointer"
            >
              {copiedFeed ? (
                <>
                  <Check size={15} />
                  تم نسخ الرابط!
                </>
              ) : (
                <>
                  <Copy size={15} />
                  نسخ رابط الخلاصة
                </>
              )}
            </button>

            <a
              href="/api/feeds/google-merchant"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-luxury-black border border-luxury-gold/30 text-white hover:text-luxury-gold hover:border-luxury-gold font-medium text-xs sm:text-sm rounded-sm transition-all inline-flex items-center gap-1.5"
            >
              <ExternalLink size={14} />
              معاينة ملف الـ XML
            </a>

            <a
              href="https://merchants.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/20 font-bold text-xs sm:text-sm rounded-sm transition-all inline-flex items-center gap-1.5 mr-auto"
            >
              <Sparkles size={14} />
              إدارة الخلاصة في Google Merchant Center
            </a>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Page Selector */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-4 sm:p-6"
        >
          <h3 className="text-white font-bold mb-4 hidden lg:block">صفحات الموقع</h3>
          
          {/* Mobile Select (hidden on lg+) */}
          <div className="lg:hidden">
            <label className="block text-gray-400 text-sm mb-2">اختر الصفحة للتعديل:</label>
            <select 
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none focus:ring-1 focus:ring-luxury-gold transition-colors"
              dir="ltr"
            >
              {seoSettings.map(page => (
                <option key={page.page_path} value={page.page_path}>
                  {getPageDisplayName(page.page_path)} ({page.page_path})
                </option>
              ))}
            </select>
          </div>

          {/* Desktop List (hidden on mobile) */}
          <div className="hidden lg:block space-y-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
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
                <div className="text-xs text-gray-500 mt-1" dir="ltr">{page.page_path}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* SEO Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-4 sm:p-6"
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
                  <div className="text-green-700 text-sm truncate" dir="ltr">
                    https://shbkhur.com{currentPage.page_path}
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
