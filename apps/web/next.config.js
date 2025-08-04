/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@soccer/shared', '@soccer/ui'],
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    typedRoutes: true,
  },
}

module.exports = nextConfig