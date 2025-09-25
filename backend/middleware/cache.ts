/**
 * Caching Middleware
 * Provides response caching for improved performance with ETag support
 */

import NodeCache from 'node-cache';
import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/products.model';
import { Category } from '../models/categories.model';

interface CacheEntry {
  data: any;
  etag: string | null;
  timestamp: number;
}

interface CacheOptions {
  enableETag?: boolean;
  cacheControl?: string;
  staleWhileRevalidate?: boolean;
}

interface WarmingConfig {
  products?: boolean;
  categories?: boolean;
}

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

// Generate ETag from data
const generateETag = (data: any): string => {
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify(data));
  return `"${hash.digest('hex')}"`;
};

// Enhanced cache middleware factory with ETag support and user awareness
export const createCacheMiddleware = (
  ttl: number = 300, 
  keyGenerator: ((req: Request) => string) | null = null, 
  options: CacheOptions = {}
) => {
  const { 
    enableETag = true, 
    cacheControl = 'public, max-age=300',
    staleWhileRevalidate = false 
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate user-aware cache key
    const baseKey = keyGenerator ? keyGenerator(req) : `${req.originalUrl || req.url}`;
    const userId = (req as any).user?.id || 'anonymous';
    const userRole = (req as any).user?.roleName || 'guest';
    
    // Create user-specific cache key for user-sensitive data
    const cacheKey = `${baseKey}:user:${userId}:role:${userRole}`;
    
    // Check if response is cached
    const cachedEntry = cache.get<CacheEntry>(cacheKey);
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
    res.json = function(data: any): Response {
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
export const cacheConfigs = {
  // Product listings - cache for 3 minutes with ETag support (optimized)
  products: createCacheMiddleware(180, (req: Request) => {
    const { search, category, min, max, occasions, featured, page, limit, sort, admin } = req.query;
    return `products:${search || ''}:${category || ''}:${min || ''}:${max || ''}:${occasions || ''}:${featured || ''}:${sort || 'newest'}:${page || 1}:${limit || 24}:${admin || 'false'}`;
  }, {
    enableETag: true,
    cacheControl: 'public, max-age=180, stale-while-revalidate=60',
    staleWhileRevalidate: true
  }),
  
  // Single product - cache for 10 minutes with ETag
  product: createCacheMiddleware(600, (req: Request) => `product:${req.params.id}`, {
    enableETag: true,
    cacheControl: 'public, max-age=600, stale-while-revalidate=120'
  }),
  
  // Categories - cache for 30 minutes with ETag
  categories: createCacheMiddleware(1800, null, {
    enableETag: true,
    cacheControl: 'public, max-age=1800, stale-while-revalidate=300'
  }),
  
  // Occasions - cache for 15 minutes with ETag
  occasions: createCacheMiddleware(900, (req: Request) => {
    const { current, upcoming, seasonal, search, priority, type } = req.query;
    return `occasions:${current || ''}:${upcoming || ''}:${seasonal || ''}:${search || ''}:${priority || ''}:${type || ''}`;
  }, {
    enableETag: true,
    cacheControl: 'public, max-age=900, stale-while-revalidate=180'
  }),
  
  // User profile - cache for 1 minute, private cache
  profile: createCacheMiddleware(60, (req: Request) => `profile:${(req as any).user?.id || 'anonymous'}`, {
    enableETag: true,
    cacheControl: 'private, max-age=60'
  }),
  
  // Static data - cache for 1 hour with long stale-while-revalidate
  static: createCacheMiddleware(3600, null, {
    enableETag: true,
    cacheControl: 'public, max-age=3600, stale-while-revalidate=1800'
  })
};

// Cache invalidation utilities with user awareness
export const invalidateCache = (pattern: string, userId?: string): void => {
  const keys = cache.keys();
  let matchingKeys: string[];
  
  if (userId) {
    // Invalidate cache for specific user
    matchingKeys = keys.filter(key => 
      key.includes(pattern) && key.includes(`user:${userId}`)
    );
  } else {
    // Invalidate cache for all users
    matchingKeys = keys.filter(key => key.includes(pattern));
  }
  
  cache.del(matchingKeys);
  console.log(`Invalidated ${matchingKeys.length} cache entries for pattern: ${pattern}${userId ? ` (user: ${userId})` : ' (all users)'}`);
};

export const invalidateProductCache = (userId?: string): void => invalidateCache('products:', userId);
export const invalidateCategoryCache = (userId?: string): void => invalidateCache('categories', userId);
export const invalidateUserCache = (userId: string): void => invalidateCache(`profile:`, userId);

// Invalidate cache for all users when global data changes
export const invalidateGlobalCache = (pattern: string): void => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  cache.del(matchingKeys);
  console.log(`Invalidated ${matchingKeys.length} global cache entries for pattern: ${pattern}`);
};

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

// Cache warming functionality
export const warmCache = async (warmingConfig: WarmingConfig): Promise<void> => {
  try {
    console.log('Starting cache warming...');
    
    // Warm frequently accessed product data
    if (warmingConfig.products) {
      // Cache featured products with optimized query
      const featuredProducts = await Product.find({ isFeatured: true })
        .select('name description price stock images isFeatured categories')
        .populate('categories', 'name slug')
        .limit(20);
      
      const featuredKey = 'products::::true';
      const etag = generateETag(featuredProducts);
      cache.set(featuredKey, { 
        data: { success: true, data: featuredProducts, count: featuredProducts.length }, 
        etag, 
        timestamp: Date.now() 
      }, 300);
      
      // Cache products by popular categories with optimized queries
      const popularCategories = await Category.find({ isPopular: true }).limit(5);
      for (const category of popularCategories) {
        const categoryProducts = await Product.find({ categories: category._id })
          .select('name description price stock images isFeatured categories')
          .populate('categories', 'name slug')
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
export const scheduleWarmCache = (): void => {
  // Warm cache every 30 minutes (reduced frequency to reduce database load)
  setInterval(() => {
    warmCache({ products: true, categories: true });
  }, 1800000); // 30 minutes
  
  // Initial warming with delay to avoid startup conflicts
  setTimeout(() => {
    warmCache({ products: true, categories: true });
  }, 30000); // 30 seconds after startup
};

export { cache, generateETag };
