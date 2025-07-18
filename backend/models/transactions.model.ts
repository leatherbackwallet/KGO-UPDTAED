/**
 * Transaction Model - Payment gateway transaction tracking
 * Records payment captures, refunds, and transaction status for financial reconciliation
 */

import mongoose, { Document, Schema } from 'mongoose';

// Transaction type enum
export enum TransactionType {
  CAPTURE = 'capture',
  REFUND = 'refund'
}

// Transaction status enum
export enum TransactionStatus {
  SUCCESS = 'success',
  FAILED = 'failed'
}

// TypeScript interface for Transaction document
export interface ITransaction extends Document {
  orderId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  amount: number;
  gatewayTransactionId?: string;
  type: TransactionType;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction schema definition
const transactionSchema = new Schema<ITransaction>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0, 'Transaction amount cannot be negative']
    },
    gatewayTransactionId: {
      type: String,
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: [true, 'Transaction type is required'],
      index: true
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      required: [true, 'Transaction status is required'],
      default: TransactionStatus.FAILED,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
transactionSchema.index({ orderId: 1, type: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ gatewayTransactionId: 1 }, { sparse: true });

// Compound index for financial reporting
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });

// Virtual for transaction summary
transactionSchema.virtual('summary').get(function(this: ITransaction) {
  return `${this.type.toUpperCase()} - ${this.status.toUpperCase()} - ₹${this.amount}`;
});

// Virtual for is refund
transactionSchema.virtual('isRefund').get(function(this: ITransaction) {
  return this.type === TransactionType.REFUND;
});

// Virtual for is capture
transactionSchema.virtual('isCapture').get(function(this: ITransaction) {
  return this.type === TransactionType.CAPTURE;
});

// Ensure virtual fields are serialized
transactionSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to validate transaction data
transactionSchema.pre('save', function(next) {
  // For refunds, orderId should be present
  if (this.type === TransactionType.REFUND && !this.orderId) {
    return next(new Error('Order ID is required for refund transactions'));
  }
  
  // For captures, both orderId and userId should be present
  if (this.type === TransactionType.CAPTURE && (!this.orderId || !this.userId)) {
    return next(new Error('Order ID and User ID are required for capture transactions'));
  }
  
  next();
});

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema); 