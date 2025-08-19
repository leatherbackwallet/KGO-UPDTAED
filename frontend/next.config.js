/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Keep disabled to prevent double renders
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Completely disable HMR and Fast Refresh
  webpackDevMiddleware: config => {
    config.watchOptions = {
      poll: false,
      ignored: /node_modules/,
    };
    return config;
  },
  
  // Webpack configuration without HMR
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  
  // Browser compatibility settings - HMR completely disabled
  experimental: {
    esmExternals: 'loose',
    fastRefresh: false,
  },
  
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || '',
    FAST_REFRESH: 'false',
  },
  
  // Add security headers for better browser compatibility
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 