"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const getRateLimitConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        max: isProduction
            ? (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'))
            : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000')),
        authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5'),
        standardHeaders: true,
        legacyHeaders: false,
    };
};
const config = getRateLimitConfig();
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
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
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
//# sourceMappingURL=rateLimit.js.map