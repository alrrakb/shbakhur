'use server';

import { revalidatePath } from 'next/cache';
import { purgeCloudflareCache } from '@/lib/cloudflare';

export async function revalidateSite() {
  revalidatePath('/', 'layout');
  try {
    await purgeCloudflareCache();
  } catch (err) {
    console.error('Failed to purge Cloudflare cache:', err);
  }
}
