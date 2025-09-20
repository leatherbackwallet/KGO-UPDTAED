/**
 * Content Routes - Multi-Language Content Management System
 * Handles cultural content, recipes, festival guides, and language learning
 */

import express from 'express';
import { Content, IContent, ContentType, ContentStatus } from '../models/content.model';
import { UserPreferences, IUserPreferences } from '../models/userPreferences.model';
import { auth as authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const createContentSchema = z.object({
  title: z.object({
    en: z.string().min(1),
    de: z.string().min(1),
    ml: z.string().min(1),
  }),
  content: z.object({
    en: z.string().min(1),
    de: z.string().min(1),
    ml: z.string().min(1),
  }),
  type: z.enum(['blog', 'recipe', 'cultural_guide', 'language_lesson', 'festival_guide', 'product_story', 'news', 'tutorial']),
  status: z.enum(['draft', 'published', 'archived', 'scheduled']).optional(),
});

const updateEngagementSchema = z.object({
  viewTime: z.number().optional(),
  liked: z.boolean().optional(),
  shared: z.boolean().optional(),
  commented: z.boolean().optional(),
});

/**
 * @route   GET /api/content
 * @desc    Get content with filters
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      type,
      status = 'published',
      limit = 20,
      skip = 0,
      language,
      category,
      tags,
    } = req.query;

    const query: any = { isDeleted: false };

    if (type) query.type = type;
    if (status) query.status = status;
    if (language) query.language = language;
    if (category) query.category = category;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    const content = await Content.find(query)
      .populate('related.contentIds related.productIds related.categoryIds')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    res.json({
      success: true,
      data: content,
      count: content.length,
    });
  } catch (error) {
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

/**
 * @route   GET /api/content/recipes
 * @desc    Get recipes with filters
 * @access  Public
 */
router.get('/recipes', async (req, res) => {
  try {
    const {
      difficulty,
      cookingTime,
      dietaryTags,
      language,
      limit = 20,
    } = req.query;

    const query: any = {
      type: ContentType.RECIPE,
      status: ContentStatus.PUBLISHED,
      isDeleted: false,
    };

    if (language) query.language = language;
    if (difficulty) query['recipe.difficulty'] = difficulty;
    if (cookingTime) query['recipe.cookingTime'] = { $lte: Number(cookingTime) };
    if (dietaryTags) {
      const tagArray = Array.isArray(dietaryTags) ? dietaryTags : [dietaryTags];
      query['recipe.dietaryTags'] = { $in: tagArray };
    }

    const recipes = await Content.find(query)
      .populate('related.productIds')
      .sort({ 'recipe.difficulty': 1, createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: recipes,
      count: recipes.length,
    });
  } catch (error) {
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

/**
 * @route   GET /api/content/festivals
 * @desc    Get festival guides
 * @access  Public
 */
router.get('/festivals', async (req, res) => {
  try {
    const {
      upcoming,
      language,
      region,
      limit = 20,
    } = req.query;

    const query: any = {
      type: ContentType.FESTIVAL_GUIDE,
      status: ContentStatus.PUBLISHED,
      isDeleted: false,
    };

    if (language) query.language = language;
    if (region) query.region = region;
    if (upcoming === 'true') {
      query['festivalGuide.festivalDate'] = { $gte: new Date() };
    }

    const festivals = await Content.find(query)
      .populate('related.productIds')
      .sort({ 'festivalGuide.festivalDate': 1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: festivals,
      count: festivals.length,
    });
  } catch (error) {
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

/**
 * @route   GET /api/content/language
 * @desc    Get language learning content
 * @access  Public
 */
router.get('/language', async (req, res) => {
  try {
    const {
      language,
      difficulty,
      limit = 20,
    } = req.query;

    const query: any = {
      type: ContentType.LANGUAGE_LESSON,
      status: ContentStatus.PUBLISHED,
      isDeleted: false,
    };

    if (language) query.language = language;
    if (difficulty) query['languageFeatures.difficulty'] = difficulty;

    const languageContent = await Content.find(query)
      .sort({ 'languageFeatures.difficulty': 1, createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: languageContent,
      count: languageContent.length,
    });
  } catch (error) {
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

/**
 * @route   GET /api/content/personalized
 * @desc    Get personalized content recommendations
 * @access  Private
 */
router.get('/personalized', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const userPrefs = await UserPreferences.findOne({ userId });
    
    if (!userPrefs) {
      // Return popular content if no preferences
      const popularContent = await Content.find({ 
        status: ContentStatus.PUBLISHED, 
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

    const query: any = { 
      status: ContentStatus.PUBLISHED, 
      isDeleted: false,
    };

    // Add cultural preferences
    if (userPrefs.culturalPreferences && userPrefs.culturalPreferences.festivalPreferences && userPrefs.culturalPreferences.festivalPreferences.length > 0) {
      query.tags = { $in: userPrefs.culturalPreferences.festivalPreferences };
    }

    // Add dietary preferences for recipes
    if (userPrefs.culturalPreferences && userPrefs.culturalPreferences.dietaryRestrictions && userPrefs.culturalPreferences.dietaryRestrictions.length > 0) {
      query['recipe.dietaryTags'] = { $in: userPrefs.culturalPreferences.dietaryRestrictions };
    }

    const personalizedContent = await Content.find(query)
      .populate('related.productIds')
      .sort({ 'engagement.views': -1, createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: personalizedContent,
      count: personalizedContent.length,
    });
  } catch (error) {
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

/**
 * @route   GET /api/content/:id
 * @desc    Get content by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id).populate('related.contentIds related.productIds related.categoryIds');

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
  } catch (error) {
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

/**
 * @route   POST /api/content
 * @desc    Create new content
 * @access  Private (Admin)
 */
router.post('/', authenticateToken, validate(createContentSchema), async (req: any, res: any) => {
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

    const content = new Content(contentData);
    await content.save();

    res.status(201).json({
      success: true,
      data: content,
      message: 'Content created successfully',
    });
  } catch (error) {
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

/**
 * @route   PUT /api/content/:id/engagement
 * @desc    Update content engagement metrics
 * @access  Public
 */
router.put('/:id/engagement', validate(updateEngagementSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const engagementData = req.body;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Content not found',
          code: 'CONTENT_NOT_FOUND',
        },
      });
    }

    // Update views
    content.engagement.views += 1;

    // Update average time on page
    if (engagementData.viewTime) {
      const currentAvg = content.engagement.averageTimeOnPage;
      const totalViews = content.engagement.views;
      content.engagement.averageTimeOnPage = 
        ((currentAvg * (totalViews - 1)) + engagementData.viewTime) / totalViews;
    }

    // Update other metrics
    if (engagementData.liked) content.engagement.likes += 1;
    if (engagementData.shared) content.engagement.shares += 1;
    if (engagementData.commented) content.engagement.comments += 1;

    await content.save();

    return res.json({
      success: true,
      data: content.engagement,
      message: 'Engagement updated successfully',
    });
  } catch (error) {
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

/**
 * @route   GET /api/content/search/:term
 * @desc    Search content
 * @access  Public
 */
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const { language } = req.query;

    const query: any = {
      isDeleted: false,
      status: ContentStatus.PUBLISHED,
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

    if (language) query.language = language;

    const searchResults = await Content.find(query)
      .populate('related.productIds')
      .sort({ 'engagement.views': -1 });

    res.json({
      success: true,
      data: searchResults,
      count: searchResults.length,
      searchTerm: term,
    });
  } catch (error) {
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

/**
 * @route   GET /api/content/analytics
 * @desc    Get content analytics (Admin only)
 * @access  Private (Admin)
 */
router.get('/analytics', authenticateToken, async (req: any, res: any) => {
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

    const analytics = await Content.aggregate([
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

    const topContent = await Content.find({ isDeleted: false })
      .sort({ 'engagement.views': -1 })
      .limit(10)
      .select('title type status engagement.views');

    const totalContent = await Content.countDocuments({ isDeleted: false });
    const publishedContent = await Content.countDocuments({ 
      isDeleted: false, 
      status: ContentStatus.PUBLISHED 
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
  } catch (error) {
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

export default router; 