/**
 * Analytics Model - Advanced Business Intelligence and Data Analytics
 * Provides comprehensive insights for data-driven decision making
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
  // Customer Analytics
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
  
  // Product Analytics
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
  
  // Sales Analytics
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
  
  // Marketing Analytics
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
  
  // Operational Analytics
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
  
  // Financial Analytics
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
  
  // Cultural & Seasonal Analytics
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
  
  // Predictive Analytics
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
  
  // Real-time Metrics
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

const analyticsSchema = new Schema<IAnalytics>({
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
      productId: { type: Schema.Types.ObjectId, ref: 'Product' },
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
      promotionId: { type: Schema.Types.ObjectId, ref: 'Promotion' },
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
        vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
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
      productId: { type: Schema.Types.ObjectId, ref: 'Product' },
      predictedDemand: Number,
      confidence: Number
    }],
    churnPrediction: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
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

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema); 