"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const personalizationService_1 = require("../services/personalizationService");
const userPreferences_model_1 = require("../models/userPreferences.model");
const auth = require('../middleware/auth');
const { validate, sanitizeInput } = require('../middleware/validation');
const zod_1 = require("zod");
const router = express_1.default.Router();
const updatePreferencesSchema = zod_1.z.object({
    action: zod_1.z.enum(['view_product', 'purchase', 'search', 'add_to_cart']),
    data: zod_1.z.object({
        productId: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        searchTerm: zod_1.z.string().optional(),
        amount: zod_1.z.number().optional(),
        productIds: zod_1.z.array(zod_1.z.string()).optional(),
        categories: zod_1.z.array(zod_1.z.string()).optional(),
        action: zod_1.z.enum(['add', 'remove']).optional()
    })
});
const culturalPreferencesSchema = zod_1.z.object({
    languagePreference: zod_1.z.enum(['en', 'de', 'ml']),
    festivalPreferences: zod_1.z.array(zod_1.z.string()),
    traditionalItems: zod_1.z.boolean(),
    modernItems: zod_1.z.boolean(),
    dietaryRestrictions: zod_1.z.array(zod_1.z.string())
});
router.get('/recommendations', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;
        const recommendations = await personalizationService_1.personalizationService.getRecommendations(userId, limit);
        return res.status(200).json({
            success: true,
            data: {
                recommendations,
                totalCount: recommendations.length
            }
        });
    }
    catch (error) {
        console.error('Error getting recommendations:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get recommendations', code: 'RECOMMENDATIONS_ERROR' }
        });
    }
});
router.get('/insights', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const insights = await personalizationService_1.personalizationService.getUserInsights(userId);
        return res.status(200).json({
            success: true,
            data: insights
        });
    }
    catch (error) {
        console.error('Error getting user insights:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get user insights', code: 'INSIGHTS_ERROR' }
        });
    }
});
router.post('/update-preferences', auth, sanitizeInput, validate(updatePreferencesSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { action, data } = req.body;
        await personalizationService_1.personalizationService.updateUserPreferences(userId, action, data);
        return res.status(200).json({
            success: true,
            message: 'Preferences updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating preferences:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to update preferences', code: 'PREFERENCES_UPDATE_ERROR' }
        });
    }
});
router.get('/preferences', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = await userPreferences_model_1.UserPreferences.findOne({ userId });
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
    }
    catch (error) {
        console.error('Error getting preferences:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get preferences', code: 'PREFERENCES_ERROR' }
        });
    }
});
router.put('/cultural-preferences', auth, sanitizeInput, validate(culturalPreferencesSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const culturalPreferences = req.body;
        let preferences = await userPreferences_model_1.UserPreferences.findOne({ userId });
        if (!preferences) {
            preferences = new userPreferences_model_1.UserPreferences({ userId });
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
    }
    catch (error) {
        console.error('Error updating cultural preferences:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to update cultural preferences', code: 'CULTURAL_PREFERENCES_ERROR' }
        });
    }
});
router.get('/festival-recommendations', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const festival = req.query.festival;
        if (!festival) {
            return res.status(400).json({
                success: false,
                error: { message: 'Festival parameter is required', code: 'FESTIVAL_REQUIRED' }
            });
        }
        const recommendations = await personalizationService_1.personalizationService.getRecommendations(userId, 20);
        const festivalRecommendations = recommendations.filter(rec => rec.reason.toLowerCase().includes(festival.toLowerCase()));
        return res.status(200).json({
            success: true,
            data: {
                festival,
                recommendations: festivalRecommendations,
                totalCount: festivalRecommendations.length
            }
        });
    }
    catch (error) {
        console.error('Error getting festival recommendations:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get festival recommendations', code: 'FESTIVAL_RECOMMENDATIONS_ERROR' }
        });
    }
});
router.get('/seasonal-recommendations', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const currentMonth = new Date().getMonth() + 1;
        const recommendations = await personalizationService_1.personalizationService.getRecommendations(userId, 15);
        const seasonalRecommendations = recommendations.filter(rec => rec.category === 'seasonal' || rec.category === 'cultural');
        return res.status(200).json({
            success: true,
            data: {
                currentMonth,
                recommendations: seasonalRecommendations,
                totalCount: seasonalRecommendations.length
            }
        });
    }
    catch (error) {
        console.error('Error getting seasonal recommendations:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get seasonal recommendations', code: 'SEASONAL_RECOMMENDATIONS_ERROR' }
        });
    }
});
router.get('/similar-users', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;
        const recommendations = await personalizationService_1.personalizationService.getRecommendations(userId, limit);
        const collaborativeRecommendations = recommendations.filter(rec => rec.category === 'collaborative');
        return res.status(200).json({
            success: true,
            data: {
                recommendations: collaborativeRecommendations,
                totalCount: collaborativeRecommendations.length
            }
        });
    }
    catch (error) {
        console.error('Error getting similar user recommendations:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get similar user recommendations', code: 'SIMILAR_USERS_ERROR' }
        });
    }
});
router.post('/track-behavior', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { event, data } = req.body;
        await personalizationService_1.personalizationService.updateUserPreferences(userId, event, data);
        return res.status(200).json({
            success: true,
            message: 'Behavior tracked successfully'
        });
    }
    catch (error) {
        console.error('Error tracking behavior:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to track behavior', code: 'BEHAVIOR_TRACKING_ERROR' }
        });
    }
});
router.get('/engagement-metrics', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = await userPreferences_model_1.UserPreferences.findOne({ userId });
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
    }
    catch (error) {
        console.error('Error getting engagement metrics:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get engagement metrics', code: 'ENGAGEMENT_METRICS_ERROR' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=personalization.js.map