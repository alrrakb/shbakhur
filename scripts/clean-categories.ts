import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('🧹 Cleaning up categories...\n');
  
  // Get all duplicate عود محسن IDs
  const duplicates = await pool.query(`
    SELECT id, name FROM categories WHERE name = 'عود محسن' ORDER BY id
  `);
  
  if (duplicates.rows.length > 1) {
    // Keep first, delete rest
    const keepId = duplicates.rows[0].id;
    for (let i = 1; i < duplicates.rows.length; i++) {
      await pool.query(`DELETE FROM categories WHERE id = $1`, [duplicates.rows[i].id]);
      console.log(`Deleted duplicate: عود محسن`);
    }
  }
  
  // Show remaining categories
  const result = await pool.query(`SELECT id, name FROM categories ORDER BY name`);
  console.log('\n📋 Remaining categories:');
  result.rows.forEach(row => console.log(`  - ${row.name}`));
  
  console.log('\n✅ Categories cleaned up!');
  await pool.end();
}

main();
