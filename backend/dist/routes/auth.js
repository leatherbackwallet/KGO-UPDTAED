"use strict";
/**
 * Authentication Routes
 * Handles user registration, login, logout, and guest checkout
 */
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
        const { firstName, lastName, email, password, phone, userAddress, recipientName, recipientPhone, deliveryAddress, specialInstructions } = req.body;
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
        // Validate user address if provided
        if (userAddress) {
            if (!userAddress.street || !userAddress.city || !userAddress.state || !userAddress.zipCode) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'User address information is incomplete', code: 'INCOMPLETE_USER_ADDRESS' }
                });
            }
        }
        // Validate recipient information if provided
        if (recipientName && !recipientPhone) {
            return res.status(400).json({
                success: false,
                error: { message: 'Recipient phone number is required when recipient name is provided', code: 'MISSING_RECIPIENT_PHONE' }
            });
        }
        if (recipientPhone && !recipientName) {
            return res.status(400).json({
                success: false,
                error: { message: 'Recipient name is required when recipient phone is provided', code: 'MISSING_RECIPIENT_NAME' }
            });
        }
        // Validate delivery address if provided
        if (deliveryAddress) {
            if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Delivery address information is incomplete', code: 'INCOMPLETE_DELIVERY_ADDRESS' }
                });
            }
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
        // Prepare user address data
        const userAddressData = userAddress ? {
            streetName: userAddress.street,
            houseNumber: userAddress.houseNumber,
            postalCode: userAddress.zipCode,
            city: userAddress.city,
            state: userAddress.state,
            countryCode: userAddress.country || 'IN'
        } : undefined;
        // Prepare recipient address data if provided
        const recipientAddressData = (recipientName && recipientPhone && deliveryAddress) ? [{
                name: recipientName,
                phone: recipientPhone,
                address: {
                    streetName: deliveryAddress.street,
                    houseNumber: deliveryAddress.houseNumber,
                    postalCode: deliveryAddress.zipCode,
                    city: deliveryAddress.city,
                    countryCode: deliveryAddress.country || 'IN'
                },
                additionalInstructions: specialInstructions || '',
                isDefault: true
            }] : undefined;
        // Create new user with proper error handling
        let user;
        try {
            const userData = {
                firstName: trimmedFirstName,
                lastName: trimmedLastName,
                email: trimmedEmail,
                password: hashedPassword,
                phone: trimmedPhone,
                roleId: customerRole._id,
                isActive: true
            };
            // Add address data if provided
            if (userAddressData) {
                userData.userAddress = userAddressData;
            }
            if (recipientAddressData) {
                userData.recipientAddresses = recipientAddressData;
            }
            user = await index_1.User.create(userData);
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
            roleName: 'customer', // Default role for new users
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
            roleName: user.roleId.name || 'customer',
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
            roleName: decoded.roleName, // Use roleName from decoded token
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
/**
 * Guest Checkout Route
 * Creates temporary guest user for checkout without registration
 * Guest users can place orders but don't have persistent accounts
 */
router.post('/guest', validation_1.sanitizeInput, database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const { fullName, email, phone, address, recipientName, recipientPhone, deliveryAddress, specialInstructions } = req.body;
        // Validate required fields
        if (!fullName || !email || !phone) {
            return res.status(400).json({
                success: false,
                error: { message: 'Full name, email, and phone are required', code: 'MISSING_FIELDS' }
            });
        }
        // Validate recipient information
        if (!recipientName || !recipientPhone) {
            return res.status(400).json({
                success: false,
                error: { message: 'Recipient name and phone are required', code: 'MISSING_RECIPIENT_INFO' }
            });
        }
        // Validate delivery address
        if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode) {
            return res.status(400).json({
                success: false,
                error: { message: 'Complete delivery address is required', code: 'MISSING_DELIVERY_ADDRESS' }
            });
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim().toLowerCase())) {
            return res.status(400).json({
                success: false,
                error: { message: 'Please enter a valid email address', code: 'INVALID_EMAIL' }
            });
        }
        // Create guest user data (don't save to database)
        const guestUser = {
            _id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            firstName: fullName.split(' ')[0] || fullName,
            lastName: fullName.split(' ').slice(1).join(' ') || '',
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            role: 'guest',
            isGuest: true,
            userAddress: address ? {
                streetName: address.streetName || address.street,
                houseNumber: address.houseNumber,
                postalCode: address.postalCode || address.zipCode,
                city: address.city,
                state: address.state,
                countryCode: address.countryCode || address.country || 'IN'
            } : undefined,
            recipientInfo: {
                name: recipientName,
                phone: recipientPhone,
                address: {
                    streetName: deliveryAddress.street,
                    houseNumber: deliveryAddress.houseNumber,
                    postalCode: deliveryAddress.zipCode,
                    city: deliveryAddress.city,
                    state: deliveryAddress.state,
                    countryCode: deliveryAddress.country || 'IN'
                },
                specialInstructions: specialInstructions || ''
            },
            createdAt: new Date()
        };
        // Generate temporary tokens for guest user
        const tokens = (0, jwt_1.generateTokenPair)({
            id: guestUser._id,
            email: guestUser.email,
            roleId: 'guest',
            roleName: 'customer', // Guest users have customer role
            firstName: guestUser.firstName,
            lastName: guestUser.lastName
        });
        res.json({
            success: true,
            data: {
                user: guestUser,
                tokens: tokens
            }
        });
    }
    catch (err) {
        console.error('Guest authentication error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error during guest authentication', code: 'SERVER_ERROR' }
        });
    }
});
exports.default = router;
