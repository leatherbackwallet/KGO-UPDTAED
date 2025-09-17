/**
 * Finance Routes - Income and Expenditure Analytics
 * Provides financial data for admin dashboard
 */

import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { Order } from '../models/orders.model';
import { Product } from '../models/products.model';

const router = express.Router();

// Get aggregated financial data
router.get('/aggregates', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, period } = req.query;
    
    // Build date filter
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Get product statistics
    const productStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalInventoryValue: { $sum: { $multiply: ['$price', '$stock'] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        orders: orderStats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
        products: productStats[0] || { totalProducts: 0, totalInventoryValue: 0 },
        period: period || 'all'
      }
    });
  } catch (error) {
    console.error('Error fetching financial aggregates:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch financial data', code: 'FINANCE_FETCH_ERROR' }
    });
  }
});

// Get revenue trends
router.get('/revenue/trends', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'month' } = req.query;
    
    let groupFormat: any;
    switch (period) {
      case 'day':
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'week':
        groupFormat = { $dateToString: { format: '%Y-%U', date: '$createdAt' } };
        break;
      case 'month':
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      case 'year':
        groupFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
        break;
      default:
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }

    const revenueTrends = await Order.aggregate([
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        trends: revenueTrends,
        period
      }
    });
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch revenue trends', code: 'REVENUE_TRENDS_ERROR' }
    });
  }
});

// Get top selling products
router.get('/products/top-selling', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    
    const topProducts = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.productId',
          totalSold: { $sum: '$orderItems.quantity' },
          totalRevenue: { $sum: { $multiply: ['$orderItems.quantity', '$orderItems.price'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          totalSold: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: Number(limit) }
    ]);

    res.json({
      success: true,
      data: {
        topProducts,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch top selling products', code: 'TOP_PRODUCTS_ERROR' }
    });
  }
});

export default router;
