import { PHASE_PRODUCTION_BUILD } from 'next/constants.js'

/** @type {import('next').NextConfig} */
export default (phase, defaultConfig) => {
  const isProd = phase === PHASE_PRODUCTION_BUILD

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required for JWT authentication.')
  }

  return {
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
    JWT_SECRET: process.env.JWT_SECRET,
    
    // AWS configuration
    AWS_REGION: process.env.AWS_REGION,
    CLOUDFRONT_URL: process.env.CLOUDFRONT_URL,
    
    // Database configuration
    DATABASE_URL: process.env.DATABASE_URL,
  },

  // Replit-specific optimizations
  output: isProd ? 'standalone' : undefined,
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  // Performance optimizations
  compress: true,
  reactStrictMode: true,
  swcMinify: isProd,

  // Handle trailing slashes consistently
  trailingSlash: false,

  // Customize webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
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
  };
};

// Add helpful comment about running in standalone mode
/**
 * IMPORTANT: When running in standalone mode:
 * - Use "node .next/standalone/server.js" instead of "next start"
 * - Ensure all environment variables are properly set in Replit secrets
 * - The standalone output creates a minimal production server
 */
