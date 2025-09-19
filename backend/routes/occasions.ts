import express from 'express';
import { Occasion } from '../models/occasions.model';
import { Product } from '../models/products.model';
import { ensureDatabaseConnection } from '../middleware/database';
import { cacheConfigs } from '../middleware/cache';
import { deduplicateRequests } from '../middleware/requestBatching';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
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
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional()
});

// Helper function to check if current date falls within occasion date range
function isOccasionActive(occasion: any, currentDate: Date = new Date()): boolean {
  const { startMonth, startDay, endMonth, endDay, isRecurring, specificYear } = occasion.dateRange;
  
  if (!isRecurring && specificYear && currentDate.getFullYear() !== specificYear) {
    return false;
  }
  
  const currentMonth = currentDate.getMonth() + 1; // Convert to 1-12
  const currentDay = currentDate.getDate();
  
  // Create dates for comparison (using current year for recurring events)
  const year = specificYear || currentDate.getFullYear();
  const startDate = new Date(year, startMonth - 1, startDay);
  const endDate = new Date(year, endMonth - 1, endDay);
  
  // Handle year rollover (e.g., Dec 25 to Jan 5)
  if (endDate < startDate) {
    endDate.setFullYear(year + 1);
  }
  
  const current = new Date(year, currentMonth - 1, currentDay);
  
  return current >= startDate && current <= endDate;
}

// GET /api/occasions - Get all occasions with caching and deduplication
router.get('/', 
  deduplicateRequests(),
  cacheConfigs.occasions,
  ensureDatabaseConnection, 
  async (req, res) => {
    try {
      const { 
        includeInactive = false, 
        current = false, 
        upcoming = false,
        seasonal = false,
        search,
        priority,
        type
      } = req.query;
      
      let filter: any = { isDeleted: false };
      
      if (includeInactive !== 'true') {
        filter.isActive = true;
      }
      
      // Search filter
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Priority filter
      if (priority) {
        filter['priority.level'] = priority;
      }
      
      // Type filter (seasonal flags)
      if (type) {
        const typeMap: { [key: string]: string } = {
          'festival': 'seasonalFlags.isFestival',
          'holiday': 'seasonalFlags.isHoliday',
          'personal': 'seasonalFlags.isPersonal',
          'seasonal': 'seasonalFlags.isSeasonal'
        };
        
        if (typeMap[type as string]) {
          filter[typeMap[type as string]] = true;
        }
      }
      
      const occasions = await Occasion.find(filter)
        .sort({ sortOrder: 1, name: 1 });
      
      let filteredOccasions = occasions;
      
      // Apply date-based filters
      if (current === 'true') {
        filteredOccasions = occasions.filter(occasion => isOccasionActive(occasion));
      }
      
      if (upcoming === 'true') {
        const today = new Date();
        const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        filteredOccasions = occasions.filter(occasion => {
          const { startMonth, startDay, isRecurring, specificYear } = occasion.dateRange;
          const year = specificYear || today.getFullYear();
          const occasionStartDate = new Date(year, startMonth - 1, startDay);
          
          // Handle year rollover for recurring events
          if (isRecurring && occasionStartDate < today) {
            occasionStartDate.setFullYear(year + 1);
          }
          
          return occasionStartDate >= today && occasionStartDate <= next30Days;
        });
      }
      
      if (seasonal === 'true') {
        const currentMonth = new Date().getMonth() + 1;
        filteredOccasions = occasions.filter(occasion => {
          const { startMonth, endMonth } = occasion.dateRange;
          return startMonth <= currentMonth && endMonth >= currentMonth;
        });
      }
      
      res.json({
        success: true,
        data: filteredOccasions,
        count: filteredOccasions.length,
        filters: {
          current: current === 'true',
          upcoming: upcoming === 'true',
          seasonal: seasonal === 'true',
          search,
          priority,
          type
        }
      });
    } catch (error) {
      console.error('Error fetching occasions:', error);
      res.status(500).json({ 
        success: false, 
        error: { message: 'Failed to fetch occasions', code: 'FETCH_ERROR' } 
      });
    }
  }
);

// GET /api/occasions/current - Get currently active occasions
router.get('/current',
  ensureDatabaseConnection,
  async (req, res) => {
    try {
      const occasions = await Occasion.find({ 
        isActive: true, 
        isDeleted: false 
      }).sort({ 'priority.level': -1, sortOrder: 1 });
      
      const activeOccasions = occasions.filter(occasion => isOccasionActive(occasion));
      
      res.json({
        success: true,
        data: activeOccasions,
        count: activeOccasions.length
      });
    } catch (error) {
      console.error('Error fetching current occasions:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch current occasions', code: 'FETCH_ERROR' }
      });
    }
  }
);

// GET /api/occasions/upcoming - Get upcoming occasions (next 30 days)
router.get('/upcoming',
  ensureDatabaseConnection,
  async (req, res) => {
    try {
      const occasions = await Occasion.find({ 
        isActive: true, 
        isDeleted: false 
      }).sort({ 'dateRange.startMonth': 1, 'dateRange.startDay': 1 });
      
      const today = new Date();
      const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const upcomingOccasions = occasions.filter(occasion => {
        const { startMonth, startDay, isRecurring, specificYear } = occasion.dateRange;
        const year = specificYear || today.getFullYear();
        const occasionStartDate = new Date(year, startMonth - 1, startDay);
        
        // Handle year rollover for recurring events
        if (isRecurring && occasionStartDate < today) {
          occasionStartDate.setFullYear(year + 1);
        }
        
        return occasionStartDate >= today && occasionStartDate <= next30Days;
      });
      
      res.json({
        success: true,
        data: upcomingOccasions,
        count: upcomingOccasions.length
      });
    } catch (error) {
      console.error('Error fetching upcoming occasions:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch upcoming occasions', code: 'FETCH_ERROR' }
      });
    }
  }
);

// GET /api/occasions/:id - Get single occasion
router.get('/:id', 
  ensureDatabaseConnection,
  async (req, res) => {
    try {
      const occasion = await Occasion.findById(req.params.id);
      
      if (!occasion || occasion.isDeleted) {
        return res.status(404).json({
          success: false,
          error: { message: 'Occasion not found', code: 'OCCASION_NOT_FOUND' }
        });
      }

      // Add active status
      const occasionWithStatus = {
        ...occasion.toObject(),
        isCurrentlyActive: isOccasionActive(occasion)
      };

      return res.json({
        success: true,
        data: occasionWithStatus
      });
    } catch (error) {
      console.error('Error fetching occasion:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch occasion', code: 'FETCH_ERROR' }
      });
    }
  }
);

// POST /api/occasions - Create new occasion
router.post('/',
  auth,
  requireRole('admin'),
  ensureDatabaseConnection,
  validate(createOccasionSchema),
  async (req, res) => {
    try {
      console.log('Creating occasion with data:', req.body);
      const occasionData = req.body;

      // Generate slug from name
      const slug = occasionData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug already exists
      const existingOccasion = await Occasion.findOne({ slug });
      if (existingOccasion) {
        return res.status(400).json({
          success: false,
          error: { message: 'Occasion with this name already exists', code: 'DUPLICATE_OCCASION' }
        });
      }

      const occasion = new Occasion({
        ...occasionData,
        slug
      });

      await occasion.save();
      console.log('Occasion saved successfully:', occasion);

      return res.status(201).json({
        success: true,
        data: occasion,
        message: 'Occasion created successfully'
      });
    } catch (error: any) {
      console.error('Error creating occasion:', error);
      console.error('Error details:', error.message);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to create occasion', code: 'CREATE_ERROR' }
      });
    }
  }
);

// PUT /api/occasions/:id - Update occasion
router.put('/:id',
  auth,
  requireRole('admin'),
  ensureDatabaseConnection,
  validate(updateOccasionSchema),
  async (req, res) => {
    try {
      const occasion = await Occasion.findById(req.params.id);
      if (!occasion || occasion.isDeleted) {
        return res.status(404).json({
          success: false,
          error: { message: 'Occasion not found', code: 'OCCASION_NOT_FOUND' }
        });
      }

      // Update fields
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          if (key === 'dateRange' || key === 'priority' || key === 'seasonalFlags') {
            Object.assign(occasion[key], req.body[key]);
          } else {
            occasion[key] = req.body[key];
          }
        }
      });

      // Regenerate slug if name changed
      if (req.body.name && req.body.name !== occasion.name) {
        occasion.slug = req.body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      await occasion.save();

      return res.json({
        success: true,
        data: occasion,
        message: 'Occasion updated successfully'
      });
    } catch (error) {
      console.error('Error updating occasion:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to update occasion', code: 'UPDATE_ERROR' }
      });
    }
  }
);

// DELETE /api/occasions/:id - Soft delete occasion
router.delete('/:id',
  auth,
  requireRole('admin'),
  ensureDatabaseConnection,
  async (req, res) => {
    try {
      const occasion = await Occasion.findById(req.params.id);
      if (!occasion || occasion.isDeleted) {
        return res.status(404).json({
          success: false,
          error: { message: 'Occasion not found', code: 'OCCASION_NOT_FOUND' }
        });
      }

      // Check if occasion has products
      const productsWithOccasion = await Product.countDocuments({ 
        occasions: req.params.id, 
        isDeleted: false 
      });

      if (productsWithOccasion > 0) {
        return res.status(400).json({
          success: false,
          error: { 
            message: `Cannot delete occasion. ${productsWithOccasion} products are assigned to this occasion.`, 
            code: 'OCCASION_HAS_PRODUCTS' 
          }
        });
      }

      // Soft delete
      occasion.isDeleted = true;
      occasion.isActive = false;
      await occasion.save();

      return res.json({
        success: true,
        message: 'Occasion deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting occasion:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to delete occasion', code: 'DELETE_ERROR' }
      });
    }
  }
);

// GET /api/occasions/:id/products - Get products for occasion
router.get('/:id/products',
  ensureDatabaseConnection,
  async (req, res) => {
    try {
      const occasion = await Occasion.findById(req.params.id);
      if (!occasion || occasion.isDeleted) {
        return res.status(404).json({
          success: false,
          error: { message: 'Occasion not found', code: 'OCCASION_NOT_FOUND' }
        });
      }

      const products = await Product.find({ 
        occasions: req.params.id, 
        isDeleted: false 
      }).select('name description price images defaultImage isFeatured');

      return res.json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      console.error('Error fetching occasion products:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch occasion products', code: 'FETCH_ERROR' }
      });
    }
  }
);

export default router;
