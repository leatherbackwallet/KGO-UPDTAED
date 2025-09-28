/**
 * Occasions Routes - JSON-based occasions for public requests
 * Routes admin requests to MongoDB, public requests to JSON files
 */

import express, { Request, Response } from 'express';
import { Occasion } from '../models/occasions.model';
import { Product } from '../models/products.model';
import { ensureDatabaseConnection } from '../middleware/database';
import { cacheConfigs } from '../middleware/cache';
import { deduplicateRequests } from '../middleware/requestBatching';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { validate } from '../middleware/validation';
import { z } from 'zod';
import { jsonDataService } from '../services/jsonDataService';

const router = express.Router();

// Validation schemas (for admin requests)
const createOccasionSchema = z.object({
  name: z.string().min(1, 'Occasion name is required').max(100, 'Occasion name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  icon: z.string().max(50, 'Icon name too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format').optional(),
  dateRange: z.object({
    startMonth: z.number().min(1).max(12),
    startDay: z.number().min(1).max(31),
    endMonth: z.number().min(1).max(12),
    endDay: z.number().min(1).max(31),
    isRecurring: z.boolean().default(true),
    specificYear: z.number().min(2020).max(2030).optional()
  }),
  priority: z.object({
    level: z.enum(['low', 'medium', 'high', 'peak']).default('medium'),
    boostMultiplier: z.number().min(1.0).max(3.0).default(1.5)
  }),
  seasonalFlags: z.object({
    isFestival: z.boolean().default(false),
    isHoliday: z.boolean().default(false),
    isPersonal: z.boolean().default(false),
    isSeasonal: z.boolean().default(false)
  }),
  sortOrder: z.number().default(0)
});

const updateOccasionSchema = z.object({
  name: z.string().min(1, 'Occasion name is required').max(100, 'Occasion name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  icon: z.string().max(50, 'Icon name too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format').optional(),
  dateRange: z.object({
    startMonth: z.number().min(1).max(12).optional(),
    startDay: z.number().min(1).max(31).optional(),
    endMonth: z.number().min(1).max(12).optional(),
    endDay: z.number().min(1).max(31).optional(),
    isRecurring: z.boolean().optional(),
    specificYear: z.number().min(2020).max(2030).optional()
  }).optional(),
  priority: z.object({
    level: z.enum(['low', 'medium', 'high', 'peak']).optional(),
    boostMultiplier: z.number().min(1.0).max(3.0).optional()
  }).optional(),
  seasonalFlags: z.object({
    isFestival: z.boolean().optional(),
    isHoliday: z.boolean().optional(),
    isPersonal: z.boolean().optional(),
    isSeasonal: z.boolean().optional()
  }).optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional()
});

// GET /api/occasions - Route to JSON for public, MongoDB for admin
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { admin } = req.query;
    
    if (admin === 'true') {
      // ADMIN REQUEST → Use MongoDB (existing functionality)
      console.log('🔧 Admin occasions request - using MongoDB');
      return await handleAdminOccasionsRequest(req, res);
    } else {
      // PUBLIC REQUEST → Use JSON files (no MongoDB dependency)
      console.log('📄 Public occasions request - using JSON files');
      return await handlePublicOccasionsRequest(req, res);
    }
  } catch (error) {
    console.error('❌ Error in occasions route:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        message: 'Failed to fetch occasions',
        code: 'OCCASIONS_FETCH_ERROR'
      }
    });
  }
});

/**
 * Handle public occasions requests using JSON files (items page filtering)
 * NO MongoDB dependency
 */
async function handlePublicOccasionsRequest(req: Request, res: Response): Promise<void> {
  const { includeInactive = false } = req.query;
  
  try {
    const occasions = await jsonDataService.getOccasions({
      includeInactive: includeInactive === 'true'
    });

    res.json({
      success: true,
      data: occasions
    });
  } catch (error) {
    console.error('❌ Error fetching occasions from JSON:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch occasions',
        code: 'JSON_OCCASIONS_ERROR'
      }
    });
  }
}

/**
 * Handle admin occasions requests using MongoDB (admin panel)
 * Preserves existing MongoDB functionality
 */
async function handleAdminOccasionsRequest(req: Request, res: Response): Promise<void> {
  // Apply middleware for admin requests
  await new Promise<void>((resolve, reject) => {
    deduplicateRequests()(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  await new Promise<void>((resolve, reject) => {
    cacheConfigs.occasions(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  await new Promise<void>((resolve, reject) => {
    ensureDatabaseConnection(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    const { includeInactive = false } = req.query;
    const filter = includeInactive === 'true' ? { isDeleted: false } : { isActive: true, isDeleted: false };
    
    const occasions = await Occasion.find(filter).sort('sortOrder');
    
    res.json({
      success: true,
      data: occasions
    });
  } catch (error) {
    console.error('❌ Error fetching occasions from MongoDB:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch occasions',
        code: 'MONGODB_OCCASIONS_ERROR'
      }
    });
  }
}

// GET /api/occasions/:id - Route to JSON for public, MongoDB for admin
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { admin } = req.query;
    
    if (admin === 'true') {
      // ADMIN REQUEST → Use MongoDB
      console.log('🔧 Admin single occasion request - using MongoDB');
      return await handleAdminSingleOccasionRequest(req, res);
    } else {
      // PUBLIC REQUEST → Use JSON files
      console.log('📄 Public single occasion request - using JSON files');
      return await handlePublicSingleOccasionRequest(req, res);
    }
  } catch (error) {
    console.error('❌ Error in single occasion route:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        message: 'Failed to fetch occasion',
        code: 'OCCASION_FETCH_ERROR'
      }
    });
  }
});

/**
 * Handle public single occasion requests using JSON files
 */
async function handlePublicSingleOccasionRequest(req: Request, res: Response): Promise<void> {
  try {
    const occasion = await jsonDataService.getOccasionById(req.params.id);

    if (!occasion) {
      res.status(404).json({ success: false, error: 'Occasion not found' });
      return;
    }

    res.json({ success: true, data: occasion });
  } catch (error) {
    console.error('❌ Error fetching occasion from JSON:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch occasion',
        code: 'JSON_OCCASION_ERROR'
      }
    });
  }
}

/**
 * Handle admin single occasion requests using MongoDB
 */
async function handleAdminSingleOccasionRequest(req: Request, res: Response): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    ensureDatabaseConnection(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    const occasion = await Occasion.findById(req.params.id);

    if (!occasion) {
      res.status(404).json({ success: false, error: 'Occasion not found' });
      return;
    }

    res.json({ success: true, data: occasion });
  } catch (error) {
    console.error('❌ Error fetching occasion from MongoDB:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch occasion' });
  }
}

// All other routes (POST, PUT, DELETE) remain admin-only and use MongoDB
// These are preserved exactly as they were for admin functionality

// POST /api/occasions - Create new occasion (admin only)
router.post('/', auth, requireRole('admin'), validate(createOccasionSchema), ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
  try {
    const occasionData = req.body;
    
    // Check if occasion with same name already exists
    const existingOccasion = await Occasion.findOne({ 
      name: { $regex: new RegExp(`^${occasionData.name}$`, 'i') },
      isDeleted: false 
    });
    
    if (existingOccasion) {
      res.status(400).json({ 
        success: false, 
        error: 'Occasion with this name already exists' 
      });
      return;
    }

    // Generate slug from name
    const slug = occasionData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const occasion = new Occasion({
      ...occasionData,
      slug
    });

    await occasion.save();

    res.status(201).json({ 
      success: true, 
      data: occasion,
      message: 'Occasion created successfully'
    });
  } catch (error) {
    console.error('Error creating occasion:', error);
    res.status(500).json({ success: false, error: 'Failed to create occasion' });
  }
});

// PUT /api/occasions/:id - Update occasion (admin only)
router.put('/:id', auth, requireRole('admin'), validate(updateOccasionSchema), ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData = req.body;
    
    // Check if another occasion with same name exists
    if (updateData.name) {
      const existingOccasion = await Occasion.findOne({ 
        name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
        _id: { $ne: req.params.id },
        isDeleted: false 
      });
      
      if (existingOccasion) {
        res.status(400).json({ 
          success: false, 
          error: 'Occasion with this name already exists' 
        });
        return;
      }
      
      // Update slug if name is changed
      updateData.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const occasion = await Occasion.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!occasion) {
      res.status(404).json({ success: false, error: 'Occasion not found' });
      return;
    }

    res.json({ 
      success: true, 
      data: occasion,
      message: 'Occasion updated successfully'
    });
  } catch (error) {
    console.error('Error updating occasion:', error);
    res.status(500).json({ success: false, error: 'Failed to update occasion' });
  }
});

// DELETE /api/occasions/:id - Delete occasion (admin only)
router.delete('/:id', auth, requireRole('admin'), ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if occasion has products
    const productsCount = await Product.countDocuments({ 
      occasions: req.params.id,
      isDeleted: false 
    });
    
    if (productsCount > 0) {
      res.status(400).json({ 
        success: false, 
        error: `Cannot delete occasion with ${productsCount} products. Please reassign products first.` 
      });
      return;
    }

    const occasion = await Occasion.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, isActive: false },
      { new: true }
    );

    if (!occasion) {
      res.status(404).json({ success: false, error: 'Occasion not found' });
      return;
    }

    res.json({ 
      success: true, 
      message: 'Occasion deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting occasion:', error);
    res.status(500).json({ success: false, error: 'Failed to delete occasion' });
  }
});

export default router;
