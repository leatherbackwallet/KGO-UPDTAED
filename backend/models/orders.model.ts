/**
 * Orders Model - Parent order management with shipment and promotion support
 * Orders can be fulfilled by one or more shipments
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IComboItemConfiguration {
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
}

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  personalizationOptions?: Record<string, any>;
  // Combo-specific fields
  isCombo?: boolean;
  comboBasePrice?: number;
  comboItemConfigurations?: IComboItemConfiguration[];
}

export interface IShippingDetails {
  recipientName: string;
  recipientPhone: string;
  address: {
    streetName: string;
    houseNumber?: string;
    postalCode: string;
    city: string;
    countryCode: string;
  };
  specialInstructions?: string;
}

export interface IStatusHistory {
  status: string;
  timestamp: Date;
  notes?: string;
  updatedBy?: mongoose.Types.ObjectId;
}

export interface IOrder extends Document {
  orderId: string;
  userId: mongoose.Types.ObjectId | string; // Allow both ObjectId and string for guest users
  requestedDeliveryDate?: Date; // Make optional for guest users
  shippingDetails?: IShippingDetails; // Make optional for guest users
  orderItems: IOrderItem[];
  totalPrice?: number; // Make optional, will be calculated
  orderStatus: 'pending' | 'payment_done' | 'order_received' | 'collecting_items' | 'packing' | 'en_route' | 'delivered' | 'cancelled';
  statusHistory: IStatusHistory[];
  promotionId?: mongoose.Types.ObjectId;
  discountAmount: number;
  isDeleted: boolean;
  // Razorpay payment fields
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus?: 'pending' | 'captured' | 'failed' | 'refunded';
  paymentDate?: Date;
  paymentVerifiedAt?: Date;
  razorpayPaymentDetails?: {
    id?: string;
    amount?: number;
    currency?: string;
    status?: string;
    method?: string;
    description?: string;
    bank?: string;
    wallet?: string;
    card_id?: string;
    card?: {
      id?: string;
      entity?: string;
      name?: string;
      last4?: string;
      network?: string;
      type?: string;
      issuer?: string;
      international?: boolean;
      emi?: boolean;
      sub_type?: string;
      token_iin?: string;
    };
    vpa?: string;
    email?: string;
    contact?: string;
    notes?: any;
    fee?: number;
    tax?: number;
    error_code?: string;
    error_description?: string;
    error_source?: string;
    error_step?: string;
    error_reason?: string;
    acquirer_data?: any;
    created_at?: number;
  };
  razorpayOrderDetails?: {
    id?: string;
    entity?: string;
    amount?: number;
    amount_paid?: number;
    amount_due?: number;
    currency?: string;
    receipt?: string;
    status?: string;
    attempts?: number;
    notes?: any;
    created_at?: number;
  };
  // Additional tracking fields for better transaction monitoring
  transactionId?: string;
  paymentMethod?: string;
  paymentGateway?: string;
  currency?: string;
  amountPaid?: number;
  amountRefunded?: number;
  refundStatus?: 'none' | 'partial' | 'full';
  refundDetails?: any;
  failureReason?: string;
  stockRestored?: boolean;
  // Webhook tracking
  webhookReceived?: boolean;
  webhookEvents?: Array<{
    event: string;
    timestamp: Date;
    data: any;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const comboItemConfigurationSchema = new Schema<IComboItemConfiguration>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  }
});

const orderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  personalizationOptions: {
    type: Schema.Types.Mixed
  },
  // Combo-specific fields
  isCombo: {
    type: Boolean,
    default: false
  },
  comboBasePrice: {
    type: Number,
    min: 0,
    default: 0
  },
  comboItemConfigurations: [comboItemConfigurationSchema]
});

const shippingDetailsSchema = new Schema<IShippingDetails>({
  recipientName: {
    type: String,
    required: true,
    trim: true
  },
  recipientPhone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    streetName: {
      type: String,
      required: true,
      trim: true
    },
    houseNumber: {
      type: String,
      required: false,
      trim: true
    },
    postalCode: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    countryCode: {
      type: String,
      required: true,
      default: 'DE'
    }
  },
  specialInstructions: {
    type: String,
    trim: true
  }
});

const statusHistorySchema = new Schema<IStatusHistory>({
  status: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

const orderSchema = new Schema<IOrder>({
  orderId: {
    type: String,
    unique: true
  },
  userId: {
    type: Schema.Types.Mixed, // Allow both ObjectId and string for guest users
    required: true
  },
  requestedDeliveryDate: {
    type: Date,
    required: false // Make optional for guest users
  },
  shippingDetails: {
    type: shippingDetailsSchema,
    required: false // Make optional for guest users
  },
  orderItems: [orderItemSchema],
  totalPrice: {
    type: Number,
    required: false, // Make optional, will be calculated
    min: 0
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'payment_done', 'order_received', 'collecting_items', 'packing', 'en_route', 'delivered', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [statusHistorySchema],
  promotionId: {
    type: Schema.Types.ObjectId,
    ref: 'Promotion'
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  // Razorpay payment fields
  razorpayOrderId: {
    type: String,
    trim: true
  },
  razorpayPaymentId: {
    type: String,
    trim: true
  },
  razorpaySignature: {
    type: String,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'captured', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  paymentVerifiedAt: {
    type: Date
  },
  // Comprehensive Razorpay transaction tracking
  razorpayPaymentDetails: {
    type: Schema.Types.Mixed
  },
  razorpayOrderDetails: {
    type: Schema.Types.Mixed
  },
  // Additional tracking fields for better transaction monitoring
  transactionId: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    trim: true
  },
  paymentGateway: {
    type: String,
    default: 'razorpay'
  },
  currency: {
    type: String,
    default: 'INR'
  },
  amountPaid: {
    type: Number,
    min: 0
  },
  amountRefunded: {
    type: Number,
    default: 0,
    min: 0
  },
  refundStatus: {
    type: String,
    enum: ['none', 'partial', 'full'],
    default: 'none'
  },
  refundDetails: {
    type: Schema.Types.Mixed
  },
  failureReason: {
    type: String
  },
  stockRestored: {
    type: Boolean,
    default: false
  },
  // Webhook tracking
  webhookReceived: {
    type: Boolean,
    default: false
  },
  webhookEvents: [{
    event: String,
    timestamp: Date,
    data: Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Generate orderId before saving
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.orderId = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Add status to history when status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('orderStatus')) {
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date()
    });
  }
  next();
});

// Indexes
orderSchema.index({ userId: 1 });
orderSchema.index({ orderStatus: 1, isDeleted: 1 });
orderSchema.index({ requestedDeliveryDate: 1 });
orderSchema.index({ promotionId: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema); 