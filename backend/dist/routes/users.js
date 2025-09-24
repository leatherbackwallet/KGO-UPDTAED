"use strict";
/**
 * Users Routes - User management and administration
 * Handles user operations for admin users
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_model_1 = require("../models/users.model");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const apiSecurity_1 = require("../middleware/apiSecurity");
const router = express_1.default.Router();
// Get all users (admin only)
router.get('/', auth_1.auth, (0, role_1.requireRole)('admin'), apiSecurity_1.validateAdminSession, apiSecurity_1.adminRateLimit, (0, apiSecurity_1.logSecurityEvent)('USER_LIST_ACCESS'), async (req, res) => {
    try {
        const users = await users_model_1.User.find({}, '-password').populate('roleId');
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
