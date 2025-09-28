"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.refreshAccessToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokenPair = exports.generateSecureToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a secure random string for tokens
 */
const generateSecureToken = (length = 32) => {
    return crypto_1.default.randomBytes(length).toString('hex');
};
exports.generateSecureToken = generateSecureToken;
/**
 * Generate access and refresh token pair
 */
const generateTokenPair = (payload) => {
    const accessTokenExpiry = Math.floor(Date.now() / 1000) + (15 * 60); // 15 minutes
    const refreshTokenExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
    const accessTokenPayload = {
        ...payload,
        type: 'access'
    };
    const refreshTokenPayload = {
        ...payload,
        type: 'refresh'
    };
    const accessToken = jsonwebtoken_1.default.sign(accessTokenPayload, process.env.JWT_SECRET, {
        expiresIn: '15m',
        issuer: 'keralagiftsonline',
        audience: 'keralagiftsonline-users'
    });
    const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
        issuer: 'keralagiftsonline',
        audience: 'keralagiftsonline-users'
    });
    return {
        accessToken,
        refreshToken,
        accessTokenExpiry,
        refreshTokenExpiry
    };
};
exports.generateTokenPair = generateTokenPair;
/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, {
            issuer: 'keralagiftsonline',
            audience: 'keralagiftsonline-users'
        });
        if (decoded.type !== 'access') {
            return null;
        }
        return decoded;
    }
    catch (error) {
        return null;
    }
};
exports.verifyAccessToken = verifyAccessToken;
/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET, {
            issuer: 'keralagiftsonline',
            audience: 'keralagiftsonline-users'
        });
        if (decoded.type !== 'refresh') {
            return null;
        }
        return decoded;
    }
    catch (error) {
        return null;
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = (refreshToken) => {
    const decoded = (0, exports.verifyRefreshToken)(refreshToken);
    if (!decoded) {
        return null;
    }
    // Generate new token pair
    const { type, ...payload } = decoded;
    return (0, exports.generateTokenPair)(payload);
};
exports.refreshAccessToken = refreshAccessToken;
/**
 * Decode token without verification (for logging purposes only)
 */
const decodeToken = (token) => {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch (error) {
        return null;
    }
};
exports.decodeToken = decodeToken;
