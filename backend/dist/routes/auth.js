"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../models/index");
const hash_1 = require("../utils/hash");
const router = express_1.default.Router();
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;
        if (!firstName || !lastName || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                error: { message: 'First name, last name, email, password, and phone are required', code: 'MISSING_FIELDS' }
            });
        }
        const existingUser = await index_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: { message: 'Email already in use', code: 'EMAIL_EXISTS' }
            });
        }
        const customerRole = await index_1.Role.findOne({ name: 'customer' });
        if (!customerRole) {
            return res.status(500).json({
                success: false,
                error: { message: 'Customer role not found', code: 'ROLE_NOT_FOUND' }
            });
        }
        const hashed = await (0, hash_1.hashPassword)(password);
        const user = await index_1.User.create({
            firstName,
            lastName,
            email,
            password: hashed,
            phone,
            roleId: customerRole._id
        });
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            roleId: user.roleId
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
                    roleId: user.roleId
                }
            }
        });
    }
    catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: { message: 'Email and password are required', code: 'MISSING_FIELDS' }
            });
        }
        const user = await index_1.User.findOne({ email }).populate('roleId');
        if (!user) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
            });
        }
        const isMatch = await (0, hash_1.comparePassword)(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
            });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            roleId: user.roleId
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
    catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
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
            const token = jsonwebtoken_1.default.sign({
                id: user._id,
                roleId: user.roleId
            }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
            roleId: guestRole._id
        });
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            roleId: user.roleId
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
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