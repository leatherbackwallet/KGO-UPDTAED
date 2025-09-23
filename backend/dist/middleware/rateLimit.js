"use strict";
/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per IP address
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userAwareLimiter = exports.apiLimiter = exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Get rate limiting configuration from environment variables
const getRateLimitConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
        max: isProduction
            ? (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200')) // Increased from 100 to 200
            : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000')), // Higher limit for development
        authMax: isProduction
            ? parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10') // Increased from 5 to 10
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
// User-aware rate limiter for authenticated users
exports.userAwareLimiter = (0, express_rate_limit_1.default)({
    windowMs: config.windowMs,
    max: (req) => {
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
    keyGenerator: (req) => {
        // Use user ID for authenticated users, IP for anonymous
        return req.user?.id ? `user:${req.user.id}` : req.ip;
    },
    message: {
        success: false,
        error: {
            message: 'Too many requests, please try again later.',
            code: 'USER_RATE_LIMIT_EXCEEDED'
        }
    },
    standardHeaders: config.standardHeaders,
    legacyHeaders: config.legacyHeaders
});
