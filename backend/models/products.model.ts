/**
 * Products Model - Product templates with internationalized content
 * Specific characteristics are managed via the attributes system
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: {
    en: string;
    de: string;
  };
  description: {
    en: string;
    de: string;
  };
  slug: string;
  category: mongoose.Types.ObjectId;
  price: number;
  stock: number;
  images?: string[];
  defaultImage?: string;
  isFeatured: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: {
    en: {
      type: String,
      required: true,
      trim: true
    },
    de: {
      type: String,
      required: true,
      trim: true
    }
  },
  description: {
    en: {
      type: String,
      required: true,
      trim: true
    },
    de: {
      type: String,
      required: true,
      trim: true
    }
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
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
    const englishName = this.name.en || this.name.de;
    this.slug = englishName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Indexes
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ isFeatured: 1, isDeleted: 1 });
productSchema.index({ 'name.en': 'text', 'name.de': 'text', 'description.en': 'text', 'description.de': 'text' });

export const Product = mongoose.model<IProduct>('Product', productSchema); 