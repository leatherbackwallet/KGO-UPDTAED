"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const products_model_1 = require("../models/products.model");
const categories_model_1 = require("../models/categories.model");
const activityLogs_model_1 = require("../models/activityLogs.model");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const mongoose_1 = __importDefault(require("mongoose"));
const cache_1 = require("../middleware/cache");
const database_1 = require("../middleware/database");
const router = express_1.default.Router();
router.get('/', cache_1.cacheConfigs.products, database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        console.log('🔍 [Products API] Fetching products with smart caching...');
        console.log('🔍 [Products API] Database name:', mongoose_1.default.connection.db?.databaseName);
        console.log('🔍 [Products API] Connection state:', mongoose_1.default.connection.readyState);
        console.log('🔍 [Products API] Connection URI:', mongoose_1.default.connection.host, mongoose_1.default.connection.port);
        console.log('🔍 [Products API] Collections:', await mongoose_1.default.connection.db?.listCollections().toArray());
        const { category, min, max, search, featured, occasions, page = 1, limit = 20, includeDeleted = false } = req.query;
        let filter = includeDeleted === 'true' ? {} : { isDeleted: { $ne: true } };
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
            const occasionArray = occasions.split(',').map(o => o.trim().toUpperCase());
            filter.occasions = { $in: occasionArray };
        }
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { 'name': searchRegex },
                { 'description': searchRegex },
                { occasions: searchRegex }
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const products = await products_model_1.Product.find(filter)
            .populate('categories', 'name slug')
            .populate('vendors', 'storeName')
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
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch products' });
    }
});
router.get('/:id', database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const product = await products_model_1.Product.findById(req.params.id)
            .populate('categories', 'name slug')
            .populate('vendors', 'storeName')
            .populate('attributes')
            .populate({
            path: 'reviews',
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
router.post('/', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const productData = req.body;
        if (!productData.name || !productData.price || !productData.categories) {
            res.status(400).json({
                success: false,
                error: 'Name, price, and categories are required'
            });
            return;
        }
        const product = new products_model_1.Product(productData);
        await product.save();
        await (0, cache_1.invalidateProductCache)();
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
router.put('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const product = await products_model_1.Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('categories', 'name slug');
        if (!product) {
            res.status(404).json({ success: false, error: 'Product not found' });
            return;
        }
        await (0, cache_1.invalidateProductCache)();
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
router.delete('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const product = await products_model_1.Product.findByIdAndDelete(req.params.id);
        if (!product) {
            res.status(404).json({ success: false, error: 'Product not found' });
            return;
        }
        await (0, cache_1.invalidateProductCache)();
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
router.get('/featured/list', database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const products = await products_model_1.Product.find({ isFeatured: true, isActive: true, isDeleted: false })
            .populate('categories', 'name slug')
            .populate('vendors', 'storeName')
            .sort({ createdAt: -1 })
            .limit(10);
        res.json({ success: true, data: products });
    }
    catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch featured products' });
    }
});
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
                { description: new RegExp(q, 'i') },
                { occasions: new RegExp(q, 'i') }
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
            .populate('categories', 'name slug')
            .populate('vendors', 'storeName')
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
//# sourceMappingURL=products.js.map