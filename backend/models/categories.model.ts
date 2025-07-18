/**
 * Category Model - Product categorization with hierarchical structure
 * Supports nested categories and SEO-friendly slugs for better navigation
 */

import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Category document
export interface ICategory extends Document {
  name: string;
  slug: string;
  parentCategory?: mongoose.Types.ObjectId;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Category schema definition
const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    image: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Index for hierarchical queries
categorySchema.index({ parentCategory: 1 });

// Index for slug-based lookups
categorySchema.index({ slug: 1 });

// Virtual for full category path
categorySchema.virtual('fullPath').get(function() {
  return this.name; // Simplified for now - full path would require population
});

// Ensure virtual fields are serialized
categorySchema.set('toJSON', { virtuals: true });

// Pre-save middleware to generate slug if not provided
categorySchema.pre('save', function(next) {
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

export const Category = mongoose.model<ICategory>('Category', categorySchema); 