'use server';

import { revalidatePath } from 'next/cache';
import { purgeCloudflareCache } from '@/lib/cloudflare';
import { STATIC_SITEMAP_ROUTES, CANONICAL_BASE_URL } from '@/app/sitemap';
import { createClient } from '@supabase/supabase-js';
import { saveGoogleVerificationCode, getGoogleVerificationCode } from '@/lib/seo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_Anon_key || '';

export async function revalidateSite() {
  revalidatePath('/', 'layout');
  try {
    await purgeCloudflareCache();
  } catch (err) {
    console.error('Failed to purge Cloudflare cache:', err);
  }
}

export interface SitemapStats {
  success: boolean;
  totalUrls: number;
  staticCount: number;
  productsCount: number;
  targetDomain: string;
  sitemapUrl: string;
  lastGenerated: string;
  error?: string;
}

export async function getSitemapStats(): Promise<SitemapStats> {
  const staticCount = STATIC_SITEMAP_ROUTES.length;
  let productsCount = 0;

  try {
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .neq('is_active', false);

      if (!error && typeof count === 'number') {
        productsCount = count;
      }
    }
  } catch (err) {
    console.error('Failed to query sitemap stats:', err);
  }

  return {
    success: true,
    totalUrls: staticCount + productsCount,
    staticCount,
    productsCount,
    targetDomain: CANONICAL_BASE_URL,
    sitemapUrl: `${CANONICAL_BASE_URL}/sitemap.xml`,
    lastGenerated: new Date().toISOString(),
  };
}

export async function revalidateSitemap(): Promise<SitemapStats> {
  try {
    revalidatePath('/sitemap.xml');
    revalidatePath('/robots.txt');

    try {
      await purgeCloudflareCache([
        `${CANONICAL_BASE_URL}/sitemap.xml`,
        `${CANONICAL_BASE_URL}/robots.txt`,
      ]);
    } catch (cfErr) {
      console.warn('Optional Cloudflare purge skipped or failed:', cfErr);
    }

    return await getSitemapStats();
  } catch (error: any) {
    console.error('Error revalidating sitemap:', error);
    return {
      success: false,
      totalUrls: STATIC_SITEMAP_ROUTES.length,
      staticCount: STATIC_SITEMAP_ROUTES.length,
      productsCount: 0,
      targetDomain: CANONICAL_BASE_URL,
      sitemapUrl: `${CANONICAL_BASE_URL}/sitemap.xml`,
      lastGenerated: new Date().toISOString(),
      error: error?.message || 'Failed to revalidate sitemap',
    };
  }
}

export async function fetchGoogleVerificationCode(): Promise<string> {
  return await getGoogleVerificationCode();
}

export async function updateGoogleVerificationCode(rawInput: string): Promise<{ success: boolean; cleanCode: string; error?: string }> {
  const result = await saveGoogleVerificationCode(rawInput);
  if (result.success) {
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard/seo');
    try {
      await purgeCloudflareCache();
    } catch (cfErr) {
      console.warn('Optional Cloudflare purge skipped or failed:', cfErr);
    }
  }
  return result;
}

