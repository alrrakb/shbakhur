/**
 * Cloudflare Cache Management Helper
 */

export async function purgeCloudflareCache(urls?: string[]) {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    return { success: false, error: 'Cloudflare credentials not configured' };
  }

  try {
    const payload = urls && urls.length > 0 
      ? { files: urls } 
      : { purge_everything: true };

    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return { success: data.success, data };
  } catch (error) {
    console.error('Cloudflare purge error:', error);
    return { success: false, error };
  }
}
