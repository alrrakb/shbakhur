import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

interface QueryResult {
  success: boolean;
  data?: any;
  rowCount?: number | null;
  error?: string;
}

const BLOCKED_KEYWORDS = [
  'DROP TABLE',
  'DROP COLUMN',
  'ALTER TABLE DROP',
  'DELETE FROM',
  'TRUNCATE',
  'DROP DATABASE',
  'CASCADE'
];

function containsBlockedOperation(sql: string): boolean {
  const upperSQL = sql.toUpperCase().trim();
  
  const whitelistPrefixes = ['INSERT INTO', 'SELECT', 'UPDATE', 'WITH', 'ALTER TABLE ADD'];
  for (const prefix of whitelistPrefixes) {
    if (upperSQL.startsWith(prefix)) {
      return false;
    }
  }
  
  let sqlWithoutStrings = sql.replace(/'[^']*'/g, "''");
  
  const upperClean = sqlWithoutStrings.toUpperCase().trim();
  
  return BLOCKED_KEYWORDS.some(keyword => {
    const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'i');
    return regex.test(upperClean);
  });
}

export async function executeQuery(sql: string): Promise<QueryResult> {
  const trimmedSQL = sql.trim();
  
  console.log(`\n📋 Executing SQL:\n${trimmedSQL}\n`);
  
  if (containsBlockedOperation(trimmedSQL)) {
    return {
      success: false,
      error: '⛔ BLOCKED: This query requires explicit approval. The following operations are prohibited: DROP, DELETE, TRUNCATE, or ALTER TABLE DROP COLUMN'
    };
  }
  
  try {
    const result = await pool.query(trimmedSQL);
    
    return {
      success: true,
      data: result.rows,
      rowCount: result.rowCount
    };
  } catch (error: any) {
    console.error('❌ Query error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function executeSafeQuery(sql: string): Promise<QueryResult> {
  return executeQuery(sql);
}

export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connected successfully!');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].pg_version}`);
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🗄️  DB Engine - SH Bakhoor\n');
  
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  console.log('\n🚀 Executing schema fixes...\n');
  
  const result1 = await executeQuery('ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT;');
  if (result1.success) {
    console.log('✅ categories.slug column added successfully');
  } else {
    console.error('❌ Failed to add slug column:', result1.error);
  }
  
  const result2 = await executeQuery("ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;");
  if (result2.success) {
    console.log('✅ products.gallery_images column added successfully');
  } else {
    console.error('❌ Failed to add gallery_images column:', result2.error);
  }
  
  await pool.end();
  console.log('\n👋 DB Engine finished. Connection closed.');
}

main();
