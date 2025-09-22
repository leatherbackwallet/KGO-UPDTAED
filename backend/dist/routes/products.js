"use strict";
/**
 * Products Routes - Product management and catalog operations
 * Handles product CRUD, search, filtering, and inventory management
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
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const cache_1 = require("../middleware/cache");
const database_1 = require("../middleware/database");
const router = express_1.default.Router();
// Get all products with SMART caching (re-enabled with proper invalidation)
router.get('/', cache_1.cacheConfigs.products, database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        // Removed excessive debug logging for better performance
        const { category, min, max, search, featured, occasions, page = 1, limit = 20, includeDeleted = false, admin = false } = req.query;
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
            const occasionArray = occasions.split(',').map(o => o.trim());
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
                    const allOccasionIds = [...occasionIds, ...occasionsByName.map(o => o._id)];
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
        const skip = (Number(page) - 1) * effectiveLimit;
        // Optimize: Select only needed fields for better performance
        let query = products_model_1.Product.find(filter)
            .select('name description price images isFeatured categories vendors occasions createdAt updatedAt')
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
            .populate({
            path: 'occasions',
            select: 'name slug dateRange priority seasonalFlags',
            options: { strictPopulate: false }
        })
            .sort({ isFeatured: -1, createdAt: -1 });
        // For admin requests or when limit is high (>=100), don't apply pagination limits
        // This ensures all products are returned when requested
        if (admin !== 'true' && effectiveLimit < 100) {
            query = query.skip(skip).limit(effectiveLimit);
        }
        else if (admin === 'true') {
            // For admin requests, return all products without pagination
            console.log('Admin request: returning all products without pagination');
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
});
// Get single product by ID
router.get('/:id', database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const product = await products_model_1.Product.findById(req.params.id)
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
        console.error('Error fetching product:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch product' });
    }
});
// Create new product (admin only)
router.post('/', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const productData = req.body;
        // Validate required fields
        if (!productData.name || !productData.price || !productData.categories) {
            res.status(400).json({
                success: false,
                error: 'Name, price, and categories are required'
            });
            return;
        }
        const product = new products_model_1.Product(productData);
        await product.save();
        // Invalidate cache
        await (0, cache_1.invalidateProductCache)();
        // Log activity
        await activityLogs_model_1.ActivityLog.create({
            userId: req.user?.id,
            action: 'CREATE_PRODUCT',
            details: { productId: product._id, productName: product.name }
        });
        res.status(201).json({ success: true, data: product });
    }
    catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ success: false, error: 'Failed to create product' });
    }
});
// Update product (admin only)
router.put('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const product = await products_model_1.Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('categories', 'name slug');
        if (!product) {
            res.status(404).json({ success: false, error: 'Product not found' });
            return;
        }
        // Invalidate cache
        await (0, cache_1.invalidateProductCache)();
        // Log activity
        await activityLogs_model_1.ActivityLog.create({
            userId: req.user?.id,
            action: 'UPDATE_PRODUCT',
            details: { productId: product._id, productName: product.name }
        });
        res.json({ success: true, data: product });
    }
    catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, error: 'Failed to update product' });
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
        const products = await products_model_1.Product.find({ isFeatured: true, isActive: true, isDeleted: false })
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
        const { q, category, min, max, page = 1, limit = 20 } = req.query;
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
            path: 'vendors',
            select: 'storeName',
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
