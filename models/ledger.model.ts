/**
 * Ledger Model - Financial core for income and expense tracking
 * Comprehensive financial record keeping with categorization and audit trail
 */

import mongoose, { Document, Schema } from 'mongoose';

// Ledger type enum
export enum LedgerType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

// Ledger category enum
export enum LedgerCategory {
  SALES_REVENUE = 'sales_revenue',
  DELIVERY_FEE = 'delivery_fee',
  VENDOR_PAYOUT = 'vendor_payout',
  PAYMENT_GATEWAY_FEE = 'payment_gateway_fee',
  MARKETING = 'marketing',
  REFUND = 'refund',
  SALARIES = 'salaries',
  OTHER = 'other'
}

// Related document interface
export interface IRelatedDocument {
  modelName: string;
  docId: mongoose.Types.ObjectId;
}

// TypeScript interface for Ledger document
export interface ILedger extends Document {
  date: Date;
  type: LedgerType;
  category: LedgerCategory;
  description?: string;
  amount: number;
  relatedDocument?: IRelatedDocument;
  recordedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Ledger schema definition
const ledgerSchema = new Schema<ILedger>(
  {
    date: {
      type: Date,
      required: [true, 'Ledger date is required'],
      index: true,
      default: Date.now
    },
    type: {
      type: String,
      enum: Object.values(LedgerType),
      required: [true, 'Ledger type is required'],
      index: true
    },
    category: {
      type: String,
      enum: Object.values(LedgerCategory),
      required: [true, 'Ledger category is required'],
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    relatedDocument: {
      modelName: {
        type: String,
        required: true,
        enum: ['Order', 'Transaction', 'Payout', 'Coupon', 'User']
      },
      docId: {
        type: Schema.Types.ObjectId,
        required: true
      }
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
ledgerSchema.index({ date: 1, type: 1 });
ledgerSchema.index({ category: 1, date: -1 });
ledgerSchema.index({ type: 1, category: 1, date: -1 });

// Compound index for financial reporting
ledgerSchema.index({ date: 1, type: 1, category: 1 });

// Virtual for formatted amount
ledgerSchema.virtual('formattedAmount').get(function(this: ILedger) {
  const prefix = this.type === LedgerType.INCOME ? '+' : '-';
  return `${prefix}₹${this.amount.toFixed(2)}`;
});

// Virtual for entry summary
ledgerSchema.virtual('summary').get(function(this: ILedger) {
  const prefix = this.type === LedgerType.INCOME ? '+' : '-';
  const formattedAmount = `${prefix}₹${this.amount.toFixed(2)}`;
  return `${this.type.toUpperCase()} - ${this.category.replace('_', ' ').toUpperCase()} - ${formattedAmount}`;
});

// Virtual for is income
ledgerSchema.virtual('isIncome').get(function(this: ILedger) {
  return this.type === LedgerType.INCOME;
});

// Virtual for is expense
ledgerSchema.virtual('isExpense').get(function(this: ILedger) {
  return this.type === LedgerType.EXPENSE;
});

// Ensure virtual fields are serialized
ledgerSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to validate ledger data
ledgerSchema.pre('save', function(next) {
  // Validate category matches type
  const incomeCategories = [
    LedgerCategory.SALES_REVENUE,
    LedgerCategory.DELIVERY_FEE
  ];
  
  const expenseCategories = [
    LedgerCategory.VENDOR_PAYOUT,
    LedgerCategory.PAYMENT_GATEWAY_FEE,
    LedgerCategory.MARKETING,
    LedgerCategory.REFUND,
    LedgerCategory.SALARIES,
    LedgerCategory.OTHER
  ];
  
  if (this.type === LedgerType.INCOME && !incomeCategories.includes(this.category)) {
    return next(new Error('Invalid category for income type'));
  }
  
  if (this.type === LedgerType.EXPENSE && !expenseCategories.includes(this.category)) {
    return next(new Error('Invalid category for expense type'));
  }
  
  next();
});

export const Ledger = mongoose.model<ILedger>('Ledger', ledgerSchema); 