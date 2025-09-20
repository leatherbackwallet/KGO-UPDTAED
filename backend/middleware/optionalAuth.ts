/**
 * Optional Authentication Middleware
 * Verifies JWT tokens if provided, but doesn't require them
 * Used for endpoints that should work for both authenticated and guest users
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

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

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    // No auth header provided - continue without user
    req.user = undefined;
    return next();
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      roleId: decoded.roleId,
      roleName: decoded.roleName,
      firstName: decoded.firstName,
      lastName: decoded.lastName
    };
    next();
  } catch (error) {
    // Invalid token - continue without user
    req.user = undefined;
    next();
  }
};
