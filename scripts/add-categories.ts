import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // Categories to add (the ones user wants)
  const categoriesToAdd = [
    'عروضنا المميزة',
    'عطور توم فورد',
    'عطور جوتشي',
    'عطور جوشي',
    'عطور ديور',
    'عود طبيعي',
    'عود محسن',
    'عود معطر',
    'ملحقات البخور'
  ];

  // Check what exists
  const existing = await pool.query(`SELECT name FROM categories`);
  const existingNames = existing.rows.map(r => r.name);
  
  console.log('Existing:', existingNames);

  // Add missing ones
  for (const name of categoriesToAdd) {
    if (!existingNames.includes(name)) {
      const slug = name.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g, '-');
      await pool.query(
        `INSERT INTO categories (name, slug, taxonomy) VALUES ($1, $2, 'product_cat')`,
        [name, slug]
      );
      console.log(`Added: ${name}`);
    }
  }

  // Show final
  const final = await pool.query(`SELECT name FROM categories ORDER BY name`);
  console.log('\n📋 Final categories:');
  final.rows.forEach(row => console.log(`  - ${row.name}`));
  
  await pool.end();
}

main();
