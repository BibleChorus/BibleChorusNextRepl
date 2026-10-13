import { PHASE_PRODUCTION_BUILD } from "next/constants.js";

/** @type {import('next').NextConfig} */
export default (phase, defaultConfig) => {
  const isProd = phase === PHASE_PRODUCTION_BUILD;

  // Only check for auth secrets in production when they're actually needed
  // Allow builds to proceed if secrets will be provided at runtime
  if (
    isProd &&
    process.env.NODE_ENV === "production" &&
    !process.env.JWT_SECRET &&
    !process.env.NEXTAUTH_SECRET
  ) {
    console.warn(
      "Warning: JWT_SECRET or NEXTAUTH_SECRET not set. Ensure these are configured for production runtime.",
    );
  }

  return {
    // Configure image optimization and remote patterns
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "d1yqavyzu1pe5v.cloudfront.net",
          port: "",
          pathname: "/**",
        },
        {
          protocol: "https",
          hostname: "*",
          port: "",
          pathname: "/**",
        },
      ],
      // Optimize image loading performance
      minimumCacheTTL: 60,
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    },

    // Server secrets stay in runtime process.env; never inline them in client bundles.
    // Replit runs next start, so use the standard server output.
    // Bundle Auth.js so Next resolves its extensionless next/* imports at build time.
    transpilePackages: ["next-auth"],
    poweredByHeader: false, // Remove X-Powered-By header for security

    // Performance optimizations
    compress: true,
    reactStrictMode: true,

    // Allow all dev origins for Replit proxy
    allowedDevOrigins: ["*"],

    // Handle trailing slashes consistently
    trailingSlash: false,
  };
};
