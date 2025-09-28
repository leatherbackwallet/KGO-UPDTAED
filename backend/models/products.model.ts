/**
 * Products Model - Product templates with internationalized content
 * Specific characteristics are managed via the attributes system
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IComboItem {
  name: string;
  unitPrice: number;
  defaultQuantity: number;
  unit: string; // e.g., 'kg', 'set', 'piece', 'dozen'
}

export interface IProduct extends Document {
  name: string;
  description: string;
  slug: string;
  categories: mongoose.Types.ObjectId[]; // Multiple categories
  price: number;
  costPrice: number; // Cost price for profit calculations
  stock: number;
  images?: string[]; // Image filenames (e.g., "product-123.jpg")
  defaultImage?: string; // Default image filename
  occasions?: mongoose.Types.ObjectId[]; // Array of occasion references
  vendors?: mongoose.Types.ObjectId[]; // Multiple vendors
  isFeatured: boolean;
  isActive: boolean;
  isDeleted: boolean;
  // Combo product fields
  isCombo: boolean;
  comboBasePrice?: number; // Base price for the combo
  comboItems?: IComboItem[]; // Individual items in the combo
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
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v: number) {
        return Number.isInteger(v);
      },
      message: 'Price must be a whole number'
    }
  },
  costPrice: {
    type: Number,
    required: true,
    min: [0, 'Cost price cannot be negative'],
    default: 0
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative'],
    default: 200
  },
  images: [{
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        // Allow Cloudinary public IDs (e.g., "keralagiftsonline/products/product-123")
        if (v && v.startsWith('keralagiftsonline/products/')) {
          return true;
        }
        // Also allow local filenames (alphanumeric, hyphens, underscores, dots)
        return /^[a-zA-Z0-9._-]+$/.test(v);
      },
      message: 'Invalid image path format. Must be a Cloudinary public ID or valid filename.'
    }
  }],
  defaultImage: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Allow empty/null
        // Allow Cloudinary public IDs (e.g., "keralagiftsonline/products/product-123")
        if (v && v.startsWith('keralagiftsonline/products/')) {
          return true;
        }
        // Also allow local filenames (alphanumeric, hyphens, underscores, dots)
        return /^[a-zA-Z0-9._-]+$/.test(v);
      },
      message: 'Invalid image path format. Must be a Cloudinary public ID or valid filename.'
    }
  },
  occasions: [{
    type: Schema.Types.ObjectId,
    ref: 'Occasion'
  }],
  vendors: [{
    type: Schema.Types.ObjectId,
    ref: 'Vendor'
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  // Combo product fields
  isCombo: {
    type: Boolean,
    default: false
  },
  comboBasePrice: {
    type: Number,
    min: [0, 'Combo base price cannot be negative'],
    default: 0,
    validate: {
      validator: function(v: number) {
        return Number.isInteger(v);
      },
      message: 'Combo base price must be a whole number'
    }
  },
  comboItems: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative'],
      validate: {
        validator: function(v: number) {
          return Number.isInteger(v);
        },
        message: 'Unit price must be a whole number'
      }
    },
    defaultQuantity: {
      type: Number,
      required: true,
      min: [0, 'Default quantity cannot be negative'],
      default: 1
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      enum: ['kg', 'set', 'piece', 'dozen', 'gram', 'liter', 'box', 'pack']
    }
  }]
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