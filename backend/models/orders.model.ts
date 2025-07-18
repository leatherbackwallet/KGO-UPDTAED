/**
 * Order Model - Complete order management with GST compliance
 * Handles order items, personalization, tax calculations, and payment tracking
 */

import mongoose, { Document, Schema } from 'mongoose';

// Order status enum
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// Item status enum
export enum ItemStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// Shipping details interface
export interface IShippingDetails {
  name: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  trackingNumber?: string;
  courierName?: string;
}

// Order item interface
export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  vendorId: mongoose.Types.ObjectId;
  itemStatus: ItemStatus;
}

// Tax details interface
export interface ITaxDetails {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
}

// Payment details interface
export interface IPaymentDetails {
  paymentId: string;
  method: string;
  status: string;
}

// TypeScript interface for Order document
export interface IOrder extends Document {
  orderId: string;
  userId: mongoose.Types.ObjectId;
  shippingDetails: IShippingDetails;
  orderItems: IOrderItem[];
  personalizationData: Map<string, string>;
  taxDetails: ITaxDetails;
  discountAmount?: number;
  appliedCouponCode?: string;
  totalPrice: number;
  orderStatus: OrderStatus;
  paymentDetails?: IPaymentDetails;
  createdAt: Date;
  updatedAt: Date;
}

// Order schema definition
const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      unique: true,
      index: true,
      default: function() {
        return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
      }
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    shippingDetails: {
      name: {
        type: String,
        required: [true, 'Shipping name is required'],
        trim: true
      },
      phone: {
        type: String,
        required: [true, 'Shipping phone is required'],
        trim: true
      },
      address: {
        street: {
          type: String,
          required: [true, 'Shipping street is required'],
          trim: true
        },
        city: {
          type: String,
          required: [true, 'Shipping city is required'],
          trim: true
        },
        state: {
          type: String,
          required: [true, 'Shipping state is required'],
          trim: true
        },
        postalCode: {
          type: String,
          required: [true, 'Shipping postal code is required'],
          trim: true,
          match: [/^\d{6}$/, 'Postal code must be 6 digits']
        }
      },
      trackingNumber: {
        type: String,
        trim: true
      },
      courierName: {
        type: String,
        trim: true
      }
    },
    orderItems: [{
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: {
        type: String,
        required: true,
        trim: true
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
      },
      vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
      },
      itemStatus: {
        type: String,
        enum: Object.values(ItemStatus),
        default: ItemStatus.PENDING
      }
    }],
    personalizationData: {
      type: Map,
      of: String,
      default: new Map()
    },
    taxDetails: {
      taxableAmount: {
        type: Number,
        required: [true, 'Taxable amount is required'],
        min: [0, 'Taxable amount cannot be negative']
      },
      cgst: {
        type: Number,
        required: [true, 'CGST is required'],
        min: [0, 'CGST cannot be negative']
      },
      sgst: {
        type: Number,
        required: [true, 'SGST is required'],
        min: [0, 'SGST cannot be negative']
      },
      igst: {
        type: Number,
        required: [true, 'IGST is required'],
        min: [0, 'IGST cannot be negative']
      }
    },
    discountAmount: {
      type: Number,
      min: [0, 'Discount amount cannot be negative'],
      default: 0
    },
    appliedCouponCode: {
      type: String,
      trim: true
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative']
    },
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      required: [true, 'Order status is required'],
      default: OrderStatus.PENDING,
      index: true
    },
    paymentDetails: {
      paymentId: {
        type: String,
        trim: true
      },
      method: {
        type: String,
        trim: true
      },
      status: {
        type: String,
        trim: true
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ 'shippingDetails.address.postalCode': 1 });

// Virtual for total tax
orderSchema.virtual('totalTax').get(function(this: IOrder) {
  return this.taxDetails.cgst + this.taxDetails.sgst + this.taxDetails.igst;
});

// Virtual for subtotal (before tax and discount)
orderSchema.virtual('subtotal').get(function(this: IOrder) {
  return this.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { virtuals: true });

export const Order = mongoose.model<IOrder>('Order', orderSchema); 