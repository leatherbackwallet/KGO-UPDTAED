/**
 * Notifications Routes - Admin notification management
 * Handles notification creation, retrieval, and management for admin users
 */

import express from 'express';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { ensureDatabaseConnection } from '../middleware/database';
import { Notification } from '../models/notifications.model';
import { User } from '../models/users.model';

const router = express.Router();

// Get unread notifications count for admin
router.get('/unread-count', auth, requireRole('admin'), ensureDatabaseConnection, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const unreadCount = await Notification.countDocuments({ 
      recipientId: userId, 
      isRead: false 
    });
    
    return res.json({ 
      success: true, 
      data: { unreadCount } 
    });
  } catch (err) {
    console.error('Error fetching unread notifications count:', err);
    return res.status(500).json({ 
      success: false, 
      error: { message: 'Server error' } 
    });
  }
});

// Get all notifications for admin
router.get('/', auth, requireRole('admin'), ensureDatabaseConnection, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query: any = { recipientId: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('recipientId', 'firstName lastName email');
    
    const total = await Notification.countDocuments(query);
    
    return res.json({ 
      success: true, 
      data: { 
        notifications, 
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total 
      } 
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ 
      success: false, 
      error: { message: 'Server error' } 
    });
  }
});

// Mark notification as read
router.put('/:id/read', auth, requireRole('admin'), ensureDatabaseConnection, async (req: any, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { isRead: true },
      { new: true }
    );
    
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
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return res.status(500).json({ 
      success: false, 
      error: { message: 'Server error' } 
    });
  }
});

// Mark all notifications as read for admin
router.put('/mark-all-read', auth, requireRole('admin'), ensureDatabaseConnection, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true }
    );
    
    return res.json({ 
      success: true, 
      data: { 
        modifiedCount: result.modifiedCount,
        message: `Marked ${result.modifiedCount} notifications as read`
      } 
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    return res.status(500).json({ 
      success: false, 
      error: { message: 'Server error' } 
    });
  }
});

// Delete notification
router.delete('/:id', auth, requireRole('admin'), ensureDatabaseConnection, async (req: any, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    const notification = await Notification.findOneAndDelete({
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
  } catch (err) {
    console.error('Error deleting notification:', err);
    return res.status(500).json({ 
      success: false, 
      error: { message: 'Server error' } 
    });
  }
});

export default router;
