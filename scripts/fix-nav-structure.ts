import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('🔧 Fixing navigation structure...\n');
  
  // Clear all navigation links
  await pool.query(`DELETE FROM navigation_links`);
  
  // Get categories
  const cats = await pool.query(`SELECT name, slug FROM categories ORDER BY name`);
  
  // Define main navigation structure
  const mainNav = [
    { name: 'الرئيسية', link: '/', has_dropdown: false, sort_order: 1 },
    { name: 'جميع المنتجات', link: '/products', has_dropdown: false, sort_order: 2 },
    { name: 'عروضنا المميزة', link: '/products/sale', has_dropdown: false, sort_order: 3 },
    { name: 'الاكثر مبيعا', link: '/products/best-sellers', has_dropdown: false, sort_order: 4 },
  ];
  
  // عطور dropdown
  const perfumeCats = cats.rows.filter(c => 
    c.name.includes('عطور') || c.name.includes('توم') || c.name.includes('جوتشي') || c.name.includes('ديور') || c.name.includes('جوشي')
  );
  
  const perfumeDropdown = perfumeCats.map(c => ({
    name: c.name,
    href: `/products/${c.slug}`
  }));
  
  const perfumeNav = {
    name: 'العطور',
    link: '/products/perfumes',
    has_dropdown: true,
    dropdown_items: perfumeDropdown,
    sort_order: 5
  };
  
  // بخور dropdown
  const oudCats = cats.rows.filter(c => 
    c.name.includes('عود') || c.name.includes('بخور') || c.name.includes('ملحقات')
  );
  
  const oudDropdown = oudCats.map(c => ({
    name: c.name,
    href: `/products/${c.slug}`
  }));
  
  const oudNav = {
    name: 'البخور والعود',
    link: '/products/bakhour',
    has_dropdown: true,
    dropdown_items: oudDropdown,
    sort_order: 6
  };
  
  // Insert main navigation
  for (const nav of mainNav) {
    await pool.query(
      `INSERT INTO navigation_links (name, link, has_dropdown, dropdown_items, sort_order) VALUES ($1, $2, $3, '[]', $4)`,
      [nav.name, nav.link, nav.has_dropdown, nav.sort_order]
    );
  }
  
  // Insert perfume dropdown
  await pool.query(
    `INSERT INTO navigation_links (name, link, has_dropdown, dropdown_items, sort_order) VALUES ($1, $2, $3, $4, $5)`,
    [perfumeNav.name, perfumeNav.link, perfumeNav.has_dropdown, JSON.stringify(perfumeNav.dropdown_items), perfumeNav.sort_order]
  );
  
  // Insert oud dropdown
  await pool.query(
    `INSERT INTO navigation_links (name, link, has_dropdown, dropdown_items, sort_order) VALUES ($1, $2, $3, $4, $5)`,
    [oudNav.name, oudNav.link, oudNav.has_dropdown, JSON.stringify(oudNav.dropdown_items), oudNav.sort_order]
  );
  
  console.log('✅ Navigation structure fixed!\n');
  
  // Show final navigation
  const nav = await pool.query(`SELECT name, link, has_dropdown, sort_order FROM navigation_links ORDER BY sort_order`);
  console.log('📋 Final Navigation:');
  nav.rows.forEach(r => {
    console.log(`  ${r.sort_order}. ${r.name} -> ${r.link} ${r.has_dropdown ? '(dropdown)' : ''}`);
  });
  
  await pool.end();
}

main();
