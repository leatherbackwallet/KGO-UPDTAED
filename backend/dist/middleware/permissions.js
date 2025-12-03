"use strict";
/**
 * Permission-based Access Control Middleware
 * Provides granular permission checking beyond simple role-based access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAnyRole = exports.requireOwnershipOrAdmin = exports.requirePermission = void 0;
/**
 * Check if user has specific permission
 * @param permission - The permission to check (e.g., 'products:write', 'orders:read')
 */
const requirePermission = (permission) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: 'Access denied - No user information',
                        code: 'NO_USER_INFO'
                    }
                });
                return;
            }
            // Admin has all permissions
            if (req.user.roleName === 'admin') {
                next();
                return;
            }
            // For now, we'll implement basic role-based permissions
            // In the future, this can be enhanced to check actual permissions from the database
            const rolePermissions = getRolePermissions(req.user.roleName);
            if (!rolePermissions.includes(permission) && !rolePermissions.includes('*')) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: `Access denied - Permission '${permission}' required`,
                        code: 'INSUFFICIENT_PERMISSION'
                    }
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Permission check error:', error);
            res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied - Permission verification failed',
                    code: 'PERMISSION_VERIFICATION_FAILED'
                }
            });
        }
    };
};
exports.requirePermission = requirePermission;
/**
 * Check if user can access a resource (own resource or admin)
 * @param resourceUserIdField - The field name that contains the user ID in the resource
 */
const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: 'Access denied - No user information',
                        code: 'NO_USER_INFO'
                    }
                });
                return;
            }
            // Admin can access any resource
            if (req.user.roleName === 'admin') {
                next();
                return;
            }
            // Get the resource ID from params
            const resourceId = req.params.id;
            if (!resourceId) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Resource ID required',
                        code: 'MISSING_RESOURCE_ID'
                    }
                });
                return;
            }
            // This middleware should be used with a route that fetches the resource first
            // The resource should be available in req.resource
            const resource = req.resource;
            if (!resource) {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Resource not loaded - middleware configuration error',
                        code: 'RESOURCE_NOT_LOADED'
                    }
                });
                return;
            }
            const resourceUserId = typeof resource[resourceUserIdField] === 'string'
                ? resource[resourceUserIdField]
                : resource[resourceUserIdField]?._id?.toString();
            if (resourceUserId !== req.user.id) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: 'Access denied - Resource ownership required',
                        code: 'INSUFFICIENT_OWNERSHIP'
                    }
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Ownership check error:', error);
            res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied - Ownership verification failed',
                    code: 'OWNERSHIP_VERIFICATION_FAILED'
                }
            });
        }
    };
};
exports.requireOwnershipOrAdmin = requireOwnershipOrAdmin;
/**
 * Get permissions for a role
 * This is a simplified implementation - in production, this should fetch from database
 */
function getRolePermissions(roleName) {
    const rolePermissions = {
        admin: ['*'], // Admin has all permissions
        moderator: [
            'users:read',
            'products:read', 'products:write',
            'orders:read', 'orders:write',
            'categories:read', 'categories:write'
        ],
        vendor: [
            'products:read', 'products:write',
            'orders:read', 'orders:write'
        ],
        customer: [
            'products:read',
            'orders:read', 'orders:write'
        ]
    };
    return rolePermissions[roleName] || [];
}
/**
 * Check if user has any of the specified roles
 * @param roles - Array of allowed roles
 */
const requireAnyRole = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: 'Access denied - No user information',
                        code: 'NO_USER_INFO'
                    }
                });
                return;
            }
            if (!roles.includes(req.user.roleName)) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: `Access denied - One of these roles required: ${roles.join(', ')}`,
                        code: 'INSUFFICIENT_ROLE'
                    }
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Role check error:', error);
            res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied - Role verification failed',
                    code: 'ROLE_VERIFICATION_FAILED'
                }
            });
        }
    };
};
exports.requireAnyRole = requireAnyRole;
