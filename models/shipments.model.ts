/**
 * Shipments Model - Partial fulfillment and split shipments management
 * Manages individual shipments that fulfill parts of an order
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IShipmentItem {
  orderItemId: string;
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IShipment extends Document {
  shipmentId: string;
  orderId: mongoose.Types.ObjectId;
  items: IShipmentItem[];
  deliveryRunId?: mongoose.Types.ObjectId;
  status: 'pending_fulfillment' | 'in_transit' | 'delivered' | 'failed_delivery';
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shipmentItemSchema = new Schema<IShipmentItem>({
  orderItemId: {
    type: String,
    required: true
  },
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
});

const shipmentSchema = new Schema<IShipment>({
  shipmentId: {
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
  items: [shipmentItemSchema],
  deliveryRunId: {
    type: Schema.Types.ObjectId,
    ref: 'DeliveryRun',
    index: true
  },
  status: {
    type: String,
    enum: ['pending_fulfillment', 'in_transit', 'delivered', 'failed_delivery'],
    default: 'pending_fulfillment',
    index: true
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  estimatedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Generate shipmentId before saving
shipmentSchema.pre('save', function(next) {
  if (this.isNew && !this.shipmentId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.shipmentId = `SHP-${timestamp}-${random}`;
  }
  next();
});

// Indexes
shipmentSchema.index({ orderId: 1, status: 1 });
shipmentSchema.index({ deliveryRunId: 1, status: 1 });
shipmentSchema.index({ createdAt: -1 });

export const Shipment = mongoose.model<IShipment>('Shipment', shipmentSchema); 