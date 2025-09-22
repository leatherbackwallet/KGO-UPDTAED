/**
 * Notification Service - Handles notification creation and management
 * Provides utilities for creating system notifications for admin users
 */

import { Notification } from '../models/notifications.model';
import { User } from '../models/users.model';

export interface CreateNotificationData {
  recipientId: string;
  title: string;
  message?: string;
  link?: string;
}

export class NotificationService {
  /**
   * Create a notification for a specific user
   */
  static async createNotification(data: CreateNotificationData) {
    try {
      const notification = new Notification({
        recipientId: data.recipientId,
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: false
      });

      return await notification.save();
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for all admin users
   */
  static async createNotificationForAllAdmins(data: Omit<CreateNotificationData, 'recipientId'>) {
    try {
      // Find all admin users
      const adminUsers = await User.find({ 
        role: 'admin',
        isDeleted: false 
      }).select('_id');

      if (adminUsers.length === 0) {
        console.log('No admin users found to notify');
        return [];
      }

      // Create notifications for all admins
      const notifications = await Promise.all(
        adminUsers.map(admin => 
          this.createNotification({
            ...data,
            recipientId: admin._id.toString()
          })
        )
      );

      console.log(`Created ${notifications.length} notifications for admin users`);
      return notifications;
    } catch (error) {
      console.error('Error creating notifications for all admins:', error);
      throw error;
    }
  }

  /**
   * Create a new order notification for all admins
   */
  static async createNewOrderNotification(orderData: {
    orderId: string;
    customerName: string;
    totalPrice: number;
    orderStatus: string;
  }) {
    try {
      const title = 'New Order Received';
      const message = `New order #${orderData.orderId} from ${orderData.customerName} for ₹${orderData.totalPrice.toFixed(2)}`;
      const link = `/admin?tab=orders`;

      return await this.createNotificationForAllAdmins({
        title,
        message,
        link
      });
    } catch (error) {
      console.error('Error creating new order notification:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.countDocuments({ 
        recipientId: userId, 
        isRead: false 
      });
    } catch (error) {
      console.error('Error getting unread notifications count:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      return await Notification.findOneAndUpdate(
        { _id: notificationId, recipientId: userId },
        { isRead: true },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    try {
      return await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { isRead: true }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}
