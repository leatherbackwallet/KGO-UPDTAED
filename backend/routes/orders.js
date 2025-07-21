const express = require('express');
const router = express.Router();
const { Order } = require('../models/orders.model.ts');
const { Product } = require('../models/products.model.ts');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Create order (customer)
router.post('/', auth, async (req, res) => {
  try {
    const { products, deliveryAddress, shippingAddress, paymentMethod } = req.body;
    
    // Use deliveryAddress if provided, otherwise use shippingAddress
    const address = deliveryAddress || shippingAddress;
    
    // Convert address object to string if needed
    const addressString = typeof address === 'object' 
      ? `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`
      : address;
    
    // Calculate total
    let totalAmount = 0;
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ 
          success: false, 
          error: { message: 'Product not found', code: 'PRODUCT_NOT_FOUND' } 
        });
      }
      totalAmount += product.price * item.quantity;
    }
    
    // Create order
    const order = await Order.create({
      user: req.user.id,
      products,
      totalAmount,
      shippingAddress: addressString,
      paymentMethod: paymentMethod || 'cod',

      status: 'Pending',
    });
    
    res.status(201).json({
      success: true,
      data: {
        message: 'Order created successfully',
        order: {
          id: order._id,
          totalAmount: order.totalAmount,
          status: order.status,
          orderNumber: order._id.toString().slice(-8).toUpperCase()
        }
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ 
      success: false, 
      error: { message: 'Server error', code: 'SERVER_ERROR' } 
    });
  }
});

// Get all orders (admin)
router.get('/', auth, role('admin'), async (req, res) => {
  try {
    const orders = await Order.find().populate('user').populate('products.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my orders (customer)
router.get('/my', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('products.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status (admin)
router.put('/:id/status', auth, role('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order (admin or owner)
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user').populate('products.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.roleId !== 'admin' && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 