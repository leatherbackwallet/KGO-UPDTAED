"use strict";
/**
 * Notification Service - Handles notification creation and management
 * Provides utilities for creating system notifications for admin users
 *
 * NOTE: Notification model has been removed. This service is now a stub.
 * TODO: Re-implement notifications if needed or remove this service entirely.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
class NotificationService {
    /**
     * Create a notification for a specific user
     * STUB: Notification model removed, returns empty result
     */
    static async createNotification(data) {
        console.log('[NotificationService] Stub: createNotification called (notifications disabled)');
        return null;
    }
    /**
     * Create notifications for all admin users
     * STUB: Notification model removed, returns empty array
     */
    static async createNotificationForAllAdmins(data) {
        console.log('[NotificationService] Stub: createNotificationForAllAdmins called (notifications disabled)');
        return [];
    }
    /**
     * Create a new order notification for all admins
     * STUB: Notification model removed, returns empty array
     */
    static async createNewOrderNotification(orderData) {
        console.log('[NotificationService] Stub: createNewOrderNotification called (notifications disabled)');
        return [];
    }
    /**
     * Get unread notifications count for a user
     * STUB: Notification model removed, returns 0
     */
    static async getUnreadCount(userId) {
        return 0;
    }
    /**
     * Mark notification as read
     * STUB: Notification model removed, returns null
     */
    static async markAsRead(notificationId, userId) {
        return null;
    }
    /**
     * Mark all notifications as read for a user
     * STUB: Notification model removed, returns empty result
     */
    static async markAllAsRead(userId) {
        return { acknowledged: true, modifiedCount: 0 };
    }
}
exports.NotificationService = NotificationService;
