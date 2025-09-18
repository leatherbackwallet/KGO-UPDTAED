"use strict";
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
const router = express_1.default.Router();
// Validation schemas
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
// GET /api/categories - Get all categories with caching and deduplication
router.get('/', (0, requestBatching_1.deduplicateRequests)(), cache_1.cacheConfigs.categories, database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const { includeInactive = false } = req.query;
        const filter = includeInactive === 'true' ? { isDeleted: false } : { isActive: true, isDeleted: false };
        const categories = await categories_model_1.Category.find(filter)
            .populate('parentCategory', 'name slug')
            .sort('sortOrder');
        res.json({
            success: true,
            data: categories,
            count: categories.length
        });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch categories', code: 'FETCH_ERROR' }
        });
    }
});
// GET /api/categories/:id - Get single category
router.get('/:id', database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const category = await categories_model_1.Category.findById(req.params.id)
            .populate('parentCategory', 'name slug');
        if (!category || category.isDeleted) {
            return res.status(404).json({
                success: false,
                error: { message: 'Category not found', code: 'CATEGORY_NOT_FOUND' }
            });
        }
        return res.json({
            success: true,
            data: category
        });
    }
    catch (error) {
        console.error('Error fetching category:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch category', code: 'FETCH_ERROR' }
        });
    }
});
// POST /api/categories - Create new category
router.post('/', auth_1.auth, 
// requireRole('admin'), // Temporarily disabled for testing
database_1.ensureDatabaseConnection, (0, validation_1.validate)(createCategorySchema), async (req, res) => {
    try {
        console.log('Creating category with data:', req.body);
        const { name, description, parentCategory, sortOrder } = req.body;
        // Check if parent category exists
        if (parentCategory) {
            const parent = await categories_model_1.Category.findById(parentCategory);
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
        const existingCategory = await categories_model_1.Category.findOne({ slug });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                error: { message: 'Category with this name already exists', code: 'DUPLICATE_CATEGORY' }
            });
        }
        const category = new categories_model_1.Category({
            name,
            description,
            parentCategory: parentCategory || undefined,
            sortOrder: sortOrder || 0
        });
        await category.save();
        console.log('Category saved successfully:', category);
        return res.status(201).json({
            success: true,
            data: category,
            message: 'Category created successfully'
        });
    }
    catch (error) {
        console.error('Error creating category:', error);
        console.error('Error details:', error.message);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to create category', code: 'CREATE_ERROR' }
        });
    }
});
// PUT /api/categories/:id - Update category
router.put('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, (0, validation_1.validate)(updateCategorySchema), async (req, res) => {
    try {
        const { name, description, parentCategory, sortOrder, isActive } = req.body;
        const category = await categories_model_1.Category.findById(req.params.id);
        if (!category || category.isDeleted) {
            return res.status(404).json({
                success: false,
                error: { message: 'Category not found', code: 'CATEGORY_NOT_FOUND' }
            });
        }
        // Check if parent category exists
        if (parentCategory) {
            const parent = await categories_model_1.Category.findById(parentCategory);
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
        if (description !== undefined)
            category.description = description;
        if (parentCategory !== undefined)
            category.parentCategory = parentCategory || undefined;
        if (sortOrder !== undefined)
            category.sortOrder = sortOrder;
        if (isActive !== undefined)
            category.isActive = isActive;
        await category.save();
        return res.json({
            success: true,
            data: category,
            message: 'Category updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating category:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to update category', code: 'UPDATE_ERROR' }
        });
    }
});
// DELETE /api/categories/:id - Soft delete category
router.delete('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const category = await categories_model_1.Category.findById(req.params.id);
        if (!category || category.isDeleted) {
            return res.status(404).json({
                success: false,
                error: { message: 'Category not found', code: 'CATEGORY_NOT_FOUND' }
            });
        }
        // Check if category has products
        const productsInCategory = await products_model_1.Product.countDocuments({
            categories: req.params.id,
            isDeleted: false
        });
        if (productsInCategory > 0) {
            return res.status(400).json({
                success: false,
                error: {
                    message: `Cannot delete category. ${productsInCategory} products are assigned to this category.`,
                    code: 'CATEGORY_HAS_PRODUCTS'
                }
            });
        }
        // Check if category has subcategories
        const subcategories = await categories_model_1.Category.countDocuments({
            parentCategory: req.params.id,
            isDeleted: false
        });
        if (subcategories > 0) {
            return res.status(400).json({
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
    }
    catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to delete category', code: 'DELETE_ERROR' }
        });
    }
});
// PUT /api/categories/:id/products - Assign products to category
router.put('/:id/products', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, (0, validation_1.validate)(assignProductsSchema), async (req, res) => {
    try {
        const { productIds } = req.body;
        const category = await categories_model_1.Category.findById(req.params.id);
        if (!category || category.isDeleted) {
            return res.status(404).json({
                success: false,
                error: { message: 'Category not found', code: 'CATEGORY_NOT_FOUND' }
            });
        }
        // Verify all products exist
        const products = await products_model_1.Product.find({
            _id: { $in: productIds },
            isDeleted: false
        });
        if (products.length !== productIds.length) {
            return res.status(400).json({
                success: false,
                error: { message: 'One or more products not found', code: 'PRODUCTS_NOT_FOUND' }
            });
        }
        // Add category to all products
        await products_model_1.Product.updateMany({ _id: { $in: productIds } }, { $addToSet: { categories: req.params.id } });
        return res.json({
            success: true,
            message: `${products.length} products assigned to category successfully`
        });
    }
    catch (error) {
        console.error('Error assigning products to category:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to assign products to category', code: 'ASSIGN_ERROR' }
        });
    }
});
// GET /api/categories/:id/products - Get products in category
router.get('/:id/products', database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const category = await categories_model_1.Category.findById(req.params.id);
        if (!category || category.isDeleted) {
            return res.status(404).json({
                success: false,
                error: { message: 'Category not found', code: 'CATEGORY_NOT_FOUND' }
            });
        }
        const products = await products_model_1.Product.find({
            categories: req.params.id,
            isDeleted: false
        }).select('name description price images defaultImage isFeatured');
        return res.json({
            success: true,
            data: products,
            count: products.length
        });
    }
    catch (error) {
        console.error('Error fetching category products:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch category products', code: 'FETCH_ERROR' }
        });
    }
});
exports.default = router;
