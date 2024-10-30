/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure image optimization and remote patterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd1yqavyzu1pe5v.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*',
        port: '',
        pathname: '/**',
      }
    ],
    // Optimize image loading performance
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },

  // Runtime configuration
  env: {
    // Security-related environment variables
    JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-for-debugging',
    
    // AWS configuration
    AWS_REGION: process.env.AWS_REGION,
    CLOUDFRONT_URL: process.env.CLOUDFRONT_URL,
    
    // Database configuration
    DATABASE_URL: process.env.DATABASE_URL,
  },

  // Production optimizations
  compress: true,
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Handle trailing slashes consistently
  trailingSlash: false,

  // Conditional output configuration based on environment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Customize webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Production-only optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },

  // Enable source maps in development
  productionBrowserSourceMaps: process.env.NODE_ENV !== 'production',

  // Add runtime configuration
  runtime: 'nodejs',
  
  // Disable automatic static optimization for pages that use authentication
  experimental: {
    // Enable runtime JS
    runtime: 'nodejs',
  },

  // Configure which pages should be statically generated
  exportPathMap: async function() {
    return {
      '/': { page: '/' },
      '/login': { page: '/login' },
      // Add other public pages that don't require authentication
    }
  },
};

/**
 * Environment-specific instructions:
 * 
 * Development Mode:
 * - Run with: npm run dev
 * - Uses default Next.js development server
 * - Enables hot reloading and debugging features
 * 
 * Production Mode:
 * - Build with: npm run build
 * - Run with: node .next/standalone/server.js
 * - Ensures all environment variables are set in Replit secrets
 * - Creates optimized production build with standalone server
 */

module.exports = nextConfig;
