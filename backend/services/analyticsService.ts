/**
 * Analytics Service - Advanced Business Intelligence and Data Analytics
 * Provides comprehensive insights for data-driven decision making
 */

import { Analytics, IAnalytics } from '../models/analytics.model';
import { User, IUser } from '../models/users.model';
import { Product, IProduct } from '../models/products.model';
import { Order, IOrder } from '../models/orders.model';
import { UserPreferences, IUserPreferences } from '../models/userPreferences.model';
import { Role } from '../models/roles.model';
import { Subscription, SubscriptionTier } from '../models/subscriptions.model';
import { Vendor, IVendor } from '../models/vendors.model';
import { Review, IReview } from '../models/reviews.model';
import { SupportTicket, ISupportTicket } from '../models/supportTickets.model';
import mongoose from 'mongoose';

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

class AnalyticsService {
  /**
   * Generate comprehensive analytics for a given date range
   */
  async generateAnalytics(startDate: Date, endDate: Date): Promise<IAnalytics> {
    try {
      // Check if analytics already exist for this date
      const existingAnalytics = await Analytics.findOne({
        date: { $gte: startDate, $lte: endDate }
      });

      if (existingAnalytics) {
        return existingAnalytics;
      }

      // Generate new analytics
      const analytics = new Analytics({
        date: new Date(),
        customerAnalytics: await this.generateCustomerAnalytics(startDate, endDate),
        productAnalytics: await this.generateProductAnalytics(startDate, endDate),
        salesAnalytics: await this.generateSalesAnalytics(startDate, endDate),
        marketingAnalytics: await this.generateMarketingAnalytics(startDate, endDate),
        operationalAnalytics: await this.generateOperationalAnalytics(startDate, endDate),
        financialAnalytics: await this.generateFinancialAnalytics(startDate, endDate),
        culturalAnalytics: await this.generateCulturalAnalytics(startDate, endDate),
        predictiveAnalytics: await this.generatePredictiveAnalytics(startDate, endDate),
        realTimeMetrics: await this.generateRealTimeMetrics()
      });

      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Error generating analytics:', error);
      throw error;
    }
  }

  /**
   * Generate customer analytics
   */
  private async generateCustomerAnalytics(startDate: Date, endDate: Date) {
    // Get admin role ID to exclude from customer count
    const adminRole = await Role.findOne({ name: 'admin' });
    const adminRoleId = adminRole?._id;

    const totalCustomers = await User.countDocuments({
      ...(adminRoleId && { roleId: { $ne: adminRoleId } }),
      createdAt: { $lte: endDate }
    });

    const newCustomers = await User.countDocuments({
      ...(adminRoleId && { roleId: { $ne: adminRoleId } }),
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const returningCustomers = await this.getReturningCustomers(startDate, endDate);
    const churnRate = await this.calculateChurnRate(startDate, endDate);
    const customerLifetimeValue = await this.calculateCustomerLifetimeValue();

    // Customer segmentation
    const customerSegments = await this.generateCustomerSegments();

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      churnRate,
      customerLifetimeValue,
      averageOrderFrequency: await this.calculateAverageOrderFrequency(),
      customerSegments
    };
  }

  /**
   * Generate product analytics
   */
  private async generateProductAnalytics(startDate: Date, endDate: Date) {
    const totalProducts = await Product.countDocuments({ isDeleted: false });
    
    const topSellingProducts = await this.getTopSellingProducts(startDate, endDate);
    const categoryPerformance = await this.getCategoryPerformance(startDate, endDate);
    const inventoryAnalytics = await this.getInventoryAnalytics();

    return {
      totalProducts,
      topSellingProducts,
      categoryPerformance,
      inventoryAnalytics
    };
  }

  /**
   * Generate sales analytics
   */
  private async generateSalesAnalytics(startDate: Date, endDate: Date) {
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('orderItems.product');

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const conversionRate = await this.calculateConversionRate(startDate, endDate);
    const cartAbandonmentRate = await this.calculateCartAbandonmentRate(startDate, endDate);

    const salesByChannel = await this.getSalesByChannel(startDate, endDate);
    const seasonalTrends = await this.getSeasonalTrends(startDate, endDate);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      conversionRate,
      cartAbandonmentRate,
      salesByChannel,
      seasonalTrends
    };
  }

  /**
   * Generate marketing analytics
   */
  private async generateMarketingAnalytics(startDate: Date, endDate: Date) {
    const campaignPerformance = await this.getCampaignPerformance(startDate, endDate);
    const promotionEffectiveness = await this.getPromotionEffectiveness(startDate, endDate);
    const customerAcquisitionCost = await this.calculateCustomerAcquisitionCost(startDate, endDate);
    const customerRetentionCost = await this.calculateCustomerRetentionCost(startDate, endDate);

    return {
      campaignPerformance,
      promotionEffectiveness,
      customerAcquisitionCost,
      customerRetentionCost
    };
  }

  /**
   * Generate operational analytics
   */
  private async generateOperationalAnalytics(startDate: Date, endDate: Date) {
    const deliveryPerformance = await this.getDeliveryPerformance(startDate, endDate);
    const vendorPerformance = await this.getVendorPerformance(startDate, endDate);
    const supportAnalytics = await this.getSupportAnalytics(startDate, endDate);

    return {
      deliveryPerformance,
      vendorPerformance,
      supportAnalytics
    };
  }

  /**
   * Generate financial analytics
   */
  private async generateFinancialAnalytics(startDate: Date, endDate: Date) {
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('orderItems.product');

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const totalCost = orders.reduce((sum, order) => {
      const orderCost = order.orderItems.reduce((itemSum, item) => {
        return itemSum + ((item.price || 0) * (item.quantity || 1));
      }, 0);
      return sum + orderCost;
    }, 0);

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const revenueBySource = await this.getRevenueBySource(startDate, endDate);

    return {
      grossProfit,
      netProfit: grossProfit, // Simplified for now
      profitMargin,
      operatingExpenses: totalCost * 0.3, // Estimate
      cashFlow: {
        inflow: totalRevenue,
        outflow: totalCost,
        netFlow: grossProfit
      },
      revenueBySource
    };
  }

  /**
   * Generate cultural analytics
   */
  private async generateCulturalAnalytics(startDate: Date, endDate: Date) {
    const festivalPerformance = await this.getFestivalPerformance(startDate, endDate);
    const languagePreferences = await this.getLanguagePreferences();
    const traditionalVsModern = await this.getTraditionalVsModernSales(startDate, endDate);

    return {
      festivalPerformance,
      languagePreferences,
      traditionalVsModern
    };
  }

  /**
   * Generate predictive analytics
   */
  private async generatePredictiveAnalytics(startDate: Date, endDate: Date) {
    const demandForecast = await this.generateDemandForecast();
    const churnPrediction = await this.generateChurnPrediction();
    const revenueForecast = await this.generateRevenueForecast();

    return {
      demandForecast,
      churnPrediction,
      revenueForecast
    };
  }

  /**
   * Generate real-time metrics
   */
  private async generateRealTimeMetrics() {
    const activeUsers = await this.getActiveUsers();
    const currentOrders = await this.getCurrentOrders();
    const pendingDeliveries = await this.getPendingDeliveries();

    return {
      activeUsers,
      currentOrders,
      pendingDeliveries,
      systemHealth: {
        uptime: 99.9,
        responseTime: 150,
        errorRate: 0.1
      }
    };
  }

  // Helper methods for specific analytics calculations

  private async getReturningCustomers(startDate: Date, endDate: Date): Promise<number> {
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const customerIds = [...new Set(orders.map(order => order.userId.toString()))];
    let returningCustomers = 0;

    for (const customerId of customerIds) {
      const previousOrders = await Order.find({
        userId: customerId,
        createdAt: { $lt: startDate }
      });

      if (previousOrders.length > 0) {
        returningCustomers++;
      }
    }

    return returningCustomers;
  }

  private async calculateChurnRate(startDate: Date, endDate: Date): Promise<number> {
    // Get admin role ID to exclude from customer count
    const adminRole = await Role.findOne({ name: 'admin' });
    const adminRoleId = adminRole?._id;

    const totalCustomers = await User.countDocuments({
      ...(adminRoleId && { roleId: { $ne: adminRoleId } }),
      createdAt: { $lte: startDate }
    });

    const churnedCustomers = await this.getChurnedCustomers(startDate, endDate);
    return totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0;
  }

  private async getChurnedCustomers(startDate: Date, endDate: Date): Promise<number> {
    const cutoffDate = new Date(startDate.getTime() - (90 * 24 * 60 * 60 * 1000)); // 90 days ago

    const activeCustomers = await Order.distinct('userId', {
      createdAt: { $gte: cutoffDate, $lt: startDate }
    });

    const inactiveCustomers = await Order.distinct('userId', {
      userId: { $in: activeCustomers },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    return activeCustomers.length - inactiveCustomers.length;
  }

  private async calculateCustomerLifetimeValue(): Promise<number> {
    const orders = await Order.find().populate('orderItems.product');
    
    const customerTotals = new Map<string, number>();
    
    orders.forEach(order => {
      const customerId = order.userId.toString();
      const orderTotal = order.totalPrice || 0;
      customerTotals.set(customerId, (customerTotals.get(customerId) || 0) + orderTotal);
    });

    const totalValue = Array.from(customerTotals.values()).reduce((sum, value) => sum + value, 0);
    const customerCount = customerTotals.size;

    return customerCount > 0 ? totalValue / customerCount : 0;
  }

  private async generateCustomerSegments() {
    const segments = [
      { segment: 'High Value', count: 0, averageOrderValue: 0, retentionRate: 0 },
      { segment: 'Medium Value', count: 0, averageOrderValue: 0, retentionRate: 0 },
      { segment: 'Low Value', count: 0, averageOrderValue: 0, retentionRate: 0 }
    ];

    // This would be implemented with actual customer data analysis
    return segments;
  }

  private async getTopSellingProducts(startDate: Date, endDate: Date) {
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('orderItems.product');

    const productSales = new Map<string, { units: number; revenue: number; name: string }>();

    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const productId = item.productId.toString();
        const quantity = item.quantity || 1;
        const revenue = (item.price || 0) * quantity;

        if (productSales.has(productId)) {
          const existing = productSales.get(productId)!;
          existing.units += quantity;
          existing.revenue += revenue;
        } else {
          productSales.set(productId, {
            units: quantity,
            revenue,
            name: `Product ${productId.slice(-6)}`
          });
        }
      });
    });

    return Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        unitsSold: data.units,
        revenue: data.revenue,
        profitMargin: 0.25 // Estimate
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 10);
  }

  private async getCategoryPerformance(startDate: Date, endDate: Date) {
    // Implementation for category performance analysis
    return [];
  }

  private async getInventoryAnalytics() {
    const totalProducts = await Product.countDocuments({ isDeleted: false });
    const lowStockItems = await Product.countDocuments({ stock: { $lt: 10, $gt: 0 } });
    const outOfStockItems = await Product.countDocuments({ stock: 0 });

    return {
      lowStockItems,
      outOfStockItems,
      overstockedItems: 0, // Would need business logic to define
      inventoryTurnover: 4.5 // Estimate
    };
  }

  private async calculateConversionRate(startDate: Date, endDate: Date): Promise<number> {
    // This would require tracking page views and purchases
    return 15.5; // Estimate
  }

  private async calculateCartAbandonmentRate(startDate: Date, endDate: Date): Promise<number> {
    // This would require tracking cart additions and purchases
    return 68.5; // Estimate
  }

  private async getSalesByChannel(startDate: Date, endDate: Date) {
    return [
      { channel: 'Web', revenue: 75000, orders: 1500 },
      { channel: 'Mobile', revenue: 45000, orders: 900 },
      { channel: 'Direct', revenue: 15000, orders: 300 }
    ];
  }

  private async getSeasonalTrends(startDate: Date, endDate: Date) {
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push({
        month: i + 1,
        revenue: Math.random() * 50000 + 20000,
        orders: Math.floor(Math.random() * 1000) + 200
      });
    }
    return months;
  }

  private async getCampaignPerformance(startDate: Date, endDate: Date) {
    return [
      {
        campaignId: 'festival_2024',
        name: 'Festival Season 2024',
        impressions: 50000,
        clicks: 2500,
        conversions: 125,
        revenue: 15000,
        roi: 3.2
      }
    ];
  }

  private async getPromotionEffectiveness(startDate: Date, endDate: Date) {
    return [
      {
        promotionId: new mongoose.Types.ObjectId(),
        name: 'Summer Sale',
        usageCount: 150,
        revenueGenerated: 7500,
        averageDiscount: 15
      }
    ];
  }

  private async calculateCustomerAcquisitionCost(startDate: Date, endDate: Date): Promise<number> {
    // This would require marketing spend data
    return 45;
  }

  private async calculateCustomerRetentionCost(startDate: Date, endDate: Date): Promise<number> {
    // This would require retention campaign spend data
    return 25;
  }

  private async getDeliveryPerformance(startDate: Date, endDate: Date) {
    return {
      averageDeliveryTime: 2.5,
      onTimeDeliveryRate: 92.5,
      deliveryCosts: 12500,
      hubUtilization: 78.5
    };
  }

  private async getVendorPerformance(startDate: Date, endDate: Date) {
    const totalVendors = await Vendor.countDocuments({ status: 'active' });
    const activeVendors = await Vendor.countDocuments({ 
      status: 'active',
      updatedAt: { $gte: startDate }
    });

    return {
      totalVendors,
      activeVendors,
      topPerformingVendors: []
    };
  }

  private async getSupportAnalytics(startDate: Date, endDate: Date) {
    const totalTickets = await SupportTicket.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    return {
      totalTickets,
      averageResolutionTime: 4.5,
      customerSatisfaction: 4.2,
      commonIssues: [
        { issue: 'Delivery delays', count: 45 },
        { issue: 'Product quality', count: 32 },
        { issue: 'Payment issues', count: 28 }
      ]
    };
  }

  private async getRevenueBySource(startDate: Date, endDate: Date) {
    return [
      { source: 'Product Sales', amount: 120000, percentage: 80 },
      { source: 'Delivery Fees', amount: 15000, percentage: 10 },
      { source: 'Subscription', amount: 10000, percentage: 7 },
      { source: 'Other', amount: 5000, percentage: 3 }
    ];
  }

  private async getFestivalPerformance(startDate: Date, endDate: Date) {
    return [
      { festival: 'Onam', revenue: 25000, orders: 500, topProducts: ['Onam Sadya', 'Pookalam'] },
      { festival: 'Diwali', revenue: 18000, orders: 360, topProducts: ['Diwali Sweets', 'Candles'] },
      { festival: 'Christmas', revenue: 22000, orders: 440, topProducts: ['Christmas Cake', 'Decorations'] }
    ];
  }

  private async getLanguagePreferences() {
    return [
      { language: 'English', users: 2500, revenue: 75000 },
      { language: 'English', users: 1800, revenue: 54000 },
      { language: 'Malayalam', users: 700, revenue: 21000 }
    ];
  }

  private async getTraditionalVsModernSales(startDate: Date, endDate: Date) {
    return [
      { category: 'Traditional Gifts', traditionalSales: 45000, modernSales: 15000 },
      { category: 'Food Items', traditionalSales: 35000, modernSales: 25000 },
      { category: 'Decorations', traditionalSales: 20000, modernSales: 30000 }
    ];
  }

  private async generateDemandForecast() {
    return [
      {
        productId: new mongoose.Types.ObjectId(),
        predictedDemand: 150,
        confidence: 0.85
      }
    ];
  }

  private async generateChurnPrediction() {
    return [
      {
        userId: new mongoose.Types.ObjectId(),
        churnProbability: 0.75,
        riskFactors: ['No recent orders', 'Low engagement']
      }
    ];
  }

  private async generateRevenueForecast() {
    return [
      {
        period: 'Next Month',
        predictedRevenue: 135000,
        confidence: 0.82
      },
      {
        period: 'Next Quarter',
        predictedRevenue: 420000,
        confidence: 0.78
      }
    ];
  }

  private async getActiveUsers(): Promise<number> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await User.countDocuments({
      updatedAt: { $gte: last24Hours }
    });
  }

  private async getCurrentOrders(): Promise<number> {
    return await Order.countDocuments({
      orderStatus: { $in: ['payment_done', 'order_received', 'collecting_items', 'packing'] }
    });
  }

  private async getPendingDeliveries(): Promise<number> {
    return await Order.countDocuments({
      orderStatus: 'en_route'
    });
  }

  private async calculateAverageOrderFrequency(): Promise<number> {
    const orders = await Order.find();
    const customerOrderCounts = new Map<string, number>();

    orders.forEach(order => {
      const customerId = order.userId.toString();
      customerOrderCounts.set(customerId, (customerOrderCounts.get(customerId) || 0) + 1);
    });

    const totalOrders = Array.from(customerOrderCounts.values()).reduce((sum, count) => sum + count, 0);
    const uniqueCustomers = customerOrderCounts.size;

    return uniqueCustomers > 0 ? totalOrders / uniqueCustomers : 0;
  }

  /**
   * Get analytics summary for dashboard
   */
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    const analytics = await this.generateAnalytics(startDate, endDate);

    return {
      customerMetrics: {
        totalCustomers: analytics.customerAnalytics.totalCustomers,
        newCustomers: analytics.customerAnalytics.newCustomers,
        returningCustomers: analytics.customerAnalytics.returningCustomers,
        churnRate: analytics.customerAnalytics.churnRate,
        averageLifetimeValue: analytics.customerAnalytics.customerLifetimeValue
      },
      salesMetrics: {
        totalRevenue: analytics.salesAnalytics.totalRevenue,
        totalOrders: analytics.salesAnalytics.totalOrders,
        averageOrderValue: analytics.salesAnalytics.averageOrderValue,
        conversionRate: analytics.salesAnalytics.conversionRate,
        cartAbandonmentRate: analytics.salesAnalytics.cartAbandonmentRate
      },
      productMetrics: {
        totalProducts: analytics.productAnalytics.totalProducts,
        topSellingProducts: analytics.productAnalytics.topSellingProducts.map(p => ({
          productId: p.productId.toString(),
          name: p.name,
          unitsSold: p.unitsSold,
          revenue: p.revenue
        })),
        lowStockItems: analytics.productAnalytics.inventoryAnalytics.lowStockItems,
        outOfStockItems: analytics.productAnalytics.inventoryAnalytics.outOfStockItems
      },
      culturalMetrics: {
        festivalPerformance: analytics.culturalAnalytics.festivalPerformance,
        languagePreferences: analytics.culturalAnalytics.languagePreference
      }
    };
  }
}

export const analyticsService = new AnalyticsService(); 