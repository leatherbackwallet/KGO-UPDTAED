/**
 * Caching Middleware
 * Provides response caching for improved performance
 */

import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';

interface CacheStats {
  keys: number;
  hits: number;
  misses: number;
  keyspace: string[];
}

// Create cache instance with 5 minutes default TTL
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Better performance
});

// Cache middleware factory
export const createCacheMiddleware = (
  ttl: number = 300, 
  keyGenerator: ((req: Request) => string) | null = null
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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
    res.json = function(data: any): Response {
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
export const cacheConfigs = {
  // Product listings - cache for 30 seconds (reduced from 2 minutes)
  products: createCacheMiddleware(30, (req: Request) => {
    const { search, category, min, max, occasions } = req.query;
    return `products:${search || ''}:${category || ''}:${min || ''}:${max || ''}:${occasions || ''}`;
  }),
  
  // Categories - cache for 10 minutes
  categories: createCacheMiddleware(600),
  
  // User profile - cache for 1 minute
  profile: createCacheMiddleware(60, (req: Request) => `profile:${(req as any).user?.id || 'anonymous'}`),
  
  // Static data - cache for 30 minutes
  static: createCacheMiddleware(1800)
};

// Cache invalidation utilities
export const invalidateCache = (pattern: string): void => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  cache.del(matchingKeys);
  console.log(`Invalidated ${matchingKeys.length} cache entries for pattern: ${pattern}`);
};

export const invalidateProductCache = (): void => invalidateCache('products:');
export const invalidateCategoryCache = (): void => invalidateCache('categories');
export const invalidateUserCache = (userId: string): void => invalidateCache(`profile:${userId}`);

// Cache statistics
export const getCacheStats = (): CacheStats => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    keyspace: cache.keys()
  };
};

// Clear all cache
export const clearCache = (): void => {
  cache.flushAll();
  console.log('Cache cleared');
};

export { cache };
