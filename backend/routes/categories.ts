import express from 'express';
import { Category } from '../models/categories.model';
import { ensureDatabaseConnection } from '../middleware/database';
const { cacheConfigs } = require('../middleware/cache');
const { deduplicateRequests } = require('../middleware/requestBatching');

const router = express.Router();

// GET /api/categories - Get all categories with caching and deduplication
router.get('/', 
  deduplicateRequests(),
  cacheConfigs.categories,
  ensureDatabaseConnection, 
  async (req, res) => {
    try {
      const categories = await Category.find({ isActive: true }).sort('sortOrder');
      res.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ 
        success: false, 
        error: { message: 'Failed to fetch categories', code: 'FETCH_ERROR' } 
      });
    }
  }
);

export default router;
