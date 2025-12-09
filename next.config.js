/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable source maps for better error tracking
  productionBrowserSourceMaps: true,
  // Performance optimizations
  swcMinify: true,
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Compress responses
  compress: true,
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig;
