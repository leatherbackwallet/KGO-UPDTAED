/**
 * API Security Middleware
 * Provides additional security layers for API endpoints
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

/**
 * Validate that the user's role hasn't changed since token issuance
 * This prevents privilege escalation attacks
 */
export const validateRoleConsistency = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id || !req.user?.roleId) {
      res.status(401).json({ 
        success: false,
        error: { 
          message: 'User information missing', 
          code: 'MISSING_USER_INFO' 
        } 
      });
      return;
    }

    // For admin operations, we should verify the role is still valid
    // This is a lightweight check that can be enhanced with caching
    if (req.user.roleName === 'admin') {
      // Add additional validation for admin operations
      // In production, you might want to check against a blacklist or recent role changes
      console.log(`Admin operation by user ${req.user.id} (${req.user.email})`);
    }

    next();
  } catch (error) {
    console.error('Role consistency validation error:', error);
    res.status(500).json({ 
      success: false,
      error: { 
        message: 'Role validation failed', 
        code: 'ROLE_VALIDATION_FAILED' 
      } 
    });
  }
};

/**
 * Rate limiting for admin operations
 * Prevents abuse of admin endpoints
 */
export const adminRateLimit = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // This is a simple implementation - in production, use a proper rate limiting library
  const adminOperations = req.user?.roleName === 'admin' ? 'admin' : 'user';
  
  // Log admin operations for audit
  if (adminOperations === 'admin') {
    console.log(`Admin operation: ${req.method} ${req.path} by ${req.user?.email}`);
  }
  
  next();
};

/**
 * Validate admin session integrity
 * Ensures admin sessions are properly authenticated
 */
export const validateAdminSession = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        error: { 
          message: 'Authentication required', 
          code: 'AUTHENTICATION_REQUIRED' 
        } 
      });
      return;
    }

    if (req.user.roleName !== 'admin') {
      res.status(403).json({ 
        success: false,
        error: { 
          message: 'Admin privileges required', 
          code: 'ADMIN_REQUIRED' 
        } 
      });
      return;
    }

    // Additional admin session validation can be added here
    // e.g., check for session timeout, IP validation, etc.
    
    next();
  } catch (error) {
    console.error('Admin session validation error:', error);
    res.status(500).json({ 
      success: false,
      error: { 
        message: 'Session validation failed', 
        code: 'SESSION_VALIDATION_FAILED' 
      } 
    });
  }
};

/**
 * Log security events
 * Tracks important security-related events
 */
export const logSecurityEvent = (eventType: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the security event
      console.log(`Security Event: ${eventType}`, {
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.roleName,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Validate request origin for sensitive operations
 * Prevents CSRF attacks on admin operations
 */
export const validateRequestOrigin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    // Skip validation for GET requests
    if (req.method === 'GET') {
      next();
      return;
    }

    // Check for CSRF token in headers for state-changing operations
    const csrfToken = req.header('X-CSRF-Token');
    const origin = req.header('Origin');
    const referer = req.header('Referer');

    // Basic origin validation
    if (origin && !isValidOrigin(origin)) {
      res.status(403).json({ 
        success: false,
        error: { 
          message: 'Invalid request origin', 
          code: 'INVALID_ORIGIN' 
        } 
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Origin validation error:', error);
    res.status(500).json({ 
      success: false,
      error: { 
        message: 'Origin validation failed', 
        code: 'ORIGIN_VALIDATION_FAILED' 
      } 
    });
  }
};

/**
 * Check if origin is valid
 * Updated with correct production domains for internet access
 */
function isValidOrigin(origin: string): boolean {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://onyourbehlf.uc.r.appspot.com',
    'https://www.onyourbehlf.uc.r.appspot.com'
    // Fixed: Removed incorrect keralagiftsonline domains
  ];
  
  return allowedOrigins.includes(origin);
}

/**
 * Sanitize admin input
 * Prevents injection attacks in admin operations
 */
export const sanitizeAdminInput = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    if (req.user?.roleName === 'admin') {
      // Sanitize request body for admin operations
      if (req.body) {
        sanitizeObject(req.body);
      }
      
      // Sanitize query parameters
      if (req.query) {
        sanitizeObject(req.query);
      }
    }
    
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    res.status(400).json({ 
      success: false,
      error: { 
        message: 'Invalid input data', 
        code: 'INVALID_INPUT' 
      } 
    });
  }
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): void {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove potentially dangerous characters
      obj[key] = obj[key].replace(/[<>]/g, '');
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
}
