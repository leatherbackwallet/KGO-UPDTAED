/**
 * Input Validation Middleware
 * Sanitizes and validates incoming request data
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Common validation schemas
const emailSchema = z.string().email('Invalid email format').toLowerCase().trim();
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
const phoneSchema = z.string().regex(/^[\+]?[0-9\s\-\(\)]{8,}$/, 'Invalid phone number format');

// User registration validation
export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').trim(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').trim(),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema
});

// User login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Token refresh validation
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Product creation validation
export const productSchema = z.object({
  name: z.object({
    en: z.string().min(1, 'English name is required'),
    ml: z.string().min(1, 'Malayalam name is required')
  }),
  description: z.object({
    en: z.string().min(1, 'English description is required'),
    ml: z.string().min(1, 'Malayalam description is required')
  }),
  price: z.number().int('Price must be a whole number').min(0, 'Price cannot be negative'),
  categories: z.array(z.string()).optional(),
  stock: z.number().min(0, 'Stock cannot be negative').optional(),
  occasions: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional()
});

interface ValidationError {
  field: string;
  message: string;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: ValidationError[];
  };
}

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        const response: ErrorResponse = {
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors
          }
        };
        
        res.status(400).json(response);
        return;
      }
      
      const response: ErrorResponse = {
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR'
        }
      };
      
      res.status(500).json(response);
    }
  };
};

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize string inputs
  const sanitizeString = (str: any): any => {
    if (typeof str !== 'string') return str;
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  };

  // Recursively sanitize object
  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = typeof value === 'string' ? sanitizeString(value) : sanitizeObject(value);
    }
    return sanitized;
  };

  // Sanitize request body, query, and params
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  
  next();
};

export const schemas = {
  register: registerSchema,
  login: loginSchema,
  refresh: refreshSchema,
  product: productSchema
};
