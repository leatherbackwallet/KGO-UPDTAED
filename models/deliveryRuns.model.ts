/**
 * DeliveryRun Model - Advanced logistics management
 * Manages a single logistical trip by a delivery agent, including multiple vendor pickups and customer drop-offs
 */

import mongoose, { Document, Schema } from 'mongoose';

// Delivery run status enum
export enum DeliveryRunStatus {
  PLANNING = 'planning',
  COLLECTING_ITEMS = 'collecting_items',
  AT_HUB_PACKING = 'at_hub_packing',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Stop type enum
export enum StopType {
  PICKUP = 'pickup',
  HUB = 'hub',
  DROPOFF = 'dropoff'
}

// Stop status enum
export enum StopStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  SKIPPED = 'skipped'
}

// Route stop interface
export interface IRouteStop {
  stopType: StopType;
  location: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  relatedDocument: {
    modelName: 'Vendor' | 'Hub' | 'Order';
    docId: mongoose.Types.ObjectId;
  };
  status: StopStatus;
  estimatedTime?: Date;
  actualTime?: Date;
  notes?: string;
}

// TypeScript interface for DeliveryRun document
export interface IDeliveryRun extends Document {
  runId: string;
  deliveryAgentId: mongoose.Types.ObjectId;
  assignedHubId: mongoose.Types.ObjectId;
  status: DeliveryRunStatus;
  orders: mongoose.Types.ObjectId[];
  routePlan: IRouteStop[];
  estimatedStartTime?: Date;
  actualStartTime?: Date;
  estimatedCompletionTime?: Date;
  actualCompletionTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// DeliveryRun schema definition
const deliveryRunSchema = new Schema<IDeliveryRun>(
  {
    runId: {
      type: String,
      required: [true, 'Run ID is required'],
      unique: true,
      description: 'Human-readable ID, e.g., RUN-20250720-01'
    },
    deliveryAgentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Delivery agent is required']
    },
    assignedHubId: {
      type: Schema.Types.ObjectId,
      ref: 'Hub',
      required: [true, 'Assigned hub is required']
    },
    status: {
      type: String,
      enum: Object.values(DeliveryRunStatus),
      required: [true, 'Run status is required'],
      default: DeliveryRunStatus.PLANNING
    },
    orders: {
      type: [Schema.Types.ObjectId],
      ref: 'Order',
      default: []
    },
    routePlan: {
      type: [{
        stopType: {
          type: String,
          enum: Object.values(StopType),
          required: true
        },
        location: {
          address: {
            type: String,
            required: true
          },
          coordinates: {
            lat: {
              type: Number,
              min: -90,
              max: 90
            },
            lng: {
              type: Number,
              min: -180,
              max: 180
            }
          }
        },
        relatedDocument: {
          modelName: {
            type: String,
            enum: ['Vendor', 'Hub', 'Order'],
            required: true
          },
          docId: {
            type: Schema.Types.ObjectId,
            required: true
          }
        },
        status: {
          type: String,
          enum: Object.values(StopStatus),
          default: StopStatus.PENDING
        },
        estimatedTime: {
          type: Date
        },
        actualTime: {
          type: Date
        },
        notes: {
          type: String,
          maxlength: [500, 'Notes cannot exceed 500 characters']
        }
      }],
      default: []
    },
    estimatedStartTime: {
      type: Date
    },
    actualStartTime: {
      type: Date
    },
    estimatedCompletionTime: {
      type: Date
    },
    actualCompletionTime: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
deliveryRunSchema.index({ runId: 1 }, { unique: true });
deliveryRunSchema.index({ deliveryAgentId: 1, status: 1 });
deliveryRunSchema.index({ assignedHubId: 1, status: 1 });
deliveryRunSchema.index({ status: 1, estimatedStartTime: 1 });
deliveryRunSchema.index({ orders: 1 });

// Compound index for delivery agent queries
deliveryRunSchema.index({ deliveryAgentId: 1, createdAt: -1 });

// Virtual for run duration
deliveryRunSchema.virtual('duration').get(function(this: IDeliveryRun) {
  if (this.actualStartTime && this.actualCompletionTime) {
    return this.actualCompletionTime.getTime() - this.actualStartTime.getTime();
  }
  return null;
});

// Virtual for estimated duration
deliveryRunSchema.virtual('estimatedDuration').get(function(this: IDeliveryRun) {
  if (this.estimatedStartTime && this.estimatedCompletionTime) {
    return this.estimatedCompletionTime.getTime() - this.estimatedStartTime.getTime();
  }
  return null;
});

// Virtual for completed stops count
deliveryRunSchema.virtual('completedStops').get(function(this: IDeliveryRun) {
  return this.routePlan.filter(stop => stop.status === StopStatus.COMPLETED).length;
});

// Virtual for total stops count
deliveryRunSchema.virtual('totalStops').get(function() {
  return this.routePlan.length;
});

// Virtual for progress percentage
deliveryRunSchema.virtual('progressPercentage').get(function(this: IDeliveryRun) {
  const totalStops = this.routePlan.length;
  const completedStops = this.routePlan.filter(stop => stop.status === StopStatus.COMPLETED).length;
  if (totalStops === 0) return 0;
  return Math.round((completedStops / totalStops) * 100);
});

// Virtual for run summary
deliveryRunSchema.virtual('summary').get(function(this: IDeliveryRun) {
  const totalStops = this.routePlan.length;
  const completedStops = this.routePlan.filter(stop => stop.status === StopStatus.COMPLETED).length;
  return `${this.runId} - ${this.status.toUpperCase()} - ${this.orders.length} orders - ${completedStops}/${totalStops} stops`;
});

// Ensure virtual fields are serialized
deliveryRunSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to generate run ID if not provided
deliveryRunSchema.pre('save', function(next) {
  if (!this.runId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.getTime().toString().slice(-6);
    this.runId = `RUN-${dateStr}-${timeStr}`;
  }
  next();
});

// Pre-save middleware to validate route plan
deliveryRunSchema.pre('save', function(next) {
  // Ensure route plan has at least one stop
  if (this.routePlan.length === 0) {
    return next(new Error('Route plan must have at least one stop'));
  }
  
  // Validate that all stops have valid related documents
  for (const stop of this.routePlan) {
    if (!stop.relatedDocument || !stop.relatedDocument.docId) {
      return next(new Error('All route stops must have valid related documents'));
    }
  }
  
  next();
});

// Instance method to add stop to route
deliveryRunSchema.methods.addStop = function(stop: IRouteStop) {
  this.routePlan.push(stop);
  return this.save();
};

// Instance method to update stop status
deliveryRunSchema.methods.updateStopStatus = function(stopIndex: number, status: StopStatus, actualTime?: Date) {
  if (stopIndex >= 0 && stopIndex < this.routePlan.length) {
    this.routePlan[stopIndex].status = status;
    if (actualTime) {
      this.routePlan[stopIndex].actualTime = actualTime;
    }
    return this.save();
  }
  throw new Error('Invalid stop index');
};

// Instance method to start run
deliveryRunSchema.methods.startRun = function() {
  this.status = DeliveryRunStatus.COLLECTING_ITEMS;
  this.actualStartTime = new Date();
  return this.save();
};

// Instance method to complete run
deliveryRunSchema.methods.completeRun = function() {
  this.status = DeliveryRunStatus.COMPLETED;
  this.actualCompletionTime = new Date();
  return this.save();
};

export const DeliveryRun = mongoose.model<IDeliveryRun>('DeliveryRun', deliveryRunSchema); 