/**
 * Delivery Runs Routes - Advanced logistics management
 * Handles delivery run planning, execution, and tracking for hyperlocal delivery
 */

const express = require('express');
const router = express.Router();
const { DeliveryRun } = require('../models/deliveryRuns.model');
const Order = require('../models/orders.model');
const { Hub } = require('../models/hubs.model');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Get all delivery runs (admin and delivery agents)
router.get('/', auth, async (req, res) => {
  try {
    const { status, deliveryAgentId, date } = req.query;
    const filter = {};
    
    // Filter by status
    if (status) {
      filter.status = status;
    }
    
    // Filter by delivery agent (delivery agents can only see their own runs)
    if (req.user.role === 'delivery_agent') {
      filter.deliveryAgentId = req.user.id;
    } else if (deliveryAgentId) {
      filter.deliveryAgentId = deliveryAgentId;
    }
    
    // Filter by date
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.createdAt = { $gte: startDate, $lt: endDate };
    }
    
    const deliveryRuns = await DeliveryRun.find(filter)
      .populate('deliveryAgentId', 'firstName lastName email phone')
      .populate('assignedHubId', 'name address')
      .populate('orders', 'orderId totalPrice orderStatus')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: deliveryRuns
    });
  } catch (error) {
    console.error('Error fetching delivery runs:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch delivery runs', code: 'FETCH_ERROR' }
    });
  }
});

// Get single delivery run
router.get('/:id', auth, async (req, res) => {
  try {
    const deliveryRun = await DeliveryRun.findById(req.params.id)
      .populate('deliveryAgentId', 'firstName lastName email phone')
      .populate('assignedHubId', 'name address')
      .populate('orders', 'orderId totalPrice orderStatus shippingDetails');
    
    if (!deliveryRun) {
      return res.status(404).json({
        success: false,
        error: { message: 'Delivery run not found', code: 'RUN_NOT_FOUND' }
      });
    }
    
    // Check if user has access to this run
    if (req.user.role === 'delivery_agent' && deliveryRun.deliveryAgentId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied', code: 'ACCESS_DENIED' }
      });
    }
    
    res.json({
      success: true,
      data: deliveryRun
    });
  } catch (error) {
    console.error('Error fetching delivery run:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch delivery run', code: 'FETCH_ERROR' }
    });
  }
});

// Create new delivery run (admin only)
router.post('/', auth, role('admin'), async (req, res) => {
  try {
    const { 
      deliveryAgentId, 
      assignedHubId, 
      orders, 
      routePlan, 
      estimatedStartTime, 
      estimatedCompletionTime 
    } = req.body;
    
    // Validate required fields
    if (!deliveryAgentId || !assignedHubId || !orders || !routePlan) {
      return res.status(400).json({
        success: false,
        error: { message: 'All required fields must be provided', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Validate that delivery agent exists and is a delivery agent
    const { User } = require('../models/users.model');
    const deliveryAgent = await User.findById(deliveryAgentId);
    if (!deliveryAgent || deliveryAgent.role !== 'delivery_agent') {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid delivery agent', code: 'INVALID_AGENT' }
      });
    }
    
    // Validate that hub exists
    const hub = await Hub.findById(assignedHubId);
    if (!hub) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid hub', code: 'INVALID_HUB' }
      });
    }
    
    // Validate that orders exist and are pending delivery
    const orderIds = Array.isArray(orders) ? orders : [orders];
    const orderCount = await Order.countDocuments({
      _id: { $in: orderIds },
      orderStatus: { $in: ['pending', 'processing', 'awaiting_delivery_run'] }
    });
    
    if (orderCount !== orderIds.length) {
      return res.status(400).json({
        success: false,
        error: { message: 'Some orders are not available for delivery', code: 'INVALID_ORDERS' }
      });
    }
    
    const deliveryRun = await DeliveryRun.create({
      deliveryAgentId,
      assignedHubId,
      orders: orderIds,
      routePlan,
      estimatedStartTime,
      estimatedCompletionTime
    });
    
    // Update orders to link them to this delivery run
    await Order.updateMany(
      { _id: { $in: orderIds } },
      { 
        deliveryRunId: deliveryRun._id,
        orderStatus: 'awaiting_delivery_run'
      }
    );
    
    res.status(201).json({
      success: true,
      data: {
        message: 'Delivery run created successfully',
        deliveryRun
      }
    });
  } catch (error) {
    console.error('Error creating delivery run:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create delivery run', code: 'CREATE_ERROR' }
    });
  }
});

// Update delivery run status (delivery agent and admin)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const deliveryRun = await DeliveryRun.findById(req.params.id);
    
    if (!deliveryRun) {
      return res.status(404).json({
        success: false,
        error: { message: 'Delivery run not found', code: 'RUN_NOT_FOUND' }
      });
    }
    
    // Check if user has access to this run
    if (req.user.role === 'delivery_agent' && deliveryRun.deliveryAgentId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied', code: 'ACCESS_DENIED' }
      });
    }
    
    // Update status
    deliveryRun.status = status;
    
    // Set actual start time when starting the run
    if (status === 'collecting_items' && !deliveryRun.actualStartTime) {
      deliveryRun.actualStartTime = new Date();
    }
    
    // Set actual completion time when completing the run
    if (status === 'completed' && !deliveryRun.actualCompletionTime) {
      deliveryRun.actualCompletionTime = new Date();
      
      // Update all orders in this run to delivered status
      await Order.updateMany(
        { _id: { $in: deliveryRun.orders } },
        { orderStatus: 'delivered' }
      );
    }
    
    await deliveryRun.save();
    
    res.json({
      success: true,
      data: {
        message: 'Delivery run status updated successfully',
        deliveryRun
      }
    });
  } catch (error) {
    console.error('Error updating delivery run status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update delivery run status', code: 'UPDATE_ERROR' }
    });
  }
});

// Update route stop status (delivery agent and admin)
router.put('/:id/stops/:stopIndex', auth, async (req, res) => {
  try {
    const { stopIndex } = req.params;
    const { status, notes } = req.body;
    
    const deliveryRun = await DeliveryRun.findById(req.params.id);
    if (!deliveryRun) {
      return res.status(404).json({
        success: false,
        error: { message: 'Delivery run not found', code: 'RUN_NOT_FOUND' }
      });
    }
    
    // Check if user has access to this run
    if (req.user.role === 'delivery_agent' && deliveryRun.deliveryAgentId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied', code: 'ACCESS_DENIED' }
      });
    }
    
    // Update stop status
    const stopIdx = parseInt(stopIndex);
    if (stopIdx < 0 || stopIdx >= deliveryRun.routePlan.length) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid stop index', code: 'INVALID_STOP' }
      });
    }
    
    deliveryRun.routePlan[stopIdx].status = status;
    deliveryRun.routePlan[stopIdx].actualTime = new Date();
    if (notes) {
      deliveryRun.routePlan[stopIdx].notes = notes;
    }
    
    await deliveryRun.save();
    
    res.json({
      success: true,
      data: {
        message: 'Stop status updated successfully',
        deliveryRun
      }
    });
  } catch (error) {
    console.error('Error updating stop status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update stop status', code: 'UPDATE_ERROR' }
    });
  }
});

// Cancel delivery run (admin only)
router.put('/:id/cancel', auth, role('admin'), async (req, res) => {
  try {
    const deliveryRun = await DeliveryRun.findById(req.params.id);
    if (!deliveryRun) {
      return res.status(404).json({
        success: false,
        error: { message: 'Delivery run not found', code: 'RUN_NOT_FOUND' }
      });
    }
    
    if (deliveryRun.status === 'completed' || deliveryRun.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot cancel completed or already cancelled run', code: 'INVALID_STATUS' }
      });
    }
    
    deliveryRun.status = 'cancelled';
    await deliveryRun.save();
    
    // Update orders back to processing status
    await Order.updateMany(
      { _id: { $in: deliveryRun.orders } },
      { 
        deliveryRunId: null,
        orderStatus: 'processing'
      }
    );
    
    res.json({
      success: true,
      data: {
        message: 'Delivery run cancelled successfully',
        deliveryRun
      }
    });
  } catch (error) {
    console.error('Error cancelling delivery run:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to cancel delivery run', code: 'CANCEL_ERROR' }
    });
  }
});

// Get delivery runs for a specific date range
router.get('/date-range/:startDate/:endDate', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const filter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    // Filter by delivery agent if user is a delivery agent
    if (req.user.role === 'delivery_agent') {
      filter.deliveryAgentId = req.user.id;
    }
    
    const deliveryRuns = await DeliveryRun.find(filter)
      .populate('deliveryAgentId', 'firstName lastName')
      .populate('assignedHubId', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: deliveryRuns
    });
  } catch (error) {
    console.error('Error fetching delivery runs by date range:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch delivery runs', code: 'FETCH_ERROR' }
    });
  }
});

module.exports = router; 