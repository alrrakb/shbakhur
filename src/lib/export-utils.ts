import { supabase } from '@/lib/supabase';
import { downloadCsv, exportProductsToCsv as baseExportCsv } from './csv-utils';

export interface ExportFilters {
  searchQuery?: string;
  stockFilter?: string;
  categoryFilter?: string;
  discountFilter?: string;
}

export interface ProductExportData {
  id: string | number;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  sku: string | null;
  regular_price: string | number;
  sale_price: string | number | null;
  price: string | number;
  stock: number | null;
  stock_status: string;
  image: string;
  gallery_images: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  categories: { id: string; name: string; slug: string }[];
}

export async function exportProductsToJson(filters?: ExportFilters): Promise<string> {
  let query = supabase
    .from('products')
    .select('*');

  // Apply search filter
  if (filters?.searchQuery) {
    query = query.or(`title.ilike.%${filters.searchQuery}%,sku.ilike.%${filters.searchQuery}%`);
  }

  // Apply stock filter
  if (filters?.stockFilter) {
    query = query.eq('stock_status', filters.stockFilter);
  }

  // Apply discount filter
  if (filters?.discountFilter === 'discounted') {
    query = query.not('sale_price', 'is', null).not('sale_price', 'eq', '');
  }

  const { data: products, error: productsError } = await query.order('id', { ascending: false });

  if (productsError) throw productsError;

  let filteredProducts = products || [];

  // Apply category filter
  let targetCategoryIds: string[] | null = null;
  if (filters?.categoryFilter) {
    const { data: childCats } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', filters.categoryFilter);

    targetCategoryIds = [filters.categoryFilter];
    if (childCats && childCats.length > 0) {
      targetCategoryIds.push(...childCats.map(c => c.id));
    }
  }

  // Filter products by category
  if (targetCategoryIds) {
    const { data: productCats } = await supabase
      .from('product_categories')
      .select('product_id')
      .in('category_id', targetCategoryIds);

    const productIdsInCategory = [...new Set((productCats || []).map(pc => pc.product_id))];
    filteredProducts = filteredProducts.filter(p => productIdsInCategory.includes(p.id));
  }

  // Fetch categories for all filtered products
  const { data: productCategories, error: pcError } = await supabase
    .from('product_categories')
    .select('product_id, categories(id, name, slug)')
    .in('product_id', filteredProducts.map(p => p.id));

  if (pcError) throw pcError;

  // Build category map
  const productCatsMap: Record<string | number, { id: string; name: string; slug: string }[]> = {};
  (productCategories || []).forEach((pc: any) => {
    const productId = pc.product_id;
    if (!productCatsMap[productId]) productCatsMap[productId] = [];
    if (pc.categories) {
      productCatsMap[productId].push({
        id: pc.categories.id,
        name: pc.categories.name,
        slug: pc.categories.slug,
      });
    }
  });

  // Format export data with ALL fields
  const exportData: ProductExportData[] = filteredProducts.map((p: any) => ({
    id: p.id,
    title: p.title || '',
    slug: p.slug || '',
    description: p.description || '',
    short_description: p.short_description || '',
    sku: p.sku || null,
    regular_price: p.regular_price || p.price || '',
    sale_price: p.sale_price || null,
    price: p.price || p.regular_price || '',
    stock: p.stock,
    stock_status: p.stock_status || 'instock',
    image: p.image || '',
    gallery_images: Array.isArray(p.gallery_images) ? p.gallery_images : [],
    is_active: p.is_active !== false,
    created_at: p.created_at,
    updated_at: p.updated_at,
    categories: productCatsMap[p.id] || [],
  }));

  return JSON.stringify(exportData, null, 2);
}

export async function exportProductsToCsv(filters?: ExportFilters): Promise<string> {
  return baseExportCsv(filters);
}

export function downloadJson(jsonContent: string, filename: string): void {
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { downloadCsv };
