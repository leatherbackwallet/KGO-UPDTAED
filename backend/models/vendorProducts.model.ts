/**
 * VendorProduct Model - Vendor-specific product pricing and tax information
 * Links vendors to products with custom pricing, HSN codes, and tax rates
 */

import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for VendorProduct document
export interface IVendorProduct extends Document {
  vendorId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  price: number;
  hsnCode: string;
  taxRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// VendorProduct schema definition
const vendorProductSchema = new Schema<IVendorProduct>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative']
    },
    hsnCode: {
      type: String,
      required: [true, 'HSN code is required for GST compliance'],
      trim: true,
      match: [/^\d{4,8}$/, 'HSN code must be 4-8 digits']
    },
    taxRate: {
      type: Number,
      required: [true, 'Tax rate is required'],
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
      enum: [0, 5, 12, 18, 28] // Common GST rates in India
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

// Compound index for vendor-product uniqueness and performance
vendorProductSchema.index({ vendorId: 1, productId: 1 }, { unique: true });

// Indexes for performance
vendorProductSchema.index({ productId: 1, isActive: 1 });
vendorProductSchema.index({ vendorId: 1, isActive: 1 });
vendorProductSchema.index({ price: 1 });

// Virtual for tax amount
vendorProductSchema.virtual('taxAmount').get(function(this: IVendorProduct) {
  return (this.price * this.taxRate) / 100;
});

// Virtual for total price with tax
vendorProductSchema.virtual('totalPrice').get(function(this: IVendorProduct) {
  return this.price + ((this.price * this.taxRate) / 100);
});

// Ensure virtual fields are serialized
vendorProductSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to validate unique vendor-product combination
vendorProductSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('vendorId') || this.isModified('productId')) {
    const existing = await mongoose.model('VendorProduct').findOne({
      vendorId: this.vendorId,
      productId: this.productId,
      _id: { $ne: this._id }
    });
    
    if (existing) {
      return next(new Error('Vendor already has this product listed'));
    }
  }
  next();
});

export const VendorProduct = mongoose.model<IVendorProduct>('VendorProduct', vendorProductSchema); 