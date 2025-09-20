"use strict";
/**
 * User Preferences Model - AI-powered personalization and recommendation system
 * Tracks user behavior, preferences, and enables personalized experiences
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
exports.UserPreferences = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const userPreferencesSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    browsingHistory: {
        productIds: [{
                type: mongoose_1.Schema.Types.ObjectId,
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
                type: mongoose_1.Schema.Types.ObjectId,
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
                    type: mongoose_1.Schema.Types.ObjectId,
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
exports.UserPreferences = mongoose_1.default.model('UserPreferences', userPreferencesSchema);
