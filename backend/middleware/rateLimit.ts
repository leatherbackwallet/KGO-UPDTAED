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
      ? (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'))
      : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000')), // Higher limit for development
    authMax: isProduction 
      ? parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5')
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

// API limiter for product endpoints
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: config.max,
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
