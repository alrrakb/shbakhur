import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { executeQuery } from '@/lib/db';

// Supabase client is initialized lazily inside the handler to avoid
// throwing at module-level during the Next.js build phase.
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_Service_role_key;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

const WP_DB_HOST = process.env.WP_DB_HOST || 'localhost';
const WP_DB_USER = process.env.WP_DB_USER || 'root';
const WP_DB_PASS = process.env.WP_DB_PASS || '';
const WP_DB_NAME = process.env.WP_DB_NAME || 'store_db';

interface WPProduct {
  ID: number;
  post_title: string;
  post_content: string;
  post_excerpt: string;
  post_name: string;
  meta_value: string;
  featured_image: string;
  gallery_images: string[];
  categories: string[];
}

async function getWpConnection() {
  const mysql = require('mysql2/promise');
  return await mysql.createConnection({
    host: WP_DB_HOST,
    user: WP_DB_USER,
    password: WP_DB_PASS,
    database: WP_DB_NAME,
  });
}

async function fetchWordPressProducts(): Promise<WPProduct[]> {
  const connection = await getWpConnection();
  
  await connection.query("SET NAMES utf8mb4");
  
  const [rows] = await connection.query(`
    SELECT 
      p.ID,
      p.post_title,
      p.post_content,
      p.post_excerpt,
      p.post_name,
      COALESCE(pm_regular.meta_value, '') as regular_price,
      COALESCE(pm_sale.meta_value, '') as sale_price,
      COALESCE(pm_sku.meta_value, '') as sku,
      COALESCE(pm_stock.meta_value, '0') as stock,
      COALESCE(pm_stock_status.meta_value, 'instock') as stock_status,
      (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_thumbnail_id' LIMIT 1) as thumbnail_id
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm_regular ON p.ID = pm_regular.post_id AND pm_regular.meta_key = '_price'
    LEFT JOIN wp_postmeta pm_sale ON p.ID = pm_sale.post_id AND pm_sale.meta_key = '_sale_price'
    LEFT JOIN wp_postmeta pm_sku ON p.ID = pm_sku.post_id AND pm_sku.meta_key = '_sku'
    LEFT JOIN wp_postmeta pm_stock ON p.ID = pm_stock.post_id AND pm_stock.meta_key = '_stock'
    LEFT JOIN wp_postmeta pm_stock_status ON p.ID = pm_stock_status.post_id AND pm_stock_status.meta_key = '_stock_status'
    WHERE p.post_type = 'product' AND p.post_status = 'publish'
    ORDER BY p.ID DESC
    LIMIT 100
  `);

  const products: WPProduct[] = [];
  
  for (const row of rows) {
    let featuredImageUrl = '';
    
    if (row.thumbnail_id) {
      const [thumbRows] = await connection.query(
        'SELECT guid FROM wp_posts WHERE ID = ? AND post_type = "attachment"',
        [row.thumbnail_id]
      );
      if (thumbRows.length > 0) {
        featuredImageUrl = thumbRows[0].guid;
      }
    }
    
    const [catRows] = await connection.query(`
      SELECT t.name 
      FROM wp_terms t
      INNER JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
      INNER JOIN wp_term_relationships tr ON tr.term_taxonomy_id = tt.term_taxonomy_id
      WHERE tr.object_id = ? AND tt.taxonomy = 'product_cat'
    `, [row.ID]);
    
    const categories = catRows.map((r: any) => r.name);
    
    products.push({
      ID: row.ID,
      post_title: row.post_title,
      post_content: row.post_content,
      post_excerpt: row.post_excerpt,
      post_name: row.post_name,
      meta_value: row.regular_price,
      featured_image: featuredImageUrl,
      gallery_images: [],
      categories
    });
  }
  
  await connection.end();
  return products;
}

async function downloadAndUploadImage(imageUrl: string, bucket: string, folder: string): Promise<string | null> {
  try {
    if (!imageUrl || imageUrl.includes('placeholder') || !imageUrl.startsWith('http')) {
      return null;
    }
    
    const processedUrl = imageUrl.replace(/localhost/gi, '127.0.0.1');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(processedUrl, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Failed to fetch image (${response.status}): ${imageUrl}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: response.headers.get('content-type') || 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.warn('Upload error:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error: any) {
    console.warn('Image download error:', error.message);
    return null;
  }
}

function escapeSql(value: string | null | undefined): string {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function escapeNumeric(value: string | null | undefined, defaultValue: string = 'NULL'): string {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : String(num);
}

async function ensureCategoryExists(categoryName: string): Promise<number | null> {
  if (!categoryName) return null;
  
  const slug = categoryName.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g, '-');
  
  const checkResult = await executeQuery(`SELECT id FROM categories WHERE name = ${escapeSql(categoryName)}`);
  
  if (checkResult.success && checkResult.data && checkResult.data.length > 0) {
    return checkResult.data[0].id;
  }
  
  const insertResult = await executeQuery(
    `INSERT INTO categories (name, slug, taxonomy) VALUES (${escapeSql(categoryName)}, ${escapeSql(slug)}, 'product_cat') RETURNING id`
  );
  
  if (insertResult.success && insertResult.data && insertResult.data.length > 0) {
    return insertResult.data[0].id;
  }
  
  return null;
}

export async function GET() {
  try {
    console.log('Starting WordPress to Supabase import using DB Engine...');
    
    const wpProducts = await fetchWordPressProducts();
    console.log(`Found ${wpProducts.length} products in WordPress`);
    
    if (wpProducts.length === 0) {
      return NextResponse.json({ success: false, error: 'No products found in WordPress' });
    }
    
    let successCount = 0;
    let errorCount = 0;
    const categoryMap = new Map<string, number>();
    
    const allCategories = new Set<string>();
    wpProducts.forEach(p => {
      p.categories.forEach(c => allCategories.add(c));
    });
    
    console.log(`Creating ${allCategories.size} categories...`);
    for (const category of allCategories) {
      const catId = await ensureCategoryExists(category);
      if (catId) {
        categoryMap.set(category, catId);
      }
    }
    
    for (const wpProduct of wpProducts) {
      try {
        let imageUrl: string | null = null;
        if (wpProduct.featured_image) {
          imageUrl = await downloadAndUploadImage(wpProduct.featured_image, 'products', 'featured');
        }
        
        const productSQL = `
          INSERT INTO products (wp_id, name, title, description, short_description, slug, sku, price, regular_price, sale_price, image, gallery_images, is_active)
          VALUES (
            ${wpProduct.ID ? String(wpProduct.ID) : 'NULL'},
            ${escapeSql(wpProduct.post_title)},
            ${escapeSql(wpProduct.post_title)},
            ${escapeSql(wpProduct.post_content)},
            ${escapeSql(wpProduct.post_excerpt)},
            ${escapeSql(wpProduct.post_name)},
            ${escapeSql(wpProduct.meta_value)},
            ${escapeNumeric(wpProduct.meta_value, '0')},
            ${escapeNumeric(wpProduct.meta_value, '0')},
            ${escapeNumeric('', '0')},
            ${imageUrl ? escapeSql(imageUrl) : 'NULL'},
            ${escapeSql('[]')},
            true
          )
          ON CONFLICT (wp_id) DO UPDATE SET
            name = EXCLUDED.name,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            short_description = EXCLUDED.short_description,
            slug = EXCLUDED.slug,
            sku = EXCLUDED.sku,
            price = EXCLUDED.price,
            regular_price = EXCLUDED.regular_price,
            sale_price = EXCLUDED.sale_price,
            image = COALESCE(EXCLUDED.image, products.image),
            gallery_images = EXCLUDED.gallery_images,
            is_active = EXCLUDED.is_active
          RETURNING id
        `;
        
        const productResult = await executeQuery(productSQL);
        
        if (!productResult.success || !productResult.data || productResult.data.length === 0) {
          console.warn('Product insert failed:', productResult.error);
          errorCount++;
          continue;
        }
        
        const productId = productResult.data[0].id;
        
        for (const catName of wpProduct.categories) {
          const catId = categoryMap.get(catName);
          if (catId) {
            const linkCheckResult = await executeQuery(
              `SELECT id FROM product_categories WHERE product_id = '${productId}' AND category_id = '${catId}'`
            );
            
            if (!linkCheckResult.success || !linkCheckResult.data || linkCheckResult.data.length === 0) {
              await executeQuery(
                `INSERT INTO product_categories (product_id, category_id) VALUES ('${productId}', '${catId}')`
              );
            }
          }
        }
        
        successCount++;
      } catch (error: any) {
        console.warn('Product import error:', error.message);
        errorCount++;
      }
    }
    
    console.log(`Import complete: ${successCount} success, ${errorCount} errors`);
    
    return NextResponse.json({
      success: true,
      count: successCount,
      errors: errorCount,
      message: `تم استيراد ${successCount} منتج`
    });
    
  } catch (error: any) {
    console.error('Import failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
