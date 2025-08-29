/**
 * Promotions Model - Advanced promotions engine with complex rules and actions
 * Manages promotional campaigns with flexible rule-based logic
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IPromotionCondition {
  type: string; // e.g., 'cart_total', 'product_in_cart', 'customer_is_new'
  config: Record<string, any>; // Configuration for the rule
}

export interface IPromotionAction {
  type: string; // e.g., 'apply_free_shipping', 'cart_percentage_discount'
  config: Record<string, any>; // Configuration for the action
}

export interface IPromotion extends Document {
  name: string;
  code?: string;
  conditions: IPromotionCondition[];
  actions: IPromotionAction[];
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const promotionConditionSchema = new Schema<IPromotionCondition>({
  type: {
    type: String,
    required: true,
    trim: true
  },
  config: {
    type: Schema.Types.Mixed,
    required: true
  }
});

const promotionActionSchema = new Schema<IPromotionAction>({
  type: {
    type: String,
    required: true,
    trim: true
  },
  config: {
    type: Schema.Types.Mixed,
    required: true
  }
});

const promotionSchema = new Schema<IPromotion>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  conditions: [promotionConditionSchema],
  actions: [promotionActionSchema],
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
promotionSchema.index({ code: 1 });
promotionSchema.index({ isActive: 1, isDeleted: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ createdAt: -1 });

// Validation: Ensure at least one condition and action
promotionSchema.pre('save', function(next) {
  if (this.conditions.length === 0) {
    return next(new Error('Promotion must have at least one condition'));
  }
  if (this.actions.length === 0) {
    return next(new Error('Promotion must have at least one action'));
  }
  next();
});

export const Promotion = mongoose.model<IPromotion>('Promotion', promotionSchema); 