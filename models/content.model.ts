/**
 * Content Model - Multi-language content management and cultural content delivery
 * Supports English and Malayalam with cultural context
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum ContentType {
  BLOG = 'blog',
  RECIPE = 'recipe',
  CULTURAL_GUIDE = 'cultural_guide',
  LANGUAGE_LESSON = 'language_lesson',
  FESTIVAL_GUIDE = 'festival_guide',
  PRODUCT_STORY = 'product_story',
  NEWS = 'news',
  TUTORIAL = 'tutorial'
}

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  SCHEDULED = 'scheduled'
}

export interface IContent extends Document {
  title: {
    en: string;
    ml: string; // Malayalam
  };
  
  content: {
    en: string;
    ml: string;
  };
  
  excerpt: {
    en: string;
    ml: string;
  };
  
  metaDescription: {
    en: string;
    ml: string;
  };
  
  slug: {
    en: string;
    ml: string;
  };
  
  type: ContentType;
  status: ContentStatus;
  
  // Cultural context
  culturalContext: {
    festival: string[]; // Related festivals
    region: string[]; // Kerala regions
    tradition: string[]; // Cultural traditions
    season: string[]; // Seasonal relevance
    dietary: string[]; // Dietary considerations
  };
  
  // SEO and discovery
  seo: {
    keywords: {
      en: string[];
      ml: string[];
    };
    canonicalUrl: string;
    ogImage: string;
    structuredData: object;
  };
  
  // Media and attachments
  media: {
    featuredImage: string;
    gallery: string[];
    videoUrl: string;
    audioUrl: string;
    documents: string[];
  };
  
  // Author and attribution
  author: {
    userId: mongoose.Types.ObjectId;
    name: string;
    bio: string;
    avatar: string;
  };
  
  // Publishing and scheduling
  publishing: {
    publishedAt: Date;
    scheduledAt: Date;
    expiresAt: Date;
    isFeatured: boolean;
    isSticky: boolean;
    allowComments: boolean;
  };
  
  // Engagement metrics
  engagement: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    averageTimeOnPage: number;
    bounceRate: number;
  };
  
  // Related content and products
  related: {
    contentIds: mongoose.Types.ObjectId[];
    productIds: mongoose.Types.ObjectId[];
    categoryIds: mongoose.Types.ObjectId[];
  };
  
  // Language learning features
  languageFeatures: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    vocabulary: {
      en: string[];
      de: string[];
      ml: string[];
    };
    pronunciation: {
      ml: string; // Malayalam pronunciation guide
    };
    grammarNotes: {
      en: string;
      ml: string;
    };
  };
  
  // Recipe-specific fields
  recipe: {
    cookingTime: number;
    preparationTime: number;
    servings: number;
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients: {
      name: {
        en: string;
        ml: string;
      };
      amount: string;
      unit: string;
    }[];
    instructions: {
      step: number;
      instruction: {
        en: string;
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
    dietaryTags: string[]; // Vegetarian, Vegan, Gluten-free, etc.
  };
  
  // Festival guide specific fields
  festivalGuide: {
    festivalDate: Date;
    duration: number; // in days
    significance: {
      en: string;
      ml: string;
    };
    traditions: {
      en: string[];
      ml: string[];
    };
    products: mongoose.Types.ObjectId[]; // Related products
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

const contentSchema = new Schema<IContent>({
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
    structuredData: Schema.Types.Mixed
  },
  
  media: {
    featuredImage: String,
    gallery: [String],
    videoUrl: String,
    audioUrl: String,
    documents: [String]
  },
  
  author: {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
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
    contentIds: [{ type: Schema.Types.ObjectId, ref: 'Content' }],
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }]
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
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
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

export const Content = mongoose.model<IContent>('Content', contentSchema); 