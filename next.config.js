/** @type {import('next').NextConfig} */
const nextConfig = {
  // Comment out the 'export' output to allow server-side rendering with 'npm run start'
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    outputFileTracingExcludes: {
      '*': ['./framework/**/*'],
    },
  },
};

module.exports = nextConfig;
