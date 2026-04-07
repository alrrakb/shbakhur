'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNavigationLinks, saveNavigationLinks, getHeroSlides, saveHeroSlides, saveFooterLinks, getFooterLinks, getFooterSettings, getPartners, savePartners, savePartnersSettings, saveFooterSettings, type NavLink as DbNavLink } from '@/lib/database';
import { useToast } from '@/context/ToastContext';

interface Section {
  section_name: string;
  is_active: boolean;
  settings: string;
}

interface HeroSlide {
  id?: number;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

interface CategoryCard {
  id?: number;
  icon: string;
  name: string;
  description: string;
  page_link: string;
  sort_order: number;
  is_active: boolean;
}

interface Testimonial {
  id?: number;
  name: string;
  location: string;
  rating: number;
  comment: string;
  is_active: boolean;
  sort_order: number;
}

interface Partner {
  id?: number;
  name: string;
  country: string;
  logo_url: string;
  is_active: boolean;
  sort_order: number;
}

interface FooterLink {
  id?: number;
  section: string;
  name: string;
  link: string;
  sort_order: number;
}

interface NewsMessage {
  id?: number;
  message: string;
  is_active: boolean;
  sort_order: number;
}

interface NavItem {
  id?: number;
  name: string;
  link: string;
  has_dropdown: boolean;
  dropdown_items: string | any[];
  sort_order: number;
  is_active: boolean;
}

interface ContentData {
  sections: Section[];
  hero_slides: HeroSlide[];
  hero_info: { title: string; description: string; icon: string; is_active: boolean };
  category_cards: CategoryCard[];
  products_settings: any;
  partners_settings: { section_title: string; section_description: string; is_active: boolean };
  footer_settings: { 
    about_title: string; 
    about_description: string; 
    phone_numbers: string[]; 
    whatsapp: string;
    copyright: string;
    is_active: boolean 
  };
  testimonials: Testimonial[];
  partners: Partner[];
  footer_links: FooterLink[];
  news_ticker: NewsMessage[];
  navigation: NavItem[];
  site_logo: { logo_url: string; store_name: string }[];
}

interface AccordionSection {
  id: string;
  title: string;
  icon: string;
}

const accordions: AccordionSection[] = [
  { id: 'logo', title: 'الشعار والهيدر', icon: '🎨' },
  { id: 'navigation', title: 'قائمة التنقل', icon: '🔗' },
  { id: 'news', title: 'الأخبار العاجلة', icon: '📰' },
  { id: 'hero', title: 'سلايدر الهيرو', icon: '🖼️' },
  { id: 'hero_info', title: 'معلومات الشحن', icon: '🚚' },
  { id: 'categories', title: 'مربعات التصنيفات', icon: '📁' },
  { id: 'products', title: 'إعدادات المنتجات', icon: '🛍️' },
  { id: 'testimonials', title: 'آراء العملاء', icon: '⭐' },
  { id: 'partners', title: 'الشركاء', icon: '🤝' },
  { id: 'footer', title: 'الفوتر', icon: '📋' },
];

export default function ContentManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSection, setOpenSection] = useState<string>('logo');
  const { showToast } = useToast();

  const initialData: ContentData = {
    sections: [
      { section_name: 'news_ticker', is_active: true, settings: '' },
      { section_name: 'hero', is_active: true, settings: '' },
      { section_name: 'categories', is_active: true, settings: '' },
      { section_name: 'products', is_active: true, settings: '' },
      { section_name: 'testimonials', is_active: true, settings: '' },
      { section_name: 'partners', is_active: true, settings: '' },
      { section_name: 'footer', is_active: true, settings: '' },
    ],
    hero_slides: [
      { id: 1, title: 'شحن سريع ومضمون', subtitle: 'أجود أنواع البخور والعطور', description: 'delivery within 2-4 business days', button_text: 'تسوق الآن', button_link: '/products', image_url: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1920&q=80', sort_order: 1, is_active: true },
      { id: 2, title: 'العود الطبيعي', subtitle: 'فاخر ومميز', description: 'أجود قطع العود الطبيعي من تايلاند وإندونيسيا', button_text: 'تسوق الآن', button_link: '/products', image_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1920&q=80', sort_order: 2, is_active: true },
      { id: 3, title: 'عطور عالمية', subtitle: 'أفضل الماركات', description: 'شانيل، ديور، غوتشي، توم فورد والمزيد', button_text: 'تسوق الآن', button_link: '/products', image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1920&q=80', sort_order: 3, is_active: true },
    ],
    hero_info: { title: 'شحن سريع ومضمون', description: 'خلال 2-4 أيام عمل', icon: '🚚', is_active: true },
    category_cards: [
      { id: 1, icon: '🔥', name: 'بخور', description: 'أجود أنواع البخور', page_link: '/products/incense', sort_order: 1, is_active: true },
      { id: 2, icon: '💎', name: 'عود محسن', description: 'عود محسن تايلاندي', page_link: '/products/enhanced-oud', sort_order: 2, is_active: true },
      { id: 3, icon: '🪵', name: 'عود طبيعي', description: 'عود طبيعي فاخر', page_link: '/products/natural-oud', sort_order: 3, is_active: true },
      { id: 4, icon: '✨', name: 'عطور', description: 'عطور عالمية', page_link: '/products/perfumes', sort_order: 4, is_active: true },
      { id: 5, icon: '💧', name: 'دهن العود', description: 'دهن عود طبيعي', page_link: '/products/oud-oil', sort_order: 5, is_active: true },
      { id: 6, icon: '🏺', name: 'ملحقات', description: 'مباخر ومستلزمات', page_link: '/products/incense-accessories', sort_order: 6, is_active: true },
    ],
    products_settings: { section_title: 'منتجاتنا', section_description: 'اكتشف تشكيلتنا الفاخرة', items_per_section: 4 },
    partners_settings: { section_title: 'شركاؤنا', section_description: 'موردين موثوقين · أفضل العلامات العالمية · شراكات استراتيجية', is_active: true },
    footer_settings: { 
      about_title: 'نحن', 
      about_description: 'متجر SH للبخور متخصص في أجود أنواع البخور والعطور والعود الطبيعي والفاخر من جميع أنحاء العالم.',
      phone_numbers: ['+966 50 123 4567', '+966 55 987 6543'],
      whatsapp: '+966 50 123 4567',
      copyright: 'جميع الحقوق محفوظة',
      is_active: true
    },
    testimonials: [
      { id: 1, name: 'أحمد محمد', location: 'الرياض', rating: 5, comment: 'منتجات عالية الجودة والتوصيل كان سريع جداً', is_active: true, sort_order: 1 },
      { id: 2, name: 'سارة علي', location: 'جدة', rating: 5, comment: 'أفضل متجر للبخور والعطور', is_active: true, sort_order: 2 },
    ],
    partners: [
      { id: 1, name: 'توم فورد', country: 'Fragrance', logo_url: '', is_active: true, sort_order: 1 },
      { id: 2, name: 'ديور', country: 'Fragrance', logo_url: '', is_active: true, sort_order: 2 },
      { id: 3, name: 'شانيل', country: 'Fragrance', logo_url: '', is_active: true, sort_order: 3 },
      { id: 4, name: 'غوتشي', country: 'Fragrance', logo_url: '', is_active: true, sort_order: 4 },
    ],
    footer_links: [],
    news_ticker: [
      { id: 1, message: 'الشحن مجاني', is_active: true, sort_order: 1 },
      { id: 2, message: 'التوصيل للرياض فقط', is_active: true, sort_order: 2 },
      { id: 3, message: 'خصم 20% على الطلبات الأولى', is_active: true, sort_order: 3 },
      { id: 4, message: 'توصيل سريع خلال 2-4 أيام عمل', is_active: true, sort_order: 4 },
      { id: 5, message: 'للطلب يرجى التواصل واتساب', is_active: true, sort_order: 5 },
    ],
    navigation: [
      { id: 1, name: 'الرئيسية', link: '/', has_dropdown: false, dropdown_items: '[]', sort_order: 1, is_active: true },
      { id: 2, name: 'جميع المنتجات', link: '/products', has_dropdown: false, dropdown_items: '[]', sort_order: 2, is_active: true },
      { id: 3, name: 'الاكثر مبيعا', link: '/products/best-sellers', has_dropdown: false, dropdown_items: '[]', sort_order: 3, is_active: true },
      { id: 4, name: 'البخور والعود', link: '/products/oud', has_dropdown: true, dropdown_items: '[{"name":"عود طبيعي","link":"/products/عود-طبيعي"},{"name":"عود محسن","link":"/products/عود-محسن"},{"name":"دهن العود","link":"/products/دهن-العود"},{"name":"ملحقات البخور","link":"/products/oud"}]', sort_order: 4, is_active: true },
      { id: 5, name: 'العطور', link: '/products/perfumes', has_dropdown: true, dropdown_items: '[{"name":"توم فورد","link":"/products/perfumes"},{"name":"جوتشي","link":"/products/perfumes"},{"name":"ديور","link":"/products/perfumes"}]', sort_order: 5, is_active: true },
      { id: 6, name: 'عروضنا', link: '/products/best-offers', has_dropdown: false, dropdown_items: '[]', sort_order: 6, is_active: true },
    ],
    site_logo: [{ logo_url: 'http://localhost/my-store/wp-content/uploads/2025/03/sh-logo-1-300x300.png', store_name: 'SH للبخور' }],
  };

  const STORAGE_KEY = 'sh_bakhoor_content';

  const loadFromStorage = (): ContentData | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  };

  const saveToStorage = (contentData: ContentData) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contentData));
  };

  const [data, setData] = useState<ContentData>(initialData);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const stored = loadFromStorage();
      if (stored) {
        // Always start with empty footer_links — Supabase is source of truth
        setData({ ...stored, footer_links: [], footer_settings: stored.footer_settings });
      }
      
      try {
        const dbNavLinks = await getNavigationLinks();
        const dbHeroSlides = await getHeroSlides();
        
        const res = await fetch('http://localhost/sh-bakhoor-scripts/content.php?action=getAll');
        const result = await res.json();
        
        const hasSupabaseData = result.hero_slides && result.hero_slides.length > 0 ||
                                result.news_ticker && result.news_ticker.length > 0;
        
        const navLinksFromDb = dbNavLinks.map((link: any) => {
          let dropdownArray: any[] = [];
          try {
            const rawDropdowns = typeof link.dropdown_items === 'string' 
              ? JSON.parse(link.dropdown_items) 
              : (link.dropdown_items || []);
            dropdownArray = rawDropdowns.map((item: any) => ({
              name: item.name,
              link: item.href || item.link || ''
            }));
          } catch {
            dropdownArray = [];
          }
          
          return {
            ...link,
            dropdown_items: JSON.stringify(dropdownArray)
          };
        });
        
      // Load from Supabase (source of truth)
        const dbPartners = await getPartners();
        const dbFooterLinks = await getFooterLinks();
        const dbFooterSettings = await getFooterSettings();
        
        const newData = {
          sections: result.sections && result.sections.length > 0 ? result.sections : initialData.sections,
          hero_slides: dbHeroSlides.length > 0 ? dbHeroSlides : (result.hero_slides && result.hero_slides.length > 0 ? result.hero_slides : initialData.hero_slides),
          hero_info: result.hero_info ? result.hero_info : initialData.hero_info,
          category_cards: result.category_cards && result.category_cards.length > 0 ? result.category_cards : initialData.category_cards,
          products_settings: result.products_settings && result.products_settings.length > 0 
            ? (Array.isArray(result.products_settings[0]) ? result.products_settings[0] : result.products_settings)
            : initialData.products_settings,
          partners_settings: result.partners_settings && result.partners_settings.length > 0 
            ? (Array.isArray(result.partners_settings[0]) ? result.partners_settings[0] : result.partners_settings)
            : initialData.partners_settings,
          testimonials: result.testimonials && result.testimonials.length > 0 ? result.testimonials : initialData.testimonials,
          // Partners: prefer Supabase over PHP fallback
          partners: dbPartners.length > 0 ? dbPartners : (result.partners && result.partners.length > 0 ? result.partners : initialData.partners),
          // Footer links: Supabase is source of truth
          footer_links: dbFooterLinks.length > 0 ? dbFooterLinks : (result.footer_links && result.footer_links.length > 0 ? result.footer_links : initialData.footer_links),
          // Footer settings: Supabase first
          footer_settings: (dbFooterSettings as any) ?? (result.footer_settings && result.footer_settings.length > 0
            ? (Array.isArray(result.footer_settings[0]) ? result.footer_settings[0] : result.footer_settings)
            : initialData.footer_settings),
          news_ticker: result.news_ticker && result.news_ticker.length > 0 ? result.news_ticker : initialData.news_ticker,
          navigation: navLinksFromDb.length > 0 ? navLinksFromDb : initialData.navigation,
          site_logo: result.site_logo && result.site_logo.length > 0 ? result.site_logo : initialData.site_logo,
        };
        
        setData(newData);
        saveToStorage(newData);
      } catch (error) {
        // If PHP server is down, still load from Supabase
        try {
          const [dbPartners, dbFooterLinks, dbFooterSettings] = await Promise.all([
            getPartners(),
            getFooterLinks(),
            getFooterSettings(),
          ]);
          setData(prev => ({
            ...prev,
            ...(dbPartners.length > 0 ? { partners: dbPartners } : {}),
            ...(dbFooterLinks.length > 0 ? { footer_links: dbFooterLinks } : {}),
            ...(dbFooterSettings ? { footer_settings: dbFooterSettings } : {}),
          }));
        } catch {}
        if (!stored) {
          saveToStorage(initialData);
        }
      } finally {
        setDataLoaded(true);
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  async function handleSave() {
    setSaving(true);
    
    saveToStorage(data);
    
    try {
      // Save navigation links
      const navLinksForDb: DbNavLink[] = (data.navigation || []).map((item: NavItem, index: number) => {
        let dropdownArray: any[] = [];
        try {
          const raw = typeof item.dropdown_items === 'string' 
            ? JSON.parse(item.dropdown_items) 
            : (item.dropdown_items || []);
          dropdownArray = raw.map((d: any) => ({
            name: d.name,
            link: d.link || d.href || ''
          }));
        } catch {
          dropdownArray = [];
        }
        
        return {
          id: item.id || 0,
          name: item.name,
          link: item.link,
          has_dropdown: item.has_dropdown,
          dropdown_items: dropdownArray,
          sort_order: item.sort_order || index + 1,
          is_active: item.is_active !== false
        };
      });
      
      const navResult = await saveNavigationLinks(navLinksForDb);
      
      // Save partners to Supabase
      const partnersResult = await savePartners((data.partners || []) as any);

      // Save partners settings to Supabase
      if (data.partners_settings) {
        const ps = data.partners_settings as any;
        await savePartnersSettings({
          section_title: ps.section_title || 'شركاؤنا',
          section_description: ps.section_description || '',
          is_active: ps.is_active !== false,
        });
      }
      
      // Save hero slides
      const heroSlidesForDb = (data.hero_slides || []).map((slide: HeroSlide, index: number) => ({
        id: slide.id || 0,
        title: slide.title || '',
        subtitle: slide.subtitle || '',
        description: slide.description || '',
        button_text: slide.button_text || '',
        button_link: slide.button_link || '',
        image_url: slide.image_url || '',
        sort_order: slide.sort_order || index + 1,
        is_active: slide.is_active !== false
      }));
      const heroSlidesResult = await saveHeroSlides(heroSlidesForDb);
      
      // Save footer links
      const formattedFooterLinks = (data.footer_links || []).map((link: any) => ({
        ...link,
        id: link.id || 0
      }));
      const footerLinksResult = await saveFooterLinks(formattedFooterLinks);

      // Save footer settings (about text, phone, whatsapp, copyright)
      if (data.footer_settings) {
        const fs = data.footer_settings as any;
        await saveFooterSettings({
          about_title: fs.about_title || 'نحن',
          about_description: fs.about_description || '',
          phone_numbers: Array.isArray(fs.phone_numbers) ? fs.phone_numbers : [],
          whatsapp: fs.whatsapp || '',
          copyright: fs.copyright || 'جميع الحقوق محفوظة',
          is_active: fs.is_active !== false,
        });
      }
      
      // Try WordPress fallback
      const res = await fetch('http://localhost/sh-bakhoor-scripts/content.php?action=saveAll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      
      if (result.success || navResult.success || heroSlidesResult.success || footerLinksResult.success) {
        showToast('تم حفظ جميع التغييرات بنجاح', 'success');
      } else {
        showToast('تم الحفظ محلياً', 'success');
      }
    } catch (error) {
      showToast('تم الحفظ محلياً', 'success');
    } finally {
      setSaving(false);
    }
  }

  const updateData = (key: keyof ContentData, value: any) => {
    setData(prev => {
      const current = prev[key];
      if (Array.isArray(current) && !Array.isArray(value)) {
        return { ...prev, [key]: value };
      }
      return { ...prev, [key]: value };
    });
  };

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? '' : id);
  };

  if (loading || !dataLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">إدارة المحتوى</h1>
          <p className="text-gray-400">تحكم في جميع محتويات الموقع</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ كل التغييرات'}
        </button>
      </motion.div>

      {/* Accordions */}
      <div className="space-y-4">
        {accordions.map((accordion) => (
          <motion.div
            key={accordion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 overflow-hidden"
          >
            <button
              onClick={() => toggleSection(accordion.id)}
              className="w-full px-6 py-4 flex items-center justify-between text-white hover:bg-luxury-gold/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{accordion.icon}</span>
                <span className="font-bold">{accordion.title}</span>
              </div>
              <svg
                className={`w-6 h-6 text-luxury-gold transition-transform ${openSection === accordion.id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {openSection === accordion.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-luxury-gold/20"
                >
                  <div className="p-6 space-y-6">
                    {accordion.id === 'logo' && (
                      <LogoSection
                        data={data}
                        updateData={updateData}
                      />
                    )}
                    {accordion.id === 'navigation' && (
                      <NavigationSection
                        data={data}
                        updateData={updateData}
                      />
                    )}
                    {accordion.id === 'news' && (
                      <NewsSection
                        data={data}
                        updateData={updateData}
                      />
                    )}
                    {accordion.id === 'hero' && (
                      <HeroSection
                        data={data}
                        updateData={updateData}
                      />
                    )}
                    {accordion.id === 'hero_info' && (
                      <HeroInfoSection
                        data={data}
                        updateData={updateData}
                      />
                    )}
                    {accordion.id === 'categories' && (
                      <CategoriesSection
                        data={data}
                        updateData={updateData}
                      />
                    )}
                    {accordion.id === 'products' && (
                      <ProductsSettingsSection
                        data={data}
                        updateData={updateData}
                      />
                    )}
                    {accordion.id === 'testimonials' && (
                      <TestimonialsSection
                        data={data}
                        updateData={updateData}
                      />
                    )}
                    {accordion.id === 'partners' && (
                      <>
                        <PartnersSettingsSection
                          data={data}
                          updateData={updateData}
                        />
                        <PartnersSection
                          data={data}
                          updateData={updateData}
                        />
                      </>
                    )}
                    {accordion.id === 'footer' && (
                      <>
                        <FooterSettingsSection
                          data={data}
                          updateData={updateData}
                        />
                        <FooterSection
                          data={data}
                          updateData={updateData}
                        />
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Logo Section
function LogoSection({ data, updateData }: { data: ContentData; updateData: any }) {
  const logo = data.site_logo?.[0]?.logo_url || '';
  const storeName = data.site_logo?.[0]?.store_name || 'SH للبخور';
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'images');
      formData.append('folder', 'logos');

      const res = await fetch('http://localhost/sh-bakhoor-scripts/upload.php?action=upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        updateData('site_logo', [{ logo_url: result.url, store_name: storeName }]);
      } else {
        console.error('Upload failed:', result);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleStoreNameChange = (value: string) => {
    updateData('site_logo', [{ logo_url: logo, store_name: value }]);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white font-medium mb-2">اسم المتجر</label>
        <input
          type="text"
          value={storeName}
          onChange={(e) => handleStoreNameChange(e.target.value)}
          className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
          placeholder="اسم المتجر"
        />
      </div>
      <div>
        <label className="block text-white font-medium mb-2">شعار الموقع</label>
        <div className="flex items-center gap-4">
          <label className="px-4 py-2 bg-luxury-gold text-luxury-black font-medium rounded-sm cursor-pointer hover:bg-luxury-gold-light transition-colors">
            {uploading ? 'جاري الرفع...' : 'اختر صورة'}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <span className="text-gray-400 text-sm">PNG, JPG - max 2MB</span>
        </div>
      </div>
      {logo && (
        <div className="mt-4">
          <p className="text-gray-400 text-sm mb-2">معاينة:</p>
          <img src={logo} alt="Logo" className="h-20 object-contain" />
        </div>
      )}
    </div>
  );
}

// Navigation Section
function NavigationSection({ data, updateData }: { data: ContentData; updateData: (key: keyof ContentData, value: any) => void }) {
  const addNav = () => {
    const newNav: NavItem = { name: '', link: '#', has_dropdown: false, dropdown_items: '[]', sort_order: (data.navigation || []).length + 1, is_active: true };
    updateData('navigation', [...(data.navigation || []), newNav]);
  };

  const updateNav = (index: number, field: string, value: any) => {
    const updated = [...(data.navigation || [])];
    (updated[index] as any)[field] = value;
    updateData('navigation', updated);
  };

  const removeNav = (index: number) => {
    updateData('navigation', (data.navigation || []).filter((_, i) => i !== index));
  };

  const getDropdownItems = (nav: any): any[] => {
    try {
      const items = typeof nav.dropdown_items === 'string' ? JSON.parse(nav.dropdown_items) : nav.dropdown_items || [];
      return items.map((item: any) => ({
        name: item.name,
        link: item.link || item.href || ''
      }));
    } catch {
      return [];
    }
  };

  const updateDropdownItems = (index: number, items: any[]) => {
    updateNav(index, 'dropdown_items', JSON.stringify(items));
  };

  const addDropdownItem = (index: number) => {
    const nav = (data.navigation || [])[index];
    const items = getDropdownItems(nav);
    items.push({ name: '', link: '' });
    updateDropdownItems(index, items);
  };

  const updateDropdownItem = (navIndex: number, itemIndex: number, field: string, value: string) => {
    const nav = (data.navigation || [])[navIndex];
    const items = getDropdownItems(nav);
    items[itemIndex][field] = value;
    updateDropdownItems(navIndex, items);
  };

  const removeDropdownItem = (navIndex: number, itemIndex: number) => {
    const nav = (data.navigation || [])[navIndex];
    const items = getDropdownItems(nav);
    items.splice(itemIndex, 1);
    updateDropdownItems(navIndex, items);
  };

  return (
    <div className="space-y-4">
      {(data.navigation || []).map((nav, index) => (
        <div key={index} className={`bg-luxury-black p-4 rounded-sm space-y-3 ${!nav.is_active ? 'opacity-50' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={nav.name}
              onChange={(e) => updateNav(index, 'name', e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
              placeholder="الاسم"
            />
            <input
              type="text"
              value={nav.link}
              onChange={(e) => updateNav(index, 'link', e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
              placeholder="/link"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={nav.has_dropdown}
                onChange={(e) => updateNav(index, 'has_dropdown', e.target.checked)}
                className="w-4 h-4"
              />
              يحتوي على قائمة فرعية
            </label>
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={nav.is_active}
                onChange={(e) => updateNav(index, 'is_active', e.target.checked)}
                className="w-4 h-4 accent-luxury-gold"
              />
              مفعل
            </label>
            <button onClick={() => removeNav(index)} className="text-red-500 text-sm mr-auto">حذف</button>
          </div>
          
          {/* Dropdown Items */}
          {nav.has_dropdown && (
            <div className="mt-3 p-3 bg-[#0f0f0f] rounded-sm space-y-2">
              <p className="text-luxury-gold text-sm font-medium">القائمة الفرعية</p>
              {getDropdownItems(nav).map((item: any, itemIndex: number) => (
                <div key={itemIndex} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateDropdownItem(index, itemIndex, 'name', e.target.value)}
                    className="flex-1 px-2 py-1 bg-[#1a1a1a] border border-luxury-gold/10 rounded-sm text-white text-sm"
                    placeholder="اسم الرابط"
                  />
                  <input
                    type="text"
                    value={item.link || item.href || ''}
                    onChange={(e) => updateDropdownItem(index, itemIndex, 'link', e.target.value)}
                    className="flex-1 px-2 py-1 bg-[#1a1a1a] border border-luxury-gold/10 rounded-sm text-white text-sm"
                    placeholder="/link"
                  />
                  <button 
                    onClick={() => removeDropdownItem(index, itemIndex)}
                    className="text-red-500 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button 
                onClick={() => addDropdownItem(index)}
                className="text-luxury-gold text-sm hover:underline"
              >
                + إضافة عنصر
              </button>
            </div>
          )}
        </div>
      ))}
      <button onClick={addNav} className="px-4 py-2 bg-luxury-gold/10 text-luxury-gold rounded-sm hover:bg-luxury-gold/20">+ إضافة رابط</button>
    </div>
  );
}

// News Section
function NewsSection({ data, updateData }: { data: ContentData; updateData: any }) {
  const addNews = () => {
    const newNews = { message: '', is_active: true, sort_order: (data.news_ticker || []).length + 1 };
    updateData('news_ticker', [...(data.news_ticker || []), newNews]);
  };

  const updateNews = (index: number, field: string, value: any) => {
    const updated = [...(data.news_ticker || [])];
    (updated[index] as any)[field] = value;
    updateData('news_ticker', updated);
  };

  const removeNews = (index: number) => {
    updateData('news_ticker', (data.news_ticker || []).filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {(data.news_ticker || []).map((news, index) => (
        <div key={index} className="flex gap-3 items-center">
          <input
            type="text"
            value={news.message}
            onChange={(e) => updateNews(index, 'message', e.target.value)}
            className="flex-1 px-3 py-2 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
            placeholder="الرسالة"
          />
          <label className="flex items-center gap-2 text-white whitespace-nowrap">
            <input
              type="checkbox"
              checked={news.is_active}
              onChange={(e) => updateNews(index, 'is_active', e.target.checked)}
              className="w-4 h-4"
            />
            مفعل
          </label>
          <button onClick={() => removeNews(index)} className="text-red-500">✕</button>
        </div>
      ))}
      <button onClick={addNews} className="px-4 py-2 bg-luxury-gold/10 text-luxury-gold rounded-sm hover:bg-luxury-gold/20">+ إضافة رسالة</button>
    </div>
  );
}

// Hero Section
function HeroSection({ data, updateData }: { data: ContentData; updateData: any }) {
  const [uploading, setUploading] = useState<number | null>(null);

  const addSlide = () => {
    const newSlide = { title: '', subtitle: '', description: '', button_text: 'تسوق الآن', button_link: '/products', image_url: '', sort_order: (data.hero_slides || []).length + 1, is_active: true };
    updateData('hero_slides', [...(data.hero_slides || []), newSlide]);
  };

  const updateSlide = (index: number, field: string, value: any) => {
    const updated = [...(data.hero_slides || [])];
    (updated[index] as any)[field] = value;
    updateData('hero_slides', updated);
  };

  const removeSlide = (index: number) => {
    updateData('hero_slides', (data.hero_slides || []).filter((_, i) => i !== index));
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(index);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'images');
      formData.append('folder', 'hero');

      const res = await fetch('http://localhost/sh-bakhoor-scripts/upload.php?action=upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        updateSlide(index, 'image_url', result.url);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-4">
      {(data.hero_slides || []).map((slide, index) => (
        <div key={index} className="bg-luxury-black p-4 rounded-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={slide.title}
              onChange={(e) => updateSlide(index, 'title', e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
              placeholder="العنوان الرئيسي"
            />
            <input
              type="text"
              value={slide.subtitle}
              onChange={(e) => updateSlide(index, 'subtitle', e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
              placeholder="العنوان الفرعي"
            />
          </div>
          <textarea
            value={slide.description}
            onChange={(e) => updateSlide(index, 'description', e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
            placeholder="الوصف"
            rows={2}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={slide.button_text}
              onChange={(e) => updateSlide(index, 'button_text', e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
              placeholder="نص الزر"
            />
            <input
              type="text"
              value={slide.button_link}
              onChange={(e) => updateSlide(index, 'button_link', e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
              placeholder="رابط الزر"
            />
            <div className="flex items-center gap-2">
              <label className="px-3 py-2 bg-luxury-gold/20 text-luxury-gold text-sm rounded-sm cursor-pointer hover:bg-luxury-gold/30 flex-1 text-center">
                {uploading === index ? 'جاري الرفع...' : 'اختر صورة'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(index, e)}
                  className="hidden"
                  disabled={uploading === index}
                />
              </label>
            </div>
          </div>
          {slide.image_url && (
            <div className="mt-2">
              <img src={slide.image_url} alt="Slide" className="h-32 w-full object-cover rounded-sm" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={slide.is_active}
                onChange={(e) => updateSlide(index, 'is_active', e.target.checked)}
                className="w-4 h-4"
              />
              مفعل
            </label>
            <button onClick={() => removeSlide(index)} className="text-red-500 text-sm">حذف السلايد</button>
          </div>
        </div>
      ))}
      <button onClick={addSlide} className="px-4 py-2 bg-luxury-gold/10 text-luxury-gold rounded-sm hover:bg-luxury-gold/20">+ إضافة سلايد</button>
    </div>
  );
}

// Hero Info Section (Shipping Badge)
function HeroInfoSection({ data, updateData }: { data: ContentData; updateData: any }) {
  const info = data.hero_info || { title: '', description: '', icon: '🚚', is_active: true };

  const updateInfo = (field: string, value: any) => {
    updateData('hero_info', { ...info, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="bg-luxury-black p-4 rounded-sm space-y-4">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              checked={info.is_active}
              onChange={(e) => updateInfo('is_active', e.target.checked)}
              className="w-4 h-4 accent-luxury-gold"
            />
            مفعل
          </label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-white text-sm mb-1">الأيقونة</label>
            <input
              type="text"
              value={info.icon}
              onChange={(e) => updateInfo('icon', e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white text-center"
              placeholder="🚚"
            />
          </div>
          <div>
            <label className="block text-white text-sm mb-1">العنوان</label>
            <input
              type="text"
              value={info.title}
              onChange={(e) => updateInfo('title', e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white"
              placeholder="شحن سريع ومضمون"
            />
          </div>
          <div>
            <label className="block text-white text-sm mb-1">الوصف</label>
            <input
              type="text"
              value={info.description}
              onChange={(e) => updateInfo('description', e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white"
              placeholder="خلال 2-4 أيام عمل"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Categories Section
function CategoriesSection({ data, updateData }: { data: ContentData; updateData: any }) {
  const addCard = () => {
    const newCard = { icon: '📦', name: '', description: '', page_link: '/products', sort_order: (data.category_cards || []).length + 1, is_active: true };
    updateData('category_cards', [...(data.category_cards || []), newCard]);
  };

  const updateCard = (index: number, field: string, value: any) => {
    const updated = [...(data.category_cards || [])];
    (updated[index] as any)[field] = value;
    updateData('category_cards', updated);
  };

  const removeCard = (index: number) => {
    updateData('category_cards', (data.category_cards || []).filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {(data.category_cards || []).map((card, index) => (
        <div key={index} className={`bg-luxury-black p-4 rounded-sm space-y-3 ${!card.is_active ? 'opacity-50' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={card.icon}
              onChange={(e) => updateCard(index, 'icon', e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
              placeholder="الأيقونة"
            />
            <input
              type="text"
              value={card.name}
              onChange={(e) => updateCard(index, 'name', e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
              placeholder="الاسم"
            />
            <input
              type="text"
              value={card.page_link}
              onChange={(e) => updateCard(index, 'page_link', e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
              placeholder="/products/category"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={card.is_active}
                onChange={(e) => updateCard(index, 'is_active', e.target.checked)}
                className="w-4 h-4 accent-luxury-gold"
              />
              مفعل
            </label>
            <button onClick={() => removeCard(index)} className="text-red-500 text-sm">حذف</button>
          </div>
        </div>
      ))}
      <button onClick={addCard} className="px-4 py-2 bg-luxury-gold/10 text-luxury-gold rounded-sm hover:bg-luxury-gold/20">+ إضافة مربع</button>
    </div>
  );
}

// Products Settings Section
function ProductsSettingsSection({ data, updateData }: { data: ContentData; updateData: any }) {
  const rawSettings = data.products_settings;
  const settings = rawSettings && typeof rawSettings === 'object' 
    ? (Array.isArray(rawSettings) ? rawSettings[0] : rawSettings)
    : {};

  const updateSettings = (field: string, value: any) => {
    updateData('products_settings', { ...settings, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white font-medium mb-2">عنوان القسم</label>
        <input
          type="text"
          value={settings.section_title || ''}
          onChange={(e) => updateSettings('section_title', e.target.value)}
          className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-white font-medium mb-2">وصف القسم</label>
        <textarea
          value={settings.section_description || ''}
          onChange={(e) => updateSettings('section_description', e.target.value)}
          className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white font-medium mb-2">عدد المنتجات المعروضة</label>
          <input
            type="number"
            value={settings.items_per_section || 4}
            onChange={(e) => updateSettings('items_per_section', parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-white font-medium mb-2">ترتيب المنتجات</label>
          <select
            value={settings.sort_order || 'newest'}
            onChange={(e) => updateSettings('sort_order', e.target.value)}
            className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
          >
            <option value="newest">الأحدث</option>
            <option value="price_asc">السعر: من الأقل</option>
            <option value="price_desc">السعر: من الأعلى</option>
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-white">
        <input
          type="checkbox"
          checked={settings.is_active !== false}
          onChange={(e) => updateSettings('is_active', e.target.checked)}
          className="w-4 h-4"
        />
        إظهار قسم المنتجات
      </label>
    </div>
  );
}

// Testimonials Section
function TestimonialsSection({ data, updateData }: { data: ContentData; updateData: any }) {
  const addTestimonial = () => {
    const newTest = { name: '', location: '', rating: 5, comment: '', is_active: true, sort_order: (data.testimonials || []).length + 1 };
    updateData('testimonials', [...(data.testimonials || []), newTest]);
  };

  const updateTestimonial = (index: number, field: string, value: any) => {
    const updated = [...(data.testimonials || [])];
    (updated[index] as any)[field] = value;
    updateData('testimonials', updated);
  };

  const removeTestimonial = (index: number) => {
    updateData('testimonials', (data.testimonials || []).filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {(data.testimonials || []).map((test, index) => (
        <div key={index} className="bg-luxury-black p-4 rounded-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={test.name}
              onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
              placeholder="الاسم"
            />
            <input
              type="text"
              value={test.location}
              onChange={(e) => updateTestimonial(index, 'location', e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
              placeholder="الموقع"
            />
            <select
              value={test.rating}
              onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value))}
              className="px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
            >
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} نجوم</option>)}
            </select>
          </div>
          <textarea
            value={test.comment}
            onChange={(e) => updateTestimonial(index, 'comment', e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
            placeholder="التعليق"
            rows={2}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={test.is_active}
                onChange={(e) => updateTestimonial(index, 'is_active', e.target.checked)}
                className="w-4 h-4"
              />
              مفعل
            </label>
            <button onClick={() => removeTestimonial(index)} className="text-red-500 text-sm">حذف</button>
          </div>
        </div>
      ))}
      <button onClick={addTestimonial} className="px-4 py-2 bg-luxury-gold/10 text-luxury-gold rounded-sm hover:bg-luxury-gold/20">+ إضافة تقييم</button>
    </div>
  );
}

// Partners Settings Section
function PartnersSettingsSection({ data, updateData }: { data: ContentData; updateData: any }) {
  const rawSettings = data.partners_settings;
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {
    section_title: 'شركاؤنا',
    section_description: 'موردين موثوقين · أفضل العلامات العالمية · شراكات استراتيجية',
    is_active: true
  };

  const updateSettings = (field: string, value: any) => {
    updateData('partners_settings', { ...settings, [field]: value });
  };

  return (
    <div className="space-y-4 mb-6 pb-6 border-b border-luxury-gold/20">
      <h4 className="text-lg font-bold text-luxury-gold">إعدادات القسم</h4>
      <div>
        <label className="block text-white font-medium mb-2">عنوان القسم</label>
        <input
          type="text"
          value={settings.section_title || ''}
          onChange={(e) => updateSettings('section_title', e.target.value)}
          className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-white font-medium mb-2">وصف القسم</label>
        <textarea
          value={settings.section_description || ''}
          onChange={(e) => updateSettings('section_description', e.target.value)}
          className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
          rows={2}
        />
      </div>
      <label className="flex items-center gap-2 text-white">
        <input
          type="checkbox"
          checked={settings.is_active !== false}
          onChange={(e) => updateSettings('is_active', e.target.checked)}
          className="w-4 h-4"
        />
        إظهار قسم الشركاء
      </label>
    </div>
  );
}

// Partners Section
function PartnersSection({ data, updateData }: { data: ContentData; updateData: any }) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handlePartnerLogoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'images');
      formData.append('folder', 'partners');

      const res = await fetch('http://localhost/sh-bakhoor-scripts/upload.php?action=upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        updatePartner(index, 'logo_url', result.url);
      } else {
        console.error('Upload failed:', result);
      }
    } catch (error) {
      console.error('Error uploading partner logo:', error);
    } finally {
      setUploadingIndex(null);
    }
  };

  const addPartner = () => {
    const newPartner = { name: '', country: '', logo_url: '', is_active: true, sort_order: (data.partners || []).length + 1 };
    updateData('partners', [...(data.partners || []), newPartner]);
  };

  const updatePartner = (index: number, field: string, value: any) => {
    const updated = [...(data.partners || [])];
    (updated[index] as any)[field] = value;
    updateData('partners', updated);
  };

  const removePartner = (index: number) => {
    updateData('partners', (data.partners || []).filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {(data.partners || []).map((partner, index) => (
        <div key={index} className="bg-luxury-black p-4 rounded-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={partner.name}
              onChange={(e) => updatePartner(index, 'name', e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
              placeholder="الاسم"
            />
            <input
              type="text"
              value={partner.country}
              onChange={(e) => updatePartner(index, 'country', e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
              placeholder="الدولة"
            />
            <div className="flex items-center gap-2">
              <label className="cursor-pointer flex-1 flex items-center justify-center px-3 py-2 bg-luxury-gold text-luxury-black rounded-sm hover:bg-luxury-gold-light transition-colors text-sm">
                {uploadingIndex === index ? (
                  'جاري الرفع...'
                ) : partner.logo_url ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    تم الرفع
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    رفع الشعار
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePartnerLogoUpload(index, e)}
                  disabled={uploadingIndex === index}
                />
              </label>
              {partner.logo_url && (
                <button
                  type="button"
                  onClick={() => updatePartner(index, 'logo_url', '')}
                  className="px-2 py-2 text-red-500 hover:text-red-400"
                  title="حذف"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={partner.is_active}
                onChange={(e) => updatePartner(index, 'is_active', e.target.checked)}
                className="w-4 h-4"
              />
              مفعل
            </label>
            <button onClick={() => removePartner(index)} className="text-red-500 text-sm">حذف</button>
          </div>
        </div>
      ))}
      <button onClick={addPartner} className="px-4 py-2 bg-luxury-gold/10 text-luxury-gold rounded-sm hover:bg-luxury-gold/20">+ إضافة شريك</button>
    </div>
  );
}

// Footer Settings Section
function FooterSettingsSection({ data, updateData }: { data: ContentData; updateData: any }) {
  const rawSettings = data.footer_settings;
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {
    about_title: 'نحن',
    about_description: 'متجر SH للبخور متخصص في أجود أنواع البخور والعطور والعود الطبيعي والفاخر من جميع أنحاء العالم.',
    phone_numbers: ['+966 50 123 4567', '+966 55 987 6543'],
    whatsapp: '+966 50 123 4567',
    copyright: 'جميع الحقوق محفوظة',
    is_active: true
  };

  const updateSettings = (field: string, value: any) => {
    updateData('footer_settings', { ...settings, [field]: value });
  };

  const updatePhoneNumber = (index: number, value: string) => {
    const phones = [...(settings.phone_numbers || [])];
    phones[index] = value;
    updateSettings('phone_numbers', phones);
  };

  const addPhoneNumber = () => {
    const phones = [...(settings.phone_numbers || []), ''];
    updateSettings('phone_numbers', phones);
  };

  const removePhoneNumber = (index: number) => {
    const phones = (settings.phone_numbers || []).filter((_: any, i: number) => i !== index);
    updateSettings('phone_numbers', phones);
  };

  return (
    <div className="space-y-4 mb-6 pb-6 border-b border-luxury-gold/20">
      <h4 className="text-lg font-bold text-luxury-gold">إعدادات الفوتر</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white font-medium mb-2">عنوان "من نحن"</label>
          <input
            type="text"
            value={settings.about_title || ''}
            onChange={(e) => updateSettings('about_title', e.target.value)}
            className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-white font-medium mb-2">نص حقوق الملكية</label>
          <input
            type="text"
            value={settings.copyright || ''}
            onChange={(e) => updateSettings('copyright', e.target.value)}
            className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">وصف "من نحن"</label>
        <textarea
          value={settings.about_description || ''}
          onChange={(e) => updateSettings('about_description', e.target.value)}
          className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-white font-medium mb-2">رقم الواتساب</label>
        <input
          type="text"
          value={settings.whatsapp || ''}
          onChange={(e) => updateSettings('whatsapp', e.target.value)}
          className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-white font-medium mb-2">أرقام الهاتف</label>
        {(settings.phone_numbers || []).map((phone: string, index: number) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={phone || ''}
              onChange={(e) => updatePhoneNumber(index, e.target.value)}
              className="flex-1 px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
              placeholder="+966 50 123 4567"
            />
            <button onClick={() => removePhoneNumber(index)} className="px-3 py-2 text-red-500 hover:text-red-400">
              ✕
            </button>
          </div>
        ))}
        <button onClick={addPhoneNumber} className="px-3 py-2 text-luxury-gold hover:text-luxury-gold-light text-sm">
          + إضافة رقم
        </button>
      </div>

      <label className="flex items-center gap-2 text-white">
        <input
          type="checkbox"
          checked={settings.is_active !== false}
          onChange={(e) => updateSettings('is_active', e.target.checked)}
          className="w-4 h-4"
        />
        إظهار الفوتر
      </label>
    </div>
  );
}

// Footer Section
function FooterSection({ data, updateData }: { data: ContentData; updateData: any }) {
  const sectionOptions = [
    { value: 'quick_links', label: 'روابط سريعة' },
    { value: 'incense', label: 'البخور' },
  ];

  const addLink = (section: string = 'quick_links') => {
    const newLink = { section, name: '', link: '#', sort_order: (data.footer_links || []).length + 1 };
    updateData('footer_links', [...(data.footer_links || []), newLink]);
  };

  const updateLink = (index: number, field: string, value: any) => {
    const updated = [...(data.footer_links || [])];
    (updated[index] as any)[field] = value;
    updateData('footer_links', updated);
  };

  const removeLink = (index: number) => {
    updateData('footer_links', (data.footer_links || []).filter((_, i) => i !== index));
  };

  const groupedLinks = (data.footer_links || []).reduce((acc: any, link: any) => {
    if (!acc[link.section]) acc[link.section] = [];
    acc[link.section].push(link);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {sectionOptions.map(section => (
        <div key={section.value} className="space-y-3">
          <h4 className="text-lg font-bold text-luxury-gold">{section.label}</h4>
          {(groupedLinks[section.value] || []).map((link: any, index: number) => {
            const originalIndex = (data.footer_links || []).findIndex((l: any) => l === link);
            return (
              <div key={originalIndex} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={link.name}
                  onChange={(e) => updateLink(originalIndex, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
                  placeholder="اسم الرابط"
                />
                <input
                  type="text"
                  value={link.link}
                  onChange={(e) => updateLink(originalIndex, 'link', e.target.value)}
                  className="flex-1 px-3 py-2 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none"
                  placeholder="الرابط"
                />
                <button onClick={() => removeLink(originalIndex)} className="text-red-500 hover:text-red-400">
                  ✕
                </button>
              </div>
            );
          })}
          <button 
            onClick={() => addLink(section.value)} 
            className="px-4 py-2 bg-luxury-gold/10 text-luxury-gold rounded-sm hover:bg-luxury-gold/20 text-sm"
          >
            + إضافة رابط
          </button>
        </div>
      ))}
    </div>
  );
}
