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
    houseNumber: string;
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
  userId: mongoose.Types.ObjectId;
  requestedDeliveryDate: Date;
  shippingDetails: IShippingDetails;
  orderItems: IOrderItem[];
  totalPrice: number;
  orderStatus: 'payment_done' | 'order_received' | 'collecting_items' | 'packing' | 'en_route' | 'delivered' | 'cancelled';
  statusHistory: IStatusHistory[];
  promotionId?: mongoose.Types.ObjectId;
  discountAmount: number;
  isDeleted: boolean;
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
      required: true,
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
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedDeliveryDate: {
    type: Date,
    required: true
  },
  shippingDetails: {
    type: shippingDetailsSchema,
    required: true
  },
  orderItems: [orderItemSchema],
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  orderStatus: {
    type: String,
    enum: ['payment_done', 'order_received', 'collecting_items', 'packing', 'en_route', 'delivered', 'cancelled'],
    default: 'payment_done'
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
  }
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