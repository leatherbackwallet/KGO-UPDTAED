/**
 * Cart Model - Shopping cart management
 * Handles user cart persistence and guest cart merging
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  // Combo-specific fields
  isCombo?: boolean;
  comboBasePrice?: number;
  comboItemConfigurations?: Array<{
    name: string;
    unitPrice: number;
    quantity: number;
    unit: string;
    defaultQuantity?: number;
  }>;
}

export interface ICart extends Document {
  userId: string; // Can be ObjectId for registered users or sessionId for guests
  items: ICartItem[];
  totalItems: number;
  totalPrice: number;
  lastUpdated: Date;
  expiresAt: Date; // Cart expiration (e.g., 30 days for guests, 90 days for users)
  isGuest: boolean;
  sessionId?: string; // For guest carts
  createdAt: Date;
  updatedAt: Date;
}

const comboItemConfigurationSchema = new Schema({
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
  },
  defaultQuantity: {
    type: Number,
    min: 0
  }
}, { _id: false });

const cartItemSchema = new Schema<ICartItem>({
  productId: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
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
}, { _id: false });

const cartSchema = new Schema<ICart>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index
  },
  isGuest: {
    type: Boolean,
    default: false,
    index: true
  },
  sessionId: {
    type: String,
    trim: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'carts'
});

// Indexes for performance
cartSchema.index({ userId: 1, isGuest: 1 });
cartSchema.index({ sessionId: 1, isGuest: 1 });
cartSchema.index({ expiresAt: 1 });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalPrice = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.lastUpdated = new Date();
  next();
});

// Static method to find or create cart
cartSchema.statics.findOrCreateCart = async function(userId: string, isGuest: boolean = false, sessionId?: string) {
  const query = isGuest ? { sessionId, isGuest: true } : { userId, isGuest: false };
  
  let cart = await this.findOne(query);
  
  if (!cart) {
    const expirationDays = isGuest ? 7 : 30; // Guest carts expire in 7 days, user carts in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    
    cart = new this({
      userId,
      items: [],
      isGuest,
      sessionId,
      expiresAt
    });
    
    await cart.save();
  }
  
  return cart;
};

// Method to add item to cart
cartSchema.methods.addItem = function(item: ICartItem) {
  const existingItemIndex = this.items.findIndex(
    (cartItem: ICartItem) => cartItem.productId === item.productId
  );
  
  if (existingItemIndex >= 0) {
    // Update existing item
    this.items[existingItemIndex].quantity += item.quantity;
  } else {
    // Add new item
    this.items.push(item);
  }
  
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId: string) {
  this.items = this.items.filter((item: ICartItem) => item.productId !== productId);
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId: string, quantity: number) {
  const item = this.items.find((cartItem: ICartItem) => cartItem.productId === productId);
  
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId);
    } else {
      item.quantity = quantity;
      return this.save();
    }
  }
  
  return Promise.resolve(this);
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// Method to merge with another cart
cartSchema.methods.mergeCart = function(otherCart: ICart) {
  otherCart.items.forEach((item: ICartItem) => {
    this.addItem(item);
  });
  return this.save();
};

export const Cart = mongoose.model<ICart>('Cart', cartSchema);
