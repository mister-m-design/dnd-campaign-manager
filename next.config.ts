import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.dndbeyond.com',
      },
      {
        protocol: 'https',
        hostname: 'media.dndbeyond.com',
      },
      {
        protocol: 'https',
        hostname: 'www.dnd.builders',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: '5e.tools',
      },
    ],
  },
};

export default nextConfig;
