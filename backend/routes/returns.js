/**
 * Returns Routes - Return Merchandise Authorization (RMA) management
 * Handles the complete return workflow from request to resolution
 */

const express = require('express');
const router = express.Router();
const { Return } = require('../models/returns.model.js');
const { Order } = require('../models/orders.model.js');
const auth = require('../middleware/auth.js');
const role = require('../middleware/role.js');

// Get all returns (admin/support only)
router.get('/', auth, role(['admin', 'support_agent']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const returns = await Return.find(query)
      .populate('orderId', 'orderId totalPrice orderStatus')
      .populate('userId', 'firstName lastName email')
      .populate('orderItems.productId', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Return.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        returns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch returns', code: 'FETCH_ERROR' }
    });
  }
});

// Get returns for a specific user
router.get('/my-returns', auth, async (req, res) => {
  try {
    const returns = await Return.find({ userId: req.user.id })
      .populate('orderId', 'orderId totalPrice orderStatus')
      .populate('orderItems.productId', 'name images')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: returns
    });
  } catch (error) {
    console.error('Error fetching user returns:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch returns', code: 'FETCH_ERROR' }
    });
  }
});

// Get single return by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const returnItem = await Return.findById(req.params.id)
      .populate('orderId', 'orderId totalPrice orderStatus shippingDetails')
      .populate('userId', 'firstName lastName email phone')
      .populate('orderItems.productId', 'name images description');
    
    if (!returnItem) {
      return res.status(404).json({
        success: false,
        error: { message: 'Return not found', code: 'RETURN_NOT_FOUND' }
      });
    }
    
    // Check if user has permission to view this return
    if (req.user.roleId !== 'admin' && req.user.roleId !== 'support_agent' && returnItem.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied', code: 'ACCESS_DENIED' }
      });
    }
    
    res.json({
      success: true,
      data: returnItem
    });
  } catch (error) {
    console.error('Error fetching return:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch return', code: 'FETCH_ERROR' }
    });
  }
});

// Create new return request
router.post('/', auth, async (req, res) => {
  try {
    const { orderId, orderItems, reason } = req.body;
    
    // Validate required fields
    if (!orderId || !orderItems || !reason) {
      return res.status(400).json({
        success: false,
        error: { message: 'Order ID, order items, and reason are required', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Verify order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' }
      });
    }
    
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied', code: 'ACCESS_DENIED' }
      });
    }
    
    // Check if order is eligible for return (delivered within return window)
    const returnWindowDays = 7; // 7 days return window
    const orderDeliveryDate = order.updatedAt; // Assuming this is when order was delivered
    const daysSinceDelivery = (Date.now() - orderDeliveryDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDelivery > returnWindowDays) {
      return res.status(400).json({
        success: false,
        error: { message: 'Return window has expired', code: 'RETURN_WINDOW_EXPIRED' }
      });
    }
    
    // Check if return already exists for this order
    const existingReturn = await Return.findOne({ orderId, status: { $nin: ['rejected', 'completed'] } });
    if (existingReturn) {
      return res.status(400).json({
        success: false,
        error: { message: 'Return already exists for this order', code: 'RETURN_EXISTS' }
      });
    }
    
    const returnItem = await Return.create({
      orderId,
      userId: req.user.id,
      orderItems,
      reason
    });
    
    res.status(201).json({
      success: true,
      data: {
        message: 'Return request created successfully',
        return: returnItem
      }
    });
  } catch (error) {
    console.error('Error creating return:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create return', code: 'CREATE_ERROR' }
    });
  }
});

// Update return status (admin/support only)
router.put('/:id/status', auth, role(['admin', 'support_agent']), async (req, res) => {
  try {
    const { status, resolution, notes } = req.body;
    
    const returnItem = await Return.findById(req.params.id);
    if (!returnItem) {
      return res.status(404).json({
        success: false,
        error: { message: 'Return not found', code: 'RETURN_NOT_FOUND' }
      });
    }
    
    // Validate status transition
    const validTransitions = {
      requested: ['approved', 'rejected'],
      approved: ['shipped_by_customer'],
      shipped_by_customer: ['received_at_hub'],
      received_at_hub: ['completed']
    };
    
    if (validTransitions[returnItem.status] && !validTransitions[returnItem.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid status transition', code: 'INVALID_STATUS' }
      });
    }
    
    // Update return
    returnItem.status = status;
    if (resolution) returnItem.resolution = resolution;
    if (notes) returnItem.notes = notes;
    
    await returnItem.save();
    
    res.json({
      success: true,
      data: {
        message: 'Return status updated successfully',
        return: returnItem
      }
    });
  } catch (error) {
    console.error('Error updating return status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update return status', code: 'UPDATE_ERROR' }
    });
  }
});

// Cancel return request (user only)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const returnItem = await Return.findById(req.params.id);
    if (!returnItem) {
      return res.status(404).json({
        success: false,
        error: { message: 'Return not found', code: 'RETURN_NOT_FOUND' }
      });
    }
    
    // Check if user owns this return
    if (returnItem.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied', code: 'ACCESS_DENIED' }
      });
    }
    
    // Only allow cancellation if status is 'requested'
    if (returnItem.status !== 'requested') {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot cancel return in current status', code: 'INVALID_STATUS' }
      });
    }
    
    returnItem.status = 'cancelled';
    await returnItem.save();
    
    res.json({
      success: true,
      data: {
        message: 'Return cancelled successfully',
        return: returnItem
      }
    });
  } catch (error) {
    console.error('Error cancelling return:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to cancel return', code: 'CANCEL_ERROR' }
    });
  }
});

module.exports = router; 