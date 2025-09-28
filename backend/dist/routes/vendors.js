"use strict";
/**
 * Vendors Routes - Vendor management and operations
 * Handles vendor listing and management for admin users
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const vendors_model_1 = require("../models/vendors.model");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const router = express_1.default.Router();
// GET /api/vendors - Get all active vendors
router.get('/', async (req, res) => {
    try {
        const vendors = await vendors_model_1.Vendor.find({ status: 'active' }).select('storeName _id');
        res.json(vendors);
    }
    catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ success: false, error: { message: 'Failed to fetch vendors', code: 'FETCH_ERROR' } });
    }
});
// GET /api/vendors/all - Get all vendors (admin only)
router.get('/all', auth_1.auth, (0, role_1.requireRole)('admin'), async (req, res) => {
    try {
        const vendors = await vendors_model_1.Vendor.find().select('storeName _id status');
        res.json(vendors);
    }
    catch (error) {
        console.error('Error fetching all vendors:', error);
        res.status(500).json({ success: false, error: { message: 'Failed to fetch vendors', code: 'FETCH_ERROR' } });
    }
});
exports.default = router;
