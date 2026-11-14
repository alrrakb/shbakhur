import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_Anon_key || '';
const CANONICAL_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shbkhur.com';

export const dynamic = 'force-dynamic';

function cleanCdata(text: string): string {
  if (!text) return '';
  return text.replace(/\]\]>/g, ']]&gt;').trim();
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

function resolveImageUrl(rawUrl?: string): string {
  if (!rawUrl) return `${CANONICAL_BASE_URL}/og-image.png`;
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `${CANONICAL_BASE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

export async function GET() {
  let itemsXml = '';

  try {
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Query active products (.neq('is_active', false) includes active and legacy unflagged products)
      const { data: products, error } = await supabase
        .from('products')
        .select('id, title, name, slug, price, sale_price, regular_price, image, short_description, description, stock_status, is_active')
        .neq('is_active', false)
        .order('id', { ascending: false });

      if (error) {
        console.error('Error querying products for Google Merchant Feed:', error);
      } else if (products && products.length > 0) {
        itemsXml = products
          .map((p) => {
            const rawId = p.id?.toString() || '';
            const rawTitle = p.title || p.name || 'منتج فاخر';
            const rawSlug = p.slug || rawId;
            const link = `${CANONICAL_BASE_URL}/product/${rawSlug}`;
            const imageLink = resolveImageUrl(p.image);

            // Clean description
            const rawDesc = p.short_description || p.description || `${rawTitle} - تسوق أرقى أنواع البخور وخشب العود وعطور النيش الفاخرة من متجر SH للبخور في المملكة العربية السعودية.`;
            const cleanDescription = stripHtml(rawDesc);

            // Price resolution
            const numRegular = parseFloat(p.regular_price || p.price || '0');
            const safeRegular = isNaN(numRegular) || numRegular <= 0 ? 100.0 : numRegular;
            const priceFormatted = `${safeRegular.toFixed(2)} SAR`;

            let salePriceElement = '';
            if (p.sale_price) {
              const numSale = parseFloat(p.sale_price);
              if (!isNaN(numSale) && numSale > 0 && numSale < safeRegular) {
                salePriceElement = `\n      <g:sale_price>${numSale.toFixed(2)} SAR</g:sale_price>`;
              }
            }

            // Availability
            const isOutOfStock = p.stock_status === 'outofstock' || p.is_active === false;
            const availability = isOutOfStock ? 'out_of_stock' : 'in_stock';

            return `    <item>
      <g:id>${rawId}</g:id>
      <g:title><![CDATA[${cleanCdata(rawTitle)}]]></g:title>
      <g:description><![CDATA[${cleanCdata(cleanDescription)}]]></g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:price>${priceFormatted}</g:price>${salePriceElement}
      <g:availability>${availability}</g:availability>
      <g:brand>SH للبخور</g:brand>
      <g:condition>new</g:condition>
      <g:shipping>
        <g:country>SA</g:country>
        <g:service>Bolesa Express</g:service>
        <g:price>0.00 SAR</g:price>
      </g:shipping>
    </item>`;
          })
          .join('\n');
      }
    }
  } catch (err) {
    console.error('Unhandled exception in Google Merchant Feed Route:', err);
  }

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>متجر SH للبخور والعطور الفاخرة</title>
    <link>${CANONICAL_BASE_URL}</link>
    <description>خلاصة منتجات متجر SH للبخور الرسمية المعتمدة لـ Google Shopping و Google Merchant Center</description>
${itemsXml}
  </channel>
</rss>`;

  return new Response(xmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400',
    },
  });
}
