import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // First show all categories
  const all = await pool.query(`SELECT id, name FROM categories ORDER BY name`);
  console.log('📋 All categories before cleanup:');
  all.rows.forEach(row => console.log(`  - ${row.name} (${row.id})`));
  
  // Delete by exact name
  const toDelete = ['أخرى', 'البخور', 'العطور'];
  for (const name of toDelete) {
    await pool.query(`DELETE FROM categories WHERE name = $1`, [name]);
  }
  
  // Get remaining duplicates
  const result = await pool.query(`
    SELECT name, COUNT(*) as cnt 
    FROM categories 
    GROUP BY name 
    HAVING COUNT(*) > 1
  `);
  
  console.log('\n📋 Duplicates:', result.rows);
  
  // Delete duplicates keeping first
  for (const dup of result.rows) {
    const ids = await pool.query(`SELECT id FROM categories WHERE name = $1 ORDER BY id LIMIT 1`, [dup.name]);
    if (ids.rows.length > 0) {
      const keepId = ids.rows[0].id;
      await pool.query(`DELETE FROM categories WHERE name = $1 AND id != $2`, [dup.name, keepId]);
    }
  }
  
  // Show final
  const final = await pool.query(`SELECT name FROM categories ORDER BY name`);
  console.log('\n📋 Final categories:');
  final.rows.forEach(row => console.log(`  - ${row.name}`));
  
  await pool.end();
}

main();
