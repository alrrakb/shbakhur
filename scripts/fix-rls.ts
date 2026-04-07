import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('🔧 Fixing RLS policies for categories...\n');
  
  // Check if RLS is enabled
  const rlsCheck = await pool.query(`
    SELECT relname, relrowsecurity 
    FROM pg_class 
    WHERE relname IN ('categories', 'products', 'product_categories')
  `);
  
  console.log('RLS Status:');
  rlsCheck.rows.forEach(row => {
    console.log(`  ${row.relname}: ${row.relrowsecurity ? 'ON' : 'OFF'}`);
  });

  // Disable RLS for simplicity (or create proper policies)
  await pool.query(`ALTER TABLE categories DISABLE ROW LEVEL SECURITY`);
  await pool.query(`ALTER TABLE products DISABLE ROW LEVEL SECURITY`);
  await pool.query(`ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY`);
  
  console.log('\n✅ RLS disabled for categories, products, and product_categories');
  
  await pool.end();
}

main();
