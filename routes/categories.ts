import express from 'express';
import { Category } from '../models/categories.model';
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

// GET /api/categories - Get all categories with caching and deduplication
router.get('/', 
  deduplicateRequests(),
  cacheConfigs.categories,
  ensureDatabaseConnection, 
  async (req, res) => {
    try {
      const { includeInactive = false } = req.query;
      const filter = includeInactive === 'true' ? { isDeleted: false } : { isActive: true, isDeleted: false };
      
      const categories = await Category.find(filter)
        .populate('parentCategory', 'name slug')
        .sort('sortOrder');
      
      return res.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ 
        success: false, 
        error: { message: 'Failed to fetch categories', code: 'FETCH_ERROR' } 
      });
    }
  }
);

// GET /api/categories/:id - Get single category
router.get('/:id', 
  ensureDatabaseConnection,
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id)
        .populate('parentCategory', 'name slug');
      
      if (!category || category.isDeleted) {
        return return res.status(404).json({
          success: false,
          error: { message: 'Category not found', code: 'CATEGORY_NOT_FOUND' }
        });
      }

      return res.json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch category', code: 'FETCH_ERROR' }
      });
    }
  }
);

// POST /api/categories - Create new category
router.post('/',
  auth,
  requireRole('admin'),
  ensureDatabaseConnection,
  validate(createCategorySchema),
  async (req, res) => {
    try {
      const { name, description, parentCategory, sortOrder } = req.body;

      // Check if parent category exists
      if (parentCategory) {
        const parent = await Category.findById(parentCategory);
        if (!parent || parent.isDeleted) {
          return res.status(400).json({
            success: false,
            error: { message: 'Parent category not found', code: 'PARENT_NOT_FOUND' }
          });
        }
      }

      // Generate slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug already exists
      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        return return res.status(400).json({
          success: false,
          error: { message: 'Category with this name already exists', code: 'DUPLICATE_CATEGORY' }
        });
      }

      const category = new Category({
        name,
        description,
        parentCategory: parentCategory || undefined,
        sortOrder: sortOrder || 0
      });

      await category.save();

      return res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully'
      });
    } catch (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to create category', code: 'CREATE_ERROR' }
      });
    }
  }
);

// PUT /api/categories/:id - Update category
router.put('/:id',
  auth,
  requireRole('admin'),
  ensureDatabaseConnection,
  validate(updateCategorySchema),
  async (req, res) => {
    try {
      const { name, description, parentCategory, sortOrder, isActive } = req.body;
      
      const category = await Category.findById(req.params.id);
      if (!category || category.isDeleted) {
        return return res.status(404).json({
          success: false,
          error: { message: 'Category not found', code: 'CATEGORY_NOT_FOUND' }
        });
      }

      // Check if parent category exists
      if (parentCategory) {
        const parent = await Category.findById(parentCategory);
        if (!parent || parent.isDeleted) {
          return res.status(400).json({
            success: false,
            error: { message: 'Parent category not found', code: 'PARENT_NOT_FOUND' }
          });
        }
      }

      // Update fields
      if (name !== undefined) {
        category.name = name;
        // Regenerate slug if name changed
        category.slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      if (description !== undefined) category.description = description;
      if (parentCategory !== undefined) category.parentCategory = parentCategory || undefined;
      if (sortOrder !== undefined) category.sortOrder = sortOrder;
      if (isActive !== undefined) category.isActive = isActive;

      await category.save();

      return res.json({
        success: true,
        data: category,
        message: 'Category updated successfully'
      });
    } catch (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to update category', code: 'UPDATE_ERROR' }
      });
    }
  }
);

// DELETE /api/categories/:id - Soft delete category
router.delete('/:id',
  auth,
  requireRole('admin'),
  ensureDatabaseConnection,
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category || category.isDeleted) {
        return return res.status(404).json({
          success: false,
          error: { message: 'Category not found', code: 'CATEGORY_NOT_FOUND' }
        });
      }

      // Check if category has products
      const productsInCategory = await Product.countDocuments({ 
        categories: req.params.id, 
        isDeleted: false 
      });

      if (productsInCategory > 0) {
        return return res.status(400).json({
          success: false,
          error: { 
            message: `Cannot delete category. ${productsInCategory} products are assigned to this category.`, 
            code: 'CATEGORY_HAS_PRODUCTS' 
          }
        });
      }

      // Check if category has subcategories
      const subcategories = await Category.countDocuments({ 
        parentCategory: req.params.id, 
        isDeleted: false 
      });

      if (subcategories > 0) {
        return return res.status(400).json({
          success: false,
          error: { 
            message: `Cannot delete category. ${subcategories} subcategories exist.`, 
            code: 'CATEGORY_HAS_SUBCATEGORIES' 
          }
        });
      }

      // Soft delete
      category.isDeleted = true;
      category.isActive = false;
      await category.save();

      return res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to delete category', code: 'DELETE_ERROR' }
      });
    }
  }
);

// PUT /api/categories/:id/products - Assign products to category
router.put('/:id/products',
  auth,
  requireRole('admin'),
  ensureDatabaseConnection,
  validate(assignProductsSchema),
  async (req, res) => {
    try {
      const { productIds } = req.body;
      
      const category = await Category.findById(req.params.id);
      if (!category || category.isDeleted) {
        return return res.status(404).json({
          success: false,
          error: { message: 'Category not found', code: 'CATEGORY_NOT_FOUND' }
        });
      }

      // Verify all products exist
      const products = await Product.find({ 
        _id: { $in: productIds }, 
        isDeleted: false 
      });

      if (products.length !== productIds.length) {
        return return res.status(400).json({
          success: false,
          error: { message: 'One or more products not found', code: 'PRODUCTS_NOT_FOUND' }
        });
      }

      // Add category to all products
      await Product.updateMany(
        { _id: { $in: productIds } },
        { $addToSet: { categories: req.params.id } }
      );

      return res.json({
        success: true,
        message: `${products.length} products assigned to category successfully`
      });
    } catch (error) {
      console.error('Error assigning products to category:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to assign products to category', code: 'ASSIGN_ERROR' }
      });
    }
  }
);

// GET /api/categories/:id/products - Get products in category
router.get('/:id/products',
  ensureDatabaseConnection,
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category || category.isDeleted) {
        return return res.status(404).json({
          success: false,
          error: { message: 'Category not found', code: 'CATEGORY_NOT_FOUND' }
        });
      }

      const products = await Product.find({ 
        categories: req.params.id, 
        isDeleted: false 
      }).select('name description price images defaultImage isFeatured');

      return res.json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      console.error('Error fetching category products:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch category products', code: 'FETCH_ERROR' }
      });
    }
  }
);

export default router;
