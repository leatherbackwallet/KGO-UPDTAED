/**
 * Subscription Routes - Advanced Subscription and Loyalty Program Management
 * Handles subscription management, billing, loyalty points, and cultural features
 */

import * as express from 'express';
import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscriptionService';
import { Subscription, SubscriptionTier, SubscriptionStatus } from '../models/subscriptions.model';
import { auth as authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

// Type assertion helper for authenticated requests
type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
};

const router = express.Router();

// Validation schemas
const createSubscriptionSchema = z.object({
  tier: z.enum(['free', 'silver', 'gold', 'platinum']),
  billingCycle: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
});

const redeemPointsSchema = z.object({
  pointsToRedeem: z.number().min(100).max(10000),
});

const referralSchema = z.object({
  referralCode: z.string().min(3).max(20),
});

/**
 * @route   GET /api/subscriptions/benefits
 * @desc    Get user's subscription benefits
 * @access  Private
 */
router.get('/benefits', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const benefits = await SubscriptionService.getUserBenefits(userId);
    
    return res.json({
      success: true,
      data: benefits,
    });
  } catch (error) {
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
router.post('/create', authenticateToken, validate(createSubscriptionSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { tier, billingCycle = 'monthly' } = req.body;

    const subscription = await SubscriptionService.createSubscription(
      userId,
      tier as SubscriptionTier,
      billingCycle
    );

    return res.json({
      success: true,
      data: {
        subscription,
        message: `Successfully ${subscription.isNew ? 'created' : 'updated'} ${tier} subscription`,
      },
    });
  } catch (error) {
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
router.post('/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const subscription = await SubscriptionService.cancelSubscription(userId);

    return res.json({
      success: true,
      data: {
        subscription,
        message: 'Subscription cancelled successfully',
      },
    });
  } catch (error) {
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
router.get('/loyalty-points', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const subscription = await Subscription.findOne({
      userId: userId,
      status: SubscriptionStatus.ACTIVE,
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
  } catch (error) {
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
router.post('/redeem-points', authenticateToken, validate(redeemPointsSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { pointsToRedeem } = req.body;

    const discountAmount = await SubscriptionService.redeemLoyaltyPoints(userId, pointsToRedeem);

    return res.json({
      success: true,
      data: {
        pointsRedeemed: pointsToRedeem,
        discountAmount,
        message: `Successfully redeemed ${pointsToRedeem} points for ₹${discountAmount.toFixed(2)} discount`,
      },
    });
  } catch (error) {
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
router.get('/upgrade-status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const upgradeStatus = await SubscriptionService.canUpgradeTier(userId);

    return res.json({
      success: true,
      data: upgradeStatus,
    });
  } catch (error) {
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
router.post('/process-referral', authenticateToken, validate(referralSchema), async (req: Request, res: Response) => {
  try {
    const referrerId = (req as any).user.id;
    const { referralCode } = req.body;

    // Find the user who owns this referral code
    const referrerSubscription = await Subscription.findOne({
      'referrals.referralCode': referralCode,
      status: SubscriptionStatus.ACTIVE,
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
    const existingReferral = await Subscription.findOne({
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

    await SubscriptionService.processReferralBonus(
      referrerSubscription.userId.toString(),
      referrerId
    );

    return res.json({
      success: true,
      data: {
        message: 'Referral bonus processed successfully',
        referralCode,
      },
    });
  } catch (error) {
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
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if ((req as any).user.roleName !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Admin privileges required.',
          code: 'ADMIN_ACCESS_REQUIRED',
        },
      });
    }

    const analytics = await SubscriptionService.getSubscriptionAnalytics();

    return res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
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
router.get('/tiers', async (req: Request, res: Response) => {
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
  } catch (error) {
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

export default router; 