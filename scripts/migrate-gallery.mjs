import { createClient } from '@supabase/supabase-js';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_Service_role_key;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'media';
const WP_UPLOADS_DIR = 'C:\\xampp\\htdocs\\my-store\\wp-content\\uploads';

// WP config
const WP_DB_HOST = process.env.WP_DB_HOST || '127.0.0.1';
const WP_DB_USER = process.env.WP_DB_USER || 'root';
const WP_DB_PASS = process.env.WP_DB_PASS || '';
const WP_DB_NAME = process.env.WP_DB_NAME || 'store_db';

function getLocalFilePath(url) {
  if (!url || !url.includes('wp-content/uploads/')) return null;
  const relativePath = url.split('wp-content/uploads/')[1];
  return path.join(WP_UPLOADS_DIR, relativePath.split('?')[0]);
}

async function uploadFile(localPath, storagePath) {
  if (!fs.existsSync(localPath)) {
    console.warn(`File not found locally: ${localPath}`);
    return null;
  }
  
  const fileBuffer = fs.readFileSync(localPath);
  const ext = path.extname(localPath).toLowerCase();
  let contentType = 'image/jpeg';
  if (ext === '.png') contentType = 'image/png';
  if (ext === '.svg') contentType = 'image/svg+xml';
  if (ext === '.webp') contentType = 'image/webp';
  if (ext === '.gif') contentType = 'image/gif';

  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, fileBuffer, {
    contentType,
    upsert: true
  });

  if (error) {
    console.error(`Upload error for ${storagePath}:`, error.message);
    return null;
  }
  
  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  return publicUrlData.publicUrl;
}

async function run() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: WP_DB_HOST,
      user: WP_DB_USER,
      password: WP_DB_PASS,
      database: WP_DB_NAME,
    });
    console.log('Connected to MySQL');

    await connection.query('SET NAMES utf8mb4');

    const [wpRows] = await connection.query(`
      SELECT
        p.ID as wp_id,
        COALESCE(pm_gallery.meta_value, '') as gallery_meta
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm_gallery
        ON p.ID = pm_gallery.post_id AND pm_gallery.meta_key = '_product_image_gallery'
      WHERE p.post_type = 'product' AND p.post_status = 'publish'
      ORDER BY p.ID DESC
    `);

    const rows = wpRows;
    console.log(`Found ${rows.length} products in WordPress`);

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        const wpId = row.wp_id;

        const { data: supaProducts, error: findError } = await supabase
          .from('products')
          .select('id, gallery_images')
          .eq('wp_id', wpId)
          .single();

        if (findError || !supaProducts) {
          skippedCount++;
          continue;
        }

        const productId = supaProducts.id;

        const galleryMetaRaw = row.gallery_meta || '';
        const galleryIds = galleryMetaRaw
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !isNaN(Number(s)));

        if (galleryIds.length === 0) {
          skippedCount++;
          continue;
        }

        const placeholders = galleryIds.map(() => '?').join(',');
        const [attachRows] = await connection.query(
          `SELECT ID, guid FROM wp_posts WHERE ID IN (${placeholders}) AND post_type = 'attachment'`,
          galleryIds
        );

        if (attachRows.length === 0) {
          skippedCount++;
          continue;
        }

        const uploadedUrls = [];
        for (const att of attachRows) {
          if (!att.guid) continue;
          
          const localPath = getLocalFilePath(att.guid);
          if (localPath) {
             const ext = path.extname(localPath).toLowerCase();
             // Use attachment ID to avoid Arabic character "Invalid key" errors in Supabase storage
             const filename = `gallery/${productId}_wp_${att.ID}${ext}`;
             const uploadedUrl = await uploadFile(localPath, filename);
             if (uploadedUrl) {
               uploadedUrls.push(uploadedUrl);
             }
          }
        }

        if (uploadedUrls.length === 0) {
          skippedCount++;
          continue;
        }

        // We OVERWRITE the gallery images to remove previous run's duplicates
        // and broken localhost images.
        const mergedGallery = uploadedUrls;

        const { error: updateError } = await supabase
          .from('products')
          .update({ gallery_images: mergedGallery })
          .eq('id', productId);

        if (updateError) {
          console.warn(`Failed to update product ${productId}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✓ Updated product ${productId} with ${uploadedUrls.length} gallery images`);
          successCount++;
        }
      } catch (err) {
        console.warn('Row error:', err.message);
        errorCount++;
      }
    }

    console.log(`Finished: ${successCount} updated, ${skippedCount} skipped, ${errorCount} errors.`);
  } catch (error) {
    console.error('Gallery import failed:', error);
  } finally {
    if (connection) await connection.end();
  }
}

run();
