import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('🔗 Database Connection Check\n');
  
  // Check categories
  const cats = await pool.query(`SELECT id, name, slug FROM categories ORDER BY name`);
  console.log(`📁 Categories (${cats.rows.length}):`);
  cats.rows.forEach(r => console.log(`   - ${r.name} (${r.slug})`));
  
  // Check navigation links
  const nav = await pool.query(`SELECT name, link, sort_order FROM navigation_links ORDER BY sort_order`);
  console.log(`\n🧭 Navigation Links (${nav.rows.length}):`);
  nav.rows.forEach(r => console.log(`   - ${r.name} -> ${r.link}`));
  
  // Check products count
  const products = await pool.query(`SELECT COUNT(*) as cnt FROM products`);
  console.log(`\n🛍️ Products: ${products.rows[0].cnt}`);
  
  // Check product_categories links
  const links = await pool.query(`SELECT COUNT(*) as cnt FROM product_categories`);
  console.log(`🔗 Product-Category Links: ${links.rows[0].cnt}`);
  
  await pool.end();
  console.log('\n✅ All connected to database!');
}

main();
