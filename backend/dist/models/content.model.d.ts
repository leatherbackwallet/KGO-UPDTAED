import mongoose, { Document } from 'mongoose';
export declare enum ContentType {
    BLOG = "blog",
    RECIPE = "recipe",
    CULTURAL_GUIDE = "cultural_guide",
    LANGUAGE_LESSON = "language_lesson",
    FESTIVAL_GUIDE = "festival_guide",
    PRODUCT_STORY = "product_story",
    NEWS = "news",
    TUTORIAL = "tutorial"
}
export declare enum ContentStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    ARCHIVED = "archived",
    SCHEDULED = "scheduled"
}
export interface IContent extends Document {
    title: {
        en: string;
        de: string;
        ml: string;
    };
    content: {
        en: string;
        de: string;
        ml: string;
    };
    excerpt: {
        en: string;
        de: string;
        ml: string;
    };
    metaDescription: {
        en: string;
        de: string;
        ml: string;
    };
    slug: {
        en: string;
        de: string;
        ml: string;
    };
    type: ContentType;
    status: ContentStatus;
    culturalContext: {
        festival: string[];
        region: string[];
        tradition: string[];
        season: string[];
        dietary: string[];
    };
    seo: {
        keywords: {
            en: string[];
            de: string[];
            ml: string[];
        };
        canonicalUrl: string;
        ogImage: string;
        structuredData: object;
    };
    media: {
        featuredImage: string;
        gallery: string[];
        videoUrl: string;
        audioUrl: string;
        documents: string[];
    };
    author: {
        userId: mongoose.Types.ObjectId;
        name: string;
        bio: string;
        avatar: string;
    };
    publishing: {
        publishedAt: Date;
        scheduledAt: Date;
        expiresAt: Date;
        isFeatured: boolean;
        isSticky: boolean;
        allowComments: boolean;
    };
    engagement: {
        views: number;
        likes: number;
        shares: number;
        comments: number;
        averageTimeOnPage: number;
        bounceRate: number;
    };
    related: {
        contentIds: mongoose.Types.ObjectId[];
        productIds: mongoose.Types.ObjectId[];
        categoryIds: mongoose.Types.ObjectId[];
    };
    languageFeatures: {
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        vocabulary: {
            en: string[];
            de: string[];
            ml: string[];
        };
        pronunciation: {
            ml: string;
            de: string;
        };
        grammarNotes: {
            en: string;
            de: string;
            ml: string;
        };
    };
    recipe: {
        cookingTime: number;
        preparationTime: number;
        servings: number;
        difficulty: 'easy' | 'medium' | 'hard';
        ingredients: {
            name: {
                en: string;
                de: string;
                ml: string;
            };
            amount: string;
            unit: string;
        }[];
        instructions: {
            step: number;
            instruction: {
                en: string;
                de: string;
                ml: string;
            };
            image: string;
        }[];
        nutrition: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            fiber: number;
        };
        dietaryTags: string[];
    };
    festivalGuide: {
        festivalDate: Date;
        duration: number;
        significance: {
            en: string;
            de: string;
            ml: string;
        };
        traditions: {
            en: string[];
            de: string[];
            ml: string[];
        };
        products: mongoose.Types.ObjectId[];
        events: {
            name: string;
            date: Date;
            location: string;
            description: string;
        }[];
    };
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Content: mongoose.Model<IContent, {}, {}, {}, mongoose.Document<unknown, {}, IContent, {}> & IContent & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=content.model.d.ts.map