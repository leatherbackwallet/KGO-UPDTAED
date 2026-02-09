/**
 * Categories Routes - JSON-based categories for public requests
 * Routes admin requests to MongoDB, public requests to JSON files
 */

import express, { Request, Response } from 'express';
import { Category } from '../models/categories.model';
import { Product } from '../models/products.model';
import { ensureDatabaseConnection } from '../middleware/database';
import { cacheConfigs, invalidateCache, clearCache } from '../middleware/cache';
import { deduplicateRequests } from '../middleware/requestBatching';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { validate } from '../middleware/validation';
import { z } from 'zod';
import { jsonDataService } from '../services/jsonDataService';

const router = express.Router();

// Validation schemas (for admin requests)
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  description: z.string().optional(),
  parentCategory: z.string().optional(),
  sortOrder: z.number().optional().default(0)
});

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long').optional(),
  description: z.string().optional(),
  parentCategory: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional()
});

const assignProductsSchema = z.object({
  productIds: z.array(z.string()).min(1, 'At least one product must be selected')
});

// GET /api/categories - Route to JSON for public, MongoDB for admin
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { admin } = req.query;
    const authHeader = req.headers.authorization;
    
    // Check if this is an admin request (either admin=true param or has auth header)
    if (admin === 'true' || authHeader) {
      // ADMIN REQUEST → Use MongoDB (existing functionality)
      console.log('🔧 Admin categories request - using MongoDB');
      return await handleAdminCategoriesRequest(req, res);
    } else {
      // PUBLIC REQUEST → Use JSON files (no MongoDB dependency)
      console.log('📄 Public categories request - using JSON files');
      return await handlePublicCategoriesRequest(req, res);
    }
  } catch (error) {
    console.error('❌ Error in categories route:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        message: 'Failed to fetch categories',
        code: 'CATEGORIES_FETCH_ERROR'
      }
    });
  }
});

/**
 * Handle public categories requests using JSON files (navbar, items page)
 * NO MongoDB dependency
 */
async function handlePublicCategoriesRequest(req: Request, res: Response): Promise<void> {
  const { includeInactive = false } = req.query;
  
  try {
    const categories = await jsonDataService.getCategories({
      includeInactive: includeInactive === 'true'
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('❌ Error fetching categories from JSON:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch categories',
        code: 'JSON_CATEGORIES_ERROR'
      }
    });
  }
}

/**
 * Handle admin categories requests using MongoDB (admin panel)
 * Preserves existing MongoDB functionality
 */
async function handleAdminCategoriesRequest(req: Request, res: Response): Promise<void> {
  // Apply middleware for admin requests (skip caching for fresh data)
  await new Promise<void>((resolve, reject) => {
    deduplicateRequests()(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  // Skip caching for admin requests to ensure fresh database data
  // await new Promise<void>((resolve, reject) => {
  //   cacheConfigs.categories(req, res, (err) => {
  //     if (err) reject(err);
  //     else resolve();
  //   });
  // });
  
  await new Promise<void>((resolve, reject) => {
    ensureDatabaseConnection(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    const { includeInactive = false } = req.query;
    const filter = includeInactive === 'true' ? { isDeleted: false } : { isActive: true, isDeleted: false };
    
    console.log('🔍 Fetching categories with filter:', filter);
    const categories = await Category.find(filter)
      .populate('parentCategory', 'name slug')
      .sort('sortOrder');
    
    console.log('📋 Found categories:', categories.length, 'categories');
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('❌ Error fetching categories from MongoDB:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch categories',
        code: 'MONGODB_CATEGORIES_ERROR'
      }
    });
  }
}

// GET /api/categories/:id - Route to JSON for public, MongoDB for admin
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { admin } = req.query;
    
    if (admin === 'true') {
      // ADMIN REQUEST → Use MongoDB
      console.log('🔧 Admin single category request - using MongoDB');
      return await handleAdminSingleCategoryRequest(req, res);
    } else {
      // PUBLIC REQUEST → Use JSON files
      console.log('📄 Public single category request - using JSON files');
      return await handlePublicSingleCategoryRequest(req, res);
    }
  } catch (error) {
    console.error('❌ Error in single category route:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        message: 'Failed to fetch category',
        code: 'CATEGORY_FETCH_ERROR'
      }
    });
  }
});

/**
 * Handle public single category requests using JSON files
 */
async function handlePublicSingleCategoryRequest(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : (req.params.id?.[0] ?? '');
    const category = await jsonDataService.getCategoryById(id);

    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('❌ Error fetching category from JSON:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch category',
        code: 'JSON_CATEGORY_ERROR'
      }
    });
  }
}

/**
 * Handle admin single category requests using MongoDB
 */
async function handleAdminSingleCategoryRequest(req: Request, res: Response): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    ensureDatabaseConnection(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name slug');

    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('❌ Error fetching category from MongoDB:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch category' });
  }
}

// All other routes (POST, PUT, DELETE) remain admin-only and use MongoDB
// These are preserved exactly as they were for admin functionality

// POST /api/categories - Create new category (admin only)
router.post('/', auth, requireRole('admin'), validate(createCategorySchema), ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, parentCategory, sortOrder } = req.body;
    
    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isDeleted: false 
    });
    
    if (existingCategory) {
      res.status(400).json({ 
        success: false, 
        error: 'Category with this name already exists' 
      });
      return;
    }

    // Validate parent category if provided
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent || parent.isDeleted) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid parent category' 
        });
        return;
      }
    }

    const category = new Category({
      name,
      description,
      parentCategory: parentCategory || undefined,
      sortOrder: sortOrder || 0,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    });

    await category.save();
    console.log('✅ Category saved successfully:', category);
    
    // Invalidate cache for all users and query parameters
    await invalidateCache('/api/categories');
    await invalidateCache('categories');
    console.log('✅ Categories cache invalidated after creation');

    res.status(201).json({ 
      success: true, 
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id - Update category (admin only)
router.put('/:id', auth, requireRole('admin'), validate(updateCategorySchema), ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, parentCategory, sortOrder, isActive } = req.body;
    
    // Check if another category with same name exists
    if (name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id },
        isDeleted: false 
      });
      
      if (existingCategory) {
        res.status(400).json({ 
          success: false, 
          error: 'Category with this name already exists' 
        });
        return;
      }
    }

    // Validate parent category if provided
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent || parent.isDeleted) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid parent category' 
        });
        return;
      }
      
      // Prevent circular references
      if (parentCategory === req.params.id) {
        res.status(400).json({ 
          success: false, 
          error: 'Category cannot be its own parent' 
        });
        return;
      }
    }

    const updateData: any = {};
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) updateData.description = description;
    if (parentCategory !== undefined) updateData.parentCategory = parentCategory || null;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parentCategory', 'name slug');

    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    // Invalidate cache for all users and query parameters
    await invalidateCache('/api/categories');
    await invalidateCache('categories');
    console.log('Categories cache invalidated after update');

    res.json({ 
      success: true, 
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id - Delete category (admin only)
router.delete('/:id', auth, requireRole('admin'), ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if category has subcategories
    const subcategories = await Category.find({ 
      parentCategory: req.params.id,
      isDeleted: false 
    });
    
    if (subcategories.length > 0) {
      res.status(400).json({ 
        success: false, 
        error: 'Cannot delete category with subcategories. Please delete or reassign subcategories first.' 
      });
      return;
    }

    // Check if category has products
    const productsCount = await Product.countDocuments({ 
      categories: req.params.id,
      isDeleted: false 
    });
    
    if (productsCount > 0) {
      res.status(400).json({ 
        success: false, 
        error: `Cannot delete category with ${productsCount} products. Please reassign products first.` 
      });
      return;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, isActive: false },
      { new: true }
    );

    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    // Invalidate cache for all users and query parameters
    await invalidateCache('/api/categories');
    await invalidateCache('categories');
    console.log('Categories cache invalidated after deletion');

    res.json({ 
      success: true, 
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
});

export default router;
