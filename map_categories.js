const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env file
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    env[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Data from user request
const mappings = [
  { textPattern: "مون باريس انتنسمنت", categories: ["العطور"] },
  { textPattern: "توم فورد بلاك اوركيد", categories: ["العطور", "عطور توم فورد"] },
  { textPattern: "روبرتو كفالي خط اخضر", categories: ["العطور"] },
  { textPattern: "الحياة حلوة لافي إي بيل", categories: ["العطور"] },
  { textPattern: "ديور بلومينج بوكيت", categories: ["العطور", "عطور ديور"] },
  { textPattern: "غوتشي بلوم", categories: ["العطور", "عروضنا المميزة", "عطور جوتشي"] },
  { textPattern: "ليبر انتنس او دو بارفيوم", categories: ["العطور"] },
  { textPattern: "عود اصفهان او دو بارفيوم", categories: ["العطور", "عطور ديور"] },
  { textPattern: "العود الأزرق 302", categories: ["البخور", "عود محسن"] },
  { textPattern: "عود طبيعي 124قطع صغيرة", categories: ["البخور", "عود طبيعي"] },
  { textPattern: "بونتياناك دبل سوبر 115", categories: ["البخور", "عود طبيعي"] },
  { textPattern: "سومطري فاخر سوبر 116", categories: ["البخور", "عود طبيعي"] },
  { textPattern: "سومطري سوبر 111 ثقيل", categories: ["البخور", "عود طبيعي"] },
  { textPattern: "كلمنتانا طبيعي سوبر 120", categories: ["البخور", "عود طبيعي"] },
  { textPattern: "كلمنتانا  فاخر 114", categories: ["البخور", "عود طبيعي"] },
  { textPattern: "كلمنتانا فاخر 114", categories: ["البخور", "عود طبيعي"] },
  { textPattern: "عود محسن B101", categories: ["البخور", "عروضنا المميزة", "عود محسن"] },
  { textPattern: "أوقية عود محسن 305", categories: ["البخور", "عود محسن"] },
  { textPattern: "أوقية محسن بيت النمل 306", categories: ["البخور", "عود محسن"] },
  { textPattern: "عود محسن فاخر", categories: ["البخور", "عروضنا المميزة", "عود محسن"] }, // Need to be exact since there's multiple
  { textPattern: "أوقية عود محسن فاخر 301", categories: ["البخور", "عروضنا المميزة", "عود محسن"] }
];

async function run() {
  console.log('Fetching store data...');
  const { data: dbCategories, error: catErr } = await supabase.from('categories').select('id, name');
  if (catErr) { console.error(catErr); return; }

  const { data: products, error: prodErr } = await supabase.from('products').select('id, title');
  if (prodErr) { console.error(prodErr); return; }

  console.log(`Found ${products.length} products and ${dbCategories.length} categories.`);

  let updatesCount = 0;

  for (const product of products) {
    // Find the matching item
    const mapping = mappings.find(m => product.title.includes(m.textPattern));
    
    if (mapping) {
      console.log(`\nMatched product: ${product.title}`);
      const categoryNames = mapping.categories;
      console.log(`=> Assigning: ${categoryNames.join(', ')}`);

      // Resolve IDs
      const categoryIds = categoryNames.map(cn => {
        const cat = dbCategories.find(c => c.name.trim() === cn.trim());
        if (!cat) console.warn(`   WARNING: Category not found in DB: ${cn}`);
        return cat?.id;
      }).filter(Boolean);

      // We should insert into product_categories table
      // First delete existing ties for safety
      await supabase.from('product_categories').delete().eq('product_id', product.id);
      
      const inserts = categoryIds.map(cid => ({
        product_id: product.id,
        category_id: cid
      }));

      if (inserts.length > 0) {
         const { error: insErr } = await supabase.from('product_categories').insert(inserts);
         if (insErr) {
           console.error(`   Failed to insert:`, insErr);
         } else {
           console.log(`   Success.`);
           updatesCount++;
         }
      }
    } else {
      // Special logic: If product title is exactly "عود طبيعي محسن فاخر" it might clash with "عود محسن فاخر"
      if (product.title === "عود طبيعي محسن فاخر") {
         // Not in the explicit list but let's see. 
      }
    }
  }

  console.log(`\nDone. Updated ${updatesCount} products.`);
}

run();
