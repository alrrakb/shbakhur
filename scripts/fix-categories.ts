import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // Update all categories to have proper slug and taxonomy
  const categories = await pool.query(`
    SELECT id, name FROM categories
  `);

  for (const cat of categories.rows) {
    const slug = cat.name.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g, '-').replace(/-+/g, '-');
    await pool.query(`
      UPDATE categories SET slug = $1, taxonomy = 'product_cat' WHERE id = $2
    `, [slug, cat.id]);
    console.log(`Updated: ${cat.name}`);
  }

  console.log('\n✅ All categories updated with slug and taxonomy!');
  await pool.end();
}

main();
