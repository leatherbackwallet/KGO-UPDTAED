/**
 * Vendor Model - Marketplace vendor management with store information
 * Handles vendor profiles, addresses, service areas, and approval status
 */

import mongoose, { Document, Schema } from 'mongoose';

// Vendor status enum
export enum VendorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_APPROVAL = 'pending_approval',
  REJECTED = 'rejected'
}

// Address interface
export interface IVendorAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

// TypeScript interface for Vendor document
export interface IVendor extends Document {
  ownerId: mongoose.Types.ObjectId;
  storeName: string;
  status: VendorStatus;
  address: IVendorAddress;
  serviceablePincodes: string[];
  averageRating: number;
  createdAt: Date;
  updatedAt: Date;
}

// Vendor schema definition
const vendorSchema = new Schema<IVendor>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor owner is required'],
      index: true
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters']
    },
    status: {
      type: String,
      enum: Object.values(VendorStatus),
      required: [true, 'Vendor status is required'],
      default: VendorStatus.PENDING_APPROVAL,
      index: true
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
        trim: true
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
      },
      postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true,
        match: [/^\d{6}$/, 'Postal code must be 6 digits']
      }
    },
    serviceablePincodes: {
      type: [String],
      required: [true, 'At least one serviceable pincode is required'],
      index: true,
      validate: {
        validator: function(pincodes: string[]) {
          return pincodes.length > 0 && pincodes.every(pincode => /^\d{6}$/.test(pincode));
        },
        message: 'All pincodes must be 6 digits and at least one is required'
      }
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
vendorSchema.index({ storeName: 1 });
vendorSchema.index({ status: 1, averageRating: -1 });
vendorSchema.index({ 'address.city': 1, 'address.state': 1 });

// Virtual for full address
vendorSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.postalCode}`;
});

// Ensure virtual fields are serialized
vendorSchema.set('toJSON', { virtuals: true });

export const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema); 