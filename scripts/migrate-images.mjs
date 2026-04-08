import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Load keys from .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_Service_role_key;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'media';
const WP_UPLOADS_DIR = 'C:\\xampp\\htdocs\\my-store\\wp-content\\uploads';

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  
  if (!buckets.find(b => b.name === BUCKET_NAME)) {
    console.log(`Creating bucket ${BUCKET_NAME}...`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
    });
    if (createError) throw createError;
    console.log(`Bucket ${BUCKET_NAME} created successfully.`);
  } else {
    console.log(`Bucket ${BUCKET_NAME} already exists.`);
  }
}

function getLocalFilePath(url) {
  if (!url || !url.includes('localhost/my-store/wp-content/uploads/')) return null;
  const relativePath = url.split('wp-content/uploads/')[1];
  return path.join(WP_UPLOADS_DIR, relativePath.split('?')[0]);
}

async function uploadFile(localPath, storagePath) {
  if (!fs.existsSync(localPath)) {
    console.error(`File not found locally: ${localPath}`);
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

async function migrateSiteSettings() {
  console.log('Migrating site_logo...');
  const { data: logos, error: logoError } = await supabase.from('site_logo').select('*');
  if (!logoError && logos?.length > 0) {
    for (const row of logos) {
      if (row.logo_url && row.logo_url.includes('localhost/my-store')) {
        const localPath = getLocalFilePath(row.logo_url);
        if (localPath) {
          const newUrl = await uploadFile(localPath, `logos/${path.basename(localPath)}`);
          if (newUrl) {
            console.log(`Updating site_logo id: ${row.id}`);
            await supabase.from('site_logo').update({ logo_url: newUrl }).eq('id', row.id);
          }
        }
      }
    }
  }

  console.log('Migrating hero_slides...');
  const { data: slides, error: slideError } = await supabase.from('hero_slides').select('*');
  if (!slideError && slides?.length > 0) {
    for (const slide of slides) {
      if (slide.image_url && slide.image_url.includes('localhost/my-store')) {
        const localPath = getLocalFilePath(slide.image_url);
        if (localPath) {
          const newUrl = await uploadFile(localPath, `hero_slides/${path.basename(localPath)}`);
          if (newUrl) {
            console.log(`Updating hero_slide id: ${slide.id}`);
            await supabase.from('hero_slides').update({ image_url: newUrl }).eq('id', slide.id);
          }
        }
      }
    }
  }

  console.log('Migrating partners...');
  const { data: partners, error: partError } = await supabase.from('partners').select('*');
  if (!partError && partners?.length > 0) {
    for (const partner of partners) {
      if (partner.logo_url && partner.logo_url.includes('localhost/my-store')) {
        const localPath = getLocalFilePath(partner.logo_url);
        if (localPath) {
          const newUrl = await uploadFile(localPath, `partners/${path.basename(localPath)}`);
          if (newUrl) {
            console.log(`Updating partner id: ${partner.id}`);
            await supabase.from('partners').update({ logo_url: newUrl }).eq('id', partner.id);
          }
        }
      }
    }
  }
}

async function migrateProducts() {
  console.log('Migrating products images...');
  const { data: products, error } = await supabase.from('products').select('*');
  if (error) throw error;

  for (const product of products) {
    if (product.image && product.image.includes('localhost/my-store')) {
      const localPath = getLocalFilePath(product.image);
      if (localPath) {
        const newUrl = await uploadFile(localPath, `products/${path.basename(localPath)}`);
        if (newUrl) {
          console.log(`Updating product ${product.id} image...`);
          await supabase.from('products').update({ image: newUrl }).eq('id', product.id);
        }
      }
    }
  }
}

async function main() {
  try {
    await ensureBucket();
    await migrateSiteSettings();
    await migrateProducts();
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

main();
