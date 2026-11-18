import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days cache
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
  allowedDevOrigins: ['172.20.10.2'],
  async rewrites() {
    return [
      {
        source: '/returns',
        destination: '/return-policy',
      },
      {
        source: '/refund-policy',
        destination: '/return-policy',
      },
      {
        source: '/privacy',
        destination: '/privacy-policy',
      },
      {
        source: '/products/%D8%B9%D9%88%D8%AF-%D8%B7%D8%A8%D9%8A%D8%B9%D9%8A',
        destination: '/products/natural-oud',
      },
      {
        source: '/products/%D8%B9%D9%88%D8%AF-%D9%85%D8%AD%D8%B3%D9%86',
        destination: '/products/enhanced-oud',
      },
      {
        source: '/products/%D8%AF%D9%87%D9%86-%D8%A7%D9%84%D8%B9%D9%88%D8%AF',
        destination: '/products/aloud',
      },
      {
        source: '/products/%D8%B9%D9%88%D8%AF-%D9%85%D8%B3%D9%82%D9%89',
        destination: '/products/scented-oud',
      },
    ];
  },
};

export default nextConfig;
