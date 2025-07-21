/**
 * Returns Model - Return Merchandise Authorization (RMA) workflows
 * Manages the complete return process from request to resolution
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IReturn extends Document {
  returnId: string;
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderItems: Array<{
    productId: mongoose.Types.ObjectId;
    quantity: number;
  }>;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'shipped_by_customer' | 'received_at_hub' | 'completed';
  resolution?: 'refund' | 'replacement';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const returnSchema = new Schema<IReturn>({
  returnId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [{
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected', 'shipped_by_customer', 'received_at_hub', 'completed'],
    default: 'requested',
    index: true
  },
  resolution: {
    type: String,
    enum: ['refund', 'replacement'],
    description: 'The final outcome of the return'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Generate returnId before saving
returnSchema.pre('save', function(next) {
  if (this.isNew && !this.returnId) {
    this.returnId = `RMA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Indexes
returnSchema.index({ orderId: 1, status: 1 });
returnSchema.index({ userId: 1, status: 1 });
returnSchema.index({ createdAt: -1 });

export const Return = mongoose.model<IReturn>('Return', returnSchema); 