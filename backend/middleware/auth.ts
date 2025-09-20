/**
 * Authentication Middleware
 * Verifies JWT tokens and adds user information to requests
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

export const auth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
    const decoded = verifyAccessToken(token);
    
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
  } catch (err: any) {
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
