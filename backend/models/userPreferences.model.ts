/**
 * User Preferences Model - AI-powered personalization and recommendation system
 * Tracks user behavior, preferences, and enables personalized experiences
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  
  // Behavioral tracking
  browsingHistory: {
    productIds: mongoose.Types.ObjectId[];
    categories: string[];
    searchTerms: string[];
    timeSpent: number;
    lastVisited: Date;
  };
  
  // Purchase preferences
  purchaseHistory: {
    productIds: mongoose.Types.ObjectId[];
    categories: string[];
    priceRanges: { min: number; max: number }[];
    occasions: string[];
    averageOrderValue: number;
  };
  
  // AI-generated preferences
  aiPreferences: {
    preferredCategories: { category: string; score: number }[];
    preferredPriceRange: { min: number; max: number };
    preferredOccasions: { occasion: string; score: number }[];
    preferredVendors: { vendorId: mongoose.Types.ObjectId; score: number }[];
    seasonalPreferences: { month: number; preferences: string[] }[];
  };
  
  // Personalization settings
  personalizationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    personalizedRecommendations: boolean;
    seasonalOffers: boolean;
    newProductAlerts: boolean;
  };
  
  // Cultural preferences (for Kerala-specific targeting)
  culturalPreferences: {
    languagePreference: 'en' | 'ml'; // English, Malayalam
    festivalPreferences: string[]; // Onam, Diwali, etc.
    traditionalItems: boolean;
    modernItems: boolean;
    dietaryRestrictions: string[]; // Vegetarian, Vegan, etc.
  };
  
  // Engagement metrics
  engagementMetrics: {
    totalVisits: number;
    averageSessionDuration: number;
    cartAbandonmentRate: number;
    returnCustomerRate: number;
    lastEngagement: Date;
  };
  
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userPreferencesSchema = new Schema<IUserPreferences>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  browsingHistory: {
    productIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Product'
    }],
    categories: [String],
    searchTerms: [String],
    timeSpent: {
      type: Number,
      default: 0
    },
    lastVisited: {
      type: Date,
      default: Date.now
    }
  },
  
  purchaseHistory: {
    productIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Product'
    }],
    categories: [String],
    priceRanges: [{
      min: Number,
      max: Number
    }],
    occasions: [String],
    averageOrderValue: {
      type: Number,
      default: 0
    }
  },
  
  aiPreferences: {
    preferredCategories: [{
      category: String,
      score: {
        type: Number,
        min: 0,
        max: 1
      }
    }],
    preferredPriceRange: {
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number,
        default: 1000
      }
    },
    preferredOccasions: [{
      occasion: String,
      score: {
        type: Number,
        min: 0,
        max: 1
      }
    }],
    preferredVendors: [{
      vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor'
      },
      score: {
        type: Number,
        min: 0,
        max: 1
      }
    }],
    seasonalPreferences: [{
      month: {
        type: Number,
        min: 1,
        max: 12
      },
      preferences: [String]
    }]
  },
  
  personalizationSettings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    personalizedRecommendations: {
      type: Boolean,
      default: true
    },
    seasonalOffers: {
      type: Boolean,
      default: true
    },
    newProductAlerts: {
      type: Boolean,
      default: true
    }
  },
  
  culturalPreferences: {
    languagePreference: {
      type: String,
      enum: ['en', 'de', 'ml'],
      default: 'en'
    },
    festivalPreferences: [String],
    traditionalItems: {
      type: Boolean,
      default: true
    },
    modernItems: {
      type: Boolean,
      default: true
    },
    dietaryRestrictions: [String]
  },
  
  engagementMetrics: {
    totalVisits: {
      type: Number,
      default: 0
    },
    averageSessionDuration: {
      type: Number,
      default: 0
    },
    cartAbandonmentRate: {
      type: Number,
      default: 0
    },
    returnCustomerRate: {
      type: Number,
      default: 0
    },
    lastEngagement: {
      type: Date,
      default: Date.now
    }
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
userPreferencesSchema.index({ userId: 1 });
userPreferencesSchema.index({ 'aiPreferences.preferredCategories.category': 1 });
userPreferencesSchema.index({ 'aiPreferences.preferredOccasions.occasion': 1 });
userPreferencesSchema.index({ 'culturalPreferences.languagePreference': 1 });

export const UserPreferences = mongoose.model<IUserPreferences>('UserPreferences', userPreferencesSchema); 