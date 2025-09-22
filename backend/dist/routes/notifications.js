"use strict";
/**
 * Notifications Routes - Admin notification management
 * Handles notification creation, retrieval, and management for admin users
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const database_1 = require("../middleware/database");
const notifications_model_1 = require("../models/notifications.model");
const router = express_1.default.Router();
// Get unread notifications count for admin
router.get('/unread-count', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const userId = req.user.id;
        const unreadCount = await notifications_model_1.Notification.countDocuments({
            recipientId: userId,
            isRead: false
        });
        return res.json({
            success: true,
            data: { unreadCount }
        });
    }
    catch (err) {
        console.error('Error fetching unread notifications count:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error' }
        });
    }
});
// Get all notifications for admin
router.get('/', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        const query = { recipientId: userId };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }
        const notifications = await notifications_model_1.Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('recipientId', 'firstName lastName email');
        const total = await notifications_model_1.Notification.countDocuments(query);
        return res.json({
            success: true,
            data: {
                notifications,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });
    }
    catch (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error' }
        });
    }
});
// Mark notification as read
router.put('/:id/read', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;
        const notification = await notifications_model_1.Notification.findOneAndUpdate({ _id: notificationId, recipientId: userId }, { isRead: true }, { new: true });
        if (!notification) {
            return res.status(404).json({
                success: false,
                error: { message: 'Notification not found' }
            });
        }
        return res.json({
            success: true,
            data: notification
        });
    }
    catch (err) {
        console.error('Error marking notification as read:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error' }
        });
    }
});
// Mark all notifications as read for admin
router.put('/mark-all-read', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await notifications_model_1.Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });
        return res.json({
            success: true,
            data: {
                modifiedCount: result.modifiedCount,
                message: `Marked ${result.modifiedCount} notifications as read`
            }
        });
    }
    catch (err) {
        console.error('Error marking all notifications as read:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error' }
        });
    }
});
// Delete notification
router.delete('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;
        const notification = await notifications_model_1.Notification.findOneAndDelete({
            _id: notificationId,
            recipientId: userId
        });
        if (!notification) {
            return res.status(404).json({
                success: false,
                error: { message: 'Notification not found' }
            });
        }
        return res.json({
            success: true,
            data: { message: 'Notification deleted successfully' }
        });
    }
    catch (err) {
        console.error('Error deleting notification:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error' }
        });
    }
});
exports.default = router;
