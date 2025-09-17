"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const orders_model_1 = require("../models/orders.model");
const products_model_1 = require("../models/products.model");
const router = express_1.default.Router();
router.get('/aggregates', auth_1.auth, async (req, res) => {
    try {
        const { startDate, endDate, period } = req.query;
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        const orderStats = await orders_model_1.Order.aggregate([
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
        const productStats = await products_model_1.Product.aggregate([
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
    }
    catch (error) {
        console.error('Error fetching financial aggregates:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch financial data', code: 'FINANCE_FETCH_ERROR' }
        });
    }
});
router.get('/revenue/trends', auth_1.auth, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        let groupFormat;
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
        const revenueTrends = await orders_model_1.Order.aggregate([
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
    }
    catch (error) {
        console.error('Error fetching revenue trends:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch revenue trends', code: 'REVENUE_TRENDS_ERROR' }
        });
    }
});
router.get('/products/top-selling', auth_1.auth, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const topProducts = await orders_model_1.Order.aggregate([
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
    }
    catch (error) {
        console.error('Error fetching top selling products:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch top selling products', code: 'TOP_PRODUCTS_ERROR' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=finance.js.map