"use strict";
/**
 * Subscription Routes - Advanced Subscription and Loyalty Program Management
 * Handles subscription management, billing, loyalty points, and cultural features
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express = __importStar(require("express"));
const subscriptionService_1 = require("../services/subscriptionService");
const subscriptions_model_1 = require("../models/subscriptions.model");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const zod_1 = require("zod");
const router = express.Router();
// Validation schemas
const createSubscriptionSchema = zod_1.z.object({
    tier: zod_1.z.enum(['free', 'silver', 'gold', 'platinum']),
    billingCycle: zod_1.z.enum(['monthly', 'quarterly', 'yearly']).optional(),
});
const redeemPointsSchema = zod_1.z.object({
    pointsToRedeem: zod_1.z.number().min(100).max(10000),
});
const referralSchema = zod_1.z.object({
    referralCode: zod_1.z.string().min(3).max(20),
});
/**
 * @route   GET /api/subscriptions/benefits
 * @desc    Get user's subscription benefits
 * @access  Private
 */
router.get('/benefits', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const benefits = await subscriptionService_1.SubscriptionService.getUserBenefits(userId);
        return res.json({
            success: true,
            data: benefits,
        });
    }
    catch (error) {
        console.error('Error getting subscription benefits:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get subscription benefits',
                code: 'SUBSCRIPTION_BENEFITS_ERROR',
            },
        });
    }
});
/**
 * @route   POST /api/subscriptions/create
 * @desc    Create or update user subscription
 * @access  Private
 */
router.post('/create', auth_1.auth, (0, validation_1.validate)(createSubscriptionSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { tier, billingCycle = 'monthly' } = req.body;
        const subscription = await subscriptionService_1.SubscriptionService.createSubscription(userId, tier, billingCycle);
        return res.json({
            success: true,
            data: {
                subscription,
                message: `Successfully ${subscription.isNew ? 'created' : 'updated'} ${tier} subscription`,
            },
        });
    }
    catch (error) {
        console.error('Error creating subscription:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create subscription',
                code: 'SUBSCRIPTION_CREATE_ERROR',
            },
        });
    }
});
/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Cancel user subscription
 * @access  Private
 */
router.post('/cancel', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const subscription = await subscriptionService_1.SubscriptionService.cancelSubscription(userId);
        return res.json({
            success: true,
            data: {
                subscription,
                message: 'Subscription cancelled successfully',
            },
        });
    }
    catch (error) {
        console.error('Error cancelling subscription:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to cancel subscription',
                code: 'SUBSCRIPTION_CANCEL_ERROR',
            },
        });
    }
});
/**
 * @route   GET /api/subscriptions/loyalty-points
 * @desc    Get user's loyalty points
 * @access  Private
 */
router.get('/loyalty-points', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const subscription = await subscriptions_model_1.Subscription.findOne({
            userId: userId,
            status: subscriptions_model_1.SubscriptionStatus.ACTIVE,
        });
        if (!subscription) {
            return res.json({
                success: true,
                data: {
                    currentPoints: 0,
                    totalEarned: 0,
                    totalRedeemed: 0,
                    tierMultiplier: 1,
                    nextTierPoints: 1000,
                },
            });
        }
        return res.json({
            success: true,
            data: subscription.loyaltyPoints,
        });
    }
    catch (error) {
        console.error('Error getting loyalty points:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get loyalty points',
                code: 'LOYALTY_POINTS_ERROR',
            },
        });
    }
});
/**
 * @route   POST /api/subscriptions/redeem-points
 * @desc    Redeem loyalty points for discount
 * @access  Private
 */
router.post('/redeem-points', auth_1.auth, (0, validation_1.validate)(redeemPointsSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { pointsToRedeem } = req.body;
        const discountAmount = await subscriptionService_1.SubscriptionService.redeemLoyaltyPoints(userId, pointsToRedeem);
        return res.json({
            success: true,
            data: {
                pointsRedeemed: pointsToRedeem,
                discountAmount,
                message: `Successfully redeemed ${pointsToRedeem} points for ₹${discountAmount.toFixed(2)} discount`,
            },
        });
    }
    catch (error) {
        console.error('Error redeeming loyalty points:', error);
        return res.status(400).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Failed to redeem loyalty points',
                code: 'LOYALTY_POINTS_REDEEM_ERROR',
            },
        });
    }
});
/**
 * @route   GET /api/subscriptions/upgrade-status
 * @desc    Check if user can upgrade subscription tier
 * @access  Private
 */
router.get('/upgrade-status', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const upgradeStatus = await subscriptionService_1.SubscriptionService.canUpgradeTier(userId);
        return res.json({
            success: true,
            data: upgradeStatus,
        });
    }
    catch (error) {
        console.error('Error checking upgrade status:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to check upgrade status',
                code: 'UPGRADE_STATUS_ERROR',
            },
        });
    }
});
/**
 * @route   POST /api/subscriptions/process-referral
 * @desc    Process referral bonus
 * @access  Private
 */
router.post('/process-referral', auth_1.auth, (0, validation_1.validate)(referralSchema), async (req, res) => {
    try {
        const referrerId = req.user.id;
        const { referralCode } = req.body;
        // Find the user who owns this referral code
        const referrerSubscription = await subscriptions_model_1.Subscription.findOne({
            'referrals.referralCode': referralCode,
            status: subscriptions_model_1.SubscriptionStatus.ACTIVE,
        });
        if (!referrerSubscription) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid referral code',
                    code: 'INVALID_REFERRAL_CODE',
                },
            });
        }
        if (referrerSubscription.userId.toString() === referrerId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Cannot refer yourself',
                    code: 'SELF_REFERRAL_ERROR',
                },
            });
        }
        // Check if this user has already been referred
        const existingReferral = await subscriptions_model_1.Subscription.findOne({
            userId: referrerId,
            'referrals.referredUsers': referrerSubscription.userId,
        });
        if (existingReferral) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Referral already processed',
                    code: 'DUPLICATE_REFERRAL_ERROR',
                },
            });
        }
        await subscriptionService_1.SubscriptionService.processReferralBonus(referrerSubscription.userId.toString(), referrerId);
        return res.json({
            success: true,
            data: {
                message: 'Referral bonus processed successfully',
                referralCode,
            },
        });
    }
    catch (error) {
        console.error('Error processing referral:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to process referral',
                code: 'REFERRAL_PROCESS_ERROR',
            },
        });
    }
});
/**
 * @route   GET /api/subscriptions/analytics
 * @desc    Get subscription analytics (Admin only)
 * @access  Private (Admin)
 */
router.get('/analytics', auth_1.auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.roleName !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied. Admin privileges required.',
                    code: 'ADMIN_ACCESS_REQUIRED',
                },
            });
        }
        const analytics = await subscriptionService_1.SubscriptionService.getSubscriptionAnalytics();
        return res.json({
            success: true,
            data: analytics,
        });
    }
    catch (error) {
        console.error('Error getting subscription analytics:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get subscription analytics',
                code: 'SUBSCRIPTION_ANALYTICS_ERROR',
            },
        });
    }
});
/**
 * @route   GET /api/subscriptions/tiers
 * @desc    Get available subscription tiers
 * @access  Public
 */
router.get('/tiers', async (req, res) => {
    try {
        const tiers = [
            {
                tier: 'free',
                name: 'Free',
                price: 0,
                features: [
                    'Basic access to products',
                    'Standard delivery',
                    'Festival alerts',
                    'Cultural event notifications',
                ],
            },
            {
                tier: 'silver',
                name: 'Silver',
                price: 499,
                features: [
                    'Free delivery',
                    '5% discount on all orders',
                    'Priority support',
                    'Traditional recipe access',
                    '₹2500 monthly credits',
                    '₹500 referral bonus',
                ],
            },
            {
                tier: 'gold',
                name: 'Gold',
                price: 999,
                features: [
                    'Free delivery',
                    '10% discount on all orders',
                    'Priority support',
                    'Exclusive products access',
                    'Early access to new products',
                    '₹5000 monthly credits',
                    '₹750 referral bonus',
                    'Language learning content',
                    'Community access',
                ],
            },
            {
                tier: 'platinum',
                name: 'Platinum',
                price: 1499,
                features: [
                    'Free delivery',
                    '15% discount on all orders',
                    'Priority support',
                    'Exclusive products access',
                    'Early access to new products',
                    '₹10000 monthly credits',
                    '₹1000 referral bonus',
                    'All cultural features',
                    'Premium community access',
                ],
            },
        ];
        return res.json({
            success: true,
            data: tiers,
        });
    }
    catch (error) {
        console.error('Error getting subscription tiers:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get subscription tiers',
                code: 'SUBSCRIPTION_TIERS_ERROR',
            },
        });
    }
});
exports.default = router;
