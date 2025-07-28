/**
 * Personalization Routes - AI-powered recommendations and user insights
 * Provides personalized product recommendations and user behavior analytics
 */

import express from 'express';
import { personalizationService } from '../services/personalizationService';
import { UserPreferences } from '../models/userPreferences.model';
const auth = require('../middleware/auth');
const { validate, sanitizeInput } = require('../middleware/validation');
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const updatePreferencesSchema = z.object({
  action: z.enum(['view_product', 'purchase', 'search', 'add_to_cart']),
  data: z.object({
    productId: z.string().optional(),
    category: z.string().optional(),
    searchTerm: z.string().optional(),
    amount: z.number().optional(),
    productIds: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    action: z.enum(['add', 'remove']).optional()
  })
});

const culturalPreferencesSchema = z.object({
  languagePreference: z.enum(['en', 'de', 'ml']),
  festivalPreferences: z.array(z.string()),
  traditionalItems: z.boolean(),
  modernItems: z.boolean(),
  dietaryRestrictions: z.array(z.string())
});

/**
 * GET /api/personalization/recommendations
 * Get personalized product recommendations for the user
 */
router.get('/recommendations', auth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const recommendations = await personalizationService.getRecommendations(userId, limit);

    return res.status(200).json({
      success: true,
      data: {
        recommendations,
        totalCount: recommendations.length
      }
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get recommendations', code: 'RECOMMENDATIONS_ERROR' }
    });
  }
});

/**
 * GET /api/personalization/insights
 * Get user insights and analytics
 */
router.get('/insights', auth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const insights = await personalizationService.getUserInsights(userId);

    return res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error getting user insights:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get user insights', code: 'INSIGHTS_ERROR' }
    });
  }
});

/**
 * POST /api/personalization/update-preferences
 * Update user preferences based on behavior
 */
router.post('/update-preferences', auth, sanitizeInput, validate(updatePreferencesSchema), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { action, data } = req.body;

    await personalizationService.updateUserPreferences(userId, action, data);

    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to update preferences', code: 'PREFERENCES_UPDATE_ERROR' }
    });
  }
});

/**
 * GET /api/personalization/preferences
 * Get user preferences
 */
router.get('/preferences', auth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const preferences = await UserPreferences.findOne({ userId });

    if (!preferences) {
      return res.status(404).json({
        success: false,
        error: { message: 'User preferences not found', code: 'PREFERENCES_NOT_FOUND' }
      });
    }

    return res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get preferences', code: 'PREFERENCES_ERROR' }
    });
  }
});

/**
 * PUT /api/personalization/cultural-preferences
 * Update cultural preferences
 */
router.put('/cultural-preferences', auth, sanitizeInput, validate(culturalPreferencesSchema), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const culturalPreferences = req.body;

    let preferences = await UserPreferences.findOne({ userId });

    if (!preferences) {
      preferences = new UserPreferences({ userId });
    }

    preferences.culturalPreferences = {
      ...preferences.culturalPreferences,
      ...culturalPreferences
    };

    await preferences.save();

    return res.status(200).json({
      success: true,
      message: 'Cultural preferences updated successfully',
      data: preferences.culturalPreferences
    });
  } catch (error) {
    console.error('Error updating cultural preferences:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to update cultural preferences', code: 'CULTURAL_PREFERENCES_ERROR' }
    });
  }
});

/**
 * GET /api/personalization/festival-recommendations
 * Get festival-specific recommendations
 */
router.get('/festival-recommendations', auth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const festival = req.query.festival as string;

    if (!festival) {
      return res.status(400).json({
        success: false,
        error: { message: 'Festival parameter is required', code: 'FESTIVAL_REQUIRED' }
      });
    }

    // Get festival-specific recommendations
    const recommendations = await personalizationService.getRecommendations(userId, 20);
    const festivalRecommendations = recommendations.filter(rec => 
      rec.reason.toLowerCase().includes(festival.toLowerCase())
    );

    return res.status(200).json({
      success: true,
      data: {
        festival,
        recommendations: festivalRecommendations,
        totalCount: festivalRecommendations.length
      }
    });
  } catch (error) {
    console.error('Error getting festival recommendations:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get festival recommendations', code: 'FESTIVAL_RECOMMENDATIONS_ERROR' }
    });
  }
});

/**
 * GET /api/personalization/seasonal-recommendations
 * Get seasonal recommendations based on current month
 */
router.get('/seasonal-recommendations', auth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const currentMonth = new Date().getMonth() + 1;

    const recommendations = await personalizationService.getRecommendations(userId, 15);
    const seasonalRecommendations = recommendations.filter(rec => 
      rec.category === 'seasonal' || rec.category === 'cultural'
    );

    return res.status(200).json({
      success: true,
      data: {
        currentMonth,
        recommendations: seasonalRecommendations,
        totalCount: seasonalRecommendations.length
      }
    });
  } catch (error) {
    console.error('Error getting seasonal recommendations:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get seasonal recommendations', code: 'SEASONAL_RECOMMENDATIONS_ERROR' }
    });
  }
});

/**
 * GET /api/personalization/similar-users
 * Get recommendations based on similar users
 */
router.get('/similar-users', auth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const recommendations = await personalizationService.getRecommendations(userId, limit);
    const collaborativeRecommendations = recommendations.filter(rec => 
      rec.category === 'collaborative'
    );

    return res.status(200).json({
      success: true,
      data: {
        recommendations: collaborativeRecommendations,
        totalCount: collaborativeRecommendations.length
      }
    });
  } catch (error) {
    console.error('Error getting similar user recommendations:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get similar user recommendations', code: 'SIMILAR_USERS_ERROR' }
    });
  }
});

/**
 * POST /api/personalization/track-behavior
 * Track user behavior for analytics
 */
router.post('/track-behavior', auth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { event, data } = req.body;

    // Track the behavior event
    await personalizationService.updateUserPreferences(userId, event, data);

    return res.status(200).json({
      success: true,
      message: 'Behavior tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking behavior:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to track behavior', code: 'BEHAVIOR_TRACKING_ERROR' }
    });
  }
});

/**
 * GET /api/personalization/engagement-metrics
 * Get user engagement metrics
 */
router.get('/engagement-metrics', auth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const preferences = await UserPreferences.findOne({ userId });

    if (!preferences) {
      return res.status(404).json({
        success: false,
        error: { message: 'User preferences not found', code: 'PREFERENCES_NOT_FOUND' }
      });
    }

    const engagementMetrics = {
      totalVisits: preferences.engagementMetrics.totalVisits,
      averageSessionDuration: preferences.engagementMetrics.averageSessionDuration,
      cartAbandonmentRate: preferences.engagementMetrics.cartAbandonmentRate,
      returnCustomerRate: preferences.engagementMetrics.returnCustomerRate,
      lastEngagement: preferences.engagementMetrics.lastEngagement
    };

    return res.status(200).json({
      success: true,
      data: engagementMetrics
    });
  } catch (error) {
    console.error('Error getting engagement metrics:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get engagement metrics', code: 'ENGAGEMENT_METRICS_ERROR' }
    });
  }
});

export default router; 