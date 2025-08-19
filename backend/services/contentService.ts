/**
 * Content Service - Multi-Language Content Management System
 * Handles cultural content, recipes, festival guides, and language learning
 */

import { Content, IContent, ContentType, ContentStatus } from '../models/content.model';
import { UserPreferences, IUserPreferences } from '../models/userPreferences.model';
import { Product, IProduct } from '../models/products.model';
import { Category, ICategory } from '../models/categories.model';
import mongoose from 'mongoose';

export interface ContentFilter {
  type?: ContentType;
  language?: string;
  category?: string;
  tags?: string[];
  isPublished?: boolean;
  limit?: number;
  skip?: number;
}

export interface RecipeFilter {
  difficulty?: 'easy' | 'medium' | 'hard';
  cookingTime?: number;
  dietaryTags?: string[];
  language?: string;
}

export interface FestivalGuideFilter {
  upcoming?: boolean;
  language?: string;
  region?: string;
}

export class ContentService {
  /**
   * Create new content
   */
  static async createContent(contentData: Partial<IContent>): Promise<IContent> {
    const content = new Content({
      ...contentData,
      status: contentData.status ?? 'draft',
      engagement: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        averageTimeOnPage: 0,
        bounceRate: 0,
      },
    });

    await content.save();
    return content;
  }

  /**
   * Get content by ID
   */
  static async getContentById(contentId: string): Promise<IContent | null> {
    return await Content.findById(contentId).populate('related.contentIds related.productIds related.categoryIds');
  }

  /**
   * Get content with filters
   */
  static async getContent(filter: ContentFilter = {}): Promise<IContent[]> {
    const query: any = { isDeleted: false };

    if (filter.type) query.type = filter.type;
    if (filter.language) query.language = filter.language;
    if (filter.category) query.category = filter.category;
    if (filter.tags) query.tags = { $in: filter.tags };
    if (filter.isPublished !== undefined) query.isPublished = filter.isPublished;

    const limit = filter.limit || 20;
    const skip = filter.skip || 0;

    return await Content.find(query)
      .populate('related.contentIds related.productIds related.categoryIds')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  /**
   * Get recipes with filters
   */
  static async getRecipes(filter: RecipeFilter = {}): Promise<IContent[]> {
    const query: any = { 
      type: ContentType.RECIPE,
      isDeleted: false,
      isPublished: true,
    };

    if (filter.language) query.language = filter.language;
    if (filter.difficulty) query['recipe.difficulty'] = filter.difficulty;
    if (filter.cookingTime) query['recipe.cookingTime'] = { $lte: filter.cookingTime };
    if (filter.dietaryTags) query['recipe.dietaryTags'] = { $in: filter.dietaryTags };

    return await Content.find(query)
      .populate('related.productIds')
      .sort({ 'recipe.difficulty': 1, createdAt: -1 });
  }

  /**
   * Get festival guides
   */
  static async getFestivalGuides(filter: FestivalGuideFilter = {}): Promise<IContent[]> {
    const query: any = { 
      type: ContentType.FESTIVAL_GUIDE,
      isDeleted: false,
      isPublished: true,
    };

    if (filter.language) query.language = filter.language;
    if (filter.region) query.region = filter.region;
    if (filter.upcoming) {
      query['festivalGuide.festivalDate'] = { $gte: new Date() };
    }

    return await Content.find(query)
      .populate('related.productIds')
      .sort({ 'festivalGuide.festivalDate': 1 });
  }

  /**
   * Get language learning content
   */
  static async getLanguageContent(language: string, difficulty?: string): Promise<IContent[]> {
    const query: any = { 
      type: ContentType.LANGUAGE_LESSON,
      language,
      isDeleted: false,
      status: 'published',
    };

    if (difficulty) query['languageFeatures.difficulty'] = difficulty;

    return await Content.find(query)
      .sort({ 'languageFeatures.difficulty': 1, createdAt: -1 });
  }

  /**
   * Get personalized content recommendations
   */
  static async getPersonalizedContent(userId: string, limit: number = 10): Promise<IContent[]> {
    const userPrefs = await UserPreferences.findOne({ userId });
    
    if (!userPrefs) {
      // Return popular content if no preferences
      return await Content.find({ 
        isPublished: true, 
        isDeleted: false 
      })
        .sort({ 'engagement.views': -1 })
        .limit(limit);
    }

    const query: any = { 
      status: 'published', 
      isDeleted: false,
      language: userPrefs.culturalPreferences.languagePreference,
    };

    // Add cultural preferences
    if (userPrefs.culturalPreferences.festivalPreferences && userPrefs.culturalPreferences.festivalPreferences.length > 0) {
      query.tags = { $in: userPrefs.culturalPreferences.festivalPreferences };
    }

    // Add dietary preferences for recipes
    if (userPrefs.culturalPreferences.dietaryRestrictions && userPrefs.culturalPreferences.dietaryRestrictions.length > 0) {
      query['recipe.dietaryTags'] = { $in: userPrefs.culturalPreferences.dietaryRestrictions };
    }

    return await Content.find(query)
      .populate('related.productIds')
      .sort({ 'engagement.views': -1, createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get seasonal content
   */
  static async getSeasonalContent(season: string, language: string): Promise<IContent[]> {
    const query = {
      isPublished: true,
      isDeleted: false,
      language,
      tags: { $in: [season.toLowerCase()] },
    };

    return await Content.find(query)
      .populate('related.productIds')
      .sort({ 'engagement.views': -1 });
  }

  /**
   * Update content engagement metrics
   */
  static async updateEngagement(contentId: string, engagementData: {
    viewTime?: number;
    liked?: boolean;
    shared?: boolean;
    commented?: boolean;
  }): Promise<void> {
    const content = await Content.findById(contentId);
    if (!content) return;

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
  }

  /**
   * Get content analytics
   */
  static async getContentAnalytics(): Promise<any> {
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

    const languageStats = await Content.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
          totalViews: { $sum: '$engagement.views' },
        }
      }
    ]);

    const topContent = await Content.find({ isDeleted: false })
      .sort({ 'engagement.views': -1 })
      .limit(10)
      .select('title type language engagement.views');

    return {
      typeBreakdown: analytics,
      languageStats,
      topContent,
      totalContent: await Content.countDocuments({ isDeleted: false }),
      publishedContent: await Content.countDocuments({ isDeleted: false, isPublished: true }),
    };
  }

  /**
   * Search content
   */
  static async searchContent(searchTerm: string, language?: string): Promise<IContent[]> {
    const query: any = {
      isDeleted: false,
      isPublished: true,
      $or: [
        { 'title.en': { $regex: searchTerm, $options: 'i' } },
        { 'title.de': { $regex: searchTerm, $options: 'i' } },
        { 'title.ml': { $regex: searchTerm, $options: 'i' } },
        { 'content.en': { $regex: searchTerm, $options: 'i' } },
        { 'content.de': { $regex: searchTerm, $options: 'i' } },
        { 'content.ml': { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    if (language) query.language = language;

    return await Content.find(query)
      .populate('related.productIds')
      .sort({ 'engagement.views': -1 });
  }

  /**
   * Get related content
   */
  static async getRelatedContent(contentId: string, limit: number = 5): Promise<IContent[]> {
    const content = await Content.findById(contentId);
    if (!content) return [];

    const query = {
      _id: { $ne: contentId },
      isDeleted: false,
      isPublished: true,
      $or: [
        { type: content.type },
        { type: content.type },
        { 'culturalContext.festival': { $in: content.culturalContext?.festival || [] } },
        { 'culturalContext.region': { $in: content.culturalContext?.region || [] } },
      ],
    };

    return await Content.find(query)
      .populate('related.productIds')
      .sort({ 'engagement.views': -1 })
      .limit(limit);
  }

  /**
   * Create sample content for seeding
   */
  static async createSampleContent(): Promise<void> {
    const sampleRecipes = [
      {
        type: ContentType.RECIPE,
        status: ContentStatus.PUBLISHED,
        title: {
          en: 'Traditional Kerala Fish Curry',
          de: 'Traditionelles Kerala Fisch Curry',
          ml: 'കേരള ഫിഷ് കറി',
        },
        content: {
          en: 'A delicious traditional fish curry from Kerala with coconut milk and spices.',
          de: 'Ein köstliches traditionelles Fischcurry aus Kerala mit Kokosmilch und Gewürzen.',
          ml: 'തേങ്ങാപ്പാലും മസാലകളും ചേർത്ത കേരള ഫിഷ് കറി.',
        },
        slug: {
          en: 'traditional-kerala-fish-curry',
          de: 'traditionelles-kerala-fisch-curry',
          ml: 'kerala-fish-curry',
        },
        culturalContext: {
          festival: ['onam', 'vishu'],
          region: ['kerala'],
          tradition: ['fishing', 'cooking'],
          season: ['monsoon'],
          dietary: ['non-vegetarian']
        },
        recipe: {
          cookingTime: 45,
          preparationTime: 15,
          servings: 4,
          difficulty: 'medium' as const,
          ingredients: [
            {
              name: { en: 'Fish', de: 'Fisch', ml: 'മീൻ' },
              amount: '500',
              unit: 'g',
            },
            {
              name: { en: 'Coconut Milk', de: 'Kokosmilch', ml: 'തേങ്ങാപ്പാൽ' },
              amount: '200',
              unit: 'ml',
            },
          ],
          instructions: [
            {
              step: 1,
              instruction: {
                en: 'Clean and cut the fish into pieces',
                de: 'Fisch säubern und in Stücke schneiden',
                ml: 'മീൻ വൃത്തിയാക്കി കഷണങ്ങളാക്കുക',
              },
              image: '',
            },
          ],
          nutrition: {
            calories: 250,
            protein: 25,
            carbs: 5,
            fat: 15,
            fiber: 2,
          },
          dietaryTags: ['gluten-free', 'dairy-free'],
        },
      },
    ];

    const sampleFestivalGuides = [
      {
        type: ContentType.FESTIVAL_GUIDE,
        status: ContentStatus.PUBLISHED,
        title: {
          en: 'Onam Festival Guide',
          de: 'Onam Fest Guide',
          ml: 'ഓണം ഉത്സവ ഗൈഡ്',
        },
        content: {
          en: 'Complete guide to celebrating Onam festival with traditional customs and recipes.',
          de: 'Vollständiger Leitfaden zur Feier des Onam-Festivals mit traditionellen Bräuchen und Rezepten.',
          ml: 'പരമ്പരാഗത ആചാരങ്ങളും പാചകവിധികളും ഉപയോഗിച്ച് ഓണം ആഘോഷിക്കാനുള്ള സമ്പൂർണ്ണ ഗൈഡ്.',
        },
        slug: {
          en: 'onam-festival-guide',
          de: 'onam-fest-guide',
          ml: 'onam-utsav-guide',
        },
        culturalContext: {
          festival: ['onam'],
          region: ['kerala'],
          tradition: ['celebration', 'feast'],
          season: ['monsoon'],
          dietary: ['vegetarian']
        },
        festivalGuide: {
          festivalDate: new Date('2024-08-15'),
          duration: 10,
          significance: {
            en: 'Onam is the biggest festival of Kerala, celebrating the homecoming of King Mahabali.',
            de: 'Onam ist das größte Festival Keralas und feiert die Heimkehr von König Mahabali.',
            ml: 'ഓണം കേരളത്തിന്റെ ഏറ്റവും വലിയ ഉത്സവമാണ്, മഹാബലി രാജാവിന്റെ വീട്ടുവരവ് ആഘോഷിക്കുന്നു.',
          },
          traditions: {
            en: ['Pookalam (flower rangoli)', 'Onasadya (traditional feast)'],
            de: ['Pookalam (Blumen-Rangoli)', 'Onasadya (traditionelles Festmahl)'],
            ml: ['പൂക്കളം', 'ഓണസദ്യ'],
          },
          products: [],
          events: [
            {
              name: 'Onam Celebration',
              date: new Date('2024-08-15'),
              location: 'Kerala, India',
              description: 'Traditional Onam festival celebration'
            }
          ],
        },
      },
    ];

    for (const recipe of sampleRecipes) {
      await this.createContent(recipe);
    }

    for (const guide of sampleFestivalGuides) {
      await this.createContent(guide);
    }
  }
} 