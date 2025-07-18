const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Create order (customer)
router.post('/', auth, async (req, res) => {
  try {
    const { products, shippingAddress } = req.body;
    // Calculate total
    let totalAmount = 0;
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(400).json({ message: 'Product not found' });
      totalAmount += product.price * item.quantity;
    }
    // Create order (no payment)
    const order = await Order.create({
      user: req.user.id,
      products,
      totalAmount,
      shippingAddress,
      status: 'Pending',
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all orders (admin)
router.get('/', auth, role('Admin'), async (req, res) => {
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
router.put('/:id/status', auth, role('Admin'), async (req, res) => {
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
    if (req.user.role !== 'Admin' && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 