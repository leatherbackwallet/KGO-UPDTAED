"use strict";
/**
 * Analytics Model - Advanced Business Intelligence and Data Analytics
 * Provides comprehensive insights for data-driven decision making
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
exports.Analytics = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const analyticsSchema = new mongoose_1.Schema({
    customerAnalytics: {
        totalCustomers: { type: Number, default: 0 },
        newCustomers: { type: Number, default: 0 },
        returningCustomers: { type: Number, default: 0 },
        churnRate: { type: Number, default: 0 },
        customerLifetimeValue: { type: Number, default: 0 },
        averageOrderFrequency: { type: Number, default: 0 },
        customerSegments: [{
                segment: String,
                count: Number,
                averageOrderValue: Number,
                retentionRate: Number
            }]
    },
    productAnalytics: {
        totalProducts: { type: Number, default: 0 },
        topSellingProducts: [{
                productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' },
                name: String,
                unitsSold: Number,
                revenue: Number,
                profitMargin: Number
            }],
        categoryPerformance: [{
                category: String,
                sales: Number,
                units: Number,
                profitMargin: Number
            }],
        inventoryAnalytics: {
            lowStockItems: { type: Number, default: 0 },
            outOfStockItems: { type: Number, default: 0 },
            overstockedItems: { type: Number, default: 0 },
            inventoryTurnover: { type: Number, default: 0 }
        }
    },
    salesAnalytics: {
        totalRevenue: { type: Number, default: 0 },
        totalOrders: { type: Number, default: 0 },
        averageOrderValue: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
        cartAbandonmentRate: { type: Number, default: 0 },
        salesByChannel: [{
                channel: String,
                revenue: Number,
                orders: Number
            }],
        seasonalTrends: [{
                month: Number,
                revenue: Number,
                orders: Number
            }]
    },
    marketingAnalytics: {
        campaignPerformance: [{
                campaignId: String,
                name: String,
                impressions: Number,
                clicks: Number,
                conversions: Number,
                revenue: Number,
                roi: Number
            }],
        promotionEffectiveness: [{
                promotionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Promotion' },
                name: String,
                usageCount: Number,
                revenueGenerated: Number,
                averageDiscount: Number
            }],
        customerAcquisitionCost: { type: Number, default: 0 },
        customerRetentionCost: { type: Number, default: 0 }
    },
    operationalAnalytics: {
        deliveryPerformance: {
            averageDeliveryTime: { type: Number, default: 0 },
            onTimeDeliveryRate: { type: Number, default: 0 },
            deliveryCosts: { type: Number, default: 0 },
            hubUtilization: { type: Number, default: 0 }
        },
        vendorPerformance: {
            totalVendors: { type: Number, default: 0 },
            activeVendors: { type: Number, default: 0 },
            topPerformingVendors: [{
                    vendorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Vendor' },
                    name: String,
                    sales: Number,
                    rating: Number
                }]
        },
        supportAnalytics: {
            totalTickets: { type: Number, default: 0 },
            averageResolutionTime: { type: Number, default: 0 },
            customerSatisfaction: { type: Number, default: 0 },
            commonIssues: [{
                    issue: String,
                    count: Number
                }]
        }
    },
    financialAnalytics: {
        grossProfit: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        profitMargin: { type: Number, default: 0 },
        operatingExpenses: { type: Number, default: 0 },
        cashFlow: {
            inflow: { type: Number, default: 0 },
            outflow: { type: Number, default: 0 },
            netFlow: { type: Number, default: 0 }
        },
        revenueBySource: [{
                source: String,
                amount: Number,
                percentage: Number
            }]
    },
    culturalAnalytics: {
        festivalPerformance: [{
                festival: String,
                revenue: Number,
                orders: Number,
                topProducts: [String]
            }],
        languagePreference: [{
                language: String,
                users: Number,
                revenue: Number
            }],
        traditionalVsModern: [{
                category: String,
                traditionalSales: Number,
                modernSales: Number
            }]
    },
    predictiveAnalytics: {
        demandForecast: [{
                productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' },
                predictedDemand: Number,
                confidence: Number
            }],
        churnPrediction: [{
                userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
                churnProbability: Number,
                riskFactors: [String]
            }],
        revenueForecast: [{
                period: String,
                predictedRevenue: Number,
                confidence: Number
            }]
    },
    realTimeMetrics: {
        activeUsers: { type: Number, default: 0 },
        currentOrders: { type: Number, default: 0 },
        pendingDeliveries: { type: Number, default: 0 },
        systemHealth: {
            uptime: { type: Number, default: 100 },
            responseTime: { type: Number, default: 0 },
            errorRate: { type: Number, default: 0 }
        }
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
// Indexes for performance
analyticsSchema.index({ date: 1 });
analyticsSchema.index({ 'customerAnalytics.totalCustomers': 1 });
analyticsSchema.index({ 'salesAnalytics.totalRevenue': 1 });
exports.Analytics = mongoose_1.default.model('Analytics', analyticsSchema);
