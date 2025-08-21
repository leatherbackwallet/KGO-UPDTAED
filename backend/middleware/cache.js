/**
 * Caching Middleware
 * Provides response caching for improved performance
 */

const NodeCache = require('node-cache');

// Create cache instance with 5 minutes default TTL
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Better performance
});

// Cache middleware factory
const createCacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator ? keyGenerator(req) : `${req.originalUrl || req.url}`;
    
    // Check if response is cached
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Cache successful responses
      if (res.statusCode === 200) {
        cache.set(cacheKey, data, ttl);
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

// Specific cache configurations
const cacheConfigs = {
  // Product listings - cache for 30 seconds (reduced from 2 minutes)
  products: createCacheMiddleware(30, (req) => {
    const { search, category, min, max, occasions } = req.query;
    return `products:${search || ''}:${category || ''}:${min || ''}:${max || ''}:${occasions || ''}`;
  }),
  
  // Categories - cache for 10 minutes
  categories: createCacheMiddleware(600),
  
  // User profile - cache for 1 minute
  profile: createCacheMiddleware(60, (req) => `profile:${req.user?.id || 'anonymous'}`),
  
  // Static data - cache for 30 minutes
  static: createCacheMiddleware(1800)
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

module.exports = {
  cache,
  createCacheMiddleware,
  cacheConfigs,
  invalidateCache,
  invalidateProductCache,
  invalidateCategoryCache,
  invalidateUserCache,
  getCacheStats,
  clearCache
}; 