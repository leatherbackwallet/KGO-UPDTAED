"use strict";
/**
 * Caching Middleware
 * Provides response caching for improved performance with ETag support
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateETag = exports.cache = exports.scheduleWarmCache = exports.warmCache = exports.clearCache = exports.getCacheStats = exports.invalidateUserCache = exports.invalidateCategoryCache = exports.invalidateProductCache = exports.invalidateCache = exports.cacheConfigs = exports.createCacheMiddleware = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const crypto_1 = __importDefault(require("crypto"));
const products_model_1 = require("../models/products.model");
const categories_model_1 = require("../models/categories.model");
// Create cache instance with 5 minutes default TTL
const cache = new node_cache_1.default({
    stdTTL: 300, // 5 minutes
    checkperiod: 600, // Check for expired keys every 10 minutes
    useClones: false // Better performance
});
exports.cache = cache;
// Generate ETag from data
const generateETag = (data) => {
    const hash = crypto_1.default.createHash('md5');
    hash.update(JSON.stringify(data));
    return `"${hash.digest('hex')}"`;
};
exports.generateETag = generateETag;
// Enhanced cache middleware factory with ETag support
const createCacheMiddleware = (ttl = 300, keyGenerator = null, options = {}) => {
    const { enableETag = true, cacheControl = 'public, max-age=300', staleWhileRevalidate = false } = options;
    return (req, res, next) => {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }
        // Generate cache key
        const cacheKey = keyGenerator ? keyGenerator(req) : `${req.originalUrl || req.url}`;
        // Check if response is cached
        const cachedEntry = cache.get(cacheKey);
        if (cachedEntry) {
            const { data, etag, timestamp } = cachedEntry;
            // Check if client has matching ETag
            if (enableETag && req.headers['if-none-match'] === etag) {
                res.status(304).end();
                return;
            }
            // Set cache headers
            res.setHeader('Cache-Control', cacheControl);
            res.setHeader('Last-Modified', new Date(timestamp).toUTCString());
            if (enableETag && etag) {
                res.setHeader('ETag', etag);
            }
            res.json(data);
            return;
        }
        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function (data) {
            // Cache successful responses
            if (res.statusCode === 200) {
                const etag = enableETag ? generateETag(data) : null;
                const timestamp = Date.now();
                // Store in cache with metadata
                cache.set(cacheKey, { data, etag, timestamp }, ttl);
                // Set response headers
                res.setHeader('Cache-Control', cacheControl);
                res.setHeader('Last-Modified', new Date(timestamp).toUTCString());
                if (etag) {
                    res.setHeader('ETag', etag);
                }
                // Add Vary header for conditional requests
                res.setHeader('Vary', 'Accept-Encoding, If-None-Match');
            }
            // Call original json method
            return originalJson.call(this, data);
        };
        next();
    };
};
exports.createCacheMiddleware = createCacheMiddleware;
// Specific cache configurations with enhanced headers
exports.cacheConfigs = {
    // Product listings - cache for 5 minutes with ETag support
    products: (0, exports.createCacheMiddleware)(300, (req) => {
        const { search, category, min, max, occasions, featured } = req.query;
        return `products:${search || ''}:${category || ''}:${min || ''}:${max || ''}:${occasions || ''}:${featured || ''}`;
    }, {
        enableETag: true,
        cacheControl: 'public, max-age=300, stale-while-revalidate=60',
        staleWhileRevalidate: true
    }),
    // Single product - cache for 10 minutes with ETag
    product: (0, exports.createCacheMiddleware)(600, (req) => `product:${req.params.id}`, {
        enableETag: true,
        cacheControl: 'public, max-age=600, stale-while-revalidate=120'
    }),
    // Categories - cache for 30 minutes with ETag
    categories: (0, exports.createCacheMiddleware)(1800, null, {
        enableETag: true,
        cacheControl: 'public, max-age=1800, stale-while-revalidate=300'
    }),
    // User profile - cache for 1 minute, private cache
    profile: (0, exports.createCacheMiddleware)(60, (req) => `profile:${req.user?.id || 'anonymous'}`, {
        enableETag: true,
        cacheControl: 'private, max-age=60'
    }),
    // Static data - cache for 1 hour with long stale-while-revalidate
    static: (0, exports.createCacheMiddleware)(3600, null, {
        enableETag: true,
        cacheControl: 'public, max-age=3600, stale-while-revalidate=1800'
    })
};
// Cache invalidation utilities
const invalidateCache = (pattern) => {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    cache.del(matchingKeys);
    console.log(`Invalidated ${matchingKeys.length} cache entries for pattern: ${pattern}`);
};
exports.invalidateCache = invalidateCache;
const invalidateProductCache = () => (0, exports.invalidateCache)('products:');
exports.invalidateProductCache = invalidateProductCache;
const invalidateCategoryCache = () => (0, exports.invalidateCache)('categories');
exports.invalidateCategoryCache = invalidateCategoryCache;
const invalidateUserCache = (userId) => (0, exports.invalidateCache)(`profile:${userId}`);
exports.invalidateUserCache = invalidateUserCache;
// Cache statistics
const getCacheStats = () => {
    return {
        keys: cache.keys().length,
        hits: cache.getStats().hits,
        misses: cache.getStats().misses,
        keyspace: cache.keys()
    };
};
exports.getCacheStats = getCacheStats;
// Clear all cache
const clearCache = () => {
    cache.flushAll();
    console.log('Cache cleared');
};
exports.clearCache = clearCache;
// Cache warming functionality
const warmCache = async (warmingConfig) => {
    try {
        console.log('Starting cache warming...');
        // Warm frequently accessed product data
        if (warmingConfig.products) {
            // Cache featured products
            const featuredProducts = await products_model_1.Product.find({ isFeatured: true })
                .populate('categories', 'name slug')
                .populate('vendors', 'storeName')
                .limit(20);
            const featuredKey = 'products::::true';
            const etag = generateETag(featuredProducts);
            cache.set(featuredKey, {
                data: { success: true, data: featuredProducts, count: featuredProducts.length },
                etag,
                timestamp: Date.now()
            }, 300);
            // Cache products by popular categories
            const popularCategories = await categories_model_1.Category.find({ isPopular: true }).limit(5);
            for (const category of popularCategories) {
                const categoryProducts = await products_model_1.Product.find({ categories: category._id })
                    .populate('categories', 'name slug')
                    .populate('vendors', 'storeName')
                    .limit(20);
                const categoryKey = `products::${category._id}:::`;
                const categoryEtag = generateETag(categoryProducts);
                cache.set(categoryKey, {
                    data: { success: true, data: categoryProducts, count: categoryProducts.length },
                    etag: categoryEtag,
                    timestamp: Date.now()
                }, 300);
            }
            console.log(`Warmed cache for featured products and ${popularCategories.length} popular categories`);
        }
        // Warm categories cache
        if (warmingConfig.categories) {
            const categories = await categories_model_1.Category.find().sort({ name: 1 });
            const categoriesKey = '/api/categories';
            const categoriesEtag = generateETag(categories);
            cache.set(categoriesKey, {
                data: categories,
                etag: categoriesEtag,
                timestamp: Date.now()
            }, 1800);
            console.log('Warmed categories cache');
        }
        console.log('Cache warming completed successfully');
    }
    catch (error) {
        console.error('Cache warming failed:', error);
    }
};
exports.warmCache = warmCache;
// Schedule cache warming for frequently accessed data
const scheduleWarmCache = () => {
    // Warm cache every 10 minutes
    setInterval(() => {
        (0, exports.warmCache)({ products: true, categories: true });
    }, 600000); // 10 minutes
    // Initial warming
    setTimeout(() => {
        (0, exports.warmCache)({ products: true, categories: true });
    }, 5000); // 5 seconds after startup
};
exports.scheduleWarmCache = scheduleWarmCache;
