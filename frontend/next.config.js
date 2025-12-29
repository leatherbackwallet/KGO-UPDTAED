/** @type {import('next').NextConfig} */
const { execSync } = require('child_process');

// Get git branch name at build time
function getGitBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    return branch || 'unknown';
  } catch (error) {
    return process.env.GIT_BRANCH || 'unknown';
  }
}

const gitBranch = getGitBranch();

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Disable ESLint during builds to allow warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // API proxy configuration - only for development
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5001/api/:path*',
        },
      ];
    }
    return [];
  },

  // Redirects for renamed pages
  async redirects() {
    return [
      {
        source: '/items',
        destination: '/products',
        permanent: true,
      },
      {
        source: '/gifts',
        destination: '/products',
        permanent: true,
      },
    ];
  },
  
  // Disable static optimization for pages that use client-side features
  trailingSlash: false,
  // output: 'standalone', // Disabled to fix deployment crash
  
  // Environment variables for build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api-dot-onyourbehlf.uc.r.appspot.com/api' : 'http://localhost:5001/api'),
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'KeralGiftsOnline',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '3.0.0',
    NEXT_PUBLIC_GIT_BRANCH: process.env.NEXT_PUBLIC_GIT_BRANCH || gitBranch,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS || 'false',
    NEXT_PUBLIC_ENABLE_DEBUG_MODE: process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE || 'true',
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+918075030919',
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://www.keralagiftsonline.in' : 'http://localhost:3000'),
  },
  
  // Webpack configuration
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
    
    // Fix hot reload issues in development
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**'],
      };
    }
    
    return config;
  },
  
  // Browser compatibility settings
  experimental: {
    esmExternals: 'loose',
  },
  
  // Development optimizations to reduce flashing
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
  
  // Resource optimization to prevent ERR_INSUFFICIENT_RESOURCES
  ...(process.env.NODE_ENV === 'development' && {
    webpack5: true,
    swcMinify: false, // Disable SWC minification in development
    compress: false, // Disable compression in development
  }),
  
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'onyourbehlf.uc.r.appspot.com', 'api-dot-onyourbehlf.uc.r.appspot.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Enhanced security headers and SEO optimizations
  async headers() {
    // Build CSP connect-src based on environment
    const connectSrc = [
      "'self'",
      // Razorpay domains
      "https://api.razorpay.com",
      "https://*.razorpay.com",
      "https://checkout.razorpay.com",
      "https://lumberjack.razorpay.com",
      "https://cdn.razorpay.com",
      // Cloudinary
      "https://res.cloudinary.com",
      // Production API
      "https://api-dot-onyourbehlf.uc.r.appspot.com",
      // Additional domains for production
      "https://onyourbehlf.uc.r.appspot.com",
      "https://*.uc.r.appspot.com",
    ];

    // Add localhost in development - Always include for development
    connectSrc.push(
      "http://localhost:5001",
      "http://localhost:3000",
      "http://127.0.0.1:5001",
      "http://127.0.0.1:3000",
      "ws://localhost:3000", // For hot reload
      "ws://localhost:5001",
      "wss://localhost:5001", // WebSocket secure
      "ws://127.0.0.1:3000",
      "ws://127.0.0.1:5001"
    );

    const cspValue = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com https://cdn.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob: https://cdn.razorpay.com https://res.cloudinary.com",
      `connect-src ${connectSrc.join(' ')}`,
      "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');

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
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self "https://checkout.razorpay.com"), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspValue,
          },
          {
            key: 'Access-Control-Expose-Headers',
            value: 'x-rtb-fingerprint-id, x-razorpay-signature, x-razorpay-payment-id',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
      // Add specific headers for Cloudinary images
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=43200',
          },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 