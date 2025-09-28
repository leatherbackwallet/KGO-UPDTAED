"use strict";
/**
 * Categories Routes - JSON-based categories for public requests
 * Routes admin requests to MongoDB, public requests to JSON files
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const categories_model_1 = require("../models/categories.model");
const products_model_1 = require("../models/products.model");
const database_1 = require("../middleware/database");
const cache_1 = require("../middleware/cache");
const requestBatching_1 = require("../middleware/requestBatching");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const validation_1 = require("../middleware/validation");
const zod_1 = require("zod");
const jsonDataService_1 = require("../services/jsonDataService");
const router = express_1.default.Router();
// Validation schemas (for admin requests)
const createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
    description: zod_1.z.string().optional(),
    parentCategory: zod_1.z.string().optional(),
    sortOrder: zod_1.z.number().optional().default(0)
});
const updateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Category name is required').max(100, 'Category name too long').optional(),
    description: zod_1.z.string().optional(),
    parentCategory: zod_1.z.string().optional(),
    sortOrder: zod_1.z.number().optional(),
    isActive: zod_1.z.boolean().optional()
});
const assignProductsSchema = zod_1.z.object({
    productIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one product must be selected')
});
// GET /api/categories - Route to JSON for public, MongoDB for admin
router.get('/', async (req, res) => {
    try {
        const { admin } = req.query;
        if (admin === 'true') {
            // ADMIN REQUEST → Use MongoDB (existing functionality)
            console.log('🔧 Admin categories request - using MongoDB');
            return await handleAdminCategoriesRequest(req, res);
        }
        else {
            // PUBLIC REQUEST → Use JSON files (no MongoDB dependency)
            console.log('📄 Public categories request - using JSON files');
            return await handlePublicCategoriesRequest(req, res);
        }
    }
    catch (error) {
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
async function handlePublicCategoriesRequest(req, res) {
    const { includeInactive = false } = req.query;
    try {
        const categories = await jsonDataService_1.jsonDataService.getCategories({
            includeInactive: includeInactive === 'true'
        });
        res.json({
            success: true,
            data: categories
        });
    }
    catch (error) {
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
async function handleAdminCategoriesRequest(req, res) {
    // Apply middleware for admin requests
    await new Promise((resolve, reject) => {
        (0, requestBatching_1.deduplicateRequests)()(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    await new Promise((resolve, reject) => {
        cache_1.cacheConfigs.categories(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    await new Promise((resolve, reject) => {
        (0, database_1.ensureDatabaseConnection)(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    try {
        const { includeInactive = false } = req.query;
        const filter = includeInactive === 'true' ? { isDeleted: false } : { isActive: true, isDeleted: false };
        const categories = await categories_model_1.Category.find(filter)
            .populate('parentCategory', 'name slug')
            .sort('sortOrder');
        res.json({
            success: true,
            data: categories
        });
    }
    catch (error) {
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
router.get('/:id', async (req, res) => {
    try {
        const { admin } = req.query;
        if (admin === 'true') {
            // ADMIN REQUEST → Use MongoDB
            console.log('🔧 Admin single category request - using MongoDB');
            return await handleAdminSingleCategoryRequest(req, res);
        }
        else {
            // PUBLIC REQUEST → Use JSON files
            console.log('📄 Public single category request - using JSON files');
            return await handlePublicSingleCategoryRequest(req, res);
        }
    }
    catch (error) {
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
async function handlePublicSingleCategoryRequest(req, res) {
    try {
        const category = await jsonDataService_1.jsonDataService.getCategoryById(req.params.id);
        if (!category) {
            res.status(404).json({ success: false, error: 'Category not found' });
            return;
        }
        res.json({ success: true, data: category });
    }
    catch (error) {
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
async function handleAdminSingleCategoryRequest(req, res) {
    await new Promise((resolve, reject) => {
        (0, database_1.ensureDatabaseConnection)(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    try {
        const category = await categories_model_1.Category.findById(req.params.id)
            .populate('parentCategory', 'name slug');
        if (!category) {
            res.status(404).json({ success: false, error: 'Category not found' });
            return;
        }
        res.json({ success: true, data: category });
    }
    catch (error) {
        console.error('❌ Error fetching category from MongoDB:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch category' });
    }
}
// All other routes (POST, PUT, DELETE) remain admin-only and use MongoDB
// These are preserved exactly as they were for admin functionality
// POST /api/categories - Create new category (admin only)
router.post('/', auth_1.auth, (0, role_1.requireRole)('admin'), (0, validation_1.validate)(createCategorySchema), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const { name, description, parentCategory, sortOrder } = req.body;
        // Check if category with same name already exists
        const existingCategory = await categories_model_1.Category.findOne({
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
            const parent = await categories_model_1.Category.findById(parentCategory);
            if (!parent || parent.isDeleted) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid parent category'
                });
                return;
            }
        }
        const category = new categories_model_1.Category({
            name,
            description,
            parentCategory: parentCategory || undefined,
            sortOrder: sortOrder || 0,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        });
        await category.save();
        // Invalidate cache
        await (0, cache_1.invalidateCache)('categories');
        res.status(201).json({
            success: true,
            data: category,
            message: 'Category created successfully'
        });
    }
    catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ success: false, error: 'Failed to create category' });
    }
});
// PUT /api/categories/:id - Update category (admin only)
router.put('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), (0, validation_1.validate)(updateCategorySchema), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const { name, description, parentCategory, sortOrder, isActive } = req.body;
        // Check if another category with same name exists
        if (name) {
            const existingCategory = await categories_model_1.Category.findOne({
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
            const parent = await categories_model_1.Category.findById(parentCategory);
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
        const updateData = {};
        if (name) {
            updateData.name = name;
            updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        if (description !== undefined)
            updateData.description = description;
        if (parentCategory !== undefined)
            updateData.parentCategory = parentCategory || null;
        if (sortOrder !== undefined)
            updateData.sortOrder = sortOrder;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        const category = await categories_model_1.Category.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).populate('parentCategory', 'name slug');
        if (!category) {
            res.status(404).json({ success: false, error: 'Category not found' });
            return;
        }
        // Invalidate cache
        await (0, cache_1.invalidateCache)('categories');
        res.json({
            success: true,
            data: category,
            message: 'Category updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ success: false, error: 'Failed to update category' });
    }
});
// DELETE /api/categories/:id - Delete category (admin only)
router.delete('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        // Check if category has subcategories
        const subcategories = await categories_model_1.Category.find({
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
        const productsCount = await products_model_1.Product.countDocuments({
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
        const category = await categories_model_1.Category.findByIdAndUpdate(req.params.id, { isDeleted: true, isActive: false }, { new: true });
        if (!category) {
            res.status(404).json({ success: false, error: 'Category not found' });
            return;
        }
        // Invalidate cache
        await (0, cache_1.invalidateCache)('categories');
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, error: 'Failed to delete category' });
    }
});
exports.default = router;
