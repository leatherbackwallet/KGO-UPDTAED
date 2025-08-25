/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per IP address
 */

const rateLimit = require('express-rate-limit');

// Get rate limiting configuration from environment variables
const getRateLimitConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
    max: isProduction 
      ? (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100)
      : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000), // Higher limit for development
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5,
    standardHeaders: true,
    legacyHeaders: false,
  };
};

const config = getRateLimitConfig();

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: config.windowMs,
  max: config.max,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: config.standardHeaders,
  legacyHeaders: config.legacyHeaders,
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: config.windowMs,
  max: config.authMax,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: config.standardHeaders,
  legacyHeaders: config.legacyHeaders,
});

// API limiter for product endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: config.max,
  message: {
    success: false,
    error: {
      message: 'Too many API requests, please try again later.',
      code: 'API_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: config.standardHeaders,
  legacyHeaders: config.legacyHeaders,
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter
}; 