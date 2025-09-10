import type { NextConfig } from "next";

const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: url.hostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
