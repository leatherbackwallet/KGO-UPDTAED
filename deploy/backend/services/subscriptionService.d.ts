import { ISubscription, SubscriptionTier } from '../models/subscriptions.model';
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
    redemptionRate: number;
    expirationDays: number;
}
export declare class SubscriptionService {
    private static readonly TIER_CONFIGS;
    private static readonly LOYALTY_CONFIG;
    static createSubscription(userId: string, tier: SubscriptionTier, billingCycle?: 'monthly' | 'quarterly' | 'yearly'): Promise<ISubscription>;
    static cancelSubscription(userId: string): Promise<ISubscription>;
    static addLoyaltyPoints(userId: string, orderAmount: number): Promise<number>;
    static redeemLoyaltyPoints(userId: string, pointsToRedeem: number): Promise<number>;
    static processReferralBonus(referrerId: string, referredUserId: string): Promise<void>;
    static getUserBenefits(userId: string): Promise<any>;
    static getSubscriptionAnalytics(): Promise<any>;
    private static calculateChurnRate;
    private static calculateRevenueProjection;
    private static getNextTierPoints;
    static canUpgradeTier(userId: string): Promise<{
        canUpgrade: boolean;
        nextTier?: SubscriptionTier;
        pointsNeeded?: number;
    }>;
    private static getNextTier;
}
//# sourceMappingURL=subscriptionService.d.ts.map