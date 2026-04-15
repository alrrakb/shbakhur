/**
 * Admin Setup Script
 * Run this script ONCE to create the first admin account
 * 
 * Usage: npx ts-node scripts/create-admin.ts
 * Or:    npx tsx scripts/create-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('==============================================');
  console.log('  SH للبخور - إنشاء حساب المسؤول الأول');
  console.log('==============================================\n');

  const supabaseUrl = "https://tcmohnvzuguerxgcppus.supabase.co";
  const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjbW9obnZ6dWd1ZXJ4Z2NwcHVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg5MDQ3MywiZXhwIjoyMDc0NDY2NDczfQ.3i6SJD5jv8uk9IctgjKLpCDOOVWyqmUvnvv0q0XWYBc";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing environment variables!');
    console.error('Make sure you have:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_Service_role_key');
    process.exit(1);
  }

  // Use service role key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Get admin credentials
  const email = await question('📧 Admin Email: ');
  const password = await question('🔑 Admin Password (min 6 chars): ');
  const confirmPassword = await question('🔑 Confirm Password: ');

  if (password !== confirmPassword) {
    console.error('❌ Error: Passwords do not match!');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ Error: Password must be at least 6 characters!');
    process.exit(1);
  }

  console.log('\n🔄 Creating admin account...\n');

  try {
    // Create the user
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'admin',
      },
    });

    if (createError) {
      console.error('❌ Failed to create admin:', createError.message);
      process.exit(1);
    }

    console.log('✅ Admin account created successfully!');
    console.log('\n📋 Admin Details:');
    console.log(`   Email: ${email}`);
    console.log(`   User ID: ${user.user?.id}`);
    console.log(`   Role: admin`);
    
    console.log('\n⚠️  IMPORTANT NEXT STEPS:');
    console.log('==============================================');
    console.log('1. ✅ Admin account created');
    console.log('2. ➡️  Go to Supabase Dashboard > Authentication');
    console.log('3. ➡️  Disable "Enable new signups" to prevent public registration');
    console.log('4. ➡️  You can now login at: /login');
    console.log('==============================================\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
