/**
 * Finance Routes - Income and Expenditure Analytics
 * Provides financial data for admin dashboard
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.js');
const { Order } = require('../models/orders.model.js');
const { Product } = require('../models/products.model.js');

// Get aggregated financial data
router.get('/aggregates', auth, async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (period) {
      const now = new Date();
      let start;
      
      switch (period) {
        case 'today':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      dateFilter.createdAt = { $gte: start, $lte: now };
    }

    // Get orders with date filter
    const orders = await Order.find(dateFilter).populate('orderItems.productId');
    
    // Calculate financial metrics
    let totalRevenue = 0;
    let totalCost = 0;
    let totalOrders = orders.length;
    let averageOrderValue = 0;
    
    const orderDetails = orders.map(order => {
      const orderRevenue = order.totalPrice || 0;
      const orderCost = order.orderItems.reduce((cost, item) => {
        const product = item.productId;
        const productCost = (product?.costPrice || 0) * item.quantity;
        return cost + productCost;
      }, 0);
      
      totalRevenue += orderRevenue;
      totalCost += orderCost;
      
      return {
        orderId: order._id,
        orderNumber: order.orderId,
        customerName: order.shippingDetails?.recipientName || 'Unknown',
        date: order.createdAt,
        revenue: orderRevenue,
        cost: orderCost,
        profit: orderRevenue - orderCost,
        profitMargin: orderRevenue > 0 ? ((orderRevenue - orderCost) / orderRevenue * 100) : 0
      };
    });
    
    averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;
    
    // Get previous period for comparison
    const previousPeriodData = await getPreviousPeriodData(period, startDate, endDate);
    
    // Calculate growth percentages
    const revenueGrowth = previousPeriodData.totalRevenue > 0 
      ? ((totalRevenue - previousPeriodData.totalRevenue) / previousPeriodData.totalRevenue * 100) 
      : 0;
    
    const profitGrowth = previousPeriodData.totalProfit > 0 
      ? ((totalProfit - previousPeriodData.totalProfit) / previousPeriodData.totalProfit * 100) 
      : 0;
    
    // Get monthly data for charts
    const monthlyData = await getMonthlyData(startDate, endDate);
    
    // Get category performance
    const categoryData = await getCategoryPerformance(startDate, endDate);
    
    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalCost,
          totalProfit,
          profitMargin,
          totalOrders,
          averageOrderValue,
          revenueGrowth,
          profitGrowth
        },
        orders: orderDetails,
        monthlyData,
        categoryData,
        previousPeriod: previousPeriodData
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

// Get order-wise breakdown
router.get('/orders', auth, async (req, res) => {
  try {
    const { startDate, endDate, sortBy = 'date', sortOrder = 'desc', page = 1, limit = 20 } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Build sort object
    const sortObject = {};
    switch (sortBy) {
      case 'revenue':
        sortObject.totalPrice = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'profit':
        // We'll sort after calculating profit
        break;
      case 'date':
      default:
        sortObject.createdAt = sortOrder === 'desc' ? -1 : 1;
    }
    
    // Get orders with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(dateFilter)
      .populate('orderItems.productId')
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalOrders = await Order.countDocuments(dateFilter);
    
    // Calculate financial data for each order
    const orderBreakdown = orders.map(order => {
      const revenue = order.totalPrice || 0;
      const cost = order.orderItems.reduce((total, item) => {
        const product = item.productId;
        const productCost = (product?.costPrice || 0) * item.quantity;
        return total + productCost;
      }, 0);
      
      const profit = revenue - cost;
      const profitMargin = revenue > 0 ? (profit / revenue * 100) : 0;
      
      return {
        orderId: order._id,
        orderNumber: order.orderId,
        customerName: order.shippingDetails?.recipientName || 'Unknown',
        customerEmail: '', // Not available in current model
        date: order.createdAt,
        status: order.orderStatus,
        revenue,
        cost,
        profit,
        profitMargin,
        items: order.orderItems.length,
        paymentMethod: 'Unknown' // Not available in current model
      };
    });
    
    // Sort by profit if requested
    if (sortBy === 'profit') {
      orderBreakdown.sort((a, b) => {
        return sortOrder === 'desc' ? b.profit - a.profit : a.profit - b.profit;
      });
    }
    
    res.json({
      success: true,
      data: {
        orders: orderBreakdown,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / parseInt(limit)),
          totalOrders,
          hasNext: parseInt(page) < Math.ceil(totalOrders / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching order breakdown:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch order breakdown', code: 'ORDER_BREAKDOWN_ERROR' }
    });
  }
});

// Helper function to get previous period data
async function getPreviousPeriodData(period, startDate, endDate) {
  try {
    let previousStart, previousEnd;
    
    if (startDate && endDate) {
      const duration = new Date(endDate) - new Date(startDate);
      previousEnd = new Date(startDate);
      previousStart = new Date(previousEnd.getTime() - duration);
    } else if (period) {
      const now = new Date();
      let currentStart;
      
      switch (period) {
        case 'today':
          currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          previousEnd = currentStart;
          previousStart = new Date(previousEnd.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          previousEnd = currentStart;
          previousStart = new Date(previousEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
          previousEnd = currentStart;
          previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case 'quarter':
          currentStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          previousEnd = currentStart;
          previousStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
          break;
        case 'year':
          currentStart = new Date(now.getFullYear(), 0, 1);
          previousEnd = currentStart;
          previousStart = new Date(now.getFullYear() - 1, 0, 1);
          break;
        default:
          return { totalRevenue: 0, totalProfit: 0 };
      }
    } else {
      return { totalRevenue: 0, totalProfit: 0 };
    }
    
    const previousOrders = await Order.find({
      createdAt: { $gte: previousStart, $lt: previousEnd }
    }).populate('orderItems.productId');
    
    let totalRevenue = 0;
    let totalCost = 0;
    
    previousOrders.forEach(order => {
      const orderRevenue = order.totalPrice || 0;
      const orderCost = order.orderItems.reduce((cost, item) => {
        const product = item.productId;
        const productCost = (product?.costPrice || 0) * item.quantity;
        return cost + productCost;
      }, 0);
      
      totalRevenue += orderRevenue;
      totalCost += orderCost;
    });
    
    return {
      totalRevenue,
      totalProfit: totalRevenue - totalCost
    };
  } catch (error) {
    console.error('Error getting previous period data:', error);
    return { totalRevenue: 0, totalProfit: 0 };
  }
}

// Helper function to get monthly data
async function getMonthlyData(startDate, endDate) {
  try {
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const orders = await Order.find(dateFilter).populate('orderItems.productId');
    
    const monthlyData = {};
    
    orders.forEach(order => {
      const month = order.createdAt.toISOString().substring(0, 7); // YYYY-MM format
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          revenue: 0,
          cost: 0,
          profit: 0,
          orders: 0
        };
      }
      
      const orderRevenue = order.totalPrice || 0;
      const orderCost = order.orderItems.reduce((cost, item) => {
        const product = item.productId;
        const productCost = (product?.costPrice || 0) * item.quantity;
        return cost + productCost;
      }, 0);
      
      monthlyData[month].revenue += orderRevenue;
      monthlyData[month].cost += orderCost;
      monthlyData[month].profit += (orderRevenue - orderCost);
      monthlyData[month].orders += 1;
    });
    
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  } catch (error) {
    console.error('Error getting monthly data:', error);
    return [];
  }
}

// Helper function to get category performance
async function getCategoryPerformance(startDate, endDate) {
  try {
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const orders = await Order.find(dateFilter).populate({
      path: 'orderItems.productId',
      populate: {
        path: 'category',
        model: 'Category'
      }
    });
    
    const categoryData = {};
    
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const product = item.productId;
        if (product && product.category) {
          const categoryId = product.category._id || product.category;
          const categoryName = product.category.name || categoryId;
          
          if (!categoryData[categoryId]) {
            categoryData[categoryId] = {
              category: categoryName,
              revenue: 0,
              cost: 0,
              profit: 0,
              orders: 0,
              quantity: 0
            };
          }
          
          const itemRevenue = (product.price || 0) * item.quantity;
          const itemCost = (product.costPrice || 0) * item.quantity;
          
          categoryData[categoryId].revenue += itemRevenue;
          categoryData[categoryId].cost += itemCost;
          categoryData[categoryId].profit += (itemRevenue - itemCost);
          categoryData[categoryId].quantity += item.quantity;
        }
      });
    });
    
    return Object.values(categoryData).sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error('Error getting category performance:', error);
    return [];
  }
}

module.exports = router; 