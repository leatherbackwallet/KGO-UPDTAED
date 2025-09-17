"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const jwt_1 = require("../utils/jwt");
const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        res.status(401).json({
            success: false,
            error: {
                message: 'No authorization header provided',
                code: 'NO_AUTH_HEADER'
            }
        });
        return;
    }
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
        res.status(401).json({
            success: false,
            error: {
                message: 'No token provided',
                code: 'NO_TOKEN'
            }
        });
        return;
    }
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET environment variable is not set');
        res.status(500).json({
            success: false,
            error: {
                message: 'Server configuration error',
                code: 'SERVER_CONFIG_ERROR'
            }
        });
        return;
    }
    try {
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        if (!decoded) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid or expired token',
                    code: 'INVALID_TOKEN'
                }
            });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error('Token verification error:', err);
        res.status(401).json({
            success: false,
            error: {
                message: 'Token verification failed',
                code: 'TOKEN_VERIFICATION_FAILED'
            }
        });
    }
};
exports.auth = auth;
//# sourceMappingURL=auth.js.map