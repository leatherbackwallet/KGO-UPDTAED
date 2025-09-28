"use strict";
/**
 * Role Management Utilities
 * Provides helper functions for role-based operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRoleInfo = getUserRoleInfo;
exports.userHasPermission = userHasPermission;
exports.isUserAdmin = isUserAdmin;
exports.getAllRoles = getAllRoles;
exports.createRole = createRole;
exports.updateUserRole = updateUserRole;
exports.getRoleHierarchy = getRoleHierarchy;
exports.canManageRole = canManageRole;
const users_model_1 = require("../models/users.model");
const roles_model_1 = require("../models/roles.model");
/**
 * Get role information for a user
 * @param userId - User ID
 * @returns Role information or null if not found
 */
async function getUserRoleInfo(userId) {
    try {
        const user = await users_model_1.User.findById(userId).populate('roleId');
        if (!user || !user.roleId) {
            return null;
        }
        const role = user.roleId;
        return {
            id: role._id.toString(),
            name: role.name,
            permissions: role.permissions || []
        };
    }
    catch (error) {
        console.error('Error getting user role info:', error);
        return null;
    }
}
/**
 * Check if user has specific permission
 * @param userId - User ID
 * @param permission - Permission to check
 * @returns True if user has permission
 */
async function userHasPermission(userId, permission) {
    try {
        const roleInfo = await getUserRoleInfo(userId);
        if (!roleInfo) {
            return false;
        }
        // Admin has all permissions
        if (roleInfo.name === 'admin' || roleInfo.permissions.includes('*')) {
            return true;
        }
        return roleInfo.permissions.includes(permission);
    }
    catch (error) {
        console.error('Error checking user permission:', error);
        return false;
    }
}
/**
 * Check if user has admin role
 * @param userId - User ID
 * @returns True if user is admin
 */
async function isUserAdmin(userId) {
    try {
        const roleInfo = await getUserRoleInfo(userId);
        return roleInfo?.name === 'admin' || false;
    }
    catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}
/**
 * Get all available roles
 * @returns Array of role information
 */
async function getAllRoles() {
    try {
        const roles = await roles_model_1.Role.find({ isActive: true, isDeleted: false });
        return roles.map(role => ({
            id: role._id.toString(),
            name: role.name,
            permissions: role.permissions
        }));
    }
    catch (error) {
        console.error('Error getting all roles:', error);
        return [];
    }
}
/**
 * Create a new role
 * @param roleData - Role data
 * @returns Created role or null if failed
 */
async function createRole(roleData) {
    try {
        const role = await roles_model_1.Role.create(roleData);
        return {
            id: role._id.toString(),
            name: role.name,
            permissions: role.permissions
        };
    }
    catch (error) {
        console.error('Error creating role:', error);
        return null;
    }
}
/**
 * Update user role
 * @param userId - User ID
 * @param roleId - New role ID
 * @returns True if successful
 */
async function updateUserRole(userId, roleId) {
    try {
        const result = await users_model_1.User.findByIdAndUpdate(userId, { roleId });
        return !!result;
    }
    catch (error) {
        console.error('Error updating user role:', error);
        return false;
    }
}
/**
 * Get role hierarchy (for future use)
 * @returns Role hierarchy mapping
 */
function getRoleHierarchy() {
    return {
        admin: ['moderator', 'vendor', 'customer'],
        moderator: ['vendor', 'customer'],
        vendor: ['customer'],
        customer: []
    };
}
/**
 * Check if one role can manage another
 * @param managerRole - Role of the user trying to manage
 * @param targetRole - Role of the user being managed
 * @returns True if manager can manage target
 */
function canManageRole(managerRole, targetRole) {
    const hierarchy = getRoleHierarchy();
    const manageableRoles = hierarchy[managerRole] || [];
    return manageableRoles.includes(targetRole) || managerRole === targetRole;
}
