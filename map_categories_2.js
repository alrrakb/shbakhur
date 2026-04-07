const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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

const mappings = [
  { textPattern: "محسن مروكي بالمستكة", categories: ["البخور", "عروضنا المميزة", "عود محسن"] },
  { textPattern: "عود محسن مميز 304", categories: ["البخور", "عود محسن"] },
  { textPattern: "عود محسن مميز 305", categories: ["البخور", "عود محسن"] },
  { textPattern: "عود طبيعي محسن فاخر", categories: ["البخور", "عود محسن"] },
  { textPattern: "معطر نوع 112", categories: ["البخور", "عود معطر"] },
  { textPattern: "معطر نوع 113", categories: ["البخور", "عود معطر"] },
  { textPattern: "معطر نوع 114", categories: ["البخور", "عود معطر"] },
  { textPattern: "معطر نوع 115", categories: ["البخور", "عود معطر"] },
  { textPattern: "معطر نوع 116", categories: ["البخور", "عود معطر"] },
  { textPattern: "مجسم سفينة كبيرة", categories: ["ملحقات البخور"] },
  { textPattern: "حقيبة البخور", categories: ["البخور", "عروضنا المميزة", "ملحقات البخور"] },
  { textPattern: "ديور اوم انتنس", categories: ["العطور", "عطور ديور"] },
  { textPattern: "بانكا شبيه بنتيناك", categories: ["البخور", "عود طبيعي"] },
  { textPattern: "مروكي حي اسقون", categories: ["البخور", "عود طبيعي"] },
  { textPattern: "سومطري بلس 113", categories: ["البخور", "عود طبيعي"] },
  { textPattern: "كلمنتانا فاخر شرايح", categories: ["البخور", "عود طبيعي"] },
  { textPattern: "عود بابوه سوبر", categories: ["البخور", "عود طبيعي"] },
  { textPattern: "طبيعي فاخر 118", categories: ["البخور", "عود طبيعي"] },
  { textPattern: "سفينة كمنظر من العود", categories: ["ملحقات البخور"] },
  { textPattern: "مبخرة مصنوعة من العود", categories: ["ملحقات البخور"] }
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
    const mapping = mappings.find(m => product.title.includes(m.textPattern));
    
    if (mapping) {
      console.log(`\nMatched product: ${product.title}`);
      const categoryNames = mapping.categories;
      console.log(`=> Assigning: ${categoryNames.join(', ')}`);

      const categoryIds = categoryNames.map(cn => {
        const cat = dbCategories.find(c => c.name.trim() === cn.trim());
        if (!cat) console.warn(`   WARNING: Category not found in DB: ${cn}`);
        return cat?.id;
      }).filter(Boolean);

      // We should only insert, but to prevent duplicates, delete existing specific ties if needed.
      // Wait, deleting all might wipe something from batch 1 IF it matched again, but these are unique patterns.
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
    }
  }

  console.log(`\nDone. Updated ${updatesCount} products.`);
}

run();
