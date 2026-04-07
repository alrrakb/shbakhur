import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('🔧 Setting up navigation and categories...\n');
  
  // Create navigation_links table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS navigation_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      link TEXT,
      has_dropdown BOOLEAN DEFAULT false,
      dropdown_items JSONB DEFAULT '[]',
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ Created navigation_links table');
  
  // Clear existing nav links
  await pool.query(`DELETE FROM navigation_links`);
  
  // Get categories
  const cats = await pool.query(`SELECT * FROM categories ORDER BY name`);
  
  // Navigation structure:
  // 1. الرئيسية -> /
  // 2. جميع المنتجات -> /products
  // 3. عروضنا المميزة -> /products/sale (special category)
  // 4. العطور (dropdown) -> /products/perfumes
  // 5. البخور (dropdown) -> /products/bakhour
  
  const navLinks = [
    {
      name: 'الرئيسية',
      link: '/',
      has_dropdown: false,
      dropdown_items: [],
      sort_order: 1
    },
    {
      name: 'جميع المنتجات',
      link: '/products',
      has_dropdown: false,
      dropdown_items: [],
      sort_order: 2
    },
    {
      name: 'عروضنا المميزة',
      link: '/products/sale',
      has_dropdown: false,
      dropdown_items: [],
      sort_order: 3
    },
    {
      name: 'العطور',
      link: '/products/perfumes',
      has_dropdown: true,
      dropdown_items: [
        { name: 'عطور توم فورد', href: '/products/tom-ford' },
        { name: 'عطور جوتشي', href: '/products/gucci' },
        { name: 'عطور جوشي', href: '/products/gucci' },
        { name: 'عطور ديور', href: '/products/dior' }
      ],
      sort_order: 4
    },
    {
      name: 'البخور والعود',
      link: '/products/bakhour',
      has_dropdown: true,
      dropdown_items: [
        { name: 'عود طبيعي', href: '/products/ouud-natural' },
        { name: 'عود محسن', href: '/products/ouud-enhanced' },
        { name: 'عود معطر', href: '/products/ouud-perfumed' },
        { name: 'ملحقات البخور', href: '/products/bakhour-accessories' }
      ],
      sort_order: 5
    }
  ];
  
  for (const nav of navLinks) {
    await pool.query(
      `INSERT INTO navigation_links (name, link, has_dropdown, dropdown_items, sort_order) VALUES ($1, $2, $3, $4, $5)`,
      [nav.name, nav.link, nav.has_dropdown, JSON.stringify(nav.dropdown_items), nav.sort_order]
    );
    console.log(`✅ Added nav: ${nav.name}`);
  }
  
  // Add special category links
  const categoryLinks = [
    { name: 'عطور توم فورد', link: '/products/tom-ford', sort_order: 10 },
    { name: 'عطور جوتشي', link: '/products/gucci', sort_order: 11 },
    { name: 'عطور ديور', link: '/products/dior', sort_order: 12 },
    { name: 'عود طبيعي', link: '/products/ouud-natural', sort_order: 13 },
    { name: 'عود محسن', link: '/products/ouud-enhanced', sort_order: 14 },
    { name: 'عود معطر', link: '/products/ouud-perfumed', sort_order: 15 },
    { name: 'ملحقات البخور', link: '/products/bakhour-accessories', sort_order: 16 },
  ];
  
  for (const cat of categoryLinks) {
    await pool.query(
      `INSERT INTO navigation_links (name, link, has_dropdown, dropdown_items, sort_order) VALUES ($1, $2, $3, $4, $5)`,
      [cat.name, cat.link, false, [], cat.sort_order]
    );
    console.log(`✅ Added category nav: ${cat.name}`);
  }
  
  // Show final nav links
  const final = await pool.query(`SELECT name, link, sort_order FROM navigation_links ORDER BY sort_order`);
  console.log('\n📋 Final Navigation:');
  final.rows.forEach(r => console.log(`  ${r.sort_order}. ${r.name} -> ${r.link}`));
  
  await pool.end();
}

main();
