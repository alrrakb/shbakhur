import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function execute(sql: string) {
  console.log(`\n📋 ${sql.substring(0, 60)}...`);
  try {
    const result = await pool.query(sql);
    console.log('✅ Success');
    return result;
  } catch (error: any) {
    console.log('⚠️  ' + error.message);
  }
}

async function main() {
  console.log('🗄️  Quick schema fix for trial...\n');

  await execute(`ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT`);

  console.log('\n✅ Schema fixed for trial!');
  
  await pool.end();
}

main();
