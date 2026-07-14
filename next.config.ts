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
      {
        // Dominio propio de hipotecas: tupartnerhipotecario.es → landing DELAGALA
        source: '/',
        destination: '/delagala/hipotecas',
        has: [{ type: 'host', value: '(www\\.)?tupartnerhipotecario\\.es' }],
      },
      {
        source: '/:path*',
        destination: '/delagala/hipotecas',
        has: [{ type: 'host', value: '(www\\.)?tupartnerhipotecario\\.es' }],
      },
    ];
  },
};

export default nextConfig;
