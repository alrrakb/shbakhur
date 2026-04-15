import { supabase } from '@/lib/supabase';

export interface CsvProductRow {
  'Product Name': string;
  'SKU': string;
  'Categories': string;
  'Stock Quantity': string;
  'Original Price': string;
  'Discounted Price': string;
}

export interface CsvImportResult {
  success: number;
  errors: number;
  errorDetails: string[];
}

export interface CsvExportFilters {
  searchQuery?: string;
  stockFilter?: string;
  categoryFilter?: string;
  discountFilter?: string;
}

const CSV_HEADERS = ['Product Name', 'SKU', 'Categories', 'Stock Quantity', 'Original Price', 'Discounted Price'];

function escapeCsvField(field: unknown): string {
  const str = String(field ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function validateCsvHeaders(headers: string[]): boolean {
  return CSV_HEADERS.every(h => headers.includes(h));
}

export async function exportProductsToCsv(filters?: CsvExportFilters): Promise<string> {
  let query = supabase
    .from('products')
    .select('id, title, slug, sku, regular_price, sale_price, stock, stock_status');

  // Apply search filter
  if (filters?.searchQuery) {
    query = query.or(`title.ilike.%${filters.searchQuery}%,sku.ilike.%${filters.searchQuery}%`);
  }

  // Apply stock filter
  if (filters?.stockFilter) {
    query = query.eq('stock_status', filters.stockFilter);
  }

  // Apply discount filter (products with sale_price < regular_price)
  if (filters?.discountFilter === 'discounted') {
    query = query.not('sale_price', 'is', null).not('sale_price', 'eq', '');
  }

  const { data: products, error: productsError } = await query.order('id', { ascending: false });

  if (productsError) throw productsError;

  let filteredProducts = products || [];

  // Apply category filter (requires post-processing since it's a junction table)
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

  // Filter products by category if category filter is applied
  let productIdsInCategory: number[] | null = null;
  if (targetCategoryIds) {
    const { data: productCats } = await supabase
      .from('product_categories')
      .select('product_id')
      .in('category_id', targetCategoryIds);
    
    productIdsInCategory = [...new Set((productCats || []).map(pc => pc.product_id))];
    filteredProducts = filteredProducts.filter(p => productIdsInCategory?.includes(p.id));
  }

  const { data: productCategories, error: pcError } = await supabase
    .from('product_categories')
    .select('product_id, categories(name)')
    .in('product_id', filteredProducts.map(p => p.id));

  if (pcError) throw pcError;

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name');

  const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);

  const productCatsMap: Record<number, string[]> = {};
  (productCategories || []).forEach((pc: any) => {
    const productId = pc.product_id;
    const catName = pc.categories?.name;
    if (!productCatsMap[productId]) productCatsMap[productId] = [];
    if (catName) productCatsMap[productId].push(catName);
  });

  const rows: CsvProductRow[] = filteredProducts.map((p: any) => ({
    'Product Name': p.title || '',
    'SKU': p.sku || '',
    'Categories': (productCatsMap[p.id] || []).join(', '),
    'Stock Quantity': p.stock === null ? 'Infinite' : (p.stock?.toString() || '0'),
    'Original Price': p.regular_price || p.price || '0',
    'Discounted Price': p.sale_price || '',
  }));

  const csvContent = [
    CSV_HEADERS.join(','),
    ...rows.map(row =>
      CSV_HEADERS.map(h => escapeCsvField(row[h as keyof CsvProductRow])).join(',')
    ),
  ].join('\n');

  return csvContent;
}

export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importProductsFromCsv(
  csvContent: string,
  onProgress?: (current: number, total: number) => void
): Promise<CsvImportResult> {
  const lines = csvContent.split('\n').filter(l => l.trim());
  if (lines.length < 2) {
    return { success: 0, errors: 0, errorDetails: ['CSV file is empty or missing data'] };
  }

  const headers = parseCsvLine(lines[0]);
  if (!validateCsvHeaders(headers)) {
    return {
      success: 0,
      errors: 0,
      errorDetails: [`Invalid CSV headers. Required: ${CSV_HEADERS.join(', ')}`],
    };
  }

  const headerIndex = new Map(headers.map((h, i) => [h, i]));
  const dataRows = lines.slice(1);

  const { data: existingCategories } = await supabase
    .from('categories')
    .select('id, name');

  const categoryNameToId = new Map(
    (existingCategories || []).map((c: any) => [c.name.toLowerCase().trim(), c.id])
  );

  let successCount = 0;
  let errorCount = 0;
  const errorDetails: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    onProgress?.(i + 1, dataRows.length);

    try {
      const fields = parseCsvLine(row);
      if (fields.length < CSV_HEADERS.length) {
        errorCount++;
        errorDetails.push(`Row ${i + 2}: Insufficient columns`);
        continue;
      }

      const productName = fields[headerIndex.get('Product Name')!] || '';
      const sku = fields[headerIndex.get('SKU')!] || '';
      const categoriesStr = fields[headerIndex.get('Categories')!] || '';
      const stockStr = fields[headerIndex.get('Stock Quantity')!] || '0';
      const stockQty = stockStr.toLowerCase() === 'infinite' ? null : parseInt(stockStr, 10);
      const originalPrice = fields[headerIndex.get('Original Price')!] || '';
      const discountedPrice = fields[headerIndex.get('Discounted Price')!] || '';

      if (!productName) {
        errorCount++;
        errorDetails.push(`Row ${i + 2}: Product Name is required`);
        continue;
      }

      const slug = productName
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // If stock is null (infinite), default to instock, otherwise check quantity
      const stockStatus = stockQty === null ? 'instock' : (stockQty > 0 ? 'instock' : 'outofstock');

      const productData = {
        title: productName,
        slug,
        sku: sku || null,
        regular_price: originalPrice,
        sale_price: discountedPrice || null,
        price: originalPrice,
        stock: stockQty,
        stock_status: stockStatus,
        is_active: true,
      };

      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      let productId: number;

      if (existingProduct) {
        const { data: updated, error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', existingProduct.id)
          .select('id')
          .single();

        if (updateError) throw updateError;
        productId = updated.id;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();

        if (insertError) throw insertError;
        productId = inserted.id;
      }

      if (categoriesStr) {
        const categoryNames = categoriesStr
          .split(',')
          .map(c => c.trim().toLowerCase())
          .filter(Boolean);

        const categoryIds = categoryNames
          .map(name => categoryNameToId.get(name))
          .filter((id): id is string => Boolean(id));

        if (categoryIds.length > 0) {
          await supabase
            .from('product_categories')
            .delete()
            .eq('product_id', productId);

          const catInserts = categoryIds.map(catId => ({
            product_id: productId,
            category_id: catId,
          }));

          await supabase.from('product_categories').insert(catInserts);
        }
      }

      successCount++;
    } catch (error: any) {
      errorCount++;
      errorDetails.push(`Row ${i + 2}: ${error.message || 'Unknown error'}`);
    }
  }

  return { success: successCount, errors: errorCount, errorDetails };
}

export function parseCsvFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
