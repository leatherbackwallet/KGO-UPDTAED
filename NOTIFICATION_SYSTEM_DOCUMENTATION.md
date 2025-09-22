# Notification System Documentation

## Overview

The notification system provides real-time alerts for admin users when new orders are placed. It includes a notification badge on the Orders tab in the admin panel that shows the count of unread notifications.

## Features

- ✅ **Real-time Notifications**: Automatically creates notifications when new orders are placed
- ✅ **Notification Badge**: Shows unread notification count on the Orders tab
- ✅ **Auto-mark as Read**: Notifications are marked as read when admin visits the Orders tab
- ✅ **Admin-only Access**: Only admin users can see and manage notifications
- ✅ **Database Persistence**: Notifications are stored in MongoDB
- ✅ **Auto-refresh**: Unread count refreshes every 30 seconds

## Architecture

### Backend Components

#### 1. Notification Model (`backend/models/notifications.model.ts`)
```typescript
interface INotification {
  recipientId: ObjectId;  // Admin user ID
  title: string;          // Notification title
  message?: string;       // Notification message
  link?: string;          // Link to relevant page
  isRead: boolean;        // Read status
  createdAt: Date;        // Creation timestamp
  updatedAt: Date;        // Last update timestamp
}
```

#### 2. Notification Service (`backend/services/notificationService.ts`)
- `createNotification()`: Creates a single notification
- `createNotificationForAllAdmins()`: Creates notifications for all admin users
- `createNewOrderNotification()`: Creates order-specific notifications
- `getUnreadCount()`: Gets unread notification count
- `markAsRead()`: Marks notification as read
- `markAllAsRead()`: Marks all notifications as read

#### 3. Notification Routes (`backend/routes/notifications.ts`)
- `GET /api/notifications/unread-count`: Get unread notifications count
- `GET /api/notifications`: Get all notifications (with pagination)
- `PUT /api/notifications/:id/read`: Mark specific notification as read
- `PUT /api/notifications/mark-all-read`: Mark all notifications as read
- `DELETE /api/notifications/:id`: Delete notification

### Frontend Components

#### 1. Notification Hook (`frontend/src/hooks/useNotifications.ts`)
```typescript
const {
  notifications,      // Array of notifications
  unreadCount,        // Number of unread notifications
  loading,           // Loading state
  error,             // Error state
  fetchNotifications, // Fetch notifications
  fetchUnreadCount,   // Fetch unread count
  markAsRead,        // Mark as read
  markAllAsRead,     // Mark all as read
  deleteNotification  // Delete notification
} = useNotifications();
```

#### 2. AdminTabs Component (`frontend/src/components/AdminTabs.tsx`)
- Enhanced to accept `notificationBadges` prop
- Shows red badge with count for tabs with unread notifications
- Badge shows "99+" for counts over 99

#### 3. Admin Panel (`frontend/src/pages/admin.tsx`)
- Uses `useNotifications` hook to get unread count
- Passes notification badges to `AdminTabs` component
- Shows badge on "Orders" tab when there are unread notifications

#### 4. AdminOrders Component (`frontend/src/components/AdminOrders.tsx`)
- Automatically marks all notifications as read when admin visits the Orders tab
- Uses `markAllAsRead()` from the notification hook

## How It Works

### 1. Order Creation Flow
```
Customer places order → Order created in database → NotificationService.createNewOrderNotification() → 
Notifications created for all admin users → Admin panel shows badge
```

### 2. Notification Display Flow
```
Admin visits admin panel → useNotifications hook fetches unread count → 
AdminTabs component shows badge → Admin clicks Orders tab → 
AdminOrders component marks all as read → Badge disappears
```

### 3. Auto-refresh Mechanism
- `useNotifications` hook automatically fetches unread count every 30 seconds
- Ensures real-time updates without manual refresh

## Database Schema

### Notifications Collection
```javascript
{
  _id: ObjectId,
  recipientId: ObjectId,  // Reference to User
  title: String,          // "New Order Received"
  message: String,        // "New order #ORD-123 from John Doe for ₹500.00"
  link: String,           // "/admin?tab=orders"
  isRead: Boolean,        // false
  createdAt: Date,        // 2024-01-15T10:30:00Z
  updatedAt: Date         // 2024-01-15T10:30:00Z
}
```

### Indexes
- `{ recipientId: 1, isRead: 1 }` - For efficient unread count queries
- `{ recipientId: 1, createdAt: -1 }` - For fetching user notifications
- `{ isRead: 1, createdAt: -1 }` - For global notification queries

## API Endpoints

### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

### Get Notifications
```http
GET /api/notifications?page=1&limit=20&unreadOnly=false
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "notifications": [...],
    "totalPages": 2,
    "currentPage": 1,
    "total": 25
  }
}
```

### Mark All as Read
```http
PUT /api/notifications/mark-all-read
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "modifiedCount": 5,
    "message": "Marked 5 notifications as read"
  }
}
```

## Configuration

### Environment Variables
No additional environment variables are required. The system uses existing database and authentication configurations.

### Admin User Setup
Ensure admin users exist in the system. The notification system will automatically create notifications for all users with the "admin" role.

## Testing

### Manual Testing
1. Create a test order as a customer
2. Login as admin and check the Orders tab for notification badge
3. Click on Orders tab to mark notifications as read
4. Verify badge disappears

### Automated Testing
Use the provided test script:
```bash
node test-notification-system.js
```

## Security Considerations

- ✅ **Admin-only Access**: All notification endpoints require admin role
- ✅ **User Isolation**: Users can only see their own notifications
- ✅ **Input Validation**: All inputs are validated and sanitized
- ✅ **Error Handling**: Graceful error handling prevents system failures

## Performance Considerations

- ✅ **Database Indexes**: Optimized queries with proper indexing
- ✅ **Pagination**: Notifications are paginated to prevent large data loads
- ✅ **Auto-refresh**: 30-second intervals prevent excessive API calls
- ✅ **Efficient Updates**: Only unread count is fetched for badges

## Future Enhancements

### Potential Improvements
- **Real-time Updates**: WebSocket integration for instant notifications
- **Email Notifications**: Send email alerts for critical notifications
- **Push Notifications**: Browser push notifications for offline admins
- **Notification Categories**: Different types of notifications (orders, users, etc.)
- **Notification Preferences**: Admin settings for notification types
- **Bulk Actions**: Mark multiple notifications as read/delete

### Additional Notification Types
- New user registrations
- Payment failures
- Low stock alerts
- System errors
- Customer support tickets

## Troubleshooting

### Common Issues

#### 1. Notifications Not Appearing
- Check if admin user has correct role
- Verify order creation is successful
- Check server logs for notification creation errors

#### 2. Badge Not Updating
- Check browser console for API errors
- Verify authentication token is valid
- Check network connectivity

#### 3. Notifications Not Marking as Read
- Verify admin permissions
- Check API endpoint responses
- Clear browser cache and retry

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=notifications:*
```

## Maintenance

### Database Cleanup
Consider implementing a cleanup job to remove old read notifications:
```javascript
// Remove notifications older than 30 days
db.notifications.deleteMany({
  isRead: true,
  createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
});
```

### Monitoring
Monitor notification system health:
- Track notification creation success rate
- Monitor unread count API response times
- Alert on notification service failures

## Conclusion

The notification system provides a robust, scalable solution for admin order notifications. It follows best practices for security, performance, and user experience while maintaining simplicity and maintainability.
