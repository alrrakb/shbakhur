import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://shbakhur.com';

  const disallowedRoutes = [
    '/dashboard',
    '/dashboard/*',
    '/cart',
    '/checkout',
    '/api',
    '/api/*',
    '/login',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowedRoutes,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: disallowedRoutes,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
