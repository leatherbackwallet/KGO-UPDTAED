/**
 * Authentication Middleware
 * Verifies JWT tokens and adds user information to requests
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export const auth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }
  
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET environment variable is not set');
    res.status(500).json({ message: 'Server configuration error' });
    return;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
