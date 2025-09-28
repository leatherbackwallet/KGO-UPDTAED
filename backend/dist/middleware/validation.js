"use strict";
/**
 * Input Validation Middleware
 * Sanitizes and validates incoming request data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.sanitizeInput = exports.validate = exports.productSchema = exports.refreshSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// Common validation schemas
const emailSchema = zod_1.z.string().email('Invalid email format').toLowerCase().trim();
const passwordSchema = zod_1.z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
const phoneSchema = zod_1.z.string().regex(/^[\+]?[0-9\s\-\(\)]{8,}$/, 'Invalid phone number format');
// User registration validation
exports.registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters').trim(),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters').trim(),
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema,
    userAddress: zod_1.z.object({
        street: zod_1.z.string().min(1, 'Street is required'),
        houseNumber: zod_1.z.string().optional(),
        city: zod_1.z.string().min(1, 'City is required'),
        state: zod_1.z.string().min(1, 'State is required'),
        zipCode: zod_1.z.string().min(1, 'ZIP code is required'),
        country: zod_1.z.string().optional()
    }).optional(),
    recipientName: zod_1.z.string().optional(),
    recipientPhone: zod_1.z.string().optional(),
    deliveryAddress: zod_1.z.object({
        street: zod_1.z.string().min(1, 'Street is required'),
        houseNumber: zod_1.z.string().optional(),
        city: zod_1.z.string().min(1, 'City is required'),
        state: zod_1.z.string().min(1, 'State is required'),
        zipCode: zod_1.z.string().min(1, 'ZIP code is required'),
        country: zod_1.z.string().optional()
    }).optional(),
    specialInstructions: zod_1.z.string().optional()
});
// User login validation
exports.loginSchema = zod_1.z.object({
    email: emailSchema,
    password: zod_1.z.string().min(1, 'Password is required')
});
// Token refresh validation
exports.refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required')
});
// Product creation validation
exports.productSchema = zod_1.z.object({
    name: zod_1.z.object({
        en: zod_1.z.string().min(1, 'English name is required'),
        ml: zod_1.z.string().min(1, 'Malayalam name is required')
    }),
    description: zod_1.z.object({
        en: zod_1.z.string().min(1, 'English description is required'),
        ml: zod_1.z.string().min(1, 'Malayalam description is required')
    }),
    price: zod_1.z.number().int('Price must be a whole number').min(0, 'Price cannot be negative'),
    categories: zod_1.z.array(zod_1.z.string()).optional(),
    stock: zod_1.z.number().min(0, 'Stock cannot be negative').optional(),
    occasions: zod_1.z.array(zod_1.z.string()).optional(),
    isFeatured: zod_1.z.boolean().optional()
});
// Validation middleware factory
const validate = (schema) => {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                const response = {
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
            const response = {
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
exports.validate = validate;
// Sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Sanitize string inputs
    const sanitizeString = (str) => {
        if (typeof str !== 'string')
            return str;
        return str
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, ''); // Remove event handlers
    };
    // Recursively sanitize object
    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null)
            return obj;
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
    if (req.body)
        req.body = sanitizeObject(req.body);
    if (req.query)
        req.query = sanitizeObject(req.query);
    if (req.params)
        req.params = sanitizeObject(req.params);
    next();
};
exports.sanitizeInput = sanitizeInput;
exports.schemas = {
    register: exports.registerSchema,
    login: exports.loginSchema,
    refresh: exports.refreshSchema,
    product: exports.productSchema
};
