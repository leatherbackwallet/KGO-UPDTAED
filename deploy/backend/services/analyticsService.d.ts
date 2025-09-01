import { IAnalytics } from '../models/analytics.model';
export interface AnalyticsSummary {
    customerMetrics: {
        totalCustomers: number;
        newCustomers: number;
        returningCustomers: number;
        churnRate: number;
        averageLifetimeValue: number;
    };
    salesMetrics: {
        totalRevenue: number;
        totalOrders: number;
        averageOrderValue: number;
        conversionRate: number;
        cartAbandonmentRate: number;
    };
    productMetrics: {
        totalProducts: number;
        topSellingProducts: Array<{
            productId: string;
            name: string;
            unitsSold: number;
            revenue: number;
        }>;
        lowStockItems: number;
        outOfStockItems: number;
    };
    culturalMetrics: {
        festivalPerformance: Array<{
            festival: string;
            revenue: number;
            orders: number;
        }>;
        languagePreferences: Array<{
            language: string;
            users: number;
            revenue: number;
        }>;
    };
}
declare class AnalyticsService {
    generateAnalytics(startDate: Date, endDate: Date): Promise<IAnalytics>;
    private generateCustomerAnalytics;
    private generateProductAnalytics;
    private generateSalesAnalytics;
    private generateMarketingAnalytics;
    private generateOperationalAnalytics;
    private generateFinancialAnalytics;
    private generateCulturalAnalytics;
    private generatePredictiveAnalytics;
    private generateRealTimeMetrics;
    private getReturningCustomers;
    private calculateChurnRate;
    private getChurnedCustomers;
    private calculateCustomerLifetimeValue;
    private generateCustomerSegments;
    private getTopSellingProducts;
    private getCategoryPerformance;
    private getInventoryAnalytics;
    private calculateConversionRate;
    private calculateCartAbandonmentRate;
    private getSalesByChannel;
    private getSeasonalTrends;
    private getCampaignPerformance;
    private getPromotionEffectiveness;
    private calculateCustomerAcquisitionCost;
    private calculateCustomerRetentionCost;
    private getDeliveryPerformance;
    private getVendorPerformance;
    private getSupportAnalytics;
    private getRevenueBySource;
    private getFestivalPerformance;
    private getLanguagePreferences;
    private getTraditionalVsModernSales;
    private generateDemandForecast;
    private generateChurnPrediction;
    private generateRevenueForecast;
    private getActiveUsers;
    private getCurrentOrders;
    private getPendingDeliveries;
    private calculateAverageOrderFrequency;
    getAnalyticsSummary(): Promise<AnalyticsSummary>;
}
export declare const analyticsService: AnalyticsService;
export {};
//# sourceMappingURL=analyticsService.d.ts.map