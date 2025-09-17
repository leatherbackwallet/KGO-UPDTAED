/**
 * Analytics Routes - Advanced Business Intelligence and Data Analytics
 * Provides comprehensive insights for data-driven decision making
 */

import express from 'express';
import { analyticsService } from '../services/analyticsService';
import { Analytics } from '../models/analytics.model';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = express.Router();

/**
 * GET /api/analytics/summary
 * Get analytics summary for dashboard
 */
router.get('/summary', auth, requireRole('admin'), async (req: any, res) => {
  try {
    const summary = await analyticsService.getAnalyticsSummary();

    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get analytics summary', code: 'ANALYTICS_SUMMARY_ERROR' }
    });
  }
});

/**
 * GET /api/analytics/generate
 * Generate comprehensive analytics for a date range
 */
router.get('/generate', auth, requireRole('admin'), async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'Start date and end date are required', code: 'DATE_RANGE_REQUIRED' }
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const analytics = await analyticsService.generateAnalytics(start, end);

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to generate analytics', code: 'ANALYTICS_GENERATION_ERROR' }
    });
  }
});

/**
 * GET /api/analytics/customer
 * Get customer analytics
 */
router.get('/customer', auth, requireRole('admin'), async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await analyticsService.generateAnalytics(start, end);

    return res.status(200).json({
      success: true,
      data: {
        customerAnalytics: analytics.customerAnalytics,
        period: { startDate: start, endDate: end }
      }
    });
  } catch (error) {
    console.error('Error getting customer analytics:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get customer analytics', code: 'CUSTOMER_ANALYTICS_ERROR' }
    });
  }
});

/**
 * GET /api/analytics/sales
 * Get sales analytics
 */
router.get('/sales', auth, requireRole('admin'), async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await analyticsService.generateAnalytics(start, end);

    return res.status(200).json({
      success: true,
      data: {
        salesAnalytics: analytics.salesAnalytics,
        period: { startDate: start, endDate: end }
      }
    });
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get sales analytics', code: 'SALES_ANALYTICS_ERROR' }
    });
  }
});

/**
 * GET /api/analytics/products
 * Get product analytics
 */
router.get('/products', auth, requireRole('admin'), async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await analyticsService.generateAnalytics(start, end);

    return res.status(200).json({
      success: true,
      data: {
        productAnalytics: analytics.productAnalytics,
        period: { startDate: start, endDate: end }
      }
    });
  } catch (error) {
    console.error('Error getting product analytics:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get product analytics', code: 'PRODUCT_ANALYTICS_ERROR' }
    });
  }
});

/**
 * GET /api/analytics/financial
 * Get financial analytics
 */
router.get('/financial', auth, requireRole('admin'), async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await analyticsService.generateAnalytics(start, end);

    return res.status(200).json({
      success: true,
      data: {
        financialAnalytics: analytics.financialAnalytics,
        period: { startDate: start, endDate: end }
      }
    });
  } catch (error) {
    console.error('Error getting financial analytics:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get financial analytics', code: 'FINANCIAL_ANALYTICS_ERROR' }
    });
  }
});

/**
 * GET /api/analytics/cultural
 * Get cultural analytics
 */
router.get('/cultural', auth, requireRole('admin'), async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await analyticsService.generateAnalytics(start, end);

    return res.status(200).json({
      success: true,
      data: {
        culturalAnalytics: analytics.culturalAnalytics,
        period: { startDate: start, endDate: end }
      }
    });
  } catch (error) {
    console.error('Error getting cultural analytics:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get cultural analytics', code: 'CULTURAL_ANALYTICS_ERROR' }
    });
  }
});

/**
 * GET /api/analytics/operational
 * Get operational analytics
 */
router.get('/operational', auth, requireRole('admin'), async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await analyticsService.generateAnalytics(start, end);

    return res.status(200).json({
      success: true,
      data: {
        operationalAnalytics: analytics.operationalAnalytics,
        period: { startDate: start, endDate: end }
      }
    });
  } catch (error) {
    console.error('Error getting operational analytics:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get operational analytics', code: 'OPERATIONAL_ANALYTICS_ERROR' }
    });
  }
});

/**
 * GET /api/analytics/predictive
 * Get predictive analytics
 */
router.get('/predictive', auth, requireRole('admin'), async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await analyticsService.generateAnalytics(start, end);

    return res.status(200).json({
      success: true,
      data: {
        predictiveAnalytics: analytics.predictiveAnalytics,
        period: { startDate: start, endDate: end }
      }
    });
  } catch (error) {
    console.error('Error getting predictive analytics:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get predictive analytics', code: 'PREDICTIVE_ANALYTICS_ERROR' }
    });
  }
});

/**
 * GET /api/analytics/real-time
 * Get real-time metrics
 */
router.get('/real-time', auth, requireRole('admin'), async (req: any, res) => {
  try {
    const analytics = await Analytics.findOne().sort({ createdAt: -1 });

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
  } catch (error) {
    console.error('Error getting real-time metrics:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get real-time metrics', code: 'REAL_TIME_METRICS_ERROR' }
    });
  }
});

/**
 * GET /api/analytics/history
 * Get analytics history
 */
router.get('/history', auth, requireRole('admin'), async (req: any, res) => {
  try {
    const { limit = 30, startDate, endDate } = req.query;
    
    let query: any = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const analytics = await Analytics.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit as string))
      .select('date customerAnalytics.totalCustomers salesAnalytics.totalRevenue salesAnalytics.totalOrders');

    return res.status(200).json({
      success: true,
      data: {
        analytics,
        totalCount: analytics.length
      }
    });
  } catch (error) {
    console.error('Error getting analytics history:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get analytics history', code: 'ANALYTICS_HISTORY_ERROR' }
    });
  }
});

/**
 * POST /api/analytics/export
 * Export analytics data
 */
router.post('/export', auth, requireRole('admin'), async (req: any, res) => {
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

    const analytics = await analyticsService.generateAnalytics(start, end);

    // For now, return JSON. In a real implementation, you'd generate CSV/Excel files
    return res.status(200).json({
      success: true,
      data: {
        analytics,
        exportFormat: format,
        period: { startDate: start, endDate: end }
      }
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to export analytics', code: 'ANALYTICS_EXPORT_ERROR' }
    });
  }
});

/**
 * GET /api/analytics/dashboard
 * Get dashboard metrics
 */
router.get('/dashboard', auth, requireRole('admin'), async (req: any, res) => {
  try {
    const summary = await analyticsService.getAnalyticsSummary();

    // Get recent trends
    const recentAnalytics = await Analytics.find()
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
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get dashboard metrics', code: 'DASHBOARD_METRICS_ERROR' }
    });
  }
});

export default router; 