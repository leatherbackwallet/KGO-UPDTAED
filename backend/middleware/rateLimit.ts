/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per IP address
 */

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  authMax: number;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
}

// Get rate limiting configuration from environment variables
const getRateLimitConfig = (): RateLimitConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
    max: isProduction 
      ? (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000')) // Much higher for production
      : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '2000')), // Higher limit for development
    authMax: isProduction 
      ? parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10') // Increased from 5 to 10
      : parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '50'), // Higher limit for development
    standardHeaders: true,
    legacyHeaders: false,
  };
};

const config = getRateLimitConfig();

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: config.windowMs,
  max: config.max,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  } as ErrorResponse,
  standardHeaders: config.standardHeaders,
  legacyHeaders: config.legacyHeaders
});

// Strict limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: config.windowMs,
  max: config.authMax,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
  } as ErrorResponse,
  standardHeaders: config.standardHeaders,
  legacyHeaders: config.legacyHeaders
});

// API limiter for product endpoints - Much more generous
export const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 500, // 500 requests per 5 minutes (100/minute average)
  message: {
    success: false,
    error: {
      message: 'Too many API requests, please try again later.',
      code: 'API_RATE_LIMIT_EXCEEDED'
    }
  } as ErrorResponse,
  standardHeaders: config.standardHeaders,
  legacyHeaders: config.legacyHeaders
});

// User-aware rate limiter for authenticated users
export const userAwareLimiter = rateLimit({
  windowMs: config.windowMs,
  max: (req: any) => {
    // Higher limits for authenticated users
    if (req.user?.id) {
      const userRole = req.user.roleName;
      switch (userRole) {
        case 'admin':
          return 1000; // Very high limit for admins
        case 'vendor':
          return 500; // High limit for vendors
        case 'customer':
          return 300; // Higher limit for customers
        default:
          return 200; // Default authenticated user limit
      }
    }
    return config.max; // Default limit for anonymous users
  },
  keyGenerator: (req: any) => {
    // Use user ID for authenticated users, IP for anonymous
    return req.user?.id ? `user:${req.user.id}` : req.ip;
  },
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.',
      code: 'USER_RATE_LIMIT_EXCEEDED'
    }
  } as ErrorResponse,
  standardHeaders: config.standardHeaders,
  legacyHeaders: config.legacyHeaders
});
