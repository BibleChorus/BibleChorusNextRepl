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
    domains: [process.env.NEXT_PUBLIC_CDN_URL?.replace(/^https?:\/\//, '')],
  },
}

module.exports = nextConfig
