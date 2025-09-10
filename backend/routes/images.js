/**
 * Image serving routes with proper cache headers
 * Handles image requests with optimized caching for CDN images
 */

const express = require('express');
const router = express.Router();
const { getOptimizedImageUrl } = require('../utils/cloudinary.ts');

/**
 * Serve Cloudinary images with proper cache headers
 * This route acts as a proxy to add cache headers for Cloudinary images
 */
router.get('/cloudinary/:publicId(*)', async (req, res) => {
  try {
    const publicId = req.params.publicId;
    const { w, h, q, f } = req.query;

    // Generate optimized Cloudinary URL
    const imageUrl = getOptimizedImageUrl(publicId, {
      width: w ? parseInt(w) : undefined,
      height: h ? parseInt(h) : undefined,
      quality: q || 'auto:good',
      format: f || 'auto'
    });

    // Enhanced cache headers for optimal browser caching
    const oneYear = 365 * 24 * 60 * 60; // 1 year in seconds
    const oneWeek = 7 * 24 * 60 * 60; // 1 week in seconds
    
    // Use immutable for transformed images, shorter cache for originals
    const isTransformed = w || h || q || f;
    const maxAge = isTransformed ? oneYear : oneWeek;
    const cacheControl = isTransformed 
      ? `public, max-age=${maxAge}, immutable, stale-while-revalidate=86400`
      : `public, max-age=${maxAge}, stale-while-revalidate=86400`;
    
    res.setHeader('Cache-Control', cacheControl);
    res.setHeader('ETag', `"${publicId}-${w || 'auto'}-${h || 'auto'}-${q || 'auto'}-v2"`);
    res.setHeader('Vary', 'Accept-Encoding, Accept');
    res.setHeader('Last-Modified', new Date().toUTCString());
    
    // Enhanced CORS headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, If-None-Match, If-Modified-Since');
    res.setHeader('Access-Control-Expose-Headers', 'ETag, Last-Modified, Cache-Control');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Add Service Worker cache hints
    res.setHeader('X-SW-Cache-Strategy', 'cache-first');
    res.setHeader('X-SW-Cache-TTL', isTransformed ? '2592000' : '604800'); // 30 days vs 7 days

    // Handle conditional requests for better caching
    const ifNoneMatch = req.headers['if-none-match'];
    const currentETag = `"${publicId}-${w || 'auto'}-${h || 'auto'}-${q || 'auto'}-v2"`;
    
    if (ifNoneMatch === currentETag) {
      res.status(304).end();
      return;
    }

    // Redirect to Cloudinary URL with cache headers preserved
    res.redirect(301, imageUrl);
  } catch (error) {
    console.error('Error serving Cloudinary image:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to serve image', code: 'IMAGE_SERVE_ERROR' }
    });
  }
});

/**
 * Get image metadata and cache information
 */
router.get('/metadata/:publicId(*)', async (req, res) => {
  try {
    const publicId = req.params.publicId;
    
    // Set cache headers for metadata
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.setHeader('ETag', `"metadata-${publicId}"`);

    // Return image metadata
    res.json({
      success: true,
      data: {
        publicId,
        url: getOptimizedImageUrl(publicId),
        sizes: {
          thumb: getOptimizedImageUrl(publicId, { width: 150, height: 150 }),
          small: getOptimizedImageUrl(publicId, { width: 300, height: 300 }),
          medium: getOptimizedImageUrl(publicId, { width: 600, height: 600 }),
          large: getOptimizedImageUrl(publicId, { width: 1200, height: 1200 })
        }
      }
    });
  } catch (error) {
    console.error('Error getting image metadata:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get image metadata', code: 'METADATA_ERROR' }
    });
  }
});

/**
 * Warm cache for critical images
 * This endpoint can be called to preload important images
 */
router.post('/warm-cache', async (req, res) => {
  try {
    const { publicIds, priority = 'normal', sizes = ['thumb', 'small', 'medium'] } = req.body;
    
    if (!Array.isArray(publicIds)) {
      return res.status(400).json({
        success: false,
        error: { message: 'publicIds must be an array', code: 'INVALID_INPUT' }
      });
    }

    // Enhanced size configurations for different use cases
    const sizeConfigs = {
      thumb: { width: 150, height: 150, quality: 'auto:good', format: 'auto' },
      small: { width: 300, height: 300, quality: 'auto:good', format: 'auto' },
      medium: { width: 600, height: 600, quality: 'auto:good', format: 'auto' },
      large: { width: 1200, height: 1200, quality: 'auto:best', format: 'auto' },
      hero: { width: 1920, height: 1080, quality: 'auto:best', format: 'auto' }
    };

    // Generate URLs for different sizes with cache optimization
    const warmedUrls = [];
    const cacheHints = [];
    
    for (const publicId of publicIds) {
      for (const size of sizes) {
        if (!sizeConfigs[size]) continue;
        
        const config = sizeConfigs[size];
        const url = getOptimizedImageUrl(publicId, config);
        const proxyUrl = `/api/images/cloudinary/${publicId}?w=${config.width}&h=${config.height}&q=${config.quality}&f=${config.format}`;
        
        warmedUrls.push({ 
          publicId, 
          size, 
          url, 
          proxyUrl,
          priority,
          cacheStrategy: 'cache-first',
          ttl: priority === 'critical' ? 2592000 : 604800 // 30 days vs 7 days
        });
        
        cacheHints.push({
          url: proxyUrl,
          priority,
          preload: priority === 'critical'
        });
      }
    }

    // Set cache warming response headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Cache-Warming', 'true');
    res.setHeader('X-Cache-Priority', priority);

    res.json({
      success: true,
      data: {
        message: 'Cache warming URLs generated',
        urls: warmedUrls,
        cacheHints,
        count: warmedUrls.length,
        priority,
        timestamp: new Date().toISOString(),
        // Instructions for Service Worker
        serviceWorkerInstructions: {
          type: 'WARM_CACHE',
          urls: warmedUrls.map(item => item.proxyUrl),
          priority,
          strategy: 'cache-first'
        }
      }
    });
  } catch (error) {
    console.error('Error warming cache:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to warm cache', code: 'CACHE_WARM_ERROR' }
    });
  }
});

/**
 * Get critical images for immediate cache warming
 * Returns list of images that should be cached on app load
 */
router.get('/critical', async (req, res) => {
  try {
    // Set cache headers for critical images list
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60'); // 5 minutes cache
    res.setHeader('ETag', `"critical-images-v1"`);

    // Define critical images that should be cached immediately
    const criticalImages = [
      // Placeholder and fallback images
      {
        type: 'placeholder',
        publicId: 'keralagiftsonline/products/placeholder',
        priority: 'critical',
        sizes: ['thumb', 'small', 'medium']
      },
      // Category representative images
      {
        type: 'category',
        publicId: 'keralagiftsonline/products/wedding-cake',
        priority: 'high',
        sizes: ['thumb', 'small']
      },
      {
        type: 'category',
        publicId: 'keralagiftsonline/products/birthday-cake',
        priority: 'high',
        sizes: ['thumb', 'small']
      },
      {
        type: 'category',
        publicId: 'keralagiftsonline/products/chocolates',
        priority: 'high',
        sizes: ['thumb', 'small']
      },
      {
        type: 'category',
        publicId: 'keralagiftsonline/products/rose-bouquet',
        priority: 'high',
        sizes: ['thumb', 'small']
      },
      {
        type: 'category',
        publicId: 'keralagiftsonline/products/gift-basket-premium',
        priority: 'high',
        sizes: ['thumb', 'small']
      }
    ];

    // Generate URLs for critical images
    const criticalUrls = [];
    for (const image of criticalImages) {
      const sizeConfigs = {
        thumb: { width: 150, height: 150, quality: 'auto:good', format: 'auto' },
        small: { width: 300, height: 300, quality: 'auto:good', format: 'auto' },
        medium: { width: 600, height: 600, quality: 'auto:good', format: 'auto' }
      };

      for (const size of image.sizes) {
        const config = sizeConfigs[size];
        const url = getOptimizedImageUrl(image.publicId, config);
        const proxyUrl = `/api/images/cloudinary/${image.publicId}?w=${config.width}&h=${config.height}&q=${config.quality}&f=${config.format}`;
        
        criticalUrls.push({
          publicId: image.publicId,
          type: image.type,
          size,
          url,
          proxyUrl,
          priority: image.priority,
          cacheStrategy: 'cache-first',
          preload: image.priority === 'critical'
        });
      }
    }

    res.json({
      success: true,
      data: {
        message: 'Critical images for cache warming',
        images: criticalUrls,
        count: criticalUrls.length,
        timestamp: new Date().toISOString(),
        // Service Worker instructions
        serviceWorkerInstructions: {
          type: 'WARM_CRITICAL_CACHE',
          urls: criticalUrls.map(img => img.proxyUrl),
          strategy: 'cache-first',
          immediate: true
        }
      }
    });
  } catch (error) {
    console.error('Error getting critical images:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get critical images', code: 'CRITICAL_IMAGES_ERROR' }
    });
  }
});

module.exports = router;