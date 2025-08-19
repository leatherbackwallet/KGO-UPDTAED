"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../models/index");
const hash_1 = require("../utils/hash");
const { validate, sanitizeInput, schemas } = require('../middleware/validation');
const router = express_1.default.Router();
router.post('/register', sanitizeInput, validate(schemas.register), async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;
        if (!firstName || !lastName || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                error: { message: 'First name, last name, email, password, and phone are required', code: 'MISSING_FIELDS' }
            });
        }
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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Please enter a valid email address', code: 'INVALID_EMAIL' }
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: { message: 'Password must be at least 6 characters long', code: 'INVALID_PASSWORD' }
            });
        }
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
        if (!phoneRegex.test(trimmedPhone)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Please enter a valid phone number', code: 'INVALID_PHONE' }
            });
        }
        const existingUser = await index_1.User.findOne({ email: trimmedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: { message: 'Email already in use. Please use a different email or try logging in.', code: 'EMAIL_EXISTS' }
            });
        }
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
        const hashedPassword = await (0, hash_1.hashPassword)(password);
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
            console.log(`New user created successfully: ${user.email} (${user._id})`);
        }
        catch (createError) {
            console.error('Error creating user:', createError);
            if (createError.code === 11000) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Email already in use. Please use a different email.', code: 'EMAIL_EXISTS' }
                });
            }
            return res.status(500).json({
                success: false,
                error: { message: 'Failed to create user account. Please try again.', code: 'USER_CREATION_FAILED' }
            });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            email: user.email,
            roleId: user.roleId,
            firstName: user.firstName,
            lastName: user.lastName
        }, process.env.JWT_SECRET || '', { expiresIn: '7d' });
        return res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    roleId: user.roleId,
                    roleName: 'customer'
                }
            }
        });
    }
    catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error occurred. Please try again later.', code: 'SERVER_ERROR' }
        });
    }
});
router.post('/login', sanitizeInput, validate(schemas.login), async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: { message: 'Email and password are required', code: 'MISSING_FIELDS' }
            });
        }
        const trimmedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Please enter a valid email address', code: 'INVALID_EMAIL' }
            });
        }
        const user = await index_1.User.findOne({ email: trimmedEmail, isActive: true, isDeleted: false })
            .populate('roleId');
        if (!user) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' }
            });
        }
        const isMatch = await (0, hash_1.comparePassword)(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' }
            });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            email: user.email,
            roleId: user.roleId,
            firstName: user.firstName,
            lastName: user.lastName
        }, process.env.JWT_SECRET || '', { expiresIn: '7d' });
        return res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    roleId: user.roleId,
                    roleName: user.roleId?.name || 'customer'
                }
            }
        });
    }
    catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error occurred. Please try again later.', code: 'SERVER_ERROR' }
        });
    }
});
router.post('/guest', async (req, res) => {
    try {
        const { name, email, phone, deliveryAddress, paymentMethod } = req.body;
        if (!name || !email || !phone || !deliveryAddress) {
            return res.status(400).json({
                success: false,
                error: { message: 'Name, email, phone, and delivery address are required', code: 'MISSING_FIELDS' }
            });
        }
        let user = await index_1.User.findOne({ email }).populate('roleId');
        if (user) {
            const addressExists = user.recipientAddresses?.some(addr => addr.address.streetName === deliveryAddress.street &&
                addr.address.houseNumber === deliveryAddress.houseNumber &&
                addr.address.city === deliveryAddress.city);
            if (!addressExists) {
                const nameParts = name.trim().split(' ');
                const firstName = nameParts[0] || name;
                const lastName = nameParts.slice(1).join(' ') || 'Guest';
                const newAddress = {
                    name: `${firstName} ${lastName}`,
                    phone: phone,
                    address: {
                        streetName: deliveryAddress.street,
                        houseNumber: deliveryAddress.houseNumber,
                        postalCode: deliveryAddress.zipCode,
                        city: deliveryAddress.city,
                        countryCode: deliveryAddress.country || 'IN'
                    },
                    isDefault: user.recipientAddresses?.length === 0
                };
                user.recipientAddresses = user.recipientAddresses || [];
                user.recipientAddresses.push(newAddress);
                await user.save();
            }
            const token = jsonwebtoken_1.default.sign({
                id: user._id,
                roleId: user.roleId
            }, process.env.JWT_SECRET || '', { expiresIn: '7d' });
            return res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone,
                        roleId: user.roleId,
                        roleName: user.roleId?.name
                    }
                }
            });
        }
        let guestRole = await index_1.Role.findOne({ name: 'customer' });
        if (!guestRole) {
            guestRole = await index_1.Role.create({
                name: 'customer',
                description: 'Customer user',
                permissions: ['read_products', 'create_orders']
            });
        }
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || name;
        const lastName = nameParts.slice(1).join(' ') || 'Guest';
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await (0, hash_1.hashPassword)(randomPassword);
        user = await index_1.User.create({
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            roleId: guestRole._id,
            recipientAddresses: [{
                    name: `${firstName} ${lastName}`,
                    phone: phone,
                    address: {
                        streetName: deliveryAddress.street,
                        houseNumber: deliveryAddress.houseNumber,
                        postalCode: deliveryAddress.zipCode,
                        city: deliveryAddress.city,
                        countryCode: deliveryAddress.country || 'IN'
                    },
                    isDefault: true
                }]
        });
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            roleId: user.roleId
        }, process.env.JWT_SECRET || '', { expiresIn: '7d' });
        return res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    roleId: user.roleId,
                    roleName: user.roleId?.name,
                    isGuest: true
                }
            }
        });
    }
    catch (err) {
        console.error('Guest checkout error:', err);
        console.error('Error details:', JSON.stringify(err, null, 2));
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map