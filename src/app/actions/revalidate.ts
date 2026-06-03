'use server';

import { revalidatePath } from 'next/cache';

export async function revalidateSite() {
  revalidatePath('/', 'layout');
}
