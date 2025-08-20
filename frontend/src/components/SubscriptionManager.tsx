/**
 * Subscription Manager Component
 * Handles subscription tiers, loyalty points, and billing management
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

interface SubscriptionTier {
  tier: string;
  name: string;
  price: number;
  features: string[];
}

interface UserBenefits {
  tier: string;
  tierName: string;
  freeDelivery: boolean;
  prioritySupport: boolean;
  exclusiveProducts: boolean;
  earlyAccess: boolean;
  discountPercentage: number;
  monthlyCredits: number;
  loyaltyPoints: number;
  culturalFeatures: {
    festivalAlerts: boolean;
    traditionalRecipeAccess: boolean;
    culturalEventNotifications: boolean;
    languageLearningContent: boolean;
    communityAccess: boolean;
  };
}

interface LoyaltyPoints {
  currentPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  tierMultiplier: number;
  nextTierPoints: number;
}

const SubscriptionManager: React.FC = () => {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [userBenefits, setUserBenefits] = useState<UserBenefits | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const [tiersRes, benefitsRes, pointsRes] = await Promise.all([
        api.get('/subscriptions/tiers'),
        api.get('/subscriptions/benefits'),
        api.get('/subscriptions/loyalty-points'),
      ]);

      setTiers(tiersRes.data.data);
      setUserBenefits(benefitsRes.data.data);
      setLoyaltyPoints(pointsRes.data.data);
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionUpgrade = async () => {
    if (!selectedTier) return;

    try {
      await api.post('/subscriptions/create', {
        tier: selectedTier,
        billingCycle: 'monthly',
      });

      // Refresh data
      await fetchSubscriptionData();
      setSelectedTier('');
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      setError('Failed to upgrade subscription');
    }
  };

  const handleRedeemPoints = async () => {
    if (pointsToRedeem < 100) {
      setError('Minimum 100 points required for redemption');
      return;
    }

    try {
      const response = await api.post('/subscriptions/redeem-points', {
        pointsToRedeem,
      });

      // Refresh data
      await fetchSubscriptionData();
      setPointsToRedeem(0);
              alert(`Successfully redeemed ${pointsToRedeem} points for ₹${response.data.data.discountAmount.toFixed(2)} discount`);
    } catch (err) {
      console.error('Error redeeming points:', err);
      setError('Failed to redeem loyalty points');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      await api.post('/subscriptions/cancel');
      await fetchSubscriptionData();
      alert('Subscription cancelled successfully');
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-3 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
        <p className="text-gray-600">Manage your subscription tier and loyalty points</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Current Subscription Status */}
      {userBenefits && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Subscription</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium">{userBenefits.tierName} Tier</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
                  <span>{userBenefits.discountPercentage}% discount on all orders</span>
                </div>
                {userBenefits.freeDelivery && (
                  <div className="flex items-center">
                    <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
                    <span>Free delivery on all orders</span>
                  </div>
                )}
                {userBenefits.prioritySupport && (
                  <div className="flex items-center">
                    <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
                    <span>Priority customer support</span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
                  <span>₹{userBenefits.monthlyCredits} monthly credits</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Loyalty Points</h3>
              {loyaltyPoints && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Points:</span>
                    <span className="font-semibold">{loyaltyPoints.currentPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Earned:</span>
                    <span>{loyaltyPoints.totalEarned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Redeemed:</span>
                    <span>{loyaltyPoints.totalRedeemed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tier Multiplier:</span>
                    <span>{loyaltyPoints.tierMultiplier}x</span>
                  </div>
                </div>
              )}

              {/* Points Redemption */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Redeem Points</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                    placeholder="Points to redeem"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="100"
                    max={loyaltyPoints?.currentPoints || 0}
                  />
                  <button
                    onClick={handleRedeemPoints}
                    disabled={pointsToRedeem < 100 || pointsToRedeem > (loyaltyPoints?.currentPoints || 0)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Redeem
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  100 points = ₹1.00 discount
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancelSubscription}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      )}

      {/* Available Tiers */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Subscription Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.tier}
              className={`bg-white rounded-lg shadow-lg p-6 border-2 ${
                userBenefits?.tier === tier.tier ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                <div className="text-3xl font-bold text-blue-600 mt-2">
                  ₹{tier.price}
                  <span className="text-sm font-normal text-gray-500">/month</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>

              {userBenefits?.tier !== tier.tier && (
                <button
                  onClick={() => setSelectedTier(tier.tier)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {userBenefits ? 'Upgrade' : 'Subscribe'}
                </button>
              )}

              {userBenefits?.tier === tier.tier && (
                <div className="text-center text-green-600 font-medium">
                  Current Plan
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Confirmation Modal */}
      {selectedTier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Subscription</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {userBenefits ? 'upgrade to' : 'subscribe to'} the{' '}
              <strong>{tiers.find(t => t.tier === selectedTier)?.name}</strong> tier?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTier('')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubscriptionUpgrade}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager; 