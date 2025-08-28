import mongoose, { Document } from 'mongoose';
export declare enum SubscriptionTier {
    FREE = "free",
    SILVER = "silver",
    GOLD = "gold",
    PLATINUM = "platinum"
}
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    CANCELLED = "cancelled",
    EXPIRED = "expired",
    PENDING = "pending"
}
export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    billing: {
        amount: number;
        currency: string;
        billingCycle: 'monthly' | 'quarterly' | 'yearly';
        nextBillingDate: Date;
        lastBillingDate: Date;
        paymentMethod: string;
        autoRenew: boolean;
    };
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
    loyaltyPoints: {
        currentPoints: number;
        totalEarned: number;
        totalRedeemed: number;
        tierMultiplier: number;
        nextTierPoints: number;
    };
    usage: {
        ordersThisMonth: number;
        totalOrders: number;
        totalSpent: number;
        averageOrderValue: number;
        lastOrderDate: Date;
    };
    referrals: {
        referralCode: string;
        referredUsers: mongoose.Types.ObjectId[];
        totalReferrals: number;
        referralEarnings: number;
    };
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
export declare const Subscription: mongoose.Model<ISubscription, {}, {}, {}, mongoose.Document<unknown, {}, ISubscription> & ISubscription & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=subscriptions.model.d.ts.map