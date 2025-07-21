/**
 * Orders Routes - Order management for customers and admins
 * Supports guest checkout and order tracking
 */

import express from 'express';
import { Order, Product } from '../models/index';
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const router = express.Router();

// Create order (customer)
router.post('/', auth, async (req: any, res) => {
  try {
    const { products, deliveryAddress, shippingAddress, paymentMethod } = req.body;
    
    // Use deliveryAddress if provided, otherwise use shippingAddress
    const address = deliveryAddress || shippingAddress;
    
    // Calculate total and prepare order items
    let totalPrice = 0;
    const orderItems = [];
    
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ 
          success: false, 
          error: { message: 'Product not found', code: 'PRODUCT_NOT_FOUND' } 
        });
      }
      const itemPrice = product.price * item.quantity;
      totalPrice += itemPrice;
      
      orderItems.push({
        productId: item.product,
        quantity: item.quantity,
        price: product.price
      });
    }
    
    // Prepare shipping details
    const shippingDetails = {
      recipientName: address.name || `${req.user.firstName} ${req.user.lastName}`,
      recipientPhone: address.phone || req.user.phone,
      address: {
        streetName: address.street,
        houseNumber: address.houseNumber,
        postalCode: address.zipCode,
        city: address.city,
        countryCode: address.country || 'IN'
      }
    };
    
    // Create order
    const order = await Order.create({
      userId: req.user.id,
      requestedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      shippingDetails,
      orderItems,
      totalPrice,
      orderStatus: 'pending'
    });
    
    return res.status(201).json({
      success: true,
      data: {
        message: 'Order created successfully',
        order: {
          id: order._id,
          orderId: order.orderId,
          totalPrice: order.totalPrice,
          orderStatus: order.orderStatus
        }
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    return res.status(500).json({ 
      success: false, 
      error: { message: 'Server error', code: 'SERVER_ERROR' } 
    });
  }
});

// Get all orders (admin)
router.get('/', auth, role('admin'), async (req: any, res) => {
  try {
    const orders = await Order.find({ isDeleted: false })
      .populate('userId', 'firstName lastName email phone')
      .populate('orderItems.productId', 'name price images')
      .sort({ createdAt: -1 });
    return res.json(orders || []);
  } catch (err) {
    console.error('Error fetching orders:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get my orders (customer)
router.get('/my', auth, async (req: any, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id, isDeleted: false })
      .populate('orderItems.productId', 'name price images')
      .sort({ createdAt: -1 });
    return res.json(orders || []);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update order status (admin)
router.put('/:id/status', auth, role('admin'), async (req: any, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus: status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json(order);
  } catch (err) {
    console.error('Error updating order status:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete order (admin)
router.delete('/:id', auth, role('admin'), async (req: any, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json({ message: 'Order deleted' });
  } catch (err) {
    console.error('Error deleting order:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router; 