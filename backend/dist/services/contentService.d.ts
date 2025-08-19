import { IContent, ContentType } from '../models/content.model';
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
export declare class ContentService {
    static createContent(contentData: Partial<IContent>): Promise<IContent>;
    static getContentById(contentId: string): Promise<IContent | null>;
    static getContent(filter?: ContentFilter): Promise<IContent[]>;
    static getRecipes(filter?: RecipeFilter): Promise<IContent[]>;
    static getFestivalGuides(filter?: FestivalGuideFilter): Promise<IContent[]>;
    static getLanguageContent(language: string, difficulty?: string): Promise<IContent[]>;
    static getPersonalizedContent(userId: string, limit?: number): Promise<IContent[]>;
    static getSeasonalContent(season: string, language: string): Promise<IContent[]>;
    static updateEngagement(contentId: string, engagementData: {
        viewTime?: number;
        liked?: boolean;
        shared?: boolean;
        commented?: boolean;
    }): Promise<void>;
    static getContentAnalytics(): Promise<any>;
    static searchContent(searchTerm: string, language?: ContentLanguage): Promise<IContent[]>;
    static getRelatedContent(contentId: string, limit?: number): Promise<IContent[]>;
    static createSampleContent(): Promise<void>;
}
//# sourceMappingURL=contentService.d.ts.map