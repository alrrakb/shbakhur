import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Category Mapping Dictionary with flexible matching
const MAIN_CATEGORY_CODES: Record<string, string> = {
  'بخور': 'BK',
  'bakhoor': 'BK',
  'Bakhoor': 'BK',
  'العطور': 'PF',
  'عطور': 'PF',
  'perfumes': 'PF',
  'Perfumes': 'PF',
};

const SUB_CATEGORY_CODES: Record<string, string> = {
  // Bakhoor sub-categories (with and without "عود" prefix)
  'عود طبيعي': 'NO',
  'طبيعي': 'NO',
  'محسن': 'EN',
  'عود محسن': 'EN',
  'دهن العود': 'OO',
  'دهن': 'OO',
  'عود معطر': 'SO',
  'معطر': 'SO',
  'اكسسوارات البخور': 'AC',
  'اكسسوارات': 'AC',
  // Perfume sub-categories (flexible matching)
  'عطور ايف سان لوريان': 'YSL',
  'ايف سان لوريان': 'YSL',
  'YSL': 'YSL',
  'عطور ديور': 'DR',
  'ديور': 'DR',
  'Dior': 'DR',
  'عطور جوتشي': 'GC',
  'جوتشي': 'GC',
  'Gucci': 'GC',
  'عطور توم فورد': 'TF',
  'توم فورد': 'TF',
  'Tom Ford': 'TF',
};

const FALLBACK_SUB_CODE = 'GN';

interface ProductWithCategories {
  id: string | number;
  title: string;
  sku: string | null;
  categories: {
    id: string;
    name: string;
    parent_id: string | null;
  }[];
}

function getCategoryCodes(categories: ProductWithCategories['categories']) {
  let mainCode = '';
  let subCode = '';

  // Helper to find matching code with flexible matching
  const findMainCode = (name: string): string => {
    const normalized = name.toLowerCase().trim();
    // Exact match first
    if (MAIN_CATEGORY_CODES[name]) return MAIN_CATEGORY_CODES[name];
    // Contains match
    for (const [key, code] of Object.entries(MAIN_CATEGORY_CODES)) {
      if (normalized.includes(key.toLowerCase())) return code;
    }
    return '';
  };

  const findSubCode = (name: string): string => {
    const normalized = name.toLowerCase().trim();
    // Exact match first
    if (SUB_CATEGORY_CODES[name]) return SUB_CATEGORY_CODES[name];
    // Contains match - check if category name contains our key
    for (const [key, code] of Object.entries(SUB_CATEGORY_CODES)) {
      if (normalized.includes(key.toLowerCase())) return code;
    }
    return '';
  };

  // First, try to find a main category (parent_id is null)
  const mainCategory = categories.find(c => c.parent_id === null);
  
  if (mainCategory) {
    mainCode = findMainCode(mainCategory.name);
    
    // Find sub-categories of this main category
    const subCategories = categories.filter(c => c.parent_id === mainCategory.id);
    
    if (subCategories.length > 0) {
      // Use the first sub-category that matches our mapping
      for (const sub of subCategories) {
        const matchedCode = findSubCode(sub.name);
        if (matchedCode) {
          subCode = matchedCode;
          break;
        }
      }
    }
  }

  // If no main category found or no sub-code found, check all categories
  if (!mainCode || !subCode) {
    for (const cat of categories) {
      // Try to find main code
      if (!mainCode) {
        mainCode = findMainCode(cat.name);
      }
      
      // Try to find sub code
      if (!subCode) {
        const matchedSubCode = findSubCode(cat.name);
        if (matchedSubCode) {
          subCode = matchedSubCode;
          // Infer main category from sub-category if not found
          if (!mainCode) {
            if (['NO', 'EN', 'OO', 'SO', 'AC'].includes(matchedSubCode)) {
              mainCode = 'BK';
            } else if (['YSL', 'DR', 'GC', 'TF'].includes(matchedSubCode)) {
              mainCode = 'PF';
            }
          }
        }
      }
    }
  }

  // Fallback codes
  if (!mainCode) mainCode = 'XX';
  if (!subCode) subCode = FALLBACK_SUB_CODE;

  return { mainCode, subCode };
}

function generate4DigitSuffix(id: string | number): string {
  if (typeof id === 'number') {
    return id.toString().padStart(4, '0');
  }
  
  // For UUID strings, take the last 4 hex chars and convert to 4-digit number
  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  // We use the last 4 characters which are hexadecimal
  const last4 = id.slice(-4);
  const numeric = parseInt(last4, 16) % 10000; // Convert hex to decimal and ensure 4 digits
  return numeric.toString().padStart(4, '0');
}

function generateSku(product: ProductWithCategories): string {
  const { mainCode, subCode } = getCategoryCodes(product.categories);
  
  // Generate 4-digit numeric suffix from product ID
  const suffix = generate4DigitSuffix(product.id);
  
  return `SH-${mainCode}-${subCode}-${suffix}`;
}

async function updateSkus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_Service_role_key || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Check your .env file.');
    process.exit(1);
  }

  console.log('🔗 Connecting to Supabase...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all products with their categories
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      title,
      sku,
      product_categories(
        categories(
          id,
          name,
          parent_id
        )
      )
    `)
    .order('id');

  if (error) {
    console.error('❌ Error fetching products:', error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('⚠️ No products found in database.');
    return;
  }

  const DRY_RUN = false; // 🔓 SAFETY LOCK REMOVED - PERFORMING ACTUAL UPDATES

  console.log(`📦 Found ${products.length} products\n`);
  console.log('=' .repeat(80));
  if (DRY_RUN) {
    console.log('🧪 DRY RUN: Proposed SKU Updates');
  } else {
    console.log('🔥 LIVE UPDATE: Updating SKUs in Database');
  }
  console.log('=' .repeat(80));
  console.log();

  const productsWithCategories: ProductWithCategories[] = products.map((p: any) => ({
    id: p.id,
    title: p.title,
    sku: p.sku,
    categories: (p.product_categories || [])
      .map((pc: any) => pc.categories)
      .filter(Boolean),
  }));

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const product of productsWithCategories) {
    const newSku = generateSku(product);
    const categoryNames = product.categories.map(c => c.name).join(', ') || 'No categories';
    
    console.log(`📝 Product #${product.id}`);
    console.log(`   Name:  ${product.title}`);
    console.log(`   Categories: ${categoryNames}`);
    console.log(`   Current SKU: ${product.sku || '(none)'}`);
    console.log(`   ✅ New SKU:   ${newSku}`);
    
    if (product.sku === newSku) {
      console.log(`   ⚠️  SKU already matches - skipped`);
      skippedCount++;
    } else if (DRY_RUN) {
      console.log(`   ⏸️  Would update (dry run)`);
      updatedCount++;
    } else {
      // 🔥 PERFORM ACTUAL UPDATE
      try {
        const { error: updateError } = await supabase
          .from('products')
          .update({ sku: newSku })
          .eq('id', product.id);

        if (updateError) {
          console.log(`   ❌ Update failed: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Updated successfully!`);
          updatedCount++;
        }
      } catch (err: any) {
        console.log(`   ❌ Exception: ${err.message}`);
        errorCount++;
      }
    }
    console.log();
  }

  console.log('=' .repeat(80));
  console.log('📊 FINAL SUMMARY:');
  console.log(`   Total products: ${products.length}`);
  console.log(`   ✅ Successfully updated: ${updatedCount}`);
  console.log(`   ⏭️  Skipped (already correct): ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log();
  
  if (DRY_RUN) {
    console.log('🔒 DRY RUN MODE: No changes were made to the database.');
  } else {
    console.log('🔥 LIVE UPDATE COMPLETE: Database has been modified.');
  }
  console.log('=' .repeat(80));
}

// Run the update
updateSkus().catch(console.error);
