import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('➕ Adding "الاكثر مبيعا" category...\n');
  
  // Add category
  const slug = 'best-sellers';
  await pool.query(
    `INSERT INTO categories (name, slug, taxonomy) VALUES ($1, $2, 'product_cat') ON CONFLICT DO NOTHING`,
    ['الاكثر مبيعا', slug]
  );
  console.log('✅ Added category: الاكثر مبيعا');
  
  // Get category ID
  const cat = await pool.query(`SELECT id FROM categories WHERE slug = $1`, [slug]);
  if (cat.rows.length > 0) {
    const catId = cat.rows[0].id;
    
    // Add navigation link
    await pool.query(`
      INSERT INTO navigation_links (name, link, has_dropdown, dropdown_items, sort_order)
      VALUES ($1, $2, false, '[]', $3)
      ON CONFLICT DO NOTHING
    `, ['الاكثر مبيعا', '/products/best-sellers', 6]);
    console.log('✅ Added navigation link: الاكثر مبيعا -> /products/best-sellers');
  }
  
  // Show final navigation
  const nav = await pool.query(`SELECT name, link, sort_order FROM navigation_links ORDER BY sort_order`);
  console.log('\n📋 Navigation:');
  nav.rows.forEach(r => console.log(`   ${r.sort_order}. ${r.name} -> ${r.link}`));
  
  await pool.end();
}

main();
