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
  description: 'متجر SH للبخور متخصص في أجود أنواع البخور والعطور والعود الطبيعي من تايلاند وإندونيسيا والهند. شحن سريع وموثوق لكافة مدن المملكة.',
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
      title: 'SH للبخور | أفخم درجات العود وعطور النيش الأصلية',
      description: 'اكتشف عالم الفخامة مع متجر SH للبخور. نقدم لك قائمة بأرقى أنواع العود الطبيعي، البخور المعطر، وعطور النيش العالمية بأعلى معايير الجودة والموثوقية.',
      keywords: 'بخور، عود طبيعي، عطور نيش، متجر عطور وبخور، دهن عود، مباخر ذكية، عطور اصلية، بخور ملكي',
      og_image: ''
    },
    '/products': {
      title: 'جميع المنتجات | عود وعطور حصرية من SH للبخور',
      description: 'تصفح التشكيلة الكاملة من SH للبخور. تسوق عود طبيعي، بخور مسقى، ودهن عود بيور بالإضافة لأشهر العطور العالمية بتجربة تسوق لا تُنسى.',
      keywords: 'تسوق بخور، منتجات العود، دهن العود للبيع، عطور فخمة، متجر عطور وبخور، مباخر، خشب العود',
      og_image: ''
    },
    '/best-sellers': {
      title: 'الأكثر مبيعاً | مفضلة عملاء SH للبخور المتميزة',
      description: 'تعرف على العطور والبخور الأكثر مبيعاً والأعلى تقييماً من عملائنا الكرام. خرافة الروائح التي أثبتت جدارتها في الثبات والفوحان الفاخر.',
      keywords: 'أفضل بخور مبيعا، عطور الأكثر مبيعا، بخور مجرب، هدايا فاخرة، عود ثبات عالي، افضل دهن عود',
      og_image: ''
    },
    '/special-offers': {
      title: 'عروض عطور وبخور استثنائية | خصومات SH للبخور',
      description: 'لا تفوت أقوى العروض والتخفيضات الحصرية من متجرنا على باقات العود والعطور. جودة ملكية بأسعار تنافسية لفترة محدودة، تسوق وتوفّر الآن.',
      keywords: 'عروض البخور، تخفيضات العود، كود خصم بخور، عروض هدايا عود، بكجات عود مخفضة، عطور مخفضة',
      og_image: ''
    },
    '/oud': {
      title: 'البخور والعود الفاخر | أصالة الروائح الشرقية',
      description: 'تسوق أفضل روائح البخور والعود المعتق من SH للبخور. نوفر لك أنواع فذة من المروكي والكلمنتان التي تزين مجالسك ومناسباتك الخاصة بفوحان يدوم.',
      keywords: 'عود ملكي، بخور فاخر، عود للمناسبات، خشب العود الاصلي، عود كلمنتان، عود مروكي، بخور عرايسي',
      og_image: ''
    },
    '/natural-oud': {
      title: 'العود الطبيعي | نوادر العود الهندي والمروكي',
      description: 'لعشاق الفخامة والأصالة الطبيعية البحتة. تسوق أرقى كسر العود الطبيعي البيور الخالي من الإضافات لتجربة تبخير كلاسيكية مريحة للأعصاب.',
      keywords: 'عود طبيعي بیور، خشب عود طبيعي، عود طبيعي للبيع، عود هندي أصلي، عود سيلاني، كسر عود',
      og_image: ''
    },
    '/enhanced-oud': {
      title: 'العود المحسن | فخامة التبخير ومثالية السعر',
      description: 'استمتع بثبات عالٍ ورائحة تحاكي العود الطبيعي بالتمام مع تشكيلة العود المحسن من SH للبخور. أفضل الخيارات للتبخير اليومي والمساجد بتكلفة ذكية.',
      keywords: 'عود مروكي محسن، بخور محسن، عود محسن بيور، عود اقتصادي، بخور مساجد، عود يومي، بخور للبيت',
      og_image: ''
    },
    '/scented-oud': {
      title: 'العود المعطر (البخور المسقى) | رونق الفوحان الجذاب',
      description: 'تشكيلة مميزة من البخور المسقى بزيوت عطرية فرنسية وشرقية تدوم طويلاً. عطّر منزلك وثيابك بمزيج عصري وأصيل يمنحك تجربة عطرية ساحرة.',
      keywords: 'عود معطر، بخور مسقى، معموس دوسري، مبثوث ملكي، بخور للملابس، بخور دقة عود، مخلط بخور',
      og_image: ''
    },
    '/oil-oud': {
      title: 'دهن العود الصافي | خلاصة الطيب الأصيل',
      description: 'اكتشف أنواع دهن العود المعتقة والبيور، من دهن العود البراشين والهندي والكمبودي. قطرات صغيرة تمنحك فوطاناً مهيباً وثباتاً متجذراً من SH للبخور.',
      keywords: 'دهن عود هندي، دهن عود كمبودي، دهن عود براشين، مخلط دهن عود، دهن عود بيور، ربع توله عود',
      og_image: ''
    },
    '/bakhur-accessories': {
      title: 'إكسسوارات البخور والمباخر الأنيقة | SH للبخور',
      description: 'أكمل هديتك وتجربتك الفاخرة مع أحدث المباخر الذكية والكلاسيكية وملحقات التبخير وملاقط العود الفاخرة للزينة وللإستخدام اليومي المريح.',
      keywords: 'مباخر ذكية، مبخرة خشب، فحم بخور، اكسسوارات عود، ملقط فحم، هدايا مباخر، صندوق عود',
      og_image: ''
    },
    '/tomford': {
      title: 'عطور توم فورد الأيقونية | سحر الأناقة الجريئة',
      description: 'اقتنِ عطور توم فورد المميزة من SH للبخور. روائح تنضح بالفخامة والجاذبية للرجال والنساء في عبوات تنفرد بتكوينات عطرية عميقة وملفتة.',
      keywords: 'عطور توم فورد، عطر توم فورد بلاك اوركيد، عطور النيش، توم فورد رجالي، عطر توم فورد عود وود',
      og_image: ''
    },
    '/dior': {
      title: 'عطور ديور الفخمة | رموز الأنوثة والجاذبية العطرية',
      description: 'عطور ديور الغنية عن التعريف متوفرة الآن بأصالة مضمونة. اختر الباقة العطرية التي تعبر عن شخصيتك وتترك خلفك أثراً يسلب الحواس.',
      keywords: 'عطور ديور، عطر سوفاج، جادور ديور، ديور هوم انتنس، عطور فرنسية، عطر ديور نسائي',
      og_image: ''
    },
    '/gucci': {
      title: 'عطور جوتشي الساحرة | لمسة الفخامة الدافئة',
      description: 'تألق بأرقى عطور جوتشي الكلاسيكية والعصرية. روائح ثابتة تناسب جميع إطلالاتك، متوفرة الآن في متجر SH للبخور بثقة وموثوقية عالية.',
      keywords: 'عطور قوتشي، قوتشي بلوم، عطر جوتشي جلتي، عطور رجالية قوتشي، عطور نسائية قوتشي',
      og_image: ''
    },
    '/ysl': {
      title: 'عطور إيف سان لوران (YSL) | تجسيد الرقي الكلاسيكي',
      description: 'عطور واي إس إل (Yves Saint Laurent) الجريئة والأيقونية متوفرة لأصحاب الذوق المترف. تسوق من SH للبخور واستمتع بنفحات عطرية تسرق الأضواء.',
      keywords: 'عطور إيف سان لوران، عطر ليبر، عطر واي اس ال رجالي، YSL perfumes، بلاك اوبيوم',
      og_image: ''
    },
    '/cart': {
      title: 'سلة التسوق | راجع طلبك الفاخر | SH للبخور',
      description: 'راجع منتجاتك المختارة في سلة المشتريات بكل شفافية وأمان قبل الدفع. استعد للحصول على أندر أنواع البخور والعطور بأسعار منافسة.',
      keywords: 'سلة المشتريات متجر عطور، تاكيد طلب بخور',
      og_image: ''
    },
    '/checkout': {
      title: 'الدفع الآمن والمضمون | إتمام الطلب | SH للبخور',
      description: 'أتمم طلبك لدى SH للبخور بخطوات بسيطة ووسائل دفع متعددة ومحمية ببروتوكولات الأمان. استمتع بتوصيل سريع وتسوق مريح لمنتجات العود المتفردة.',
      keywords: 'الدفع الالكتروني للبخور، اتمام الطلب متجر عود، توصيل عطور سريع',
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
