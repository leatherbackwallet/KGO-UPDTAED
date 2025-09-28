"use strict";
/**
 * Optional Authentication Middleware
 * Verifies JWT tokens if provided, but doesn't require them
 * Used for endpoints that should work for both authenticated and guest users
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = void 0;
const jwt_1 = require("../utils/jwt");
const optionalAuth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        // No auth header provided - continue without user
        req.user = undefined;
        return next();
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            roleId: decoded.roleId,
            roleName: decoded.roleName,
            firstName: decoded.firstName,
            lastName: decoded.lastName
        };
        next();
    }
    catch (error) {
        // Invalid token - continue without user
        req.user = undefined;
        next();
    }
};
exports.optionalAuth = optionalAuth;
