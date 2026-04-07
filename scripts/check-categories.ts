import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const result = await pool.query(`
    SELECT id, name, slug, taxonomy 
    FROM categories 
    ORDER BY name 
    LIMIT 20
  `);
  
  console.log('\n📋 CATEGORIES:');
  console.table(result.rows);
  
  await pool.end();
}

main();
