/**
 * Central Image SEO Utility for SH BAKHUR (shbakhur.com)
 * Generates intent-rich, commercial Arabic alt tags for Google Images & Visual Search.
 */

export interface ProductImageAltParams {
  title?: string;
  categoryName?: string;
  isMain?: boolean;
  index?: number;
}

/**
 * Generates rich, contextual alt text for product images across listings, main pages, and galleries.
 */
export function generateProductImageAlt({
  title,
  categoryName,
  isMain,
  index,
}: ProductImageAltParams): string {
  const cleanTitle = (title || '').trim() || 'منتج فاخر';
  const cleanCategory = (categoryName || '').trim();

  // 1. Gallery thumbnail image
  if (typeof index === 'number') {
    return `معاينة تفاصيل ${cleanTitle} - صورة ${index + 1} | متجر SH للبخور`;
  }

  // 2. Single Product Main Hero Image
  if (isMain) {
    const categorySuffix = cleanCategory ? ` - ${cleanCategory}` : ' - أفخم درجات العود وعطور النيش';
    return `${cleanTitle}${categorySuffix} | متجر SH للبخور الفاخر`;
  }

  // 3. Catalog & Grid Cards
  const categorySuffix = cleanCategory ? ` - ${cleanCategory}` : ' - عود وعطور أصلية فاخرة';
  return `${cleanTitle}${categorySuffix} | متجر SH للبخور`;
}

/**
 * Generates rich promotional alt text for Hero slider banners.
 */
export function generateHeroSlideAlt(title?: string, subtitle?: string): string {
  const cleanTitle = (title || '').trim();
  const cleanSubtitle = (subtitle || '').trim();

  if (cleanTitle && cleanSubtitle) {
    return `${cleanTitle} - ${cleanSubtitle} | متجر SH للبخور الفاخر`;
  }

  if (cleanTitle) {
    return `${cleanTitle} - متجر SH للبخور | تسوق أرقى البخور ودهن العود في السعودية`;
  }

  return 'تشكيلة العود والعطور الملكية الفاخرة - متجر SH للبخور | تسوق أرقى البخور ودهن العود في السعودية';
}

/**
 * Generates brand-authentic alt text for store logos.
 */
export function generateLogoAlt(storeName?: string): string {
  const cleanName = (storeName || '').trim() || 'متجر SH للبخور';
  return `شعار ${cleanName} - المتجر الرسمي للعود والعطور الفاخرة في السعودية`;
}
