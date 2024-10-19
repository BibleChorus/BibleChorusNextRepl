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
};

module.exports = nextConfig
