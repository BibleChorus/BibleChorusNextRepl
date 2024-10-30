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
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },

  // Environment variables
  env: {
    JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-for-debugging',
    AWS_REGION: process.env.AWS_REGION,
    CLOUDFRONT_URL: process.env.CLOUDFRONT_URL,
    DATABASE_URL: process.env.DATABASE_URL,
  },

  // Production optimizations
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,

  // Disable automatic static optimization
  output: 'standalone',

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      Object.assign(config.resolve.alias, {
        'react/jsx-runtime.js': 'preact/compat/jsx-runtime',
        react: 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
