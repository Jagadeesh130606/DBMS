/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@electric-sql/pglite', '@xenova/transformers', 'pg', 'mongoose', 'bcryptjs'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@electric-sql/pglite'];
    }
    return config;
  },
};

module.exports = nextConfig;
