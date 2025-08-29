/**
 * ProductAttributes Model - Links products to their attribute values
 * A linking collection that assigns values for specific attributes to products
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IProductAttribute extends Document {
  productId: mongoose.Types.ObjectId;
  attributeId: mongoose.Types.ObjectId;
  value: any; // Mixed type for different attribute values
  createdAt: Date;
  updatedAt: Date;
}

const productAttributeSchema = new Schema<IProductAttribute>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  attributeId: {
    type: Schema.Types.ObjectId,
    ref: 'Attribute',
    required: true,
    index: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate attribute assignments
productAttributeSchema.index(
  { productId: 1, attributeId: 1 }, 
  { unique: true }
);

// Additional indexes for efficient querying
productAttributeSchema.index({ productId: 1 });
productAttributeSchema.index({ attributeId: 1 });

export const ProductAttribute = mongoose.model<IProductAttribute>('ProductAttribute', productAttributeSchema); 