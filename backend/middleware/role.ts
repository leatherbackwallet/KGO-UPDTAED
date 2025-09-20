/**
 * Role-based Access Control Middleware
 * Ensures users have the required role to access protected routes
 */

import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleId: string;
    roleName: string;
    firstName: string;
    lastName: string;
  };
}

export const requireRole = (requiredRole: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

      // Check role from JWT token (no database query needed)
      if (!req.user.roleName || req.user.roleName !== requiredRole) {
        res.status(403).json({ 
          success: false,
          error: { 
            message: `Access denied - ${requiredRole} role required`, 
            code: 'INSUFFICIENT_ROLE' 
          } 
        });
        return;
      }
      
      next();
    } catch (error) {
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
