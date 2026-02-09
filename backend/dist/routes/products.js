"use strict";
/**
 * Products Routes - Product management and catalog operations
 * Handles product CRUD, search, filtering, and inventory management
 *
 * MIGRATION STRATEGY:
 * - Admin requests (admin=true) → MongoDB (existing functionality)
 * - Public requests (items page) → JSON files (no MongoDB dependency)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const products_model_1 = require("../models/products.model");
const categories_model_1 = require("../models/categories.model");
const activityLogs_model_1 = require("../models/activityLogs.model");
// Removed imports for deleted models: VendorProduct, Review, Notification
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const cache_1 = require("../middleware/cache");
const database_1 = require("../middleware/database");
const productValidation_1 = require("../utils/productValidation");
const jsonDataService_1 = require("../services/jsonDataService");
const router = express_1.default.Router();
// Get all products - Route to JSON for public, MongoDB for admin
router.get('/', async (req, res) => {
    try {
        const { category, min, max, search, featured, occasions, page = 1, limit = 24, includeDeleted = false, admin = false, sort = 'newest' } = req.query;
        // ROUTE DETECTION: Admin vs Public requests
        if (admin === 'true') {
            // ADMIN REQUEST → Use MongoDB (existing functionality)
            console.log('🔧 Admin request detected - using MongoDB');
            return await handleAdminProductsRequest(req, res);
        }
        else {
            // PUBLIC REQUEST → Use JSON files (no MongoDB dependency)
            console.log('📄 Public request detected - using JSON files');
            return await handlePublicProductsRequest(req, res);
        }
    }
    catch (error) {
        console.error('❌ Error in products route:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch products',
                code: 'PRODUCTS_FETCH_ERROR'
            }
        });
    }
});
/**
 * Handle public products requests using JSON files (items page)
 * NO MongoDB dependency
 */
async function handlePublicProductsRequest(req, res) {
    const { category, min, max, search, featured, occasions, page = 1, limit = 24, sort = 'newest' } = req.query;
    try {
        const result = await jsonDataService_1.jsonDataService.getProducts({
            category: category,
            occasions: occasions,
            search: search,
            featured: featured === 'true',
            min: min ? Number(min) : undefined,
            max: max ? Number(max) : undefined,
            page: Number(page),
            limit: Number(limit),
            sort: sort,
            includeDeleted: false // Public requests never include deleted products
        });
        res.json({
            success: true,
            data: result.products,
            count: result.products.length,
            total: result.total,
            pages: result.pages,
            currentPage: result.currentPage
        });
    }
    catch (error) {
        console.error('❌ Error fetching products from JSON:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch products',
                code: 'JSON_PRODUCTS_ERROR'
            }
        });
    }
}
/**
 * Handle admin products requests using MongoDB (admin panel)
 * Preserves existing MongoDB functionality
 */
async function handleAdminProductsRequest(req, res) {
    // Apply caching and database connection for admin requests
    await new Promise((resolve, reject) => {
        cache_1.cacheConfigs.products(req, res, (err) => {
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
    const { category, min, max, search, featured, occasions, page = 1, limit = 24, includeDeleted = false, admin = false, sort = 'newest' } = req.query;
    try {
        // For admin requests, use a high limit to get all products
        const effectiveLimit = admin === 'true' ? 1000 : Number(limit);
        let filter = includeDeleted === 'true' ? {} : { isDeleted: { $ne: true } };
        // Apply filters
        if (category) {
            if (mongoose_1.default.Types.ObjectId.isValid(category)) {
                filter.categories = category;
            }
            else {
                const categoryDoc = await categories_model_1.Category.findOne({ slug: category });
                if (categoryDoc) {
                    filter.categories = categoryDoc._id;
                }
                else {
                    res.json({ success: true, data: [], count: 0 });
                    return;
                }
            }
        }
        if (featured === 'true')
            filter.isFeatured = true;
        if (min || max)
            filter.price = {};
        if (min)
            filter.price.$gte = Number(min);
        if (max)
            filter.price.$lte = Number(max);
        if (occasions) {
            // Handle both ObjectId and name-based filtering
            const occasionArray = occasions.split(',').map((o) => o.trim());
            const occasionIds = [];
            const occasionNames = [];
            for (const occasion of occasionArray) {
                if (mongoose_1.default.Types.ObjectId.isValid(occasion)) {
                    occasionIds.push(occasion);
                }
                else {
                    occasionNames.push(occasion);
                }
            }
            // Optimize: Only make one database call for occasion lookups
            if (occasionNames.length > 0) {
                try {
                    const { Occasion } = await Promise.resolve().then(() => __importStar(require('../models/occasions.model')));
                    const occasionsByName = await Occasion.find({
                        name: { $in: occasionNames },
                        isActive: true,
                        isDeleted: false
                    }).select('_id');
                    const allOccasionIds = [...occasionIds, ...occasionsByName.map((o) => o._id)];
                    if (allOccasionIds.length > 0) {
                        filter.occasions = { $in: allOccasionIds };
                    }
                }
                catch (error) {
                    console.error('Error fetching occasions:', error);
                    // If occasion lookup fails, skip occasion filtering
                }
            }
            else if (occasionIds.length > 0) {
                filter.occasions = { $in: occasionIds };
            }
        }
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { 'name': searchRegex },
                { 'description': searchRegex }
            ];
        }
        // Calculate skip only for non-admin requests
        const skip = admin !== 'true' ? (Number(page) - 1) * Number(limit) : 0;
        // Determine sort order based on sort parameter
        // Default to price low to high if no sort specified
        const effectiveSort = sort || 'price-low';
        let sortOrder = { price: 1, createdAt: -1 }; // Default sort: price low to high
        switch (effectiveSort) {
            case 'name':
                sortOrder = { name: 1 }; // A-Z
                break;
            case 'price-low':
                // Filter out products without price when sorting by price
                filter.price = { $exists: true, $ne: null, $gt: 0 };
                sortOrder = { price: 1, createdAt: -1 }; // Low to High, then newest
                break;
            case 'price-high':
                // Filter out products without price when sorting by price
                filter.price = { $exists: true, $ne: null, $gt: 0 };
                sortOrder = { price: -1, createdAt: -1 }; // High to Low, then newest
                break;
            case 'newest':
                sortOrder = { isFeatured: -1, createdAt: -1 }; // Newest first
                break;
        }
        // Optimize: Select only needed fields for better performance
        let query = products_model_1.Product.find(filter)
            .select('name description price stock images isFeatured categories occasions createdAt updatedAt')
            .populate({
            path: 'categories',
            select: 'name slug',
            options: { strictPopulate: false }
        })
            .populate({
            path: 'occasions',
            select: 'name slug dateRange priority seasonalFlags',
            options: { strictPopulate: false }
        })
            .sort(sortOrder);
        // Apply pagination logic correctly
        if (admin === 'true') {
            // For admin requests, return all products without pagination
            console.log('Admin request: returning all products without pagination');
        }
        else {
            // For regular requests, apply pagination
            query = query.skip(skip).limit(effectiveLimit);
        }
        // Optimize: Run count query in parallel with main query for better performance
        const [products, total] = await Promise.all([
            query,
            products_model_1.Product.countDocuments(filter)
        ]).catch(error => {
            console.error('Error in parallel queries:', error);
            // Fallback to sequential queries if parallel fails
            return Promise.all([
                query.catch(() => []),
                products_model_1.Product.countDocuments(filter).catch(() => 0)
            ]);
        });
        res.json({
            success: true,
            data: products,
            count: products.length,
            total,
            page: Number(page),
            pages: effectiveLimit >= 100 ? 1 : Math.ceil(total / effectiveLimit),
            allProductsLoaded: effectiveLimit >= 100 || admin === 'true' || products.length === total
        });
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch products' });
    }
}
// Get single product by ID - Route to JSON for public, MongoDB for admin
router.get('/:id', async (req, res) => {
    try {
        const { admin } = req.query;
        if (admin === 'true') {
            // ADMIN REQUEST → Use MongoDB (existing functionality)
            console.log('🔧 Admin single product request - using MongoDB');
            return await handleAdminSingleProductRequest(req, res);
        }
        else {
            // PUBLIC REQUEST → Use JSON files (no MongoDB dependency)
            console.log('📄 Public single product request - using JSON files');
            return await handlePublicSingleProductRequest(req, res);
        }
    }
    catch (error) {
        console.error('❌ Error in single product route:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch product',
                code: 'PRODUCT_FETCH_ERROR'
            }
        });
    }
});
/**
 * Handle public single product requests using JSON files
 * NO MongoDB dependency
 */
async function handlePublicSingleProductRequest(req, res) {
    try {
        const id = typeof req.params.id === 'string' ? req.params.id : (req.params.id?.[0] ?? '');
        const product = await jsonDataService_1.jsonDataService.getProductById(id);
        if (!product) {
            res.status(404).json({ success: false, error: 'Product not found' });
            return;
        }
        res.json({ success: true, data: product });
    }
    catch (error) {
        console.error('❌ Error fetching product from JSON:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch product',
                code: 'JSON_PRODUCT_ERROR'
            }
        });
    }
}
/**
 * Handle admin single product requests using MongoDB
 * Preserves existing MongoDB functionality
 */
async function handleAdminSingleProductRequest(req, res) {
    // Apply database connection for admin requests
    await new Promise((resolve, reject) => {
        (0, database_1.ensureDatabaseConnection)(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    try {
        const product = await products_model_1.Product.findById(req.params.id)
            .populate({
            path: 'categories',
            select: 'name slug',
            options: { strictPopulate: false }
        })
            .populate({
            path: 'attributes',
            options: { strictPopulate: false }
        })
            .populate({
            path: 'reviews',
            options: { strictPopulate: false },
            populate: {
                path: 'userId',
                select: 'firstName lastName'
            }
        });
        if (!product) {
            res.status(404).json({ success: false, error: 'Product not found' });
            return;
        }
        res.json({ success: true, data: product });
    }
    catch (error) {
        console.error('Error fetching product from MongoDB:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch product' });
    }
}
// Create new product (admin only)
router.post('/', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const productData = req.body;
        console.log('📦 Creating product with data:', {
            name: productData.name,
            price: productData.price,
            categories: productData.categories,
            images: productData.images,
            isCombo: productData.isCombo
        });
        // Enhanced validation using centralized validation utility
        const validationResult = (0, productValidation_1.validateProductData)(productData, false);
        if (!validationResult.isValid) {
            console.error('❌ Product validation failed:', validationResult.errors);
            res.status(400).json({
                success: false,
                error: validationResult.errors.join('. ')
            });
            return;
        }
        const validatedProductData = validationResult.sanitizedData;
        console.log('✅ Product data validated, creating product...');
        const product = new products_model_1.Product(validatedProductData);
        await product.save();
        console.log('✅ Product created successfully:', {
            id: product._id,
            name: product.name,
            price: product.price,
            categories: product.categories.length,
            images: product.images?.length || 0
        });
        // Invalidate cache
        try {
            await (0, cache_1.invalidateProductCache)();
        }
        catch (cacheError) {
            console.warn('Cache invalidation failed (non-critical):', cacheError);
        }
        // Log activity (non-critical)
        try {
            await activityLogs_model_1.ActivityLog.create({
                actorId: req.user?.id,
                actionType: 'CREATE_PRODUCT',
                target: {
                    type: 'Product',
                    id: product._id
                },
                details: { productName: product.name }
            });
        }
        catch (logError) {
            console.warn('Activity logging failed (non-critical):', logError);
        }
        res.status(201).json({
            success: true,
            data: product,
            message: 'Product created successfully'
        });
    }
    catch (error) {
        console.error('❌ Error creating product:', error);
        // Handle specific MongoDB validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                error: `Validation failed: ${validationErrors.join(', ')}`
            });
            return;
        }
        // Handle duplicate key errors
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                error: 'Product with this name already exists'
            });
            return;
        }
        // Handle other errors
        res.status(500).json({
            success: false,
            error: 'Failed to create product',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Update product (admin only)
router.put('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const productData = req.body;
        const productId = req.params.id;
        console.log('📦 Updating product with data:', {
            id: productId,
            name: productData.name,
            price: productData.price,
            categories: productData.categories,
            images: productData.images,
            isCombo: productData.isCombo
        });
        // Enhanced validation using centralized validation utility
        const validationResult = (0, productValidation_1.validateProductData)(productData, true);
        if (!validationResult.isValid) {
            console.error('❌ Product validation failed:', validationResult.errors);
            res.status(400).json({
                success: false,
                error: validationResult.errors.join('. ')
            });
            return;
        }
        const validatedProductData = validationResult.sanitizedData;
        console.log('✅ Product data validated, updating product...');
        const product = await products_model_1.Product.findByIdAndUpdate(productId, validatedProductData, { new: true, runValidators: true }).populate('categories', 'name slug');
        if (!product) {
            res.status(404).json({ success: false, error: 'Product not found' });
            return;
        }
        console.log('✅ Product updated successfully:', {
            id: product._id,
            name: product.name,
            price: product.price,
            categories: product.categories.length,
            images: product.images?.length || 0
        });
        // Invalidate cache
        try {
            await (0, cache_1.invalidateProductCache)();
        }
        catch (cacheError) {
            console.warn('Cache invalidation failed (non-critical):', cacheError);
        }
        // Log activity (FIXED: Use correct schema)
        try {
            await activityLogs_model_1.ActivityLog.create({
                actorId: req.user?.id,
                actionType: 'UPDATE_PRODUCT',
                target: {
                    type: 'Product',
                    id: product._id
                },
                details: { productName: product.name }
            });
        }
        catch (logError) {
            console.warn('Activity logging failed (non-critical):', logError);
        }
        res.json({
            success: true,
            data: product,
            message: 'Product updated successfully'
        });
    }
    catch (error) {
        console.error('❌ Error updating product:', error);
        // Handle specific MongoDB validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                error: `Validation failed: ${validationErrors.join(', ')}`
            });
            return;
        }
        // Handle duplicate key errors
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                error: 'Product with this name already exists'
            });
            return;
        }
        // Handle other errors
        res.status(500).json({
            success: false,
            error: 'Failed to update product',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Delete product (admin only)
router.delete('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const product = await products_model_1.Product.findByIdAndDelete(req.params.id);
        if (!product) {
            res.status(404).json({ success: false, error: 'Product not found' });
            return;
        }
        // Invalidate cache
        await (0, cache_1.invalidateProductCache)();
        // Log activity
        await activityLogs_model_1.ActivityLog.create({
            userId: req.user?.id,
            action: 'DELETE_PRODUCT',
            details: { productId: product._id, productName: product.name }
        });
        res.json({ success: true, message: 'Product deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, error: 'Failed to delete product' });
    }
});
// Get featured products
router.get('/featured/list', database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const products = await products_model_1.Product.find({ isFeatured: true, isDeleted: false })
            .populate({
            path: 'categories',
            select: 'name slug',
            options: { strictPopulate: false }
        })
            .populate({
            path: 'vendors',
            select: 'storeName',
            options: { strictPopulate: false }
        })
            .sort({ createdAt: -1 })
            .limit(10);
        res.json({ success: true, data: products });
    }
    catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch featured products' });
    }
});
// Search products
router.get('/search/query', database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const { q, category, min, max, page = 1, limit = 24 } = req.query;
        if (!q) {
            res.status(400).json({ success: false, error: 'Search query is required' });
            return;
        }
        let filter = {
            isDeleted: false,
            $or: [
                { name: new RegExp(q, 'i') },
                { description: new RegExp(q, 'i') }
            ]
        };
        if (category) {
            filter.categories = category;
        }
        if (min || max) {
            filter.price = {};
            if (min)
                filter.price.$gte = Number(min);
            if (max)
                filter.price.$lte = Number(max);
        }
        const skip = (Number(page) - 1) * Number(limit);
        const products = await products_model_1.Product.find(filter)
            .populate({
            path: 'categories',
            select: 'name slug',
            options: { strictPopulate: false }
        })
            .populate({
            path: 'occasions',
            select: 'name slug dateRange priority seasonalFlags',
            options: { strictPopulate: false }
        })
            .sort({ isFeatured: -1, createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await products_model_1.Product.countDocuments(filter);
        res.json({
            success: true,
            data: products,
            count: products.length,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit))
        });
    }
    catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ success: false, error: 'Failed to search products' });
    }
});
exports.default = router;
