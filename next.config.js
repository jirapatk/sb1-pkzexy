/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  // images: { unoptimized: true },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true
  },
  trailingSlash: true,
  // distDir: 'out'
};

module.exports = nextConfig;