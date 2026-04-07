import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function execute(sql: string) {
  console.log(`\n📋 ${sql.substring(0, 60)}...`);
  try {
    const result = await pool.query(sql);
    console.log('✅ Success');
    return result;
  } catch (error: any) {
    console.log('⚠️  ' + error.message);
  }
}

async function main() {
  console.log('🗄️  Updating schema...\n');

  await execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS name TEXT`);
  await execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT`);
  await execute(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS taxonomy TEXT`);

  await execute(`ALTER TABLE products ADD COLUMN IF NOT EXISTS wp_id TEXT`);
  await execute(`ALTER TABLE products ADD COLUMN IF NOT EXISTS title TEXT`);
  await execute(`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT`);
  await execute(`ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT`);
  await execute(`ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT`);
  await execute(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT`);
  await execute(`ALTER TABLE products ADD COLUMN IF NOT EXISTS regular_price TEXT`);
  await execute(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price TEXT`);
  await execute(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT`);
  await execute(`ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb`);

  await execute(`CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    category_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await execute(`ALTER TABLE products ADD CONSTRAINT products_wp_id_unique UNIQUE (wp_id)`);

  console.log('\n✅ Schema updated successfully!');
  
  await pool.end();
}

main();
