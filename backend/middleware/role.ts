/**
 * Role-based Access Control Middleware
 * Ensures users have the required role to access protected routes
 */

import { Request, Response, NextFunction } from 'express';
import { User } from '../models/users.model';
import { Role } from '../models/roles.model';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const requireRole = (requiredRole: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }

      const user = await User.findById(req.user.id).populate('roleId');
      if (!user || !user.roleId || (user.roleId as any).name !== requiredRole) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }
      
      next();
    } catch (error) {
      res.status(403).json({ message: 'Access denied' });
    }
  };
};
