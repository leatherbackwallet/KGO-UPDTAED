/**
 * Subscriptions Model - Premium membership and loyalty program
 * Provides recurring revenue through subscription tiers and loyalty rewards
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum SubscriptionTier {
  FREE = 'free',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  
  // Billing information
  billing: {
    amount: number;
    currency: string;
    billingCycle: 'monthly' | 'quarterly' | 'yearly';
    nextBillingDate: Date;
    lastBillingDate: Date;
    paymentMethod: string;
    autoRenew: boolean;
  };
  
  // Benefits and features
  benefits: {
    freeDelivery: boolean;
    prioritySupport: boolean;
    exclusiveProducts: boolean;
    earlyAccess: boolean;
    discountPercentage: number;
    monthlyCredits: number;
    usedCredits: number;
    referralBonus: number;
  };
  
  // Loyalty points system
  loyaltyPoints: {
    currentPoints: number;
    totalEarned: number;
    totalRedeemed: number;
    tierMultiplier: number;
    nextTierPoints: number;
  };
  
  // Usage tracking
  usage: {
    ordersThisMonth: number;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate: Date;
  };
  
  // Referral program
  referrals: {
    referralCode: string;
    referredUsers: mongoose.Types.ObjectId[];
    totalReferrals: number;
    referralEarnings: number;
  };
  
  // Cultural subscription features
  culturalFeatures: {
    festivalAlerts: boolean;
    traditionalRecipeAccess: boolean;
    culturalEventNotifications: boolean;
    languageLearningContent: boolean;
    communityAccess: boolean;
  };
  
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  tier: {
    type: String,
    enum: Object.values(SubscriptionTier),
    default: SubscriptionTier.FREE,
    required: true
  },
  
  status: {
    type: String,
    enum: Object.values(SubscriptionStatus),
    default: SubscriptionStatus.ACTIVE,
    required: true
  },
  
  billing: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    },
    nextBillingDate: Date,
    lastBillingDate: Date,
    paymentMethod: String,
    autoRenew: {
      type: Boolean,
      default: true
    }
  },
  
  benefits: {
    freeDelivery: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    exclusiveProducts: {
      type: Boolean,
      default: false
    },
    earlyAccess: {
      type: Boolean,
      default: false
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    monthlyCredits: {
      type: Number,
      default: 0
    },
    usedCredits: {
      type: Number,
      default: 0
    },
    referralBonus: {
      type: Number,
      default: 0
    }
  },
  
  loyaltyPoints: {
    currentPoints: {
      type: Number,
      default: 0
    },
    totalEarned: {
      type: Number,
      default: 0
    },
    totalRedeemed: {
      type: Number,
      default: 0
    },
    tierMultiplier: {
      type: Number,
      default: 1
    },
    nextTierPoints: {
      type: Number,
      default: 1000
    }
  },
  
  usage: {
    ordersThisMonth: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    },
    lastOrderDate: Date
  },
  
  referrals: {
    referralCode: {
      type: String,
      unique: true,
      sparse: true
    },
    referredUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    totalReferrals: {
      type: Number,
      default: 0
    },
    referralEarnings: {
      type: Number,
      default: 0
    }
  },
  
  culturalFeatures: {
    festivalAlerts: {
      type: Boolean,
      default: true
    },
    traditionalRecipeAccess: {
      type: Boolean,
      default: false
    },
    culturalEventNotifications: {
      type: Boolean,
      default: true
    },
    languageLearningContent: {
      type: Boolean,
      default: false
    },
    communityAccess: {
      type: Boolean,
      default: false
    }
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate referral code before saving
subscriptionSchema.pre('save', function(next) {
  if (this.isNew && !this.referrals.referralCode) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.referrals.referralCode = `KGO${timestamp}${random}`;
  }
  next();
});

// Indexes for performance
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ tier: 1, status: 1 });
subscriptionSchema.index({ 'referrals.referralCode': 1 });
subscriptionSchema.index({ 'billing.nextBillingDate': 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema); 