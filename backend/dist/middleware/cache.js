"use strict";
/**
 * Caching Middleware
 * Provides response caching for improved performance with ETag support
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
exports.generateETag = exports.cache = exports.scheduleWarmCache = exports.warmCache = exports.clearCache = exports.getCacheStats = exports.invalidateGlobalCache = exports.invalidateUserCache = exports.invalidateCategoryCache = exports.invalidateProductCache = exports.invalidateCache = exports.cacheConfigs = exports.createCacheMiddleware = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const crypto = __importStar(require("crypto"));
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
    const hash = crypto.createHash('md5');
    hash.update(JSON.stringify(data));
    return `"${hash.digest('hex')}"`;
};
exports.generateETag = generateETag;
// Enhanced cache middleware factory with ETag support and user awareness
const createCacheMiddleware = (ttl = 300, keyGenerator = null, options = {}) => {
    const { enableETag = true, cacheControl = 'public, max-age=300', staleWhileRevalidate = false } = options;
    return (req, res, next) => {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }
        // Generate user-aware cache key
        const baseKey = keyGenerator ? keyGenerator(req) : `${req.originalUrl || req.url}`;
        const userId = req.user?.id || 'anonymous';
        const userRole = req.user?.roleName || 'guest';
        // Create user-specific cache key for user-sensitive data
        const cacheKey = `${baseKey}:user:${userId}:role:${userRole}`;
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
    // Product listings - cache for 3 minutes with ETag support (optimized)
    products: (0, exports.createCacheMiddleware)(180, (req) => {
        const { search, category, min, max, occasions, featured, page, limit } = req.query;
        return `products:${search || ''}:${category || ''}:${min || ''}:${max || ''}:${occasions || ''}:${featured || ''}:${page || 1}:${limit || 24}`;
    }, {
        enableETag: true,
        cacheControl: 'public, max-age=180, stale-while-revalidate=60',
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
    // Occasions - cache for 15 minutes with ETag
    occasions: (0, exports.createCacheMiddleware)(900, (req) => {
        const { current, upcoming, seasonal, search, priority, type } = req.query;
        return `occasions:${current || ''}:${upcoming || ''}:${seasonal || ''}:${search || ''}:${priority || ''}:${type || ''}`;
    }, {
        enableETag: true,
        cacheControl: 'public, max-age=900, stale-while-revalidate=180'
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
// Cache invalidation utilities with user awareness
const invalidateCache = (pattern, userId) => {
    const keys = cache.keys();
    let matchingKeys;
    if (userId) {
        // Invalidate cache for specific user
        matchingKeys = keys.filter(key => key.includes(pattern) && key.includes(`user:${userId}`));
    }
    else {
        // Invalidate cache for all users
        matchingKeys = keys.filter(key => key.includes(pattern));
    }
    cache.del(matchingKeys);
    console.log(`Invalidated ${matchingKeys.length} cache entries for pattern: ${pattern}${userId ? ` (user: ${userId})` : ' (all users)'}`);
};
exports.invalidateCache = invalidateCache;
const invalidateProductCache = (userId) => (0, exports.invalidateCache)('products:', userId);
exports.invalidateProductCache = invalidateProductCache;
const invalidateCategoryCache = (userId) => (0, exports.invalidateCache)('categories', userId);
exports.invalidateCategoryCache = invalidateCategoryCache;
const invalidateUserCache = (userId) => (0, exports.invalidateCache)(`profile:`, userId);
exports.invalidateUserCache = invalidateUserCache;
// Invalidate cache for all users when global data changes
const invalidateGlobalCache = (pattern) => {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    cache.del(matchingKeys);
    console.log(`Invalidated ${matchingKeys.length} global cache entries for pattern: ${pattern}`);
};
exports.invalidateGlobalCache = invalidateGlobalCache;
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
            // Cache featured products with optimized query
            const featuredProducts = await products_model_1.Product.find({ isFeatured: true })
                .select('name description price stock images isFeatured categories vendors')
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
            // Cache products by popular categories with optimized queries
            const popularCategories = await categories_model_1.Category.find({ isPopular: true }).limit(5);
            for (const category of popularCategories) {
                const categoryProducts = await products_model_1.Product.find({ categories: category._id })
                    .select('name description price stock images isFeatured categories vendors')
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
    // Warm cache every 30 minutes (reduced frequency to reduce database load)
    setInterval(() => {
        (0, exports.warmCache)({ products: true, categories: true });
    }, 1800000); // 30 minutes
    // Initial warming with delay to avoid startup conflicts
    setTimeout(() => {
        (0, exports.warmCache)({ products: true, categories: true });
    }, 30000); // 30 seconds after startup
};
exports.scheduleWarmCache = scheduleWarmCache;
