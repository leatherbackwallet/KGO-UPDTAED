/**
 * SupportTicket Model - Customer support ticket management
 * Handles customer issues, support conversations, and ticket assignment
 */

import mongoose, { Document, Schema } from 'mongoose';

// Ticket status enum
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  CLOSED = 'closed'
}

// Conversation message interface
export interface IConversationMessage {
  byUser: mongoose.Types.ObjectId;
  message: string;
  timestamp: Date;
}

// TypeScript interface for SupportTicket document
export interface ISupportTicket extends Document {
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  issue: string;
  description?: string;
  status: TicketStatus;
  assignedTo?: mongoose.Types.ObjectId;
  conversation: IConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// SupportTicket schema definition
const supportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true
    },
    issue: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
      maxlength: [200, 'Issue cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      required: [true, 'Ticket status is required'],
      default: TicketStatus.OPEN,
      index: true
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    conversation: {
      type: [{
        byUser: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        message: {
          type: String,
          required: true,
          trim: true,
          maxlength: [1000, 'Message cannot exceed 1000 characters']
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ orderId: 1 });

// Compound index for support agent queries
supportTicketSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

// Virtual for conversation count
supportTicketSchema.virtual('conversationCount').get(function(this: ISupportTicket) {
  return this.conversation.length;
});

// Virtual for is open
supportTicketSchema.virtual('isOpen').get(function(this: ISupportTicket) {
  return this.status === TicketStatus.OPEN;
});

// Virtual for is in progress
supportTicketSchema.virtual('isInProgress').get(function(this: ISupportTicket) {
  return this.status === TicketStatus.IN_PROGRESS;
});

// Virtual for is closed
supportTicketSchema.virtual('isClosed').get(function(this: ISupportTicket) {
  return this.status === TicketStatus.CLOSED;
});

// Virtual for last message
supportTicketSchema.virtual('lastMessage').get(function(this: ISupportTicket) {
  if (this.conversation.length > 0) {
    const lastMsg = this.conversation[this.conversation.length - 1];
    return {
      message: lastMsg.message,
      timestamp: lastMsg.timestamp,
      byUser: lastMsg.byUser
    };
  }
  return null;
});

// Ensure virtual fields are serialized
supportTicketSchema.set('toJSON', { virtuals: true });

// Instance method to add message
supportTicketSchema.methods.addMessage = function(userId: mongoose.Types.ObjectId, message: string) {
  this.conversation.push({
    byUser: userId,
    message: message,
    timestamp: new Date()
  });
  return this.save();
};

// Instance method to assign ticket
supportTicketSchema.methods.assignTo = function(agentId: mongoose.Types.ObjectId) {
  this.assignedTo = agentId;
  this.status = TicketStatus.IN_PROGRESS;
  return this.save();
};

// Instance method to close ticket
supportTicketSchema.methods.closeTicket = function() {
  this.status = TicketStatus.CLOSED;
  return this.save();
};

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema); 