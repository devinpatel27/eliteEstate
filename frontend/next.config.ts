import type { NextConfig } from 'next';

const uploadsHost = process.env.NEXT_PUBLIC_UPLOADS_HOST || 'localhost';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: uploadsHost,
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.eliteestate.com',
        pathname: '/uploads/**',
      },
    ],
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    optimizePackageImports: ['lucide-react', 'date-fns', '@tanstack/react-query', 'recharts'],
  },
};

export default nextConfig;
