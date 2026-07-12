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
  async rewrites() {
    return [
      {
        // Diagnóstico "¿Está tu piso listo para vender?" (HTML autocontenido)
        source: '/delagala/diagnostico',
        destination: '/diagnostico.html',
      },
    ];
  },
};

export default nextConfig;
