/**
 * Permission Hook
 * Provides permission checking utilities for frontend components
 */

import { useAuth } from '../context/AuthContext';

export interface Permission {
  resource: string;
  action: string;
}

export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if user has admin role
   */
  const isAdmin = (): boolean => {
    return user?.roleName === 'admin';
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (roleName: string): boolean => {
    return user?.roleName === roleName;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: string[]): boolean => {
    return user?.roleName ? roles.includes(user.roleName) : false;
  };

  /**
   * Check if user can perform action on resource
   * This is a simplified implementation - in production, this should be more granular
   */
  const can = (resource: string, action: string): boolean => {
    if (!user?.roleName) return false;

    // Admin can do everything
    if (user.roleName === 'admin') return true;

    // Define role permissions
    const rolePermissions: { [key: string]: string[] } = {
      moderator: [
        'users:read',
        'products:read', 'products:write',
        'orders:read', 'orders:write',
        'categories:read', 'categories:write',
        'analytics:read'
      ],
      vendor: [
        'products:read', 'products:write',
        'orders:read', 'orders:write',
        'analytics:read'
      ],
      customer: [
        'products:read',
        'orders:read', 'orders:write'
      ]
    };

    const permission = `${resource}:${action}`;
    const userPermissions = rolePermissions[user.roleName] || [];
    
    return userPermissions.includes(permission) || userPermissions.includes('*');
  };

  /**
   * Check if user can access admin features
   */
  const canAccessAdmin = (): boolean => {
    return isAdmin();
  };

  /**
   * Check if user can manage products
   */
  const canManageProducts = (): boolean => {
    return can('products', 'write') || isAdmin();
  };

  /**
   * Check if user can manage orders
   */
  const canManageOrders = (): boolean => {
    return can('orders', 'write') || isAdmin();
  };

  /**
   * Check if user can manage users
   */
  const canManageUsers = (): boolean => {
    return can('users', 'write') || isAdmin();
  };

  /**
   * Check if user can view analytics
   */
  const canViewAnalytics = (): boolean => {
    return can('analytics', 'read') || isAdmin();
  };

  /**
   * Get user's role display name
   */
  const getRoleDisplayName = (): string => {
    const roleNames: { [key: string]: string } = {
      admin: 'Administrator',
      moderator: 'Moderator',
      vendor: 'Vendor',
      customer: 'Customer'
    };
    
    return user?.roleName ? roleNames[user.roleName] || user.roleName : 'Unknown';
  };

  /**
   * Check if user can access a specific admin tab
   */
  const canAccessAdminTab = (tabId: string): boolean => {
    if (!isAdmin()) return false;

    const adminTabPermissions: { [key: string]: string[] } = {
      dashboard: ['admin'],
      products: ['admin', 'moderator'],
      categories: ['admin', 'moderator'],
      occasions: ['admin', 'moderator'],
      orders: ['admin', 'moderator', 'vendor'],
      users: ['admin'],
      finance: ['admin'],
      returns: ['admin', 'moderator']
    };

    const allowedRoles = adminTabPermissions[tabId] || [];
    return allowedRoles.includes(user?.roleName || '');
  };

  return {
    isAdmin,
    hasRole,
    hasAnyRole,
    can,
    canAccessAdmin,
    canManageProducts,
    canManageOrders,
    canManageUsers,
    canViewAnalytics,
    getRoleDisplayName,
    canAccessAdminTab
  };
}
