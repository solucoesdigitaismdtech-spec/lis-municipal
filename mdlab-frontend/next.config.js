/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  // Redireciona chamadas /api/* para o backend NestJS (porta 3333)
  // Assim o frontend (porta 3000) conversa com o backend sem problema de CORS
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3333/api/:path*',
      },
    ];
  },
};
module.exports = nextConfig;
