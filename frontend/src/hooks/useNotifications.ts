/**
 * useNotifications Hook - Manages notification state and operations
 * Provides functionality to fetch, read, and manage admin notifications
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export interface Notification {
  _id: string;
  recipientId: string;
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    totalPages: number;
    currentPage: number;
    total: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch unread notifications count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (err: any) {
      console.error('Error fetching unread notifications count:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch unread count');
    }
  }, []);

  // Fetch all notifications
  const fetchNotifications = useCallback(async (page: number = 1, limit: number = 20, unreadOnly: boolean = false) => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString()
      });
      
      const response = await api.get<NotificationResponse>(`/notifications?${params}`);
      
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        return response.data.data;
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      
      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        return true;
      }
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      setError(err.response?.data?.error?.message || 'Failed to mark notification as read');
    }
    return false;
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await api.put('/notifications/mark-all-read');
      
      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        
        // Reset unread count
        setUnreadCount(0);
        
        return true;
      }
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      setError(err.response?.data?.error?.message || 'Failed to mark all notifications as read');
    }
    return false;
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      
      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.filter(notification => notification._id !== notificationId)
        );
        
        return true;
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      setError(err.response?.data?.error?.message || 'Failed to delete notification');
    }
    return false;
  }, []);

  // Auto-refresh unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setError
  };
};
