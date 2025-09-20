/**
 * Role Management Utilities
 * Provides helper functions for role-based operations
 */

import { User } from '../models/users.model';
import { Role } from '../models/roles.model';

export interface RoleInfo {
  id: string;
  name: string;
  permissions: string[];
}

/**
 * Get role information for a user
 * @param userId - User ID
 * @returns Role information or null if not found
 */
export async function getUserRoleInfo(userId: string): Promise<RoleInfo | null> {
  try {
    const user = await User.findById(userId).populate('roleId');
    if (!user || !user.roleId) {
      return null;
    }

    const role = user.roleId as any;
    return {
      id: role._id.toString(),
      name: role.name,
      permissions: role.permissions || []
    };
  } catch (error) {
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
export async function userHasPermission(userId: string, permission: string): Promise<boolean> {
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
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}

/**
 * Check if user has admin role
 * @param userId - User ID
 * @returns True if user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const roleInfo = await getUserRoleInfo(userId);
    return roleInfo?.name === 'admin' || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get all available roles
 * @returns Array of role information
 */
export async function getAllRoles(): Promise<RoleInfo[]> {
  try {
    const roles = await Role.find({ isActive: true, isDeleted: false });
    return roles.map(role => ({
      id: role._id.toString(),
      name: role.name,
      permissions: role.permissions
    }));
  } catch (error) {
    console.error('Error getting all roles:', error);
    return [];
  }
}

/**
 * Create a new role
 * @param roleData - Role data
 * @returns Created role or null if failed
 */
export async function createRole(roleData: {
  name: string;
  description?: string;
  permissions: string[];
}): Promise<RoleInfo | null> {
  try {
    const role = await Role.create(roleData);
    return {
      id: role._id.toString(),
      name: role.name,
      permissions: role.permissions
    };
  } catch (error) {
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
export async function updateUserRole(userId: string, roleId: string): Promise<boolean> {
  try {
    const result = await User.findByIdAndUpdate(userId, { roleId });
    return !!result;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
}

/**
 * Get role hierarchy (for future use)
 * @returns Role hierarchy mapping
 */
export function getRoleHierarchy(): { [key: string]: string[] } {
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
export function canManageRole(managerRole: string, targetRole: string): boolean {
  const hierarchy = getRoleHierarchy();
  const manageableRoles = hierarchy[managerRole] || [];
  return manageableRoles.includes(targetRole) || managerRole === targetRole;
}
