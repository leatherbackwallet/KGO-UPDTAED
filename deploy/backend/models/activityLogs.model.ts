/**
 * ActivityLog Model - Audit trail and system activity tracking
 * Records user actions, system events, and provides comprehensive audit trail
 */

import mongoose, { Document, Schema } from 'mongoose';

// Target interface
export interface ITarget {
  type: string;
  id: mongoose.Types.ObjectId;
}

// TypeScript interface for ActivityLog document
export interface IActivityLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actionType: string;
  target?: ITarget;
  details?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ActivityLog schema definition
const activityLogSchema = new Schema<IActivityLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    actionType: {
      type: String,
      required: [true, 'Action type is required'],
      trim: true,
      maxlength: [100, 'Action type cannot exceed 100 characters'],
      index: true
    },
    target: {
      type: {
        type: String,
        required: true,
        trim: true,
        maxlength: [50, 'Target type cannot exceed 50 characters']
      },
      id: {
        type: Schema.Types.ObjectId,
        required: true
      }
    },
    details: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
activityLogSchema.index({ actorId: 1, createdAt: -1 });
activityLogSchema.index({ actionType: 1, createdAt: -1 });
activityLogSchema.index({ 'target.type': 1, 'target.id': 1 });
activityLogSchema.index({ createdAt: -1 });

// Compound index for audit queries
activityLogSchema.index({ actorId: 1, actionType: 1, createdAt: -1 });

// Virtual for action summary
activityLogSchema.virtual('actionSummary').get(function(this: IActivityLog) {
  const actor = this.actorId ? `User ${this.actorId}` : 'System';
  const target = this.target ? `${this.target.type} ${this.target.id}` : 'N/A';
  return `${actor} performed ${this.actionType} on ${target}`;
});

// Virtual for is system action
activityLogSchema.virtual('isSystemAction').get(function(this: IActivityLog) {
  return !this.actorId;
});

// Virtual for is user action
activityLogSchema.virtual('isUserAction').get(function(this: IActivityLog) {
  return !!this.actorId;
});

// Ensure virtual fields are serialized
activityLogSchema.set('toJSON', { virtuals: true });

// Static method to log user action
activityLogSchema.statics.logUserAction = function(
  actorId: mongoose.Types.ObjectId,
  actionType: string,
  target?: ITarget,
  details?: Record<string, any>
) {
  return this.create({
    actorId,
    actionType,
    target,
    details
  });
};

// Static method to log system action
activityLogSchema.statics.logSystemAction = function(
  actionType: string,
  target?: ITarget,
  details?: Record<string, any>
) {
  return this.create({
    actionType,
    target,
    details
  });
};

// Pre-save middleware to validate action type
activityLogSchema.pre('save', function(next) {
  // Common action types validation
  const commonActions = [
    'create', 'update', 'delete', 'login', 'logout', 'register',
    'order_placed', 'order_cancelled', 'payment_success', 'payment_failed',
    'vendor_approved', 'vendor_rejected', 'product_added', 'product_updated'
  ];
  
  if (!commonActions.includes(this.actionType.toLowerCase())) {
    // Allow custom action types but log them
    console.log(`Custom action type logged: ${this.actionType}`);
  }
  
  next();
});

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema); 