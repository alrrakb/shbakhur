import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_Service_role_key!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const WP_DB_HOST = process.env.WP_DB_HOST || 'localhost';
const WP_DB_USER = process.env.WP_DB_USER || 'root';
const WP_DB_PASS = process.env.WP_DB_PASS || '';
const WP_DB_NAME = process.env.WP_DB_NAME || 'store_db';

async function getWpConnection() {
  const mysql = require('mysql2/promise');
  return await mysql.createConnection({
    host: WP_DB_HOST,
    user: WP_DB_USER,
    password: WP_DB_PASS,
    database: WP_DB_NAME,
  });
}

async function downloadAndUploadImage(
  imageUrl: string,
  bucket: string,
  folder: string
): Promise<string | null> {
  try {
    if (!imageUrl || !imageUrl.startsWith('http')) return null;

    const processedUrl = imageUrl.replace(/localhost/gi, '127.0.0.1');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(processedUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch image (${response.status}): ${imageUrl}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: response.headers.get('content-type') || 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.warn('Upload error:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (error: any) {
    console.warn('Image download/upload error:', error.message);
    return null;
  }
}

export async function GET() {
  const connection = await getWpConnection().catch((err) => {
    console.error('MySQL connection failed:', err.message);
    return null;
  });

  if (!connection) {
    return NextResponse.json(
      { success: false, error: 'فشل الاتصال بقاعدة بيانات WordPress' },
      { status: 500 }
    );
  }

  try {
    await connection.query('SET NAMES utf8mb4');

    // Fetch all published products with their wp_id and gallery meta
    const [wpRows] = await connection.query(`
      SELECT
        p.ID as wp_id,
        p.post_title,
        COALESCE(pm_gallery.meta_value, '') as gallery_meta,
        COALESCE(pm_thumb.meta_value, '') as thumbnail_id
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm_gallery
        ON p.ID = pm_gallery.post_id AND pm_gallery.meta_key = '_product_image_gallery'
      LEFT JOIN wp_postmeta pm_thumb
        ON p.ID = pm_thumb.post_id AND pm_thumb.meta_key = '_thumbnail_id'
      WHERE p.post_type = 'product' AND p.post_status = 'publish'
      ORDER BY p.ID DESC
    `);

    const rows = wpRows as any[];
    console.log(`Found ${rows.length} products in WordPress`);

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        const wpId = row.wp_id;

        // Find the matching product in Supabase by wp_id
        const { data: supaProducts, error: findError } = await supabase
          .from('products')
          .select('id, gallery_images')
          .eq('wp_id', wpId)
          .single();

        if (findError || !supaProducts) {
          console.warn(`No Supabase product found for wp_id=${wpId}`);
          skippedCount++;
          continue;
        }

        const productId = supaProducts.id;

        // Parse gallery image IDs from WordPress (comma-separated attachment IDs)
        const galleryMetaRaw: string = row.gallery_meta || '';
        const galleryIds = galleryMetaRaw
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0 && !isNaN(Number(s)));

        if (galleryIds.length === 0) {
          skippedCount++;
          continue;
        }

        // Resolve attachment IDs to actual image URLs from wp_posts
        const placeholders = galleryIds.map(() => '?').join(',');
        const [attachRows] = await connection.query(
          `SELECT ID, guid FROM wp_posts WHERE ID IN (${placeholders}) AND post_type = 'attachment'`,
          galleryIds
        );

        const attachments = attachRows as { ID: number; guid: string }[];

        if (attachments.length === 0) {
          skippedCount++;
          continue;
        }

        // Upload gallery images to Supabase Storage
        const uploadedUrls: string[] = [];
        for (const att of attachments) {
          if (!att.guid) continue;
          const uploadedUrl = await downloadAndUploadImage(att.guid, 'products', 'gallery');
          if (uploadedUrl) {
            uploadedUrls.push(uploadedUrl);
          }
        }

        if (uploadedUrls.length === 0) {
          skippedCount++;
          continue;
        }

        // Merge with existing gallery (avoid duplicates by filename)
        const existingGallery: string[] = (() => {
          try {
            const raw = supaProducts.gallery_images;
            if (!raw) return [];
            if (Array.isArray(raw)) return raw as string[];
            if (typeof raw === 'string') return JSON.parse(raw);
            return [];
          } catch {
            return [];
          }
        })();

        const mergedGallery = Array.from(new Set([...existingGallery, ...uploadedUrls]));

        // Update the product in Supabase — gallery_images is JSONB, store as array directly
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
      } catch (err: any) {
        console.warn('Row error:', err.message);
        errorCount++;
      }
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      updated: successCount,
      skipped: skippedCount,
      errors: errorCount,
      message: `تم تحديث معرض الصور لـ ${successCount} منتج`,
    });
  } catch (error: any) {
    await connection.end().catch(() => {});
    console.error('Gallery import failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      },
      { status: 500 }
    );
  }
}
