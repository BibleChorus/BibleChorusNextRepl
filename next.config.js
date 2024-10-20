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
    ],
  },
  // Add this section to explicitly include environment variables
  env: {
    JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-for-debugging',
  },
  // Add standalone optimization for production in deployment mode on Replit
  output: 'standalone',
};

// Conditionally apply the standalone optimization only in production
if (process.env.NODE_ENV === 'production') {
  nextConfig.experimental = {
    ...nextConfig.experimental,
    // Enable optimizations for Replit deployment
    outputStandalone: true,
  };
}

module.exports = nextConfig
