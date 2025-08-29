/**
 * Input Validation Middleware
 * Sanitizes and validates incoming request data
 */

const { z } = require('zod');

// Common validation schemas
const emailSchema = z.string().email('Invalid email format').toLowerCase().trim();
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
const phoneSchema = z.string().regex(/^[\+]?[0-9\s\-\(\)]{8,}$/, 'Invalid phone number format');

// User registration validation
const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').trim(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').trim(),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema
});

// User login validation
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Token refresh validation
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Product creation validation
const productSchema = z.object({
  name: z.object({
    en: z.string().min(1, 'English name is required'),
    ml: z.string().min(1, 'Malayalam name is required')
  }),
  description: z.object({
    en: z.string().min(1, 'English description is required'),
    ml: z.string().min(1, 'Malayalam description is required')
  }),
  price: z.number().min(0, 'Price cannot be negative'),
  categories: z.array(z.string()).optional(),
  stock: z.number().min(0, 'Stock cannot be negative').optional(),
  occasions: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional()
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR'
        }
      });
    }
  };
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
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

module.exports = {
  validate,
  sanitizeInput,
  schemas: {
    register: registerSchema,
    login: loginSchema,
    refresh: refreshSchema,
    product: productSchema
  }
}; 