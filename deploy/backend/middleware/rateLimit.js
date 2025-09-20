"use strict";
/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per IP address
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Get rate limiting configuration from environment variables
const getRateLimitConfig = () => {
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
exports.generalLimiter = (0, express_rate_limit_1.default)({
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
    legacyHeaders: config.legacyHeaders
});
// Strict limiter for auth endpoints
exports.authLimiter = (0, express_rate_limit_1.default)({
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
    legacyHeaders: config.legacyHeaders
});
// API limiter for product endpoints
exports.apiLimiter = (0, express_rate_limit_1.default)({
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
    legacyHeaders: config.legacyHeaders
});
