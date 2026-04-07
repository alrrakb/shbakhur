import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}

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
  
  console.log(`\n📋 Executing SQL:\n${trimmedSQL.substring(0, 100)}...`);
  
  if (containsBlockedOperation(trimmedSQL)) {
    return {
      success: false,
      error: '⛔ BLOCKED: This query requires explicit approval'
    };
  }
  
  try {
    const result = await getPool().query(trimmedSQL);
    
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

export async function testConnection(): Promise<boolean> {
  try {
    const result = await getPool().query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully!');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}
