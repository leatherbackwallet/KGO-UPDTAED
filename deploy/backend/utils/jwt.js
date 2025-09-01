"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.refreshAccessToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokenPair = exports.generateSecureToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const generateSecureToken = (length = 32) => {
    return crypto_1.default.randomBytes(length).toString('hex');
};
exports.generateSecureToken = generateSecureToken;
const generateTokenPair = (payload) => {
    const accessTokenExpiry = Math.floor(Date.now() / 1000) + (15 * 60);
    const refreshTokenExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
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
const refreshAccessToken = (refreshToken) => {
    const decoded = (0, exports.verifyRefreshToken)(refreshToken);
    if (!decoded) {
        return null;
    }
    const { type, ...payload } = decoded;
    return (0, exports.generateTokenPair)(payload);
};
exports.refreshAccessToken = refreshAccessToken;
const decodeToken = (token) => {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch (error) {
        return null;
    }
};
exports.decodeToken = decodeToken;
//# sourceMappingURL=jwt.js.map