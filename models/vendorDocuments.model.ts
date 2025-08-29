/**
 * VendorDocument Model - Vendor verification document management
 * Handles GSTIN, FSSAI, PAN, and bank account document verification
 */

import mongoose, { Document, Schema } from 'mongoose';

// Document type enum
export enum DocumentType {
  GSTIN = 'GSTIN',
  FSSAI = 'FSSAI',
  PAN = 'PAN',
  BANK_ACCOUNT = 'BANK_ACCOUNT'
}

// Document status enum
export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// TypeScript interface for VendorDocument document
export interface IVendorDocument extends Document {
  vendorId: mongoose.Types.ObjectId;
  documentType: DocumentType;
  fileUrl: string;
  status: DocumentStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// VendorDocument schema definition
const vendorDocumentSchema = new Schema<IVendorDocument>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor ID is required'],
      index: true
    },
    documentType: {
      type: String,
      enum: Object.values(DocumentType),
      required: [true, 'Document type is required'],
      index: true
    },
    fileUrl: {
      type: String,
      required: [true, 'Document file URL is required'],
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(DocumentStatus),
      required: [true, 'Document status is required'],
      default: DocumentStatus.PENDING,
      index: true
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
vendorDocumentSchema.index({ vendorId: 1, documentType: 1 }, { unique: true });
vendorDocumentSchema.index({ status: 1, documentType: 1 });

// Pre-save middleware to validate unique vendor-document type combination
vendorDocumentSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('vendorId') || this.isModified('documentType')) {
    const existing = await mongoose.model('VendorDocument').findOne({
      vendorId: this.vendorId,
      documentType: this.documentType,
      _id: { $ne: this._id }
    });
    
    if (existing) {
      return next(new Error('Document of this type already exists for this vendor'));
    }
  }
  next();
});

// Pre-save middleware to clear rejection reason when status changes to approved
vendorDocumentSchema.pre('save', function(next) {
  if (this.status === DocumentStatus.APPROVED && this.rejectionReason) {
    this.rejectionReason = '';
  }
  next();
});

export const VendorDocument = mongoose.model<IVendorDocument>('VendorDocument', vendorDocumentSchema); 