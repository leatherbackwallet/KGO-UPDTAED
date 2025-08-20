/**
 * Products Model - Product templates with internationalized content
 * Specific characteristics are managed via the attributes system
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  slug: string;
  categories: mongoose.Types.ObjectId[]; // Multiple categories
  price: number;
  stock: number;
  images?: string[];
  defaultImage?: string;
  occasions?: string[]; // Array of occasion tags
  vendors?: mongoose.Types.ObjectId[]; // Multiple vendors
  isFeatured: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  categories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }],
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative']
  },
  images: [{
    type: String,
    trim: true
  }],
  defaultImage: {
    type: String,
    trim: true
  },
  occasions: [{
    type: String,
    trim: true,
    enum: [
      'DIWALI', 'ANNIVERSARY', 'BIRTHDAY', 'CONDOLENCES', 'CONGRATULATION',
      'FATHERS DAY', 'GET WELL SOON', 'HOUSE WARMING', 'JUST BECAUSE',
      'MISS YOU', 'NEW BORN', 'ONAM', 'SYMPATHY', 'THANK YOU',
      'TRADITIONAL', 'WEDDING'
    ]
  }],
  vendors: [{
    type: Schema.Types.ObjectId,
    ref: 'Vendor'
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate slug from name before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Indexes
productSchema.index({ categories: 1 });
productSchema.index({ vendors: 1 });
productSchema.index({ occasions: 1 });
productSchema.index({ isFeatured: 1, isDeleted: 1 });
productSchema.index({ 'name': 'text', 'description': 'text' });

// Additional indexes for better search performance
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });

export const Product = mongoose.model<IProduct>('Product', productSchema); 