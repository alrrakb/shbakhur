import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // Check existing nav links
  const nav = await pool.query(`SELECT * FROM navigation_links ORDER BY sort_order`);
  console.log('📋 Navigation Links:');
  nav.rows.forEach(r => console.log(`  ${r.name} -> ${r.link}`));
  
  // Check categories
  const cats = await pool.query(`SELECT * FROM categories ORDER BY name`);
  console.log('\n📋 Categories:');
  cats.rows.forEach(r => console.log(`  ${r.name} (${r.slug})`));
  
  await pool.end();
}

main();
