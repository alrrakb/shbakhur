import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ProductDetailsClient, { Product, RelatedProduct } from '../ProductDetailsClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  
  try {
    let query = supabase.from('products').select('*');
    if (/^\d+$/.test(slug)) {
      query = query.eq('id', slug);
    } else {
      query = query.eq('slug', slug);
    }
    const { data: product } = await query.single();

    if (!product) {
      return { title: 'Product Not Found | SH للبخور' };
    }

    const title = product.title || product.name || 'Product';
    const description = product.short_description || product.description?.slice(0, 160) || 'تسوق أجود أنواع البخور والعطور من متجر SH للبخور';
    const keywords = product.seo_keywords || 'بخور, عود, عطور, متجر SH للبخور';

    return {
      title: `${title} - متجر SH للبخور`,
      description,
      keywords,
      openGraph: { title: `${title} - متجر SH للبخور`, description },
    };
  } catch {
    return { title: 'Product - متجر SH للبخور' };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  
  let query = supabase.from('products').select('*');
  if (/^\d+$/.test(slug)) {
    query = query.eq('id', slug);
  } else {
    query = query.eq('slug', slug);
  }
  
  const { data: product, error } = await query.single();

  if (error || !product) {
    notFound();
  }

  // Fetch category name + category IDs in one query
  let categoryName = '';
  let categoryIds: string[] = [];

  try {
    const { data: cats } = await supabase
      .from('product_categories')
      .select('category_id, categories(name)')
      .eq('product_id', product.id);
    
    if (cats && cats.length > 0) {
      categoryIds = cats.map((c: any) => c.category_id).filter(Boolean);
      // @ts-ignore
      categoryName = cats[0]?.categories?.name || '';
    }
  } catch { /* ignore */ }

  // Fetch related products: same category, exclude current product, ordered by price desc
  let relatedProducts: RelatedProduct[] = [];
  try {
    if (categoryIds.length > 0) {
      // Get product IDs in the same categories
      const { data: relatedPcRows } = await supabase
        .from('product_categories')
        .select('product_id')
        .in('category_id', categoryIds)
        .neq('product_id', product.id);

      const relatedIds = [...new Set((relatedPcRows || []).map((r: any) => r.product_id))];

      if (relatedIds.length > 0) {
        const { data: relProds } = await supabase
          .from('products')
          .select('id, title, slug, price, sale_price, image, discount_percentage, created_at')
          .in('id', relatedIds)
          .eq('is_active', true)
          .limit(4);

        relatedProducts = (relProds || []).map((p: any) => ({
          id: p.id,
          title: p.title || '',
          slug: p.slug || '',
          price: p.price || '0',
          sale_price: p.sale_price || null,
          image: p.image || '',
          discount_percentage: p.discount_percentage || 0,
          created_at: p.created_at,
        }));
      }
    }
  } catch { /* graceful fallback */ }

  const enrichedProduct = { ...product, categoryName };

  return (
    <ProductDetailsClient
      initialProduct={enrichedProduct}
      relatedProducts={relatedProducts}
    />
  );
}
