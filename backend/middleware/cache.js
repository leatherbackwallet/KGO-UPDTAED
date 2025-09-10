/**
 * Caching Middleware
 * Provides response caching for improved performance with ETag support
 */

const NodeCache = require('node-cache');
const crypto = require('crypto');

// Create cache instance with 5 minutes default TTL
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Better performance
});

// Generate ETag from data
const generateETag = (data) => {
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify(data));
  return `"${hash.digest('hex')}"`;
};

// Enhanced cache middleware factory with ETag support
const createCacheMiddleware = (ttl = 300, keyGenerator = null, options = {}) => {
  const { 
    enableETag = true, 
    cacheControl = 'public, max-age=300',
    staleWhileRevalidate = false 
  } = options;

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
      
      return res.json(data);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
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

// Specific cache configurations with enhanced headers
const cacheConfigs = {
  // Product listings - cache for 5 minutes with ETag support
  products: createCacheMiddleware(300, (req) => {
    const { search, category, min, max, occasions, featured } = req.query;
    return `products:${search || ''}:${category || ''}:${min || ''}:${max || ''}:${occasions || ''}:${featured || ''}`;
  }, {
    enableETag: true,
    cacheControl: 'public, max-age=300, stale-while-revalidate=60',
    staleWhileRevalidate: true
  }),
  
  // Single product - cache for 10 minutes with ETag
  product: createCacheMiddleware(600, (req) => `product:${req.params.id}`, {
    enableETag: true,
    cacheControl: 'public, max-age=600, stale-while-revalidate=120'
  }),
  
  // Categories - cache for 30 minutes with ETag
  categories: createCacheMiddleware(1800, null, {
    enableETag: true,
    cacheControl: 'public, max-age=1800, stale-while-revalidate=300'
  }),
  
  // User profile - cache for 1 minute, private cache
  profile: createCacheMiddleware(60, (req) => `profile:${req.user?.id || 'anonymous'}`, {
    enableETag: true,
    cacheControl: 'private, max-age=60'
  }),
  
  // Static data - cache for 1 hour with long stale-while-revalidate
  static: createCacheMiddleware(3600, null, {
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

const invalidateProductCache = () => invalidateCache('products:');
const invalidateCategoryCache = () => invalidateCache('categories');
const invalidateUserCache = (userId) => invalidateCache(`profile:${userId}`);

// Cache statistics
const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    keyspace: cache.keys()
  };
};

// Clear all cache
const clearCache = () => {
  cache.flushAll();
  console.log('Cache cleared');
};

// Cache warming functionality
const warmCache = async (warmingConfig) => {
  const { Product, Category } = require('../dist/models');
  
  try {
    console.log('Starting cache warming...');
    
    // Warm frequently accessed product data
    if (warmingConfig.products) {
      // Cache featured products
      const featuredProducts = await Product.find({ isFeatured: true })
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
      const popularCategories = await Category.find({ isPopular: true }).limit(5);
      for (const category of popularCategories) {
        const categoryProducts = await Product.find({ categories: category._id })
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
      const categories = await Category.find().sort({ name: 1 });
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
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
};

// Schedule cache warming for frequently accessed data
const scheduleWarmCache = () => {
  // Warm cache every 10 minutes
  setInterval(() => {
    warmCache({ products: true, categories: true });
  }, 600000); // 10 minutes
  
  // Initial warming
  setTimeout(() => {
    warmCache({ products: true, categories: true });
  }, 5000); // 5 seconds after startup
};

module.exports = {
  cache,
  createCacheMiddleware,
  cacheConfigs,
  invalidateCache,
  invalidateProductCache,
  invalidateCategoryCache,
  invalidateUserCache,
  getCacheStats,
  clearCache,
  generateETag,
  warmCache,
  scheduleWarmCache
}; 