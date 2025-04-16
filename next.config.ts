import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => {
    return [];
  },
  // Set strict mode to catch potential issues
  reactStrictMode: true,
  // Enable ISR for better performance
  experimental: {
    // No longer needs serverActions as it's part of core in Next.js 15
  }
};

export default nextConfig;
