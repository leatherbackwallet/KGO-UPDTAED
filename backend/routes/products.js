const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const mongoose = require('mongoose');

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category, min, max, search, featured } = req.query;
    let filter = {};
    
    if (category) {
      // Handle category filtering - could be ObjectId or slug
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = category;
      } else {
        // Try to find category by slug
        const categoryDoc = await Category.findOne({ slug: category });
        if (categoryDoc) {
          filter.category = categoryDoc._id;
        } else {
          // If category not found, return empty results
          return res.json([]);
        }
      }
    }
    
    if (featured === 'true') filter.isFeatured = true;
    
    if (min || max) filter.price = {};
    if (min) filter.price.$gte = Number(min);
    if (max) filter.price.$lte = Number(max);
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const products = await Product.find(filter).populate('category', 'name slug').sort({ isFeatured: -1, createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('Products fetch error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create product (admin only)
router.post('/', auth, role('Admin'), async (req, res) => {
  try {
    const { name, description, price, category, stock, images, tags, isFeatured, slug, defaultImage } = req.body;
    
    // Handle category - could be ObjectId or slug
    let categoryId = category;
    if (category && !mongoose.Types.ObjectId.isValid(category)) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (!categoryDoc) {
        return res.status(400).json({ message: 'Category not found' });
      }
      categoryId = categoryDoc._id;
    }
    
    const product = await Product.create({ 
      name, 
      description, 
      price, 
      category: categoryId, 
      stock, 
      images, 
      tags, 
      isFeatured,
      slug,
      defaultImage
    });
    res.status(201).json(product);
  } catch (err) {
    console.error('Product creation error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Update product (admin only)
router.put('/:id', auth, role('Admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product (admin only)
router.delete('/:id', auth, role('Admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 