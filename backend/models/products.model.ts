/**
 * Product Model - Product templates with personalization options
 * Defines base product information, categories, and customization capabilities
 */

import mongoose, { Document, Schema } from 'mongoose';

// Personalization option interface
export interface IPersonalizationOption {
  type: string;
  label: string;
}

// TypeScript interface for Product document
export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  category: mongoose.Types.ObjectId;
  defaultImage?: string;
  tags: string[];
  personalizationOptions: IPersonalizationOption[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product schema definition
const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      unique: true,
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [2000, 'Product description cannot exceed 2000 characters']
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true
    },
    defaultImage: {
      type: String,
      trim: true
    },
    tags: {
      type: [String],
      index: true,
      default: []
    },
    personalizationOptions: {
      type: [{
        type: {
          type: String,
          required: true,
          enum: ['text', 'image', 'color', 'size', 'font', 'custom']
        },
        label: {
          type: String,
          required: true,
          trim: true
        }
      }],
      default: []
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
productSchema.index({ slug: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });

// Pre-save middleware to generate slug if not provided
productSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

export const Product = mongoose.model<IProduct>('Product', productSchema); 