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
  images?: string[]; // Image filenames (e.g., "product-123.jpg")
  defaultImage?: string; // Default image filename
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
    required: false, // Will be generated automatically
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
    trim: true,
    validate: {
      validator: function(v: string) {
        // Validate filename format (alphanumeric, hyphens, underscores, dots)
        return /^[a-zA-Z0-9._-]+$/.test(v);
      },
      message: 'Invalid filename format'
    }
  }],
  defaultImage: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Allow empty/null
        return /^[a-zA-Z0-9._-]+$/.test(v);
      },
      message: 'Invalid filename format'
    }
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
productSchema.pre('save', async function(next) {
  if (!this.slug && this.name) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if slug already exists and add suffix if needed
    let slug = baseSlug;
    let counter = 1;
    
    while (await mongoose.model('Product').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Indexes
productSchema.index({ categories: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });
productSchema.index({ isDeleted: 1 });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ name: 'text', description: 'text' }); // Text search index
productSchema.index({ occasions: 1 });
productSchema.index({ vendors: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ updatedAt: -1 });

export const Product = mongoose.model<IProduct>('Product', productSchema); 