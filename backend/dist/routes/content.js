"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const content_model_1 = require("../models/content.model");
const userPreferences_model_1 = require("../models/userPreferences.model");
const authenticateToken = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const zod_1 = require("zod");
const router = express_1.default.Router();
const createContentSchema = zod_1.z.object({
    title: zod_1.z.object({
        en: zod_1.z.string().min(1),
        de: zod_1.z.string().min(1),
        ml: zod_1.z.string().min(1),
    }),
    content: zod_1.z.object({
        en: zod_1.z.string().min(1),
        de: zod_1.z.string().min(1),
        ml: zod_1.z.string().min(1),
    }),
    type: zod_1.z.enum(['blog', 'recipe', 'cultural_guide', 'language_lesson', 'festival_guide', 'product_story', 'news', 'tutorial']),
    status: zod_1.z.enum(['draft', 'published', 'archived', 'scheduled']).optional(),
});
const updateEngagementSchema = zod_1.z.object({
    viewTime: zod_1.z.number().optional(),
    liked: zod_1.z.boolean().optional(),
    shared: zod_1.z.boolean().optional(),
    commented: zod_1.z.boolean().optional(),
});
router.get('/', async (req, res) => {
    try {
        const { type, status = 'published', limit = 20, skip = 0, language, category, tags, } = req.query;
        const query = { isDeleted: false };
        if (type)
            query.type = type;
        if (status)
            query.status = status;
        if (language)
            query.language = language;
        if (category)
            query.category = category;
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            query.tags = { $in: tagArray };
        }
        const content = await content_model_1.Content.find(query)
            .populate('related.contentIds related.productIds related.categoryIds')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip));
        res.json({
            success: true,
            data: content,
            count: content.length,
        });
    }
    catch (error) {
        console.error('Error getting content:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get content',
                code: 'CONTENT_FETCH_ERROR',
            },
        });
    }
});
router.get('/recipes', async (req, res) => {
    try {
        const { difficulty, cookingTime, dietaryTags, language, limit = 20, } = req.query;
        const query = {
            type: content_model_1.ContentType.RECIPE,
            status: content_model_1.ContentStatus.PUBLISHED,
            isDeleted: false,
        };
        if (language)
            query.language = language;
        if (difficulty)
            query['recipe.difficulty'] = difficulty;
        if (cookingTime)
            query['recipe.cookingTime'] = { $lte: Number(cookingTime) };
        if (dietaryTags) {
            const tagArray = Array.isArray(dietaryTags) ? dietaryTags : [dietaryTags];
            query['recipe.dietaryTags'] = { $in: tagArray };
        }
        const recipes = await content_model_1.Content.find(query)
            .populate('related.productIds')
            .sort({ 'recipe.difficulty': 1, createdAt: -1 })
            .limit(Number(limit));
        res.json({
            success: true,
            data: recipes,
            count: recipes.length,
        });
    }
    catch (error) {
        console.error('Error getting recipes:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get recipes',
                code: 'RECIPES_FETCH_ERROR',
            },
        });
    }
});
router.get('/festivals', async (req, res) => {
    try {
        const { upcoming, language, region, limit = 20, } = req.query;
        const query = {
            type: content_model_1.ContentType.FESTIVAL_GUIDE,
            status: content_model_1.ContentStatus.PUBLISHED,
            isDeleted: false,
        };
        if (language)
            query.language = language;
        if (region)
            query.region = region;
        if (upcoming === 'true') {
            query['festivalGuide.festivalDate'] = { $gte: new Date() };
        }
        const festivals = await content_model_1.Content.find(query)
            .populate('related.productIds')
            .sort({ 'festivalGuide.festivalDate': 1 })
            .limit(Number(limit));
        res.json({
            success: true,
            data: festivals,
            count: festivals.length,
        });
    }
    catch (error) {
        console.error('Error getting festivals:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get festivals',
                code: 'FESTIVALS_FETCH_ERROR',
            },
        });
    }
});
router.get('/language', async (req, res) => {
    try {
        const { language, difficulty, limit = 20, } = req.query;
        const query = {
            type: content_model_1.ContentType.LANGUAGE_LESSON,
            status: content_model_1.ContentStatus.PUBLISHED,
            isDeleted: false,
        };
        if (language)
            query.language = language;
        if (difficulty)
            query['languageFeatures.difficulty'] = difficulty;
        const languageContent = await content_model_1.Content.find(query)
            .sort({ 'languageFeatures.difficulty': 1, createdAt: -1 })
            .limit(Number(limit));
        res.json({
            success: true,
            data: languageContent,
            count: languageContent.length,
        });
    }
    catch (error) {
        console.error('Error getting language content:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get language content',
                code: 'LANGUAGE_CONTENT_FETCH_ERROR',
            },
        });
    }
});
router.get('/personalized', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10 } = req.query;
        const userPrefs = await userPreferences_model_1.UserPreferences.findOne({ userId });
        if (!userPrefs) {
            const popularContent = await content_model_1.Content.find({
                status: content_model_1.ContentStatus.PUBLISHED,
                isDeleted: false
            })
                .sort({ 'engagement.views': -1 })
                .limit(Number(limit));
            return res.json({
                success: true,
                data: popularContent,
                count: popularContent.length,
            });
        }
        const query = {
            status: content_model_1.ContentStatus.PUBLISHED,
            isDeleted: false,
        };
        if (userPrefs.culturalPreferences && userPrefs.culturalPreferences.festivalPreferences && userPrefs.culturalPreferences.festivalPreferences.length > 0) {
            query.tags = { $in: userPrefs.culturalPreferences.festivalPreferences };
        }
        if (userPrefs.culturalPreferences && userPrefs.culturalPreferences.dietaryRestrictions && userPrefs.culturalPreferences.dietaryRestrictions.length > 0) {
            query['recipe.dietaryTags'] = { $in: userPrefs.culturalPreferences.dietaryRestrictions };
        }
        const personalizedContent = await content_model_1.Content.find(query)
            .populate('related.productIds')
            .sort({ 'engagement.views': -1, createdAt: -1 })
            .limit(Number(limit));
        res.json({
            success: true,
            data: personalizedContent,
            count: personalizedContent.length,
        });
    }
    catch (error) {
        console.error('Error getting personalized content:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get personalized content',
                code: 'PERSONALIZED_CONTENT_ERROR',
            },
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const content = await content_model_1.Content.findById(id).populate('related.contentIds related.productIds related.categoryIds');
        if (!content) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Content not found',
                    code: 'CONTENT_NOT_FOUND',
                },
            });
        }
        return res.json({
            success: true,
            data: content,
        });
    }
    catch (error) {
        console.error('Error getting content by ID:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get content',
                code: 'CONTENT_FETCH_ERROR',
            },
        });
    }
});
router.post('/', authenticateToken, validate(createContentSchema), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied. Admin privileges required.',
                    code: 'ADMIN_ACCESS_REQUIRED',
                },
            });
        }
        const contentData = {
            ...req.body,
            author: {
                userId: req.user.id,
                name: req.user.name || 'Admin',
                bio: '',
                avatar: '',
            },
            publishing: {
                publishedAt: req.body.status === 'published' ? new Date() : null,
                expiresAt: null,
                isFeatured: false,
                isSticky: false,
                allowComments: true,
            },
            engagement: {
                views: 0,
                likes: 0,
                shares: 0,
                comments: 0,
                averageTimeOnPage: 0,
                bounceRate: 0,
            },
        };
        const content = new content_model_1.Content(contentData);
        await content.save();
        res.status(201).json({
            success: true,
            data: content,
            message: 'Content created successfully',
        });
    }
    catch (error) {
        console.error('Error creating content:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create content',
                code: 'CONTENT_CREATE_ERROR',
            },
        });
    }
});
router.put('/:id/engagement', validate(updateEngagementSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const engagementData = req.body;
        const content = await content_model_1.Content.findById(id);
        if (!content) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Content not found',
                    code: 'CONTENT_NOT_FOUND',
                },
            });
        }
        content.engagement.views += 1;
        if (engagementData.viewTime) {
            const currentAvg = content.engagement.averageTimeOnPage;
            const totalViews = content.engagement.views;
            content.engagement.averageTimeOnPage =
                ((currentAvg * (totalViews - 1)) + engagementData.viewTime) / totalViews;
        }
        if (engagementData.liked)
            content.engagement.likes += 1;
        if (engagementData.shared)
            content.engagement.shares += 1;
        if (engagementData.commented)
            content.engagement.comments += 1;
        await content.save();
        return res.json({
            success: true,
            data: content.engagement,
            message: 'Engagement updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating engagement:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update engagement',
                code: 'ENGAGEMENT_UPDATE_ERROR',
            },
        });
    }
});
router.get('/search/:term', async (req, res) => {
    try {
        const { term } = req.params;
        const { language } = req.query;
        const query = {
            isDeleted: false,
            status: content_model_1.ContentStatus.PUBLISHED,
            $or: [
                { 'title.en': { $regex: term, $options: 'i' } },
                { 'title.de': { $regex: term, $options: 'i' } },
                { 'title.ml': { $regex: term, $options: 'i' } },
                { 'content.en': { $regex: term, $options: 'i' } },
                { 'content.de': { $regex: term, $options: 'i' } },
                { 'content.ml': { $regex: term, $options: 'i' } },
                { tags: { $regex: term, $options: 'i' } },
            ],
        };
        if (language)
            query.language = language;
        const searchResults = await content_model_1.Content.find(query)
            .populate('related.productIds')
            .sort({ 'engagement.views': -1 });
        res.json({
            success: true,
            data: searchResults,
            count: searchResults.length,
            searchTerm: term,
        });
    }
    catch (error) {
        console.error('Error searching content:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to search content',
                code: 'CONTENT_SEARCH_ERROR',
            },
        });
    }
});
router.get('/analytics', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied. Admin privileges required.',
                    code: 'ADMIN_ACCESS_REQUIRED',
                },
            });
        }
        const analytics = await content_model_1.Content.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalViews: { $sum: '$engagement.views' },
                    totalLikes: { $sum: '$engagement.likes' },
                    totalShares: { $sum: '$engagement.shares' },
                    averageEngagement: { $avg: '$engagement.views' },
                }
            }
        ]);
        const topContent = await content_model_1.Content.find({ isDeleted: false })
            .sort({ 'engagement.views': -1 })
            .limit(10)
            .select('title type status engagement.views');
        const totalContent = await content_model_1.Content.countDocuments({ isDeleted: false });
        const publishedContent = await content_model_1.Content.countDocuments({
            isDeleted: false,
            status: content_model_1.ContentStatus.PUBLISHED
        });
        res.json({
            success: true,
            data: {
                typeBreakdown: analytics,
                topContent,
                totalContent,
                publishedContent,
            },
        });
    }
    catch (error) {
        console.error('Error getting content analytics:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get content analytics',
                code: 'CONTENT_ANALYTICS_ERROR',
            },
        });
    }
});
exports.default = router;
//# sourceMappingURL=content.js.map