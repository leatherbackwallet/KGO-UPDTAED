const express = require('express');
const router = express.Router();
const { Category } = require('../models/categories.model.ts');

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('sortOrder');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch categories', code: 'FETCH_ERROR' } });
  }
});

module.exports = router; 