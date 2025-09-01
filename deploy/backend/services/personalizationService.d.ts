import { IProduct } from '../models/products.model';
export interface RecommendationResult {
    products: IProduct[];
    score: number;
    reason: string;
    category: 'browsing' | 'purchase' | 'cultural' | 'seasonal' | 'collaborative';
}
export interface UserInsights {
    preferences: {
        categories: {
            category: string;
            score: number;
        }[];
        priceRange: {
            min: number;
            max: number;
        };
        occasions: {
            occasion: string;
            score: number;
        }[];
        culturalPreferences: string[];
    };
    behavior: {
        averageOrderValue: number;
        orderFrequency: number;
        preferredDeliveryTime: string;
        cartAbandonmentRate: number;
    };
    engagement: {
        totalVisits: number;
        averageSessionDuration: number;
        lastEngagement: Date;
        churnRisk: 'low' | 'medium' | 'high';
    };
}
declare class PersonalizationService {
    getRecommendations(userId: string, limit?: number): Promise<RecommendationResult[]>;
    private getBrowsingBasedRecommendations;
    private getPurchaseBasedRecommendations;
    private getCulturalRecommendations;
    private getSeasonalRecommendations;
    private getCollaborativeRecommendations;
    private getPremiumRecommendations;
    private getDefaultRecommendations;
    updateUserPreferences(userId: string, action: string, data: any): Promise<void>;
    getUserInsights(userId: string): Promise<UserInsights>;
    private getFestivalsByMonth;
    private updateBrowsingHistory;
    private updatePurchaseHistory;
    private updateSearchHistory;
    private updateCartBehavior;
    private deduplicateRecommendations;
    private getDefaultInsights;
}
export declare const personalizationService: PersonalizationService;
export {};
//# sourceMappingURL=personalizationService.d.ts.map