/**
 * Categories Model - Product categorization with internationalized content
 * Supports hierarchical categories and multilingual content
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: {
    en: string;
    de: string;
  };
  slug: string;
  description?: {
    en: string;
    de: string;
  };
  parentCategory?: mongoose.Types.ObjectId;
  sortOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
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
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    en: {
      type: String,
      trim: true
    },
    de: {
      type: String,
      trim: true
    }
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate slug from name before saving
categorySchema.pre('save', function(next) {
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
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ isActive: 1, isDeleted: 1 });
categorySchema.index({ 'name.en': 'text', 'name.de': 'text' });

export const Category = mongoose.model<ICategory>('Category', categorySchema); 