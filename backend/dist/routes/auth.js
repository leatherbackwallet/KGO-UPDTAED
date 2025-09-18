"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../models/index");
const hash_1 = require("../utils/hash");
const jwt_1 = require("../utils/jwt");
const database_1 = require("../middleware/database");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// Register
router.post('/register', validation_1.sanitizeInput, (0, validation_1.validate)(validation_1.schemas.register), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;
        // Enhanced validation
        if (!firstName || !lastName || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                error: { message: 'First name, last name, email, password, and phone are required', code: 'MISSING_FIELDS' }
            });
        }
        // Trim and validate input
        const trimmedFirstName = firstName.trim();
        const trimmedLastName = lastName.trim();
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPhone = phone.trim();
        if (trimmedFirstName.length < 2) {
            return res.status(400).json({
                success: false,
                error: { message: 'First name must be at least 2 characters long', code: 'INVALID_FIRST_NAME' }
            });
        }
        if (trimmedLastName.length < 2) {
            return res.status(400).json({
                success: false,
                error: { message: 'Last name must be at least 2 characters long', code: 'INVALID_LAST_NAME' }
            });
        }
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Please enter a valid email address', code: 'INVALID_EMAIL' }
            });
        }
        // Enhanced password validation
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                error: { message: 'Password must be at least 8 characters long', code: 'INVALID_PASSWORD' }
            });
        }
        // Password complexity validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                    code: 'INVALID_PASSWORD_COMPLEXITY'
                }
            });
        }
        // Phone validation (basic)
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
        if (!phoneRegex.test(trimmedPhone)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Please enter a valid phone number', code: 'INVALID_PHONE' }
            });
        }
        // Check if user exists
        const existingUser = await index_1.User.findOne({ email: trimmedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: { message: 'Email already in use. Please use a different email or try logging in.', code: 'EMAIL_EXISTS' }
            });
        }
        // Get or create customer role
        let customerRole = await index_1.Role.findOne({ name: 'customer' });
        if (!customerRole) {
            console.log('Customer role not found, creating it...');
            customerRole = await index_1.Role.create({
                name: 'customer',
                description: 'Regular customer with basic permissions',
                permissions: [
                    'view_products',
                    'place_orders',
                    'view_own_orders',
                    'manage_wishlist',
                    'manage_profile',
                    'view_categories'
                ],
                isActive: true
            });
            console.log('Customer role created successfully');
        }
        // Hash password
        const hashedPassword = await (0, hash_1.hashPassword)(password);
        // Create new user with proper error handling
        let user;
        try {
            user = await index_1.User.create({
                firstName: trimmedFirstName,
                lastName: trimmedLastName,
                email: trimmedEmail,
                password: hashedPassword,
                phone: trimmedPhone,
                roleId: customerRole._id,
                isActive: true
            });
        }
        catch (createError) {
            console.error('User creation error:', createError);
            return res.status(500).json({
                success: false,
                error: { message: 'Failed to create user account', code: 'USER_CREATION_FAILED' }
            });
        }
        // Generate token pair
        const tokenPair = (0, jwt_1.generateTokenPair)({
            id: user._id.toString(),
            email: user.email,
            roleId: user.roleId.toString(),
            firstName: user.firstName,
            lastName: user.lastName
        });
        return res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    roleId: user.roleId,
                    roleName: 'customer'
                },
                tokens: tokenPair
            }
        });
    }
    catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error during registration', code: 'SERVER_ERROR' }
        });
    }
});
// Login
router.post('/login', validation_1.sanitizeInput, (0, validation_1.validate)(validation_1.schemas.login), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const { email, password } = req.body;
        // Enhanced validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: { message: 'Email and password are required', code: 'MISSING_FIELDS' }
            });
        }
        const trimmedEmail = email.trim().toLowerCase();
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Please enter a valid email address', code: 'INVALID_EMAIL' }
            });
        }
        // Find user with populated role
        const user = await index_1.User.findOne({ email: trimmedEmail, isActive: true, isDeleted: false })
            .populate('roleId');
        if (!user) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' }
            });
        }
        // Verify password
        const isMatch = await (0, hash_1.comparePassword)(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' }
            });
        }
        // Generate token pair
        const tokenPair = (0, jwt_1.generateTokenPair)({
            id: user._id.toString(),
            email: user.email,
            roleId: user.roleId._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName
        });
        return res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    roleId: user.roleId,
                    roleName: user.roleId?.name || 'customer'
                },
                tokens: tokenPair
            }
        });
    }
    catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error during login', code: 'SERVER_ERROR' }
        });
    }
});
// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: { message: 'Refresh token is required', code: 'MISSING_REFRESH_TOKEN' }
            });
        }
        const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' }
            });
        }
        // Generate new token pair
        const tokenPair = (0, jwt_1.generateTokenPair)({
            id: decoded.id,
            email: decoded.email,
            roleId: decoded.roleId,
            firstName: decoded.firstName,
            lastName: decoded.lastName
        });
        return res.json({
            success: true,
            data: {
                tokens: tokenPair
            }
        });
    }
    catch (err) {
        console.error('Token refresh error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error during token refresh', code: 'SERVER_ERROR' }
        });
    }
});
// Logout
router.post('/logout', async (req, res) => {
    try {
        // In a production environment, you might want to blacklist the refresh token
        // For now, we'll just return a success response
        return res.json({
            success: true,
            data: { message: 'Logged out successfully' }
        });
    }
    catch (err) {
        console.error('Logout error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error during logout', code: 'SERVER_ERROR' }
        });
    }
});
exports.default = router;
