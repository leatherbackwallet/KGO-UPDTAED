/**
 * Notification Model - User notification management
 * Handles system notifications, alerts, and user communication
 */

import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Notification document
export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification schema definition
const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    link: {
      type: String,
      trim: true,
      maxlength: [500, 'Link cannot exceed 500 characters']
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1, createdAt: -1 });

// Compound index for user notification queries
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

// Virtual for notification summary
notificationSchema.virtual('summary').get(function(this: INotification) {
  if (this.message && this.message.length > 100) {
    return this.message.substring(0, 100) + '...';
  }
  return this.message;
});

// Virtual for is unread
notificationSchema.virtual('isUnread').get(function(this: INotification) {
  return !this.isRead;
});

// Ensure virtual fields are serialized
notificationSchema.set('toJSON', { virtuals: true });

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Instance method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  return this.save();
};

export const Notification = mongoose.model<INotification>('Notification', notificationSchema); 