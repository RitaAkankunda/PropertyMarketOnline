import type { NextConfig } from "next";

// R2 Public URL - Update this with your own R2 public URL if using a different bucket
// You can get this from your Cloudflare R2 bucket settings → Public Access
// Format: https://pub-xxxxx.r2.dev or https://your-account-id.r2.cloudflarestorage.com
const R2_PUBLIC_HOSTNAME = process.env.NEXT_PUBLIC_R2_HOSTNAME || 'pub-b11ae76c45a24db3b97292080be33c6c.r2.dev';
const R2_ACCOUNT_HOSTNAME = process.env.NEXT_PUBLIC_R2_ACCOUNT_HOSTNAME || '88d5f353334b051133dbf5a76b3e81a9.r2.cloudflarestorage.com';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: R2_ACCOUNT_HOSTNAME,
      },
      {
        protocol: 'https',
        hostname: R2_PUBLIC_HOSTNAME,
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
