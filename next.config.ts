import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@neondatabase/serverless'],
  async redirects() {
    return [
      {
        source: '/delagala/newsletter',
        destination: '/delagala-daily.pdf',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
