import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('🔧 Fixing schema...\n');
  
  await pool.query(`ALTER TABLE products ALTER COLUMN price DROP NOT NULL`);
  console.log('✅ Made price nullable');
  
  await pool.query(`ALTER TABLE products ALTER COLUMN stock_quantity DROP NOT NULL`);
  console.log('✅ Made stock_quantity nullable');
  
  await pool.query(`ALTER TABLE products ALTER COLUMN name DROP NOT NULL`);
  console.log('✅ Made name nullable');
  
  console.log('\n✅ Schema fixed!');
  await pool.end();
}

main();
