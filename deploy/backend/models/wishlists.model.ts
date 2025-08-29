/**
 * Wishlist Model - User product wishlist management
 * Allows users to save products for future purchase consideration
 */

import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Wishlist document
export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  products: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Wishlist schema definition
const wishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true
    },
    products: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
wishlistSchema.index({ userId: 1 });
wishlistSchema.index({ products: 1 });

// Virtual for product count
wishlistSchema.virtual('productCount').get(function(this: IWishlist) {
  return this.products.length;
});

// Virtual for is empty
wishlistSchema.virtual('isEmpty').get(function(this: IWishlist) {
  return this.products.length === 0;
});

// Ensure virtual fields are serialized
wishlistSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to remove duplicate products
wishlistSchema.pre('save', function(next) {
  if (this.products) {
    this.products = [...new Set(this.products.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));
  }
  next();
});

export const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema); 