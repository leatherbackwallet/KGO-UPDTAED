import express from 'express';
import { Category } from '../models/categories.model';
import { ensureDatabaseConnection } from '../middleware/database';

const router = express.Router();

// GET /api/categories - Get all categories
router.get('/', ensureDatabaseConnection, async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('sortOrder');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch categories', code: 'FETCH_ERROR' } });
  }
});

export default router;
