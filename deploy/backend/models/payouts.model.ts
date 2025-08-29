/**
 * Payout Model - Vendor payout management and tracking
 * Handles vendor earnings, payout periods, and transaction references
 */

import mongoose, { Document, Schema } from 'mongoose';

// Payout status enum
export enum PayoutStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// TypeScript interface for Payout document
export interface IPayout extends Document {
  vendorId: mongoose.Types.ObjectId;
  amount: number;
  periodStartDate?: Date;
  periodEndDate?: Date;
  orderIds: mongoose.Types.ObjectId[];
  status: PayoutStatus;
  transactionReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payout schema definition
const payoutSchema = new Schema<IPayout>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Payout amount is required'],
      min: [0, 'Payout amount cannot be negative']
    },
    periodStartDate: {
      type: Date,
      index: true
    },
    periodEndDate: {
      type: Date,
      index: true
    },
    orderIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Order',
      default: [],
      index: true
    },
    status: {
      type: String,
      enum: Object.values(PayoutStatus),
      required: [true, 'Payout status is required'],
      default: PayoutStatus.PENDING,
      index: true
    },
    transactionReference: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
payoutSchema.index({ vendorId: 1, status: 1 });
payoutSchema.index({ periodStartDate: 1, periodEndDate: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });

// Compound index for vendor period queries
payoutSchema.index({ vendorId: 1, periodStartDate: 1, periodEndDate: 1 });

// Virtual for period duration
payoutSchema.virtual('periodDuration').get(function(this: IPayout) {
  if (this.periodStartDate && this.periodEndDate) {
    const duration = this.periodEndDate.getTime() - this.periodStartDate.getTime();
    return Math.ceil(duration / (1000 * 60 * 60 * 24)); // Days
  }
  return null;
});

// Virtual for payout summary
payoutSchema.virtual('summary').get(function(this: IPayout) {
  return `Payout ${this.status.toUpperCase()} - ₹${this.amount} - ${this.orderIds.length} orders`;
});

// Virtual for is completed
payoutSchema.virtual('isCompleted').get(function(this: IPayout) {
  return this.status === PayoutStatus.COMPLETED;
});

// Ensure virtual fields are serialized
payoutSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to validate payout data
payoutSchema.pre('save', function(next) {
  // If period dates are provided, end date should be after start date
  if (this.periodStartDate && this.periodEndDate) {
    if (this.periodEndDate <= this.periodStartDate) {
      return next(new Error('Period end date must be after start date'));
    }
  }
  
  // For completed payouts, transaction reference should be present
  if (this.status === PayoutStatus.COMPLETED && !this.transactionReference) {
    return next(new Error('Transaction reference is required for completed payouts'));
  }
  
  next();
});

export const Payout = mongoose.model<IPayout>('Payout', payoutSchema); 