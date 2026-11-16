import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_Anon_key || '';

export const CANONICAL_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shbkhur.com';

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export const STATIC_SITEMAP_ROUTES: Omit<SitemapEntry, 'lastModified'>[] = [
  { url: `${CANONICAL_BASE_URL}`, changeFrequency: 'daily', priority: 1.0 },
  { url: `${CANONICAL_BASE_URL}/products`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${CANONICAL_BASE_URL}/products/oud`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${CANONICAL_BASE_URL}/products/perfumes`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${CANONICAL_BASE_URL}/products/natural-oud`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${CANONICAL_BASE_URL}/products/enhanced-oud`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${CANONICAL_BASE_URL}/products/scented-oud`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${CANONICAL_BASE_URL}/products/oil-oud`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${CANONICAL_BASE_URL}/products/bakhur-accessories`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${CANONICAL_BASE_URL}/products/best-sellers`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${CANONICAL_BASE_URL}/products/special-offers`, changeFrequency: 'daily', priority: 0.8 },
  { url: `${CANONICAL_BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${CANONICAL_BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${CANONICAL_BASE_URL}/return-policy`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${CANONICAL_BASE_URL}/privacy-policy`, changeFrequency: 'monthly', priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  
  const staticPages: SitemapEntry[] = STATIC_SITEMAP_ROUTES.map((route) => ({
    ...route,
    lastModified: now,
  }));

  if (!supabaseUrl || !supabaseAnonKey) {
    return staticPages;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch active products only (.neq('is_active', false) captures true and null legacy records while excluding false)
    const { data: products, error } = await supabase
      .from('products')
      .select('slug, updated_at, is_active')
      .neq('is_active', false)
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching products for sitemap:', error);
      return staticPages;
    }

    if (products && products.length > 0) {
      const productEntries: SitemapEntry[] = products
        .filter((product) => Boolean(product.slug))
        .map((product) => ({
          url: `${CANONICAL_BASE_URL}/product/${product.slug}`,
          lastModified: new Date(product.updated_at || now),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));

      return [...staticPages, ...productEntries];
    }
  } catch (error) {
    console.error('Unexpected error generating sitemap:', error);
  }

  return staticPages;
}
