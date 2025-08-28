import mongoose, { Document } from 'mongoose';
export interface IAnalytics extends Document {
    customerAnalytics: {
        totalCustomers: number;
        newCustomers: number;
        returningCustomers: number;
        churnRate: number;
        customerLifetimeValue: number;
        averageOrderFrequency: number;
        customerSegments: {
            segment: string;
            count: number;
            averageOrderValue: number;
            retentionRate: number;
        }[];
    };
    productAnalytics: {
        totalProducts: number;
        topSellingProducts: {
            productId: mongoose.Types.ObjectId;
            name: string;
            unitsSold: number;
            revenue: number;
            profitMargin: number;
        }[];
        categoryPerformance: {
            category: string;
            sales: number;
            units: number;
            profitMargin: number;
        }[];
        inventoryAnalytics: {
            lowStockItems: number;
            outOfStockItems: number;
            overstockedItems: number;
            inventoryTurnover: number;
        };
    };
    salesAnalytics: {
        totalRevenue: number;
        totalOrders: number;
        averageOrderValue: number;
        conversionRate: number;
        cartAbandonmentRate: number;
        salesByChannel: {
            channel: string;
            revenue: number;
            orders: number;
        }[];
        seasonalTrends: {
            month: number;
            revenue: number;
            orders: number;
        }[];
    };
    marketingAnalytics: {
        campaignPerformance: {
            campaignId: string;
            name: string;
            impressions: number;
            clicks: number;
            conversions: number;
            revenue: number;
            roi: number;
        }[];
        promotionEffectiveness: {
            promotionId: mongoose.Types.ObjectId;
            name: string;
            usageCount: number;
            revenueGenerated: number;
            averageDiscount: number;
        }[];
        customerAcquisitionCost: number;
        customerRetentionCost: number;
    };
    operationalAnalytics: {
        deliveryPerformance: {
            averageDeliveryTime: number;
            onTimeDeliveryRate: number;
            deliveryCosts: number;
            hubUtilization: number;
        };
        vendorPerformance: {
            totalVendors: number;
            activeVendors: number;
            topPerformingVendors: {
                vendorId: mongoose.Types.ObjectId;
                name: string;
                sales: number;
                rating: number;
            }[];
        };
        supportAnalytics: {
            totalTickets: number;
            averageResolutionTime: number;
            customerSatisfaction: number;
            commonIssues: {
                issue: string;
                count: number;
            }[];
        };
    };
    financialAnalytics: {
        grossProfit: number;
        netProfit: number;
        profitMargin: number;
        operatingExpenses: number;
        cashFlow: {
            inflow: number;
            outflow: number;
            netFlow: number;
        };
        revenueBySource: {
            source: string;
            amount: number;
            percentage: number;
        }[];
    };
    culturalAnalytics: {
        festivalPerformance: {
            festival: string;
            revenue: number;
            orders: number;
            topProducts: string[];
        }[];
        languagePreference: {
            language: string;
            users: number;
            revenue: number;
        }[];
        traditionalVsModern: {
            category: string;
            traditionalSales: number;
            modernSales: number;
        }[];
    };
    predictiveAnalytics: {
        demandForecast: {
            productId: mongoose.Types.ObjectId;
            predictedDemand: number;
            confidence: number;
        }[];
        churnPrediction: {
            userId: mongoose.Types.ObjectId;
            churnProbability: number;
            riskFactors: string[];
        }[];
        revenueForecast: {
            period: string;
            predictedRevenue: number;
            confidence: number;
        }[];
    };
    realTimeMetrics: {
        activeUsers: number;
        currentOrders: number;
        pendingDeliveries: number;
        systemHealth: {
            uptime: number;
            responseTime: number;
            errorRate: number;
        };
    };
    date: Date;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Analytics: mongoose.Model<IAnalytics, {}, {}, {}, mongoose.Document<unknown, {}, IAnalytics, {}, {}> & IAnalytics & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=analytics.model.d.ts.map