import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SeoData {
  page_path: string;
  title: string;
  description: string;
  keywords: string;
  og_image: string;
}

const DEFAULT_SEO: SeoData = {
  page_path: '/',
  title: 'SH للبخور - أجود البخور والعطور والعود الطبيعي',
  description: 'متجر SH للبخور متخصص في أجود أنواع البخور والعطور والعود الطبيعي من تايلاند وإندونيسيا والهند. توصيل سريع خلال 2-4 أيام عمل. شحن مجاني للرياض.',
  keywords: 'بخور, عود, عطور, مبخرة, دهن عود, عود تايلاندي, عود إندونيسي,香水,عود',
  og_image: ''
};

export async function getSeoData(path: string): Promise<SeoData> {
  try {
    const normalizedPath = path === '' ? '/' : path;
    
    const { data, error } = await supabase
      .from('seo_settings')
      .select('page_path, title, description, keywords, og_image')
      .eq('page_path', normalizedPath)
      .single();

    if (error || !data) {
      return getDefaultSeo(normalizedPath);
    }

    return data;
  } catch (error) {
    console.error('Error fetching SEO data:', error);
    return getDefaultSeo(path);
  }
}

function getDefaultSeo(path: string): SeoData {
  const defaults: Record<string, Partial<SeoData>> = {
    '/': {
      title: 'SH للبخور - أجود البخور والعطور والعود الطبيعي',
      description: 'متجر SH للبخور متخصص في أجود أنواع البخور والعطور والعود الطبيعي. توصيل سريع خلال 2-4 أيام عمل.',
      keywords: 'بخور, عود, عطور, مبخرة',
      og_image: ''
    },
    '/products': {
      title: 'جميع المنتجات | SH للبخور',
      description: 'تصفح جميع منتجاتنا من البخور والعطور والعود الطبيعي والملحقات.',
      keywords: 'بخور للبيع, عطور, عود طبيعي',
      og_image: ''
    },
    '/cart': {
      title: 'السلة | SH للبخور',
      description: 'سلة التسوق - مراجعة المنتجات والإتمام.',
      keywords: 'سلة التسوق, شراء',
      og_image: ''
    },
    '/checkout': {
      title: 'الدفع | SH للبخور',
      description: 'إتمام الطلب - تواصل معنا للطلب.',
      keywords: 'شراء, دفع',
      og_image: ''
    }
  };

  const defaultPage = defaults[path] || {};
  
  return {
    ...DEFAULT_SEO,
    page_path: path,
    title: defaultPage.title || DEFAULT_SEO.title,
    description: defaultPage.description || DEFAULT_SEO.description,
    keywords: defaultPage.keywords || DEFAULT_SEO.keywords,
    og_image: defaultPage.og_image || DEFAULT_SEO.og_image
  };
}

export async function getAllSeoPaths(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('seo_settings')
      .select('page_path');

    if (error) throw error;
    
    return (data || []).map(d => d.page_path);
  } catch (error) {
    console.error('Error fetching SEO paths:', error);
    return ['/'];
  }
}

export async function saveSeoData(seo: SeoData): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('seo_settings')
      .upsert({
        page_path: seo.page_path,
        title: seo.title,
        description: seo.description,
        keywords: seo.keywords,
        og_image: seo.og_image,
        updated_at: new Date().toISOString()
      }, { onConflict: 'page_path' });

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllSeoSettings(): Promise<SeoData[]> {
  try {
    const { data, error } = await supabase
      .from('seo_settings')
      .select('page_path, title, description, keywords, og_image')
      .order('page_path');

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching all SEO settings:', error);
    return [];
  }
}
