const express = require('express');
const router = express.Router();
const { Product } = require('../models/products.model');
const { Category } = require('../models/categories.model');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const mongoose = require('mongoose');
const { cacheConfigs, invalidateProductCache } = require('../middleware/cache');

// Get all products with caching
router.get('/', cacheConfigs.products, async (req, res) => {
  try {
    const { category, min, max, search, featured, occasions } = req.query;
    let filter = {};
    
    // Validate and sanitize query parameters
    if (category && typeof category !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Invalid category parameter', code: 'INVALID_CATEGORY' } 
      });
    }
    
    if (min && (isNaN(Number(min)) || Number(min) < 0)) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Invalid minimum price', code: 'INVALID_MIN_PRICE' } 
      });
    }
    
    if (max && (isNaN(Number(max)) || Number(max) < 0)) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Invalid maximum price', code: 'INVALID_MAX_PRICE' } 
      });
    }
    
    if (category) {
      // Handle category filtering - could be ObjectId or slug
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.categories = category;
      } else {
        // Try to find category by slug
        const categoryDoc = await Category.findOne({ slug: category });
        if (categoryDoc) {
          filter.categories = categoryDoc._id;
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
    
    // Handle occasions filtering
    if (occasions) {
      const occasionArray = occasions.split(',').map(o => o.trim().toUpperCase());
      filter.occasions = { $in: occasionArray };
    }
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { 'name.en': searchRegex },
        { 'name.de': searchRegex },
        { 'description.en': searchRegex },
        { 'description.de': searchRegex },
        { occasions: searchRegex }
      ];
    }
    
    const products = await Product.find(filter)
      .populate('categories', 'name slug')
      .populate('vendors', 'storeName')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(100); // Limit results for performance
    
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (err) {
    console.error('Products fetch error:', err);
    res.status(500).json({ 
      success: false,
      error: { message: 'Failed to fetch products', code: 'FETCH_ERROR' } 
    });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categories', 'name slug').populate('vendors', 'storeName');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create product (admin only)
router.post('/', auth, role('admin'), async (req, res) => {
  try {
    const { name, description, price, categories, stock, images, occasions, vendors, isFeatured, slug, defaultImage } = req.body;
    
    // Handle categories - could be array of ObjectIds or slugs
    let categoryIds = categories;
    if (categories && Array.isArray(categories)) {
      categoryIds = await Promise.all(categories.map(async (category) => {
        if (mongoose.Types.ObjectId.isValid(category)) {
          return category;
        } else {
          const categoryDoc = await Category.findOne({ slug: category });
          if (!categoryDoc) {
            throw new Error(`Category not found: ${category}`);
          }
          return categoryDoc._id;
        }
      }));
    } else if (categories && !Array.isArray(categories)) {
      // Handle single category for backward compatibility
      if (mongoose.Types.ObjectId.isValid(categories)) {
        categoryIds = [categories];
      } else {
        const categoryDoc = await Category.findOne({ slug: categories });
        if (!categoryDoc) {
          return res.status(400).json({ message: 'Category not found' });
        }
        categoryIds = [categoryDoc._id];
      }
    }
    
    const product = await Product.create({ 
      name, 
      description, 
      price, 
      categories: categoryIds, 
      stock, 
      images, 
      occasions, 
      vendors,
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
router.put('/:id', auth, role('admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product (admin only)
router.delete('/:id', auth, role('admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 