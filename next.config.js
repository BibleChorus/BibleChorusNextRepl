/** @type {import('next').NextConfig} */
const nextConfig = {
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
  swcMinify: false, // Disable SWC minification
}

module.exports = nextConfig
