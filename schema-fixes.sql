-- =====================================================
-- SH BAKHOOR - SCHEMA FIX SQL SCRIPT
-- Run these queries in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- FIX 1: Add taxonomy column to categories table
-- =====================================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS taxonomy TEXT;

-- =====================================================
-- FIX 2: Add image column to products table
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT;

-- =====================================================
-- FIX 3: Add slug column to categories table
-- =====================================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT;

-- =====================================================
-- FIX 4: Add gallery_images column to products table
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- =====================================================
-- VERIFICATION QUERIES (Optional)
-- =====================================================
-- Check categories table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;

-- Check products table schema  
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
