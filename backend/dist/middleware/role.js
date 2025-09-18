"use strict";
/**
 * Role-based Access Control Middleware
 * Ensures users have the required role to access protected routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const users_model_1 = require("../models/users.model");
const requireRole = (requiredRole) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                res.status(403).json({ message: 'Access denied' });
                return;
            }
            const user = await users_model_1.User.findById(req.user.id).populate('roleId');
            if (!user || !user.roleId || user.roleId.name !== requiredRole) {
                res.status(403).json({ message: 'Access denied' });
                return;
            }
            next();
        }
        catch (error) {
            res.status(403).json({ message: 'Access denied' });
        }
    };
};
exports.requireRole = requireRole;
