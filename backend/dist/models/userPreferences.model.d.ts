import mongoose, { Document } from 'mongoose';
export interface IUserPreferences extends Document {
    userId: mongoose.Types.ObjectId;
    browsingHistory: {
        productIds: mongoose.Types.ObjectId[];
        categories: string[];
        searchTerms: string[];
        timeSpent: number;
        lastVisited: Date;
    };
    purchaseHistory: {
        productIds: mongoose.Types.ObjectId[];
        categories: string[];
        priceRanges: {
            min: number;
            max: number;
        }[];
        occasions: string[];
        averageOrderValue: number;
    };
    aiPreferences: {
        preferredCategories: {
            category: string;
            score: number;
        }[];
        preferredPriceRange: {
            min: number;
            max: number;
        };
        preferredOccasions: {
            occasion: string;
            score: number;
        }[];
        preferredVendors: {
            vendorId: mongoose.Types.ObjectId;
            score: number;
        }[];
        seasonalPreferences: {
            month: number;
            preferences: string[];
        }[];
    };
    personalizationSettings: {
        emailNotifications: boolean;
        smsNotifications: boolean;
        pushNotifications: boolean;
        personalizedRecommendations: boolean;
        seasonalOffers: boolean;
        newProductAlerts: boolean;
    };
    culturalPreferences: {
        languagePreference: 'en' | 'ml';
        festivalPreferences: string[];
        traditionalItems: boolean;
        modernItems: boolean;
        dietaryRestrictions: string[];
    };
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
export declare const UserPreferences: mongoose.Model<IUserPreferences, {}, {}, {}, mongoose.Document<unknown, {}, IUserPreferences, {}> & IUserPreferences & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=userPreferences.model.d.ts.map