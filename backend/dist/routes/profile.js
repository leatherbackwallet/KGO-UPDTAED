"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const index_1 = require("../models/index");
const hash_1 = require("../utils/hash");
const fileUpload_1 = require("../utils/fileUpload");
const router = express_1.default.Router();
const auth = require('../middleware/auth.js');
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
});
router.get('/', auth, async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
            });
        }
        const user = await index_1.User.findById(req.user.id)
            .select('-password')
            .populate('roleId', 'name description');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
        }
        return res.json({
            success: true,
            data: user
        });
    }
    catch (err) {
        console.error('Get profile error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
router.put('/', auth, async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
            });
        }
        const { firstName, lastName, phone } = req.body;
        if (!firstName || !lastName || !phone) {
            return res.status(400).json({
                success: false,
                error: { message: 'First name, last name, and phone are required', code: 'MISSING_FIELDS' }
            });
        }
        const user = await index_1.User.findByIdAndUpdate(req.user.id, { firstName, lastName, phone }, { new: true }).select('-password').populate('roleId', 'name description');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
        }
        return res.json({
            success: true,
            data: user
        });
    }
    catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
            });
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'No file uploaded', code: 'NO_FILE' }
            });
        }
        const user = await index_1.User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
        }
        if (user.avatar) {
            try {
                await (0, fileUpload_1.deleteImage)(user.avatar);
            }
            catch (deleteErr) {
                console.warn('Failed to delete old avatar:', deleteErr);
            }
        }
        const uploadResult = await (0, fileUpload_1.uploadImage)(req.file);
        user.avatar = uploadResult.filename;
        await user.save();
        return res.json({
            success: true,
            data: { avatar: uploadResult.filename }
        });
    }
    catch (err) {
        console.error('Upload avatar error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
router.delete('/avatar', auth, async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
            });
        }
        const user = await index_1.User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
        }
        if (user.avatar) {
            try {
                await (0, fileUpload_1.deleteImage)(user.avatar);
            }
            catch (deleteErr) {
                console.warn('Failed to delete avatar:', deleteErr);
            }
            user.avatar = undefined;
            await user.save();
        }
        return res.json({
            success: true,
            data: { message: 'Avatar deleted successfully' }
        });
    }
    catch (err) {
        console.error('Delete avatar error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
router.put('/password', auth, async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
            });
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: { message: 'Current password and new password are required', code: 'MISSING_FIELDS' }
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: { message: 'New password must be at least 6 characters long', code: 'INVALID_PASSWORD' }
            });
        }
        const user = await index_1.User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
        }
        const isMatch = await (0, hash_1.comparePassword)(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                error: { message: 'Current password is incorrect', code: 'INVALID_PASSWORD' }
            });
        }
        const hashedPassword = await (0, hash_1.hashPassword)(newPassword);
        user.password = hashedPassword;
        await user.save();
        return res.json({
            success: true,
            data: { message: 'Password changed successfully' }
        });
    }
    catch (err) {
        console.error('Change password error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
router.get('/addresses', auth, async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
            });
        }
        const user = await index_1.User.findById(req.user.id).select('recipientAddresses');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
        }
        return res.json({
            success: true,
            data: user.recipientAddresses || []
        });
    }
    catch (err) {
        console.error('Get addresses error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
router.post('/addresses', auth, async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
            });
        }
        const { name, phone, streetName, houseNumber, postalCode, city, countryCode = 'DE', additionalInstructions = '', isDefault = false } = req.body;
        if (!name || !phone || !streetName || !houseNumber || !postalCode || !city) {
            return res.status(400).json({
                success: false,
                error: { message: 'All address fields are required', code: 'MISSING_FIELDS' }
            });
        }
        if (postalCode && !/^[A-Z0-9\s-]{3,10}$/i.test(postalCode)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid postal code format', code: 'INVALID_POSTAL_CODE' }
            });
        }
        const user = await index_1.User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
        }
        if (!user.recipientAddresses) {
            user.recipientAddresses = [];
        }
        if (isDefault || user.recipientAddresses.length === 0) {
            user.recipientAddresses.forEach(addr => {
                addr.isDefault = false;
            });
        }
        user.recipientAddresses.push({
            name,
            phone,
            address: {
                streetName,
                houseNumber,
                postalCode,
                city,
                countryCode
            },
            additionalInstructions,
            isDefault: isDefault || user.recipientAddresses.length === 0
        });
        await user.save();
        return res.json({
            success: true,
            data: {
                message: 'Address added successfully',
                address: user.recipientAddresses[user.recipientAddresses.length - 1]
            }
        });
    }
    catch (err) {
        console.error('Add address error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
router.put('/addresses/:index', auth, async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
            });
        }
        const { index } = req.params;
        if (!index) {
            return res.status(400).json({
                success: false,
                error: { message: 'Index parameter is required', code: 'MISSING_PARAMETER' }
            });
        }
        const { name, phone, streetName, houseNumber, postalCode, city, countryCode = 'IN', additionalInstructions = '', isDefault = false } = req.body;
        if (!name || !phone || !streetName || !houseNumber || !postalCode || !city) {
            return res.status(400).json({
                success: false,
                error: { message: 'All address fields are required', code: 'MISSING_FIELDS' }
            });
        }
        if (postalCode && !/^[A-Z0-9\s-]{3,10}$/i.test(postalCode)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid postal code format', code: 'INVALID_POSTAL_CODE' }
            });
        }
        const user = await index_1.User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
        }
        const addressIndex = parseInt(index);
        if (!user.recipientAddresses || addressIndex < 0 || addressIndex >= user.recipientAddresses.length) {
            return res.status(404).json({
                success: false,
                error: { message: 'Address not found', code: 'ADDRESS_NOT_FOUND' }
            });
        }
        if (isDefault) {
            user.recipientAddresses.forEach(addr => {
                addr.isDefault = false;
            });
        }
        user.recipientAddresses[addressIndex] = {
            name,
            phone,
            address: {
                streetName,
                houseNumber,
                postalCode,
                city,
                countryCode
            },
            additionalInstructions,
            isDefault
        };
        await user.save();
        return res.json({
            success: true,
            data: { message: 'Address updated successfully' }
        });
    }
    catch (err) {
        console.error('Update address error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
router.delete('/addresses/:index', auth, async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
            });
        }
        const { index } = req.params;
        if (!index) {
            return res.status(400).json({
                success: false,
                error: { message: 'Index parameter is required', code: 'MISSING_PARAMETER' }
            });
        }
        const user = await index_1.User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
        }
        const addressIndex = parseInt(index);
        if (!user.recipientAddresses || addressIndex < 0 || addressIndex >= user.recipientAddresses.length) {
            return res.status(404).json({
                success: false,
                error: { message: 'Address not found', code: 'ADDRESS_NOT_FOUND' }
            });
        }
        user.recipientAddresses.splice(addressIndex, 1);
        if (user.recipientAddresses && user.recipientAddresses.length > 0 && !user.recipientAddresses.some(addr => addr.isDefault)) {
            if (user.recipientAddresses[0]) {
                user.recipientAddresses[0].isDefault = true;
            }
        }
        await user.save();
        return res.json({
            success: true,
            data: { message: 'Address deleted successfully' }
        });
    }
    catch (err) {
        console.error('Delete address error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
router.put('/addresses/:index/default', auth, async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
            });
        }
        const { index } = req.params;
        if (!index) {
            return res.status(400).json({
                success: false,
                error: { message: 'Index parameter is required', code: 'MISSING_PARAMETER' }
            });
        }
        const user = await index_1.User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
        }
        const addressIndex = parseInt(index);
        if (!user.recipientAddresses || addressIndex < 0 || addressIndex >= user.recipientAddresses.length) {
            return res.status(404).json({
                success: false,
                error: { message: 'Address not found', code: 'ADDRESS_NOT_FOUND' }
            });
        }
        user.recipientAddresses.forEach(addr => {
            addr.isDefault = false;
        });
        if (user.recipientAddresses && user.recipientAddresses[addressIndex]) {
            user.recipientAddresses[addressIndex].isDefault = true;
        }
        await user.save();
        return res.json({
            success: true,
            data: { message: 'Default address updated successfully' }
        });
    }
    catch (err) {
        console.error('Set default address error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=profile.js.map