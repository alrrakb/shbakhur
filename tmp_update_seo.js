const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    // Add seo_keywords column if it doesn't exist
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
    `);
    console.log('Added seo_keywords column if needed');

    const result = await client.query('SELECT id, title, name, category, short_description, description FROM products');
    const products = result.rows;

    let count = 0;
    for (const prod of products) {
      const title = prod.title || prod.name || '';
      
      // Basic smart SEO keywords generation setup
      const baseKeywords = ['بخور', 'عود', 'عطور', 'SH للبخور'];
      const titleWords = title.split(' ').filter(w => w.length > 2);
      
      const categoryStr = (prod.category || '').toLowerCase();
      if (categoryStr.includes('عود')) baseKeywords.push('عود أصلي', 'بخور العود');
      if (categoryStr.includes('عطور')) baseKeywords.push('عطر فرنسي', 'عطر شرقي');
      if (categoryStr.includes('مبخرة')) baseKeywords.push('مباخر الذكية', 'مباخر');

      const allKeywords = [...new Set([...baseKeywords, ...titleWords])].join('، ');

      await client.query('UPDATE products SET seo_keywords = $1 WHERE id = $2', [allKeywords, prod.id]);
      count++;
    }

    console.log(`Updated SEO keywords for ${count} products.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
