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
    // Dominios propios de la web premium: tupartnerhipotecario.es y .com → landing Tu Partner Hipotecario.
    const HIPO_HOST = '(www\\.)?tupartnerhipotecario\\.(es|com)';
    return {
      // beforeFiles: gana a los ficheros estáticos de /public y a las páginas.
      beforeFiles: [
        {
          source: '/',
          destination: '/delagala/hipotecas',
          has: [{ type: 'host', value: HIPO_HOST }],
        },
        // Biblioteca de Dailys: las URLs fijas de las plantillas de WhatsApp sirven
        // el periódico ACTIVO de cada carril (cambiable desde el panel sin reimprimir).
        { source: '/delagala-daily.pdf',           destination: '/api/daily/cafe_pan' },
        { source: '/delagala-daily-bienestar.pdf', destination: '/api/daily/herbolisteria' },
      ],
      afterFiles: [
        {
          // Diagnóstico "¿Está tu piso listo para vender?" (HTML autocontenido)
          source: '/delagala/diagnostico',
          destination: '/diagnostico.html',
        },
        {
          // Resto de rutas de esos dominios → la misma landing (assets, /api y páginas
          // reales se sirven antes, en afterFiles, así que no se rompen).
          source: '/:path*',
          destination: '/delagala/hipotecas',
          has: [{ type: 'host', value: HIPO_HOST }],
        },
      ],
    };
  },
};

export default nextConfig;
