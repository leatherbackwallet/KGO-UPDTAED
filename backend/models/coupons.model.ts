/**
 * Coupon Model - Promotional coupon and discount management
 * Handles percentage, fixed amount, and free shipping coupons with validation rules
 */

import mongoose, { Document, Schema } from 'mongoose';

// Coupon type enum
export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping'
}

// TypeScript interface for Coupon document
export interface ICoupon extends Document {
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Coupon schema definition
const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]+$/, 'Coupon code can only contain uppercase letters and numbers'],
      minlength: [3, 'Coupon code must be at least 3 characters'],
      maxlength: [20, 'Coupon code cannot exceed 20 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Coupon description cannot exceed 500 characters']
    },
    type: {
      type: String,
      enum: Object.values(CouponType),
      required: [true, 'Coupon type is required']
    },
    value: {
      type: Number,
      required: [true, 'Coupon value is required'],
      min: [0, 'Coupon value cannot be negative'],
      validate: {
        validator: function(this: ICoupon, value: number) {
          if (this.type === CouponType.PERCENTAGE) {
            return value >= 0 && value <= 100;
          }
          return value >= 0;
        },
        message: 'Percentage coupons must be between 0 and 100, other types must be positive'
      }
    },
    minOrderAmount: {
      type: Number,
      min: [0, 'Minimum order amount cannot be negative']
    },
    validUntil: {
      type: Date,
      required: [true, 'Coupon expiry date is required'],
      validate: {
        validator: function(this: ICoupon, date: Date) {
          return date > new Date();
        },
        message: 'Coupon expiry date must be in the future'
      }
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validUntil: 1 });
couponSchema.index({ type: 1, isActive: 1 });

// Virtual for discount calculation
couponSchema.virtual('calculateDiscount').get(function(this: ICoupon, orderAmount: number) {
  if (!this.isActive || new Date() > this.validUntil) {
    return 0;
  }
  
  if (this.minOrderAmount && orderAmount < this.minOrderAmount) {
    return 0;
  }
  
  switch (this.type) {
    case CouponType.PERCENTAGE:
      return (orderAmount * this.value) / 100;
    case CouponType.FIXED_AMOUNT:
      return Math.min(this.value, orderAmount);
    case CouponType.FREE_SHIPPING:
      return 0; // Free shipping logic handled separately
    default:
      return 0;
  }
});

// Virtual for coupon status
couponSchema.virtual('isValid').get(function(this: ICoupon) {
  return this.isActive && new Date() < this.validUntil;
});

// Ensure virtual fields are serialized
couponSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to validate coupon code uniqueness
couponSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('code')) {
    const existing = await mongoose.model('Coupon').findOne({
      code: this.code,
      _id: { $ne: this._id }
    });
    
    if (existing) {
      return next(new Error('Coupon code already exists'));
    }
  }
  next();
});

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema); 