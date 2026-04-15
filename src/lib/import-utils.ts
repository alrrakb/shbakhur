import { supabase } from '@/lib/supabase';
import type { ProductExportData } from './export-utils';

export type { ProductExportData };

export interface ImportConflict {
  importProduct: ProductExportData;
  existingProduct: {
    id: string | number;
    title: string;
    slug: string;
    sku: string | null;
    regular_price: string | number;
    sale_price: string | number | null;
    stock: number | null;
    stock_status: string;
    description: string;
    short_description: string;
    image: string;
    gallery_images: string[];
    is_active: boolean;
  };
  differences: string[];
}

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
  errors: number;
}

export function parseJsonFile(file: File): Promise<ProductExportData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (!Array.isArray(data)) {
          reject(new Error('JSON file must contain an array of products'));
          return;
        }
        resolve(data as ProductExportData[]);
      } catch (err) {
        reject(new Error('Invalid JSON file format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

export function findDifferences(
  importProduct: ProductExportData,
  existingProduct: ImportConflict['existingProduct']
): string[] {
  const differences: string[] = [];

  if (normalizeValue(importProduct.sku) !== normalizeValue(existingProduct.sku)) {
    differences.push(`SKU: "${existingProduct.sku}" → "${importProduct.sku}"`);
  }

  const importPrice = normalizeValue(importProduct.regular_price);
  const existingPrice = normalizeValue(existingProduct.regular_price);
  if (importPrice !== existingPrice) {
    differences.push(`Price: "${existingProduct.regular_price}" → "${importProduct.regular_price}"`);
  }

  const importSalePrice = normalizeValue(importProduct.sale_price);
  const existingSalePrice = normalizeValue(existingProduct.sale_price);
  if (importSalePrice !== existingSalePrice) {
    differences.push(`Sale Price: "${existingProduct.sale_price}" → "${importProduct.sale_price}"`);
  }

  if (importProduct.stock !== existingProduct.stock) {
    differences.push(`Stock: "${existingProduct.stock}" → "${importProduct.stock}"`);
  }

  if (importProduct.stock_status !== existingProduct.stock_status) {
    differences.push(`Stock Status: "${existingProduct.stock_status}" → "${importProduct.stock_status}"`);
  }

  if (normalizeValue(importProduct.description) !== normalizeValue(existingProduct.description)) {
    differences.push('Description changed');
  }

  if (normalizeValue(importProduct.short_description) !== normalizeValue(existingProduct.short_description)) {
    differences.push('Short description changed');
  }

  if (importProduct.image !== existingProduct.image) {
    differences.push(`Image URL changed`);
  }

  if (!arraysEqual(importProduct.gallery_images || [], existingProduct.gallery_images || [])) {
    differences.push('Gallery images changed');
  }

  if (importProduct.is_active !== existingProduct.is_active) {
    differences.push(`Active: "${existingProduct.is_active}" → "${importProduct.is_active}"`);
  }

  return differences;
}

export async function checkForConflicts(
  importProducts: ProductExportData[]
): Promise<{
  conflicts: ImportConflict[];
  newProducts: ProductExportData[];
}> {
  const conflicts: ImportConflict[] = [];
  const newProducts: ProductExportData[] = [];

  for (const importProduct of importProducts) {
    // Search for existing product by name (case-insensitive)
    const { data: existingProducts, error } = await supabase
      .from('products')
      .select('*')
      .ilike('title', importProduct.title.trim());

    if (error) {
      console.error('Error checking for conflicts:', error);
      continue;
    }

    if (existingProducts && existingProducts.length > 0) {
      // Found potential duplicate(s) - use the first match
      const existing = existingProducts[0];

      const existingFormatted: ImportConflict['existingProduct'] = {
        id: existing.id,
        title: existing.title,
        slug: existing.slug,
        sku: existing.sku,
        regular_price: existing.regular_price,
        sale_price: existing.sale_price,
        stock: existing.stock,
        stock_status: existing.stock_status,
        description: existing.description || '',
        short_description: existing.short_description || '',
        image: existing.image || '',
        gallery_images: existing.gallery_images || [],
        is_active: existing.is_active !== false,
      };

      const differences = findDifferences(importProduct, existingFormatted);

      conflicts.push({
        importProduct,
        existingProduct: existingFormatted,
        differences,
      });
    } else {
      // No match found - this is a new product
      newProducts.push(importProduct);
    }
  }

  return { conflicts, newProducts };
}

export async function importProduct(
  product: ProductExportData,
  existingId?: string | number
): Promise<{ success: boolean; error?: string }> {
  try {
    const productData = {
      title: product.title,
      slug: product.slug || product.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '-').replace(/-+/g, '-'),
      description: product.description,
      short_description: product.short_description,
      sku: product.sku,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      price: product.regular_price || product.price,
      stock: product.stock,
      stock_status: product.stock_status,
      image: product.image,
      gallery_images: product.gallery_images,
      is_active: product.is_active,
    };

    if (existingId) {
      // Update existing product
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', existingId);

      if (error) return { success: false, error: error.message };

      // Update categories
      if (product.categories && product.categories.length > 0) {
        await supabase.from('product_categories').delete().eq('product_id', existingId);

        const categoryInserts = product.categories.map(cat => ({
          product_id: existingId,
          category_id: cat.id,
        }));

        await supabase.from('product_categories').insert(categoryInserts);
      }
    } else {
      // Insert new product
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert(productData)
        .select('id')
        .single();

      if (error) return { success: false, error: error.message };

      // Insert categories for new product
      if (product.categories && product.categories.length > 0 && newProduct) {
        const categoryInserts = product.categories.map(cat => ({
          product_id: newProduct.id,
          category_id: cat.id,
        }));

        await supabase.from('product_categories').insert(categoryInserts);
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function processImportWithResolution(
  importProducts: ProductExportData[],
  resolutions: Map<string | number, 'overwrite' | 'skip'>,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult> {
  const result: ImportResult = { added: 0, updated: 0, skipped: 0, errors: 0 };

  // First, check for conflicts
  const { conflicts, newProducts } = await checkForConflicts(importProducts);

  const totalProducts = importProducts.length;
  let processedCount = 0;

  // Process new products (no conflicts)
  for (const product of newProducts) {
    onProgress?.(processedCount + 1, totalProducts);

    const importResult = await importProduct(product);
    if (importResult.success) {
      result.added++;
    } else {
      result.errors++;
      console.error(`Failed to add product "${product.title}": ${importResult.error}`);
    }
    processedCount++;
  }

  // Process conflicts based on resolutions
  for (const conflict of conflicts) {
    onProgress?.(processedCount + 1, totalProducts);

    const resolution = resolutions.get(conflict.existingProduct.id);

    if (resolution === 'skip') {
      result.skipped++;
    } else if (resolution === 'overwrite' || !resolution) {
      // Default to overwrite if no resolution specified
      const importResult = await importProduct(conflict.importProduct, conflict.existingProduct.id);
      if (importResult.success) {
        if (conflict.differences.length > 0) {
          result.updated++;
        } else {
          result.skipped++; // No differences, nothing to update
        }
      } else {
        result.errors++;
        console.error(`Failed to update product "${conflict.importProduct.title}": ${importResult.error}`);
      }
    }

    processedCount++;
  }

  return result;
}
