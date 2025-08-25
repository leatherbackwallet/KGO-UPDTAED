"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = void 0;
const analytics_model_1 = require("../models/analytics.model");
const users_model_1 = require("../models/users.model");
const products_model_1 = require("../models/products.model");
const orders_model_1 = require("../models/orders.model");
const vendors_model_1 = require("../models/vendors.model");
const supportTickets_model_1 = require("../models/supportTickets.model");
const mongoose_1 = __importDefault(require("mongoose"));
class AnalyticsService {
    async generateAnalytics(startDate, endDate) {
        try {
            const existingAnalytics = await analytics_model_1.Analytics.findOne({
                date: { $gte: startDate, $lte: endDate }
            });
            if (existingAnalytics) {
                return existingAnalytics;
            }
            const analytics = new analytics_model_1.Analytics({
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
        }
        catch (error) {
            console.error('Error generating analytics:', error);
            throw error;
        }
    }
    async generateCustomerAnalytics(startDate, endDate) {
        const totalCustomers = await users_model_1.User.countDocuments({
            roleId: { $ne: 'admin' },
            createdAt: { $lte: endDate }
        });
        const newCustomers = await users_model_1.User.countDocuments({
            roleId: { $ne: 'admin' },
            createdAt: { $gte: startDate, $lte: endDate }
        });
        const returningCustomers = await this.getReturningCustomers(startDate, endDate);
        const churnRate = await this.calculateChurnRate(startDate, endDate);
        const customerLifetimeValue = await this.calculateCustomerLifetimeValue();
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
    async generateProductAnalytics(startDate, endDate) {
        const totalProducts = await products_model_1.Product.countDocuments({ isDeleted: false });
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
    async generateSalesAnalytics(startDate, endDate) {
        const orders = await orders_model_1.Order.find({
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
    async generateMarketingAnalytics(startDate, endDate) {
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
    async generateOperationalAnalytics(startDate, endDate) {
        const deliveryPerformance = await this.getDeliveryPerformance(startDate, endDate);
        const vendorPerformance = await this.getVendorPerformance(startDate, endDate);
        const supportAnalytics = await this.getSupportAnalytics(startDate, endDate);
        return {
            deliveryPerformance,
            vendorPerformance,
            supportAnalytics
        };
    }
    async generateFinancialAnalytics(startDate, endDate) {
        const orders = await orders_model_1.Order.find({
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
            netProfit: grossProfit,
            profitMargin,
            operatingExpenses: totalCost * 0.3,
            cashFlow: {
                inflow: totalRevenue,
                outflow: totalCost,
                netFlow: grossProfit
            },
            revenueBySource
        };
    }
    async generateCulturalAnalytics(startDate, endDate) {
        const festivalPerformance = await this.getFestivalPerformance(startDate, endDate);
        const languagePreferences = await this.getLanguagePreferences();
        const traditionalVsModern = await this.getTraditionalVsModernSales(startDate, endDate);
        return {
            festivalPerformance,
            languagePreferences,
            traditionalVsModern
        };
    }
    async generatePredictiveAnalytics(startDate, endDate) {
        const demandForecast = await this.generateDemandForecast();
        const churnPrediction = await this.generateChurnPrediction();
        const revenueForecast = await this.generateRevenueForecast();
        return {
            demandForecast,
            churnPrediction,
            revenueForecast
        };
    }
    async generateRealTimeMetrics() {
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
    async getReturningCustomers(startDate, endDate) {
        const orders = await orders_model_1.Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        });
        const customerIds = [...new Set(orders.map(order => order.userId.toString()))];
        let returningCustomers = 0;
        for (const customerId of customerIds) {
            const previousOrders = await orders_model_1.Order.find({
                userId: customerId,
                createdAt: { $lt: startDate }
            });
            if (previousOrders.length > 0) {
                returningCustomers++;
            }
        }
        return returningCustomers;
    }
    async calculateChurnRate(startDate, endDate) {
        const totalCustomers = await users_model_1.User.countDocuments({
            roleId: { $ne: 'admin' },
            createdAt: { $lte: startDate }
        });
        const churnedCustomers = await this.getChurnedCustomers(startDate, endDate);
        return totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0;
    }
    async getChurnedCustomers(startDate, endDate) {
        const cutoffDate = new Date(startDate.getTime() - (90 * 24 * 60 * 60 * 1000));
        const activeCustomers = await orders_model_1.Order.distinct('userId', {
            createdAt: { $gte: cutoffDate, $lt: startDate }
        });
        const inactiveCustomers = await orders_model_1.Order.distinct('userId', {
            userId: { $in: activeCustomers },
            createdAt: { $gte: startDate, $lte: endDate }
        });
        return activeCustomers.length - inactiveCustomers.length;
    }
    async calculateCustomerLifetimeValue() {
        const orders = await orders_model_1.Order.find().populate('orderItems.product');
        const customerTotals = new Map();
        orders.forEach(order => {
            const customerId = order.userId.toString();
            const orderTotal = order.totalPrice || 0;
            customerTotals.set(customerId, (customerTotals.get(customerId) || 0) + orderTotal);
        });
        const totalValue = Array.from(customerTotals.values()).reduce((sum, value) => sum + value, 0);
        const customerCount = customerTotals.size;
        return customerCount > 0 ? totalValue / customerCount : 0;
    }
    async generateCustomerSegments() {
        const segments = [
            { segment: 'High Value', count: 0, averageOrderValue: 0, retentionRate: 0 },
            { segment: 'Medium Value', count: 0, averageOrderValue: 0, retentionRate: 0 },
            { segment: 'Low Value', count: 0, averageOrderValue: 0, retentionRate: 0 }
        ];
        return segments;
    }
    async getTopSellingProducts(startDate, endDate) {
        const orders = await orders_model_1.Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }).populate('orderItems.product');
        const productSales = new Map();
        orders.forEach(order => {
            order.orderItems.forEach(item => {
                const productId = item.productId.toString();
                const quantity = item.quantity || 1;
                const revenue = (item.price || 0) * quantity;
                if (productSales.has(productId)) {
                    const existing = productSales.get(productId);
                    existing.units += quantity;
                    existing.revenue += revenue;
                }
                else {
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
            profitMargin: 0.25
        }))
            .sort((a, b) => b.unitsSold - a.unitsSold)
            .slice(0, 10);
    }
    async getCategoryPerformance(startDate, endDate) {
        return [];
    }
    async getInventoryAnalytics() {
        const totalProducts = await products_model_1.Product.countDocuments({ isDeleted: false });
        const lowStockItems = await products_model_1.Product.countDocuments({ stock: { $lt: 10, $gt: 0 } });
        const outOfStockItems = await products_model_1.Product.countDocuments({ stock: 0 });
        return {
            lowStockItems,
            outOfStockItems,
            overstockedItems: 0,
            inventoryTurnover: 4.5
        };
    }
    async calculateConversionRate(startDate, endDate) {
        return 15.5;
    }
    async calculateCartAbandonmentRate(startDate, endDate) {
        return 68.5;
    }
    async getSalesByChannel(startDate, endDate) {
        return [
            { channel: 'Web', revenue: 75000, orders: 1500 },
            { channel: 'Mobile', revenue: 45000, orders: 900 },
            { channel: 'Direct', revenue: 15000, orders: 300 }
        ];
    }
    async getSeasonalTrends(startDate, endDate) {
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
    async getCampaignPerformance(startDate, endDate) {
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
    async getPromotionEffectiveness(startDate, endDate) {
        return [
            {
                promotionId: new mongoose_1.default.Types.ObjectId(),
                name: 'Summer Sale',
                usageCount: 150,
                revenueGenerated: 7500,
                averageDiscount: 15
            }
        ];
    }
    async calculateCustomerAcquisitionCost(startDate, endDate) {
        return 45;
    }
    async calculateCustomerRetentionCost(startDate, endDate) {
        return 25;
    }
    async getDeliveryPerformance(startDate, endDate) {
        return {
            averageDeliveryTime: 2.5,
            onTimeDeliveryRate: 92.5,
            deliveryCosts: 12500,
            hubUtilization: 78.5
        };
    }
    async getVendorPerformance(startDate, endDate) {
        const totalVendors = await vendors_model_1.Vendor.countDocuments({ status: 'active' });
        const activeVendors = await vendors_model_1.Vendor.countDocuments({
            status: 'active',
            updatedAt: { $gte: startDate }
        });
        return {
            totalVendors,
            activeVendors,
            topPerformingVendors: []
        };
    }
    async getSupportAnalytics(startDate, endDate) {
        const totalTickets = await supportTickets_model_1.SupportTicket.countDocuments({
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
    async getRevenueBySource(startDate, endDate) {
        return [
            { source: 'Product Sales', amount: 120000, percentage: 80 },
            { source: 'Delivery Fees', amount: 15000, percentage: 10 },
            { source: 'Subscription', amount: 10000, percentage: 7 },
            { source: 'Other', amount: 5000, percentage: 3 }
        ];
    }
    async getFestivalPerformance(startDate, endDate) {
        return [
            { festival: 'Onam', revenue: 25000, orders: 500, topProducts: ['Onam Sadya', 'Pookalam'] },
            { festival: 'Diwali', revenue: 18000, orders: 360, topProducts: ['Diwali Sweets', 'Candles'] },
            { festival: 'Christmas', revenue: 22000, orders: 440, topProducts: ['Christmas Cake', 'Decorations'] }
        ];
    }
    async getLanguagePreferences() {
        return [
            { language: 'English', users: 2500, revenue: 75000 },
            { language: 'English', users: 1800, revenue: 54000 },
            { language: 'Malayalam', users: 700, revenue: 21000 }
        ];
    }
    async getTraditionalVsModernSales(startDate, endDate) {
        return [
            { category: 'Traditional Gifts', traditionalSales: 45000, modernSales: 15000 },
            { category: 'Food Items', traditionalSales: 35000, modernSales: 25000 },
            { category: 'Decorations', traditionalSales: 20000, modernSales: 30000 }
        ];
    }
    async generateDemandForecast() {
        return [
            {
                productId: new mongoose_1.default.Types.ObjectId(),
                predictedDemand: 150,
                confidence: 0.85
            }
        ];
    }
    async generateChurnPrediction() {
        return [
            {
                userId: new mongoose_1.default.Types.ObjectId(),
                churnProbability: 0.75,
                riskFactors: ['No recent orders', 'Low engagement']
            }
        ];
    }
    async generateRevenueForecast() {
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
    async getActiveUsers() {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return await users_model_1.User.countDocuments({
            updatedAt: { $gte: last24Hours }
        });
    }
    async getCurrentOrders() {
        return await orders_model_1.Order.countDocuments({
            orderStatus: { $in: ['payment_done', 'order_received', 'collecting_items', 'packing'] }
        });
    }
    async getPendingDeliveries() {
        return await orders_model_1.Order.countDocuments({
            orderStatus: 'en_route'
        });
    }
    async calculateAverageOrderFrequency() {
        const orders = await orders_model_1.Order.find();
        const customerOrderCounts = new Map();
        orders.forEach(order => {
            const customerId = order.userId.toString();
            customerOrderCounts.set(customerId, (customerOrderCounts.get(customerId) || 0) + 1);
        });
        const totalOrders = Array.from(customerOrderCounts.values()).reduce((sum, count) => sum + count, 0);
        const uniqueCustomers = customerOrderCounts.size;
        return uniqueCustomers > 0 ? totalOrders / uniqueCustomers : 0;
    }
    async getAnalyticsSummary() {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
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
exports.analyticsService = new AnalyticsService();
//# sourceMappingURL=analyticsService.js.map