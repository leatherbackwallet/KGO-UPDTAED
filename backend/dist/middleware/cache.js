"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateETag = exports.cache = exports.scheduleWarmCache = exports.warmCache = exports.clearCache = exports.getCacheStats = exports.invalidateUserCache = exports.invalidateCategoryCache = exports.invalidateProductCache = exports.invalidateCache = exports.cacheConfigs = exports.createCacheMiddleware = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const crypto_1 = __importDefault(require("crypto"));
const products_model_1 = require("../models/products.model");
const categories_model_1 = require("../models/categories.model");
const cache = new node_cache_1.default({
    stdTTL: 300,
    checkperiod: 600,
    useClones: false
});
exports.cache = cache;
const generateETag = (data) => {
    const hash = crypto_1.default.createHash('md5');
    hash.update(JSON.stringify(data));
    return `"${hash.digest('hex')}"`;
};
exports.generateETag = generateETag;
const createCacheMiddleware = (ttl = 300, keyGenerator = null, options = {}) => {
    const { enableETag = true, cacheControl = 'public, max-age=300', staleWhileRevalidate = false } = options;
    return (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }
        const cacheKey = keyGenerator ? keyGenerator(req) : `${req.originalUrl || req.url}`;
        const cachedEntry = cache.get(cacheKey);
        if (cachedEntry) {
            const { data, etag, timestamp } = cachedEntry;
            if (enableETag && req.headers['if-none-match'] === etag) {
                res.status(304).end();
                return;
            }
            res.setHeader('Cache-Control', cacheControl);
            res.setHeader('Last-Modified', new Date(timestamp).toUTCString());
            if (enableETag && etag) {
                res.setHeader('ETag', etag);
            }
            res.json(data);
            return;
        }
        const originalJson = res.json;
        res.json = function (data) {
            if (res.statusCode === 200) {
                const etag = enableETag ? generateETag(data) : null;
                const timestamp = Date.now();
                cache.set(cacheKey, { data, etag, timestamp }, ttl);
                res.setHeader('Cache-Control', cacheControl);
                res.setHeader('Last-Modified', new Date(timestamp).toUTCString());
                if (etag) {
                    res.setHeader('ETag', etag);
                }
                res.setHeader('Vary', 'Accept-Encoding, If-None-Match');
            }
            return originalJson.call(this, data);
        };
        next();
    };
};
exports.createCacheMiddleware = createCacheMiddleware;
exports.cacheConfigs = {
    products: (0, exports.createCacheMiddleware)(300, (req) => {
        const { search, category, min, max, occasions, featured } = req.query;
        return `products:${search || ''}:${category || ''}:${min || ''}:${max || ''}:${occasions || ''}:${featured || ''}`;
    }, {
        enableETag: true,
        cacheControl: 'public, max-age=300, stale-while-revalidate=60',
        staleWhileRevalidate: true
    }),
    product: (0, exports.createCacheMiddleware)(600, (req) => `product:${req.params.id}`, {
        enableETag: true,
        cacheControl: 'public, max-age=600, stale-while-revalidate=120'
    }),
    categories: (0, exports.createCacheMiddleware)(1800, null, {
        enableETag: true,
        cacheControl: 'public, max-age=1800, stale-while-revalidate=300'
    }),
    profile: (0, exports.createCacheMiddleware)(60, (req) => `profile:${req.user?.id || 'anonymous'}`, {
        enableETag: true,
        cacheControl: 'private, max-age=60'
    }),
    static: (0, exports.createCacheMiddleware)(3600, null, {
        enableETag: true,
        cacheControl: 'public, max-age=3600, stale-while-revalidate=1800'
    })
};
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
const getCacheStats = () => {
    return {
        keys: cache.keys().length,
        hits: cache.getStats().hits,
        misses: cache.getStats().misses,
        keyspace: cache.keys()
    };
};
exports.getCacheStats = getCacheStats;
const clearCache = () => {
    cache.flushAll();
    console.log('Cache cleared');
};
exports.clearCache = clearCache;
const warmCache = async (warmingConfig) => {
    try {
        console.log('Starting cache warming...');
        if (warmingConfig.products) {
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
const scheduleWarmCache = () => {
    setInterval(() => {
        (0, exports.warmCache)({ products: true, categories: true });
    }, 600000);
    setTimeout(() => {
        (0, exports.warmCache)({ products: true, categories: true });
    }, 5000);
};
exports.scheduleWarmCache = scheduleWarmCache;
//# sourceMappingURL=cache.js.map