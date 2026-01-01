import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '88d5f353334b051133dbf5a76b3e81a9.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-b11ae76c45a24db3b97292080be33c6c.r2.dev',
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
