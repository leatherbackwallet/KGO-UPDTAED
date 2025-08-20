/**
 * Hub Model - Physical packing stations or fulfillment centers
 * Represents locations where gifts are prepared for final delivery in the hyperlocal logistics system
 */

import mongoose, { Document, Schema } from 'mongoose';

// Hub address interface
export interface IHubAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

// TypeScript interface for Hub document
export interface IHub extends Document {
  name: string;
  address: IHubAddress;
  operatingHours?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Hub schema definition
const hubSchema = new Schema<IHub>(
  {
    name: {
      type: String,
      required: [true, 'Hub name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Hub name cannot exceed 100 characters'],
      description: 'e.g., Kochi Central Hub'
    },
    address: {
      street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        default: 'Kochi'
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        default: 'Kerala'
      },
      postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true
      }
    },
    operatingHours: {
      type: String,
      trim: true,
      description: 'e.g., 9:00 AM - 6:00 PM'
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
hubSchema.index({ name: 1 });
hubSchema.index({ 'address.city': 1, 'address.state': 1 });
hubSchema.index({ isActive: 1 });

// Virtual for full address
hubSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.postalCode}`;
});

// Virtual for hub summary
hubSchema.virtual('summary').get(function() {
  return `${this.name} - ${this.address.city}, ${this.address.state}`;
});

// Ensure virtual fields are serialized
hubSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to validate hub data
hubSchema.pre('save', function(next) {
  // Validate postal code format (Indian format)
  if (this.address.postalCode && !/^\d{6}$/.test(this.address.postalCode)) {
    return next(new Error('Postal code must be 6 digits'));
  }
  next();
});

export const Hub = mongoose.model<IHub>('Hub', hubSchema); 