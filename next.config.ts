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
    ];
  },
};

export default nextConfig;
