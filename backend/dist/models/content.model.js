"use strict";
/**
 * Content Model - Multi-language content management and cultural content delivery
 * Supports English and Malayalam with cultural context
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
exports.Content = exports.ContentStatus = exports.ContentType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var ContentType;
(function (ContentType) {
    ContentType["BLOG"] = "blog";
    ContentType["RECIPE"] = "recipe";
    ContentType["CULTURAL_GUIDE"] = "cultural_guide";
    ContentType["LANGUAGE_LESSON"] = "language_lesson";
    ContentType["FESTIVAL_GUIDE"] = "festival_guide";
    ContentType["PRODUCT_STORY"] = "product_story";
    ContentType["NEWS"] = "news";
    ContentType["TUTORIAL"] = "tutorial";
})(ContentType || (exports.ContentType = ContentType = {}));
var ContentStatus;
(function (ContentStatus) {
    ContentStatus["DRAFT"] = "draft";
    ContentStatus["PUBLISHED"] = "published";
    ContentStatus["ARCHIVED"] = "archived";
    ContentStatus["SCHEDULED"] = "scheduled";
})(ContentStatus || (exports.ContentStatus = ContentStatus = {}));
const contentSchema = new mongoose_1.Schema({
    title: {
        en: { type: String, required: true },
        ml: { type: String, required: true }
    },
    content: {
        en: { type: String, required: true },
        ml: { type: String, required: true }
    },
    excerpt: {
        en: { type: String },
        ml: { type: String }
    },
    metaDescription: {
        en: { type: String },
        ml: { type: String }
    },
    slug: {
        en: { type: String, required: true, unique: true },
        de: { type: String, required: true, unique: true },
        ml: { type: String, required: true, unique: true }
    },
    type: {
        type: String,
        enum: Object.values(ContentType),
        required: true
    },
    status: {
        type: String,
        enum: Object.values(ContentStatus),
        default: ContentStatus.DRAFT
    },
    culturalContext: {
        festival: [String],
        region: [String],
        tradition: [String],
        season: [String],
        dietary: [String]
    },
    seo: {
        keywords: {
            en: [String],
            ml: [String]
        },
        canonicalUrl: String,
        ogImage: String,
        structuredData: mongoose_1.Schema.Types.Mixed
    },
    media: {
        featuredImage: String,
        gallery: [String],
        videoUrl: String,
        audioUrl: String,
        documents: [String]
    },
    author: {
        userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        bio: String,
        avatar: String
    },
    publishing: {
        publishedAt: Date,
        scheduledAt: Date,
        expiresAt: Date,
        isFeatured: { type: Boolean, default: false },
        isSticky: { type: Boolean, default: false },
        allowComments: { type: Boolean, default: true }
    },
    engagement: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        averageTimeOnPage: { type: Number, default: 0 },
        bounceRate: { type: Number, default: 0 }
    },
    related: {
        contentIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Content' }],
        productIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' }],
        categoryIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' }]
    },
    languageFeatures: {
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced']
        },
        vocabulary: {
            en: [String],
            ml: [String]
        },
        pronunciation: {
            ml: String
        },
        grammarNotes: {
            en: String,
            ml: String
        }
    },
    recipe: {
        cookingTime: Number,
        preparationTime: Number,
        servings: Number,
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard']
        },
        ingredients: [{
                name: {
                    en: String,
                    ml: String
                },
                amount: String,
                unit: String
            }],
        instructions: [{
                step: Number,
                instruction: {
                    en: String,
                    ml: String
                },
                image: String
            }],
        nutrition: {
            calories: Number,
            protein: Number,
            carbs: Number,
            fat: Number,
            fiber: Number
        },
        dietaryTags: [String]
    },
    festivalGuide: {
        festivalDate: Date,
        duration: Number,
        significance: {
            en: String,
            ml: String
        },
        traditions: {
            en: [String],
            ml: [String]
        },
        products: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' }],
        events: [{
                name: String,
                date: Date,
                location: String,
                description: String
            }]
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
// Indexes for performance
contentSchema.index({ type: 1, status: 1 });
contentSchema.index({ 'slug.en': 1 });
contentSchema.index({ 'culturalContext.festival': 1 });
contentSchema.index({ 'publishing.publishedAt': 1 });
contentSchema.index({ 'publishing.isFeatured': 1 });
exports.Content = mongoose_1.default.model('Content', contentSchema);
