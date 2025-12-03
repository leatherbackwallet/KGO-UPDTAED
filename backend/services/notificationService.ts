/**
 * Notification Service - Handles notification creation and management
 * Provides utilities for creating system notifications for admin users
 * 
 * NOTE: Notification model has been removed. This service is now a stub.
 * TODO: Re-implement notifications if needed or remove this service entirely.
 */

// import { Notification } from '../models/notifications.model';
// import { User } from '../models/users.model'; // Not needed in stub

export interface CreateNotificationData {
  recipientId: string;
  title: string;
  message?: string;
  link?: string;
}

export class NotificationService {
  /**
   * Create a notification for a specific user
   * STUB: Notification model removed, returns empty result
   */
  static async createNotification(data: CreateNotificationData) {
    console.log('[NotificationService] Stub: createNotification called (notifications disabled)');
    return null;
  }

  /**
   * Create notifications for all admin users
   * STUB: Notification model removed, returns empty array
   */
  static async createNotificationForAllAdmins(data: Omit<CreateNotificationData, 'recipientId'>) {
    console.log('[NotificationService] Stub: createNotificationForAllAdmins called (notifications disabled)');
    return [];
  }

  /**
   * Create a new order notification for all admins
   * STUB: Notification model removed, returns empty array
   */
  static async createNewOrderNotification(orderData: {
    orderId: string;
    customerName: string;
    totalPrice: number;
    orderStatus: string;
  }) {
    console.log('[NotificationService] Stub: createNewOrderNotification called (notifications disabled)');
    return [];
  }

  /**
   * Get unread notifications count for a user
   * STUB: Notification model removed, returns 0
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return 0;
  }

  /**
   * Mark notification as read
   * STUB: Notification model removed, returns null
   */
  static async markAsRead(notificationId: string, userId: string) {
    return null;
  }

  /**
   * Mark all notifications as read for a user
   * STUB: Notification model removed, returns empty result
   */
  static async markAllAsRead(userId: string) {
    return { acknowledged: true, modifiedCount: 0 };
  }
}
