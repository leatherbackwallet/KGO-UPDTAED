"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsService_1 = require("../services/analyticsService");
const analytics_model_1 = require("../models/analytics.model");
const auth = require('../middleware/auth.js');
const role = require('../middleware/role.js');
const router = express_1.default.Router();
router.get('/summary', auth, role(['admin']), async (req, res) => {
    try {
        const summary = await analyticsService_1.analyticsService.getAnalyticsSummary();
        return res.status(200).json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('Error getting analytics summary:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get analytics summary', code: 'ANALYTICS_SUMMARY_ERROR' }
        });
    }
});
router.get('/generate', auth, role(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: { message: 'Start date and end date are required', code: 'DATE_RANGE_REQUIRED' }
            });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const analytics = await analyticsService_1.analyticsService.generateAnalytics(start, end);
        return res.status(200).json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        console.error('Error generating analytics:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to generate analytics', code: 'ANALYTICS_GENERATION_ERROR' }
        });
    }
});
router.get('/customer', auth, role(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const analytics = await analyticsService_1.analyticsService.generateAnalytics(start, end);
        return res.status(200).json({
            success: true,
            data: {
                customerAnalytics: analytics.customerAnalytics,
                period: { startDate: start, endDate: end }
            }
        });
    }
    catch (error) {
        console.error('Error getting customer analytics:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get customer analytics', code: 'CUSTOMER_ANALYTICS_ERROR' }
        });
    }
});
router.get('/sales', auth, role(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const analytics = await analyticsService_1.analyticsService.generateAnalytics(start, end);
        return res.status(200).json({
            success: true,
            data: {
                salesAnalytics: analytics.salesAnalytics,
                period: { startDate: start, endDate: end }
            }
        });
    }
    catch (error) {
        console.error('Error getting sales analytics:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get sales analytics', code: 'SALES_ANALYTICS_ERROR' }
        });
    }
});
router.get('/products', auth, role(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const analytics = await analyticsService_1.analyticsService.generateAnalytics(start, end);
        return res.status(200).json({
            success: true,
            data: {
                productAnalytics: analytics.productAnalytics,
                period: { startDate: start, endDate: end }
            }
        });
    }
    catch (error) {
        console.error('Error getting product analytics:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get product analytics', code: 'PRODUCT_ANALYTICS_ERROR' }
        });
    }
});
router.get('/financial', auth, role(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const analytics = await analyticsService_1.analyticsService.generateAnalytics(start, end);
        return res.status(200).json({
            success: true,
            data: {
                financialAnalytics: analytics.financialAnalytics,
                period: { startDate: start, endDate: end }
            }
        });
    }
    catch (error) {
        console.error('Error getting financial analytics:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get financial analytics', code: 'FINANCIAL_ANALYTICS_ERROR' }
        });
    }
});
router.get('/cultural', auth, role(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const analytics = await analyticsService_1.analyticsService.generateAnalytics(start, end);
        return res.status(200).json({
            success: true,
            data: {
                culturalAnalytics: analytics.culturalAnalytics,
                period: { startDate: start, endDate: end }
            }
        });
    }
    catch (error) {
        console.error('Error getting cultural analytics:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get cultural analytics', code: 'CULTURAL_ANALYTICS_ERROR' }
        });
    }
});
router.get('/operational', auth, role(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const analytics = await analyticsService_1.analyticsService.generateAnalytics(start, end);
        return res.status(200).json({
            success: true,
            data: {
                operationalAnalytics: analytics.operationalAnalytics,
                period: { startDate: start, endDate: end }
            }
        });
    }
    catch (error) {
        console.error('Error getting operational analytics:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get operational analytics', code: 'OPERATIONAL_ANALYTICS_ERROR' }
        });
    }
});
router.get('/predictive', auth, role(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const analytics = await analyticsService_1.analyticsService.generateAnalytics(start, end);
        return res.status(200).json({
            success: true,
            data: {
                predictiveAnalytics: analytics.predictiveAnalytics,
                period: { startDate: start, endDate: end }
            }
        });
    }
    catch (error) {
        console.error('Error getting predictive analytics:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get predictive analytics', code: 'PREDICTIVE_ANALYTICS_ERROR' }
        });
    }
});
router.get('/real-time', auth, role(['admin']), async (req, res) => {
    try {
        const analytics = await analytics_model_1.Analytics.findOne().sort({ createdAt: -1 });
        if (!analytics) {
            return res.status(404).json({
                success: false,
                error: { message: 'No analytics data found', code: 'ANALYTICS_NOT_FOUND' }
            });
        }
        return res.status(200).json({
            success: true,
            data: analytics.realTimeMetrics
        });
    }
    catch (error) {
        console.error('Error getting real-time metrics:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get real-time metrics', code: 'REAL_TIME_METRICS_ERROR' }
        });
    }
});
router.get('/history', auth, role(['admin']), async (req, res) => {
    try {
        const { limit = 30, startDate, endDate } = req.query;
        let query = {};
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        const analytics = await analytics_model_1.Analytics.find(query)
            .sort({ date: -1 })
            .limit(parseInt(limit))
            .select('date customerAnalytics.totalCustomers salesAnalytics.totalRevenue salesAnalytics.totalOrders');
        return res.status(200).json({
            success: true,
            data: {
                analytics,
                totalCount: analytics.length
            }
        });
    }
    catch (error) {
        console.error('Error getting analytics history:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get analytics history', code: 'ANALYTICS_HISTORY_ERROR' }
        });
    }
});
router.post('/export', auth, role(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, format = 'json' } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: { message: 'Start date and end date are required', code: 'DATE_RANGE_REQUIRED' }
            });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const analytics = await analyticsService_1.analyticsService.generateAnalytics(start, end);
        return res.status(200).json({
            success: true,
            data: {
                analytics,
                exportFormat: format,
                period: { startDate: start, endDate: end }
            }
        });
    }
    catch (error) {
        console.error('Error exporting analytics:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to export analytics', code: 'ANALYTICS_EXPORT_ERROR' }
        });
    }
});
router.get('/dashboard', auth, role(['admin']), async (req, res) => {
    try {
        const summary = await analyticsService_1.analyticsService.getAnalyticsSummary();
        const recentAnalytics = await analytics_model_1.Analytics.find()
            .sort({ date: -1 })
            .limit(7)
            .select('date customerAnalytics.newCustomers salesAnalytics.totalRevenue');
        const trends = {
            customerGrowth: recentAnalytics.map(a => ({
                date: a.date,
                newCustomers: a.customerAnalytics.newCustomers
            })),
            revenueGrowth: recentAnalytics.map(a => ({
                date: a.date,
                revenue: a.salesAnalytics.totalRevenue
            }))
        };
        return res.status(200).json({
            success: true,
            data: {
                summary,
                trends,
                lastUpdated: new Date()
            }
        });
    }
    catch (error) {
        console.error('Error getting dashboard metrics:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get dashboard metrics', code: 'DASHBOARD_METRICS_ERROR' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map