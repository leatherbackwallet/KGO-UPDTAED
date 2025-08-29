/**
 * Review Model - Product and vendor review management
 * Handles customer reviews, ratings, and vendor replies for products and vendors
 */

import mongoose, { Document, Schema } from 'mongoose';

// Review type enum
export enum ReviewType {
  PRODUCT = 'product',
  VENDOR = 'vendor',
  DELIVERY = 'delivery'
}

// Reply interface
export interface IReply {
  userId: mongoose.Types.ObjectId;
  comment: string;
  createdAt: Date;
}

// TypeScript interface for Review document
export interface IReview extends Document {
  reviewType: ReviewType;
  productId?: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  deliveryAgentId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  reply?: IReply;
  createdAt: Date;
  updatedAt: Date;
}

// Review schema definition
const reviewSchema = new Schema<IReview>(
  {
    reviewType: {
      type: String,
      enum: Object.values(ReviewType),
      required: [true, 'Review type is required'],
      index: true
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
      required: function(this: IReview) {
        return this.reviewType === ReviewType.PRODUCT;
      }
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      index: true,
      required: function(this: IReview) {
        return this.reviewType === ReviewType.VENDOR;
      }
    },
    deliveryAgentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: function(this: IReview) {
        return this.reviewType === ReviewType.DELIVERY;
      }
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters']
    },
    reply: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Reply comment cannot exceed 500 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ vendorId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, reviewType: 1 });
reviewSchema.index({ rating: 1 });

// Compound index to prevent duplicate reviews
reviewSchema.index(
  { 
    userId: 1, 
    orderId: 1, 
    reviewType: 1, 
    productId: 1 
  }, 
  { 
    unique: true,
    partialFilterExpression: { productId: { $exists: true } }
  }
);

reviewSchema.index(
  { 
    userId: 1, 
    orderId: 1, 
    reviewType: 1, 
    vendorId: 1 
  }, 
  { 
    unique: true,
    partialFilterExpression: { vendorId: { $exists: true } }
  }
);

// Pre-save middleware to validate review type and required fields
reviewSchema.pre('save', function(next) {
  if (this.reviewType === ReviewType.PRODUCT && !this.productId) {
    return next(new Error('Product ID is required for product reviews'));
  }
  if (this.reviewType === ReviewType.VENDOR && !this.vendorId) {
    return next(new Error('Vendor ID is required for vendor reviews'));
  }
  if (this.reviewType === ReviewType.DELIVERY && !this.deliveryAgentId) {
    return next(new Error('Delivery agent ID is required for delivery reviews'));
  }
  next();
});

// Virtual for review summary
reviewSchema.virtual('summary').get(function(this: IReview) {
  if (this.comment && this.comment.length > 100) {
    return this.comment.substring(0, 100) + '...';
  }
  return this.comment;
});

// Ensure virtual fields are serialized
reviewSchema.set('toJSON', { virtuals: true });

export const Review = mongoose.model<IReview>('Review', reviewSchema); 