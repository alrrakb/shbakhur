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

function optimizeSlug(title) {
  // Try to extract a core meaningful name without the price details in parenthesis
  let optimized = title;
  
  // Remove anything in parenthesis like (سعر الربع كيلو 250 جرام)
  optimized = optimized.replace(/\([^)]+\)/g, '');
  
  // Remove numbers that look like types if they are dangling, or keep them if they are product codes like 113. 
  // We'll keep numbers, but just clean the text and arabic/english
  optimized = optimized.toLowerCase();
  optimized = optimized.replace(/[^a-z0-9\u0600-\u06FF]/g, '-');
  optimized = optimized.replace(/-+/g, '-');
  optimized = optimized.replace(/^-|-$/g, '');
  
  return optimized;
}

async function fixSlugs() {
  console.log('Fetching products...');
  const { data: products, error } = await supabase.from('products').select('id, title, slug');
  
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  console.log(`Found ${products.length} products. Scanning for encoded/messy slugs...`);
  
  for (const p of products) {
    // If slug contains '%' it's URL encoded. We decode it and optimize it.
    if (p.slug.includes('%')) {
      const decoded = decodeURIComponent(p.slug);
      let newSlug = optimizeSlug(p.title);
      
      console.log(`\nTitle: ${p.title}`);
      console.log(`Old Slug: ${p.slug}`);
      console.log(`Decoded:  ${decoded}`);
      console.log(`New Slug: ${newSlug}`);
      
      const { error: updateError } = await supabase.from('products').update({ slug: newSlug }).eq('id', p.id);
      if (updateError) {
        console.error('Failed to update:', updateError);
      } else {
        console.log('SUCCESS');
      }
    }
  }
  
  console.log('\nFinished updating slugs!');
}

fixSlugs();
