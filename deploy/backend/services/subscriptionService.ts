/**
 * Subscription Service - Advanced Subscription and Loyalty Program Management
 * Handles subscription tiers, billing, loyalty points, and cultural features
 */

import { Subscription, ISubscription, SubscriptionTier, SubscriptionStatus } from '../models/subscriptions.model';
import { User, IUser } from '../models/users.model';
import { Order, IOrder } from '../models/orders.model';
import { UserPreferences, IUserPreferences } from '../models/userPreferences.model';
import mongoose from 'mongoose';

export interface SubscriptionTierConfig {
  tier: SubscriptionTier;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
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
  culturalFeatures: {
    festivalAlerts: boolean;
    traditionalRecipeAccess: boolean;
    culturalEventNotifications: boolean;
    languageLearningContent: boolean;
    communityAccess: boolean;
  };
}

export interface LoyaltyPointsConfig {
  pointsPerRupee: number;
  tierMultipliers: Record<SubscriptionTier, number>;
  redemptionRate: number; // Points per rupee when redeeming
  expirationDays: number;
}

export class SubscriptionService {
  private static readonly TIER_CONFIGS: Record<SubscriptionTier, SubscriptionTierConfig> = {
        [SubscriptionTier.FREE]: {
      tier: SubscriptionTier.FREE,
      name: 'Free',
      price: 0,
      billingCycle: 'monthly',
      benefits: {
        freeDelivery: false,
        prioritySupport: false,
        exclusiveProducts: false,
        earlyAccess: false,
        discountPercentage: 0,
        monthlyCredits: 0,
        usedCredits: 0,
        referralBonus: 5,
      },
      culturalFeatures: {
        festivalAlerts: true,
        traditionalRecipeAccess: false,
        culturalEventNotifications: true,
        languageLearningContent: false,
        communityAccess: false,
      },
    },
    [SubscriptionTier.SILVER]: {
      tier: SubscriptionTier.SILVER,
      name: 'Silver',
      price: 499,
      billingCycle: 'monthly',
      benefits: {
        freeDelivery: true,
        prioritySupport: true,
        exclusiveProducts: false,
        earlyAccess: false,
        discountPercentage: 5,
        monthlyCredits: 2500,
        usedCredits: 0,
        referralBonus: 500,
      },
      culturalFeatures: {
        festivalAlerts: true,
        traditionalRecipeAccess: true,
        culturalEventNotifications: true,
        languageLearningContent: false,
        communityAccess: false,
      },
    },
    [SubscriptionTier.GOLD]: {
      tier: SubscriptionTier.GOLD,
      name: 'Gold',
      price: 999,
      billingCycle: 'monthly',
      benefits: {
        freeDelivery: true,
        prioritySupport: true,
        exclusiveProducts: true,
        earlyAccess: true,
        discountPercentage: 10,
        monthlyCredits: 5000,
        usedCredits: 0,
        referralBonus: 750,
      },
      culturalFeatures: {
        festivalAlerts: true,
        traditionalRecipeAccess: true,
        culturalEventNotifications: true,
        languageLearningContent: true,
        communityAccess: true,
      },
    },
    [SubscriptionTier.PLATINUM]: {
      tier: SubscriptionTier.PLATINUM,
      name: 'Platinum',
      price: 1499,
      billingCycle: 'monthly',
      benefits: {
        freeDelivery: true,
        prioritySupport: true,
        exclusiveProducts: true,
        earlyAccess: true,
        discountPercentage: 15,
        monthlyCredits: 10000,
        usedCredits: 0,
        referralBonus: 1000,
      },
      culturalFeatures: {
        festivalAlerts: true,
        traditionalRecipeAccess: true,
        culturalEventNotifications: true,
        languageLearningContent: true,
        communityAccess: true,
      },
    },
  };

  private static readonly LOYALTY_CONFIG: LoyaltyPointsConfig = {
    pointsPerRupee: 1,
    tierMultipliers: {
      [SubscriptionTier.FREE]: 1,
      [SubscriptionTier.SILVER]: 1.2,
      [SubscriptionTier.GOLD]: 1.5,
      [SubscriptionTier.PLATINUM]: 2,
    },
    redemptionRate: 0.01, // 100 points = ₹1
    expirationDays: 365,
  };

  /**
   * Create or update user subscription
   */
  static async createSubscription(
    userId: string,
    tier: SubscriptionTier,
    billingCycle: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): Promise<ISubscription> {
    const config = this.TIER_CONFIGS[tier];
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate billing amount based on cycle
    let billingAmount = config.price;
    if (billingCycle === 'quarterly') {
      billingAmount = config.price * 3 * 0.9; // 10% discount
    } else if (billingCycle === 'yearly') {
      billingAmount = config.price * 12 * 0.8; // 20% discount
    }

    const nextBillingDate = new Date();
    if (billingCycle === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else if (billingCycle === 'quarterly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    // Check if user already has a subscription
    let subscription = await Subscription.findOne({ 
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING] }
    });

    if (subscription) {
      // Update existing subscription
      subscription.tier = tier;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.billing = {
        ...subscription.billing,
        amount: billingAmount,
        billingCycle,
        nextBillingDate,
        autoRenew: true,
      };
      subscription.benefits = config.benefits;
      subscription.culturalFeatures = config.culturalFeatures;
      subscription.loyaltyPoints.tierMultiplier = this.LOYALTY_CONFIG.tierMultipliers[tier];
      subscription.loyaltyPoints.nextTierPoints = this.getNextTierPoints(tier);
    } else {
      // Create new subscription
      subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(userId),
        tier,
        status: SubscriptionStatus.ACTIVE,
        billing: {
          amount: billingAmount,
          currency: 'INR',
          billingCycle,
          nextBillingDate,
          lastBillingDate: new Date(),
          paymentMethod: 'card',
          autoRenew: true,
        },
        benefits: config.benefits,
        culturalFeatures: config.culturalFeatures,
        loyaltyPoints: {
          currentPoints: 0,
          totalEarned: 0,
          totalRedeemed: 0,
          tierMultiplier: this.LOYALTY_CONFIG.tierMultipliers[tier],
          nextTierPoints: this.getNextTierPoints(tier),
        },
        usage: {
          ordersThisMonth: 0,
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          lastOrderDate: null,
        },
        referrals: {
          referralCode: null, // Will be generated by pre-save hook
          referredUsers: [],
          totalReferrals: 0,
          referralEarnings: 0,
        },
      });
    }

    await subscription.save();
    return subscription;
  }

  /**
   * Cancel user subscription
   */
  static async cancelSubscription(userId: string): Promise<ISubscription> {
    const subscription = await Subscription.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING] }
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.billing.autoRenew = false;
    await subscription.save();

    return subscription;
  }

  /**
   * Add loyalty points for purchase
   */
  static async addLoyaltyPoints(userId: string, orderAmount: number): Promise<number> {
    const subscription = await Subscription.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: SubscriptionStatus.ACTIVE
    });

    if (!subscription) {
      return 0; // No points for non-subscribers
    }

    const basePoints = Math.floor(orderAmount * this.LOYALTY_CONFIG.pointsPerRupee);
    const tierMultiplier = this.LOYALTY_CONFIG.tierMultipliers[subscription.tier];
    const earnedPoints = Math.floor(basePoints * tierMultiplier);

    subscription.loyaltyPoints.currentPoints += earnedPoints;
    subscription.loyaltyPoints.totalEarned += earnedPoints;
    subscription.usage.ordersThisMonth += 1;
    subscription.usage.totalOrders += 1;
    subscription.usage.totalSpent += orderAmount;
    subscription.usage.averageOrderValue = subscription.usage.totalSpent / subscription.usage.totalOrders;
    subscription.usage.lastOrderDate = new Date();

    await subscription.save();
    return earnedPoints;
  }

  /**
   * Redeem loyalty points for discount
   */
  static async redeemLoyaltyPoints(userId: string, pointsToRedeem: number): Promise<number> {
    const subscription = await Subscription.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: SubscriptionStatus.ACTIVE
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    if (subscription.loyaltyPoints.currentPoints < pointsToRedeem) {
      throw new Error('Insufficient loyalty points');
    }

    const discountAmount = pointsToRedeem * this.LOYALTY_CONFIG.redemptionRate;
    
    subscription.loyaltyPoints.currentPoints -= pointsToRedeem;
    subscription.loyaltyPoints.totalRedeemed += pointsToRedeem;

    await subscription.save();
    return discountAmount;
  }

  /**
   * Process referral bonus
   */
  static async processReferralBonus(referrerId: string, referredUserId: string): Promise<void> {
    const referrerSubscription = await Subscription.findOne({
      userId: new mongoose.Types.ObjectId(referrerId),
      status: SubscriptionStatus.ACTIVE
    });

    if (!referrerSubscription) {
      return; // No bonus for non-subscribers
    }

    const bonusAmount = referrerSubscription.benefits.referralBonus;
    
    referrerSubscription.loyaltyPoints.currentPoints += bonusAmount;
    referrerSubscription.loyaltyPoints.totalEarned += bonusAmount;
    referrerSubscription.referrals.referredUsers.push(new mongoose.Types.ObjectId(referredUserId));
    referrerSubscription.referrals.totalReferrals += 1;
    referrerSubscription.referrals.referralEarnings += bonusAmount;

    await referrerSubscription.save();
  }

  /**
   * Get subscription benefits for user
   */
  static async getUserBenefits(userId: string): Promise<any> {
    const subscription = await Subscription.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: SubscriptionStatus.ACTIVE
    });

    if (!subscription) {
      return this.TIER_CONFIGS[SubscriptionTier.FREE].benefits;
    }

    const config = this.TIER_CONFIGS[subscription.tier];
    return {
      ...subscription.benefits,
      tier: subscription.tier,
      tierName: config.name,
      loyaltyPoints: subscription.loyaltyPoints.currentPoints,
      monthlyCredits: subscription.benefits.monthlyCredits - subscription.benefits.usedCredits,
      culturalFeatures: subscription.culturalFeatures,
    };
  }

  /**
   * Get subscription analytics
   */
  static async getSubscriptionAnalytics(): Promise<any> {
    const analytics = await Subscription.aggregate([
      { $match: { status: SubscriptionStatus.ACTIVE } },
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$billing.amount' },
          averageLoyaltyPoints: { $avg: '$loyaltyPoints.currentPoints' },
        }
      }
    ]);

    const totalSubscribers = await Subscription.countDocuments({ status: SubscriptionStatus.ACTIVE });
    const churnRate = await this.calculateChurnRate();

    return {
      totalSubscribers,
      churnRate,
      tierBreakdown: analytics,
      revenueProjection: await this.calculateRevenueProjection(),
    };
  }

  /**
   * Calculate churn rate
   */
  private static async calculateChurnRate(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const cancelledThisMonth = await Subscription.countDocuments({
      status: SubscriptionStatus.CANCELLED,
      updatedAt: { $gte: thirtyDaysAgo }
    });

    const totalActive = await Subscription.countDocuments({ status: SubscriptionStatus.ACTIVE });
    
    return totalActive > 0 ? (cancelledThisMonth / totalActive) * 100 : 0;
  }

  /**
   * Calculate revenue projection
   */
  private static async calculateRevenueProjection(): Promise<number> {
    const activeSubscriptions = await Subscription.find({ status: SubscriptionStatus.ACTIVE });
    
    return activeSubscriptions.reduce((total, sub) => {
      const monthlyAmount = sub.billing.billingCycle === 'monthly' 
        ? sub.billing.amount 
        : sub.billing.billingCycle === 'quarterly' 
          ? sub.billing.amount / 3 
          : sub.billing.amount / 12;
      
      return total + monthlyAmount;
    }, 0);
  }

  /**
   * Get points needed for next tier
   */
  private static getNextTierPoints(currentTier: SubscriptionTier): number {
    const tierPoints = {
      [SubscriptionTier.FREE]: 1000,
      [SubscriptionTier.SILVER]: 5000,
      [SubscriptionTier.GOLD]: 10000,
      [SubscriptionTier.PLATINUM]: 0, // Highest tier
    };

    return tierPoints[currentTier] || 0;
  }

  /**
   * Check if user can upgrade tier
   */
  static async canUpgradeTier(userId: string): Promise<{ canUpgrade: boolean; nextTier?: SubscriptionTier; pointsNeeded?: number }> {
    const subscription = await Subscription.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: SubscriptionStatus.ACTIVE
    });

    if (!subscription) {
      return { canUpgrade: false };
    }

    const currentTier = subscription.tier;
    const currentPoints = subscription.loyaltyPoints.currentPoints;
    const nextTierPoints = subscription.loyaltyPoints.nextTierPoints;

    if (currentTier === SubscriptionTier.PLATINUM) {
      return { canUpgrade: false };
    }

    const canUpgrade = currentPoints >= nextTierPoints;
    const nextTier = this.getNextTier(currentTier);

    return {
      canUpgrade,
      nextTier,
      pointsNeeded: canUpgrade ? 0 : nextTierPoints - currentPoints,
    };
  }

  /**
   * Get next tier
   */
  private static getNextTier(currentTier: SubscriptionTier): SubscriptionTier {
    const tierOrder = [
      SubscriptionTier.FREE,
      SubscriptionTier.SILVER,
      SubscriptionTier.GOLD,
      SubscriptionTier.PLATINUM,
    ];

    const currentIndex = tierOrder.indexOf(currentTier);
    return tierOrder[currentIndex + 1] || SubscriptionTier.PLATINUM;
  }
} 