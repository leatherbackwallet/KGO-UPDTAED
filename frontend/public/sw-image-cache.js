/**
 * Enhanced Service Worker for Image Caching
 * Provides offline image access and advanced cache management for product images
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `product-images-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `product-images-cache-${CACHE_VERSION}`;
const CRITICAL_IMAGES_CACHE = `critical-images-${CACHE_VERSION}`;
const API_CACHE_NAME = `api-cache-${CACHE_VERSION}`;

// Enhanced cache configuration
const CACHE_CONFIG = {
  // Critical images cached immediately on install
  critical: {
    cacheName: CRITICAL_IMAGES_CACHE,
    strategy: 'cache-first',
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 50
  },
  // Product images with longer TTL
  images: {
    cacheName: IMAGE_CACHE_NAME,
    strategy: 'cache-first',
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 500
  },
  // API responses for image metadata
  api: {
    cacheName: API_CACHE_NAME,
    strategy: 'network-first',
    ttl: 60 * 60 * 1000, // 1 hour
    maxEntries: 100
  }
};

// URLs to cache immediately when SW is installed
const CRITICAL_IMAGES = [
  '/images/products/placeholder.svg',
  '/images/products/wedding-cake.svg',
  '/images/products/birthday-cake.svg',
  '/images/products/chocolates.svg',
  '/images/products/rose-bouquet.svg',
  '/images/products/gift-basket-premium.svg'
];

// Cloudinary base URL pattern
const CLOUDINARY_PATTERN = /^https:\/\/res\.cloudinary\.com\/deojqbepy\/image\/upload\//;

self.addEventListener('install', (event) => {
  console.log('[SW] Installing enhanced image cache service worker');
  
  event.waitUntil(
    Promise.all([
      // Cache critical static images immediately
      caches.open(CRITICAL_IMAGES_CACHE).then(async (cache) => {
        console.log('[SW] Caching critical static images');
        try {
          await cache.addAll(CRITICAL_IMAGES);
          console.log('[SW] Critical static images cached successfully');
        } catch (error) {
          console.warn('[SW] Some critical images failed to cache:', error);
        }
      }),
      // Fetch and cache critical product images from API
      fetchAndCacheCriticalImages(),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating enhanced image cache service worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      // Initialize cache management
      initializeCacheManagement(),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith('/api/images/')) {
    // API image proxy requests - enhanced caching
    event.respondWith(handleApiImageRequest(request));
  } else if (CLOUDINARY_PATTERN.test(request.url)) {
    // Direct Cloudinary images - cache with long TTL
    event.respondWith(handleCloudinaryImage(request));
  } else if (url.pathname.startsWith('/images/')) {
    // Local static images - cache permanently
    event.respondWith(handleStaticImage(request));
  } else if (isImageRequest(request)) {
    // Other image requests - generic image handling
    event.respondWith(handleGenericImage(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API requests for image metadata
    event.respondWith(handleApiRequest(request));
  }
});

/**
 * Check if request is for an image
 */
function isImageRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();
  
  // Check file extension
  if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    return true;
  }
  
  // Check Cloudinary URLs
  if (CLOUDINARY_PATTERN.test(request.url)) {
    return true;
  }
  
  // Check Accept header
  const acceptHeader = request.headers.get('Accept') || '';
  if (acceptHeader.includes('image/')) {
    return true;
  }
  
  return false;
}

/**
 * Handle Cloudinary image requests with cache-first strategy
 */
async function handleCloudinaryImage(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving Cloudinary image from cache:', request.url);
      
      // Check if cached response is still fresh (less than 1 week old)
      const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
      const now = new Date();
      const weekInMs = 7 * 24 * 60 * 60 * 1000;
      
      if (now - cacheDate < weekInMs) {
        return cachedResponse;
      }
    }
    
    // Fetch from network
    console.log('[SW] Fetching Cloudinary image from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response before caching
      const responseToCache = networkResponse.clone();
      
      // Add custom headers for cache management
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached', new Date().toISOString());
      headers.set('sw-cache-type', 'cloudinary');
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      // Cache the response
      await cache.put(request, cachedResponse);
      console.log('[SW] Cached Cloudinary image:', request.url);
      
      return networkResponse;
    }
    
    // If network fails and we have a stale cache, use it
    if (cachedResponse) {
      console.log('[SW] Network failed, serving stale Cloudinary image:', request.url);
      return cachedResponse;
    }
    
    // Return network response even if not ok (for proper error handling)
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Error handling Cloudinary image:', error);
    
    // Try to serve from cache as fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving cached Cloudinary image as fallback:', request.url);
      return cachedResponse;
    }
    
    // Return a placeholder or error response
    return new Response('Image not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Handle static image requests with cache-first strategy
 */
async function handleStaticImage(request) {
  const cache = await caches.open(CRITICAL_IMAGES_CACHE);
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving static image from cache:', request.url);
      return cachedResponse;
    }
    
    // Fetch from network
    console.log('[SW] Fetching static image from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      await cache.put(request, networkResponse.clone());
      console.log('[SW] Cached static image:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Error handling static image:', error);
    
    // Try to serve from cache as fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving cached static image as fallback:', request.url);
      return cachedResponse;
    }
    
    // Return error response
    return new Response('Image not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Handle messages from the main thread
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'WARM_CACHE':
      handleCacheWarming(data.urls, data.priority);
      break;
      
    case 'WARM_CRITICAL_CACHE':
      handleCriticalCacheWarming();
      break;
      
    case 'CLEAR_IMAGE_CACHE':
      clearImageCache();
      break;
      
    case 'CLEAR_ALL_CACHE':
      clearAllCache();
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage({ type: 'CACHE_STATS', data: stats });
      });
      break;
      
    case 'CLEANUP_CACHE':
      performCacheCleanup();
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Warm cache by preloading images
 */
async function handleCacheWarming(urls, priority = 'normal') {
  console.log('[SW] Warming cache for', urls.length, 'images with priority:', priority);
  
  const cacheName = priority === 'critical' ? CRITICAL_IMAGES_CACHE : IMAGE_CACHE_NAME;
  const cache = await caches.open(cacheName);
  
  // Process in batches to avoid overwhelming the network
  const batchSize = priority === 'critical' ? 10 : 5;
  const batches = [];
  
  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    const promises = batch.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const responseToCache = addCacheHeaders(response.clone());
          await cache.put(url, responseToCache);
          console.log('[SW] Warmed cache for:', url);
        }
      } catch (error) {
        console.warn('[SW] Failed to warm cache for:', url, error);
      }
    });
    
    await Promise.allSettled(promises);
    
    // Small delay between batches to be nice to the network
    if (priority !== 'critical') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('[SW] Cache warming completed for priority:', priority);
}

/**
 * Handle critical cache warming from API
 */
async function handleCriticalCacheWarming() {
  console.log('[SW] Starting critical cache warming from API');
  
  try {
    const response = await fetch('/api/images/critical');
    if (!response.ok) {
      console.warn('[SW] Failed to fetch critical images from API');
      return;
    }
    
    const data = await response.json();
    if (data.success && data.data.images) {
      const criticalUrls = data.data.images
        .filter(img => img.priority === 'critical')
        .map(img => img.proxyUrl);
      
      await handleCacheWarming(criticalUrls, 'critical');
    }
  } catch (error) {
    console.error('[SW] Error in critical cache warming:', error);
  }
}

/**
 * Clear image cache
 */
async function clearImageCache() {
  console.log('[SW] Clearing image cache');
  
  await Promise.all([
    caches.delete(IMAGE_CACHE_NAME),
    caches.delete(CRITICAL_IMAGES_CACHE)
  ]);
  
  console.log('[SW] Image cache cleared');
}

/**
 * Clear all caches
 */
async function clearAllCache() {
  console.log('[SW] Clearing all caches');
  
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
  
  await Promise.all(deletePromises);
  console.log('[SW] All caches cleared');
}

/**
 * Perform comprehensive cache cleanup
 */
async function performCacheCleanup() {
  console.log('[SW] Performing cache cleanup');
  
  await Promise.all([
    cleanupExpiredEntries(),
    enforceCacheLimits(),
    cleanupOldCaches()
  ]);
  
  console.log('[SW] Cache cleanup completed');
}

/**
 * Fetch and cache critical images from API
 */
async function fetchAndCacheCriticalImages() {
  try {
    console.log('[SW] Fetching critical images from API');
    const response = await fetch('/api/images/critical');
    
    if (!response.ok) {
      console.warn('[SW] Failed to fetch critical images from API');
      return;
    }
    
    const data = await response.json();
    if (data.success && data.data.images) {
      const cache = await caches.open(CRITICAL_IMAGES_CACHE);
      const promises = data.data.images
        .filter(img => img.priority === 'critical')
        .map(async (img) => {
          try {
            const imgResponse = await fetch(img.proxyUrl);
            if (imgResponse.ok) {
              await cache.put(img.proxyUrl, imgResponse);
              console.log('[SW] Cached critical image:', img.proxyUrl);
            }
          } catch (error) {
            console.warn('[SW] Failed to cache critical image:', img.proxyUrl, error);
          }
        });
      
      await Promise.allSettled(promises);
      console.log('[SW] Critical images caching completed');
    }
  } catch (error) {
    console.error('[SW] Error fetching critical images:', error);
  }
}

/**
 * Clean up old caches
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [CACHE_NAME, IMAGE_CACHE_NAME, CRITICAL_IMAGES_CACHE, API_CACHE_NAME];
  
  const deletePromises = cacheNames.map((cacheName) => {
    if (cacheName.startsWith('product-images-') || 
        cacheName.startsWith('critical-images-') ||
        cacheName.startsWith('api-cache-')) {
      if (!currentCaches.includes(cacheName)) {
        console.log('[SW] Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      }
    }
  });
  
  await Promise.all(deletePromises);
  console.log('[SW] Cache cleanup completed');
}

/**
 * Initialize cache management
 */
async function initializeCacheManagement() {
  // Set up periodic cache cleanup
  console.log('[SW] Initializing cache management');
  
  // Clean up expired entries
  await cleanupExpiredEntries();
  
  // Enforce cache size limits
  await enforceCacheLimits();
}

/**
 * Handle API image requests with enhanced caching
 */
async function handleApiImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const url = new URL(request.url);
  
  try {
    // Check for cache strategy hints from headers
    const cacheStrategy = getCacheStrategyFromUrl(url);
    
    if (cacheStrategy === 'cache-first') {
      return await handleCacheFirstStrategy(request, cache);
    } else {
      return await handleNetworkFirstStrategy(request, cache);
    }
  } catch (error) {
    console.error('[SW] Error handling API image request:', error);
    return handleImageFallback(request, cache);
  }
}

/**
 * Handle generic image requests
 */
async function handleGenericImage(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  
  try {
    // Try cache first for generic images
    const cachedResponse = await cache.match(request);
    if (cachedResponse && !isExpired(cachedResponse)) {
      console.log('[SW] Serving generic image from cache:', request.url);
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache with appropriate headers
      const responseToCache = addCacheHeaders(networkResponse.clone());
      await cache.put(request, responseToCache);
      console.log('[SW] Cached generic image:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Error handling generic image:', error);
    return handleImageFallback(request, cache);
  }
}

/**
 * Handle API requests for image metadata
 */
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Network first for API requests
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      // Cache only GET API responses with shorter TTL
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      console.log('[SW] Cached API response:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Network failed for API request:', error);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving API response from cache:', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Cache-first strategy implementation
 */
async function handleCacheFirstStrategy(request, cache) {
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse)) {
    console.log('[SW] Cache-first: serving from cache:', request.url);
    
    // Update cache in background if stale
    if (isStale(cachedResponse)) {
      updateCacheInBackground(request, cache);
    }
    
    return cachedResponse;
  }
  
  // Fetch from network
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    const responseToCache = addCacheHeaders(networkResponse.clone());
    await cache.put(request, responseToCache);
    console.log('[SW] Cache-first: cached from network:', request.url);
  }
  
  return networkResponse;
}

/**
 * Network-first strategy implementation
 */
async function handleNetworkFirstStrategy(request, cache) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = addCacheHeaders(networkResponse.clone());
      await cache.put(request, responseToCache);
      console.log('[SW] Network-first: cached from network:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network-first: falling back to cache:', request.url);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Handle image fallback when all else fails
 */
async function handleImageFallback(request, cache) {
  // Try to serve placeholder from critical cache
  const criticalCache = await caches.open(CRITICAL_IMAGES_CACHE);
  const placeholder = await criticalCache.match('/images/products/placeholder.svg');
  
  if (placeholder) {
    console.log('[SW] Serving placeholder for failed image:', request.url);
    return placeholder;
  }
  
  // Return error response
  return new Response('Image not available offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

/**
 * Get cache strategy from URL parameters
 */
function getCacheStrategyFromUrl(url) {
  const strategy = url.searchParams.get('cache-strategy');
  return strategy || 'cache-first';
}

/**
 * Check if cached response is expired
 */
function isExpired(response) {
  const cacheDate = new Date(response.headers.get('sw-cached') || 0);
  const ttl = parseInt(response.headers.get('sw-ttl') || '604800000'); // Default 7 days
  return Date.now() - cacheDate.getTime() > ttl;
}

/**
 * Check if cached response is stale but not expired
 */
function isStale(response) {
  const cacheDate = new Date(response.headers.get('sw-cached') || 0);
  const staleTime = 24 * 60 * 60 * 1000; // 24 hours
  return Date.now() - cacheDate.getTime() > staleTime;
}

/**
 * Update cache in background
 */
function updateCacheInBackground(request, cache) {
  // Don't await this - it's a background operation
  fetch(request).then(response => {
    if (response.ok) {
      const responseToCache = addCacheHeaders(response.clone());
      cache.put(request, responseToCache);
      console.log('[SW] Background cache update:', request.url);
    }
  }).catch(error => {
    console.warn('[SW] Background cache update failed:', request.url, error);
  });
}

/**
 * Add cache management headers to response
 */
function addCacheHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached', new Date().toISOString());
  headers.set('sw-cache-type', 'image');
  headers.set('sw-ttl', '604800000'); // 7 days default
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

/**
 * Clean up expired cache entries
 */
async function cleanupExpiredEntries() {
  const cacheNames = [IMAGE_CACHE_NAME, CRITICAL_IMAGES_CACHE, API_CACHE_NAME];
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response && isExpired(response)) {
          await cache.delete(request);
          console.log('[SW] Deleted expired cache entry:', request.url);
        }
      }
    } catch (error) {
      console.error('[SW] Error cleaning up expired entries:', error);
    }
  }
}

/**
 * Enforce cache size limits
 */
async function enforceCacheLimits() {
  for (const [configKey, config] of Object.entries(CACHE_CONFIG)) {
    try {
      const cache = await caches.open(config.cacheName);
      const requests = await cache.keys();
      
      if (requests.length > config.maxEntries) {
        // Sort by last accessed time and remove oldest entries
        const entriesToRemove = requests.length - config.maxEntries;
        const oldestRequests = requests.slice(0, entriesToRemove);
        
        for (const request of oldestRequests) {
          await cache.delete(request);
          console.log('[SW] Removed cache entry due to size limit:', request.url);
        }
      }
    } catch (error) {
      console.error('[SW] Error enforcing cache limits:', error);
    }
  }
}

/**
 * Get enhanced cache statistics
 */
async function getCacheStats() {
  const stats = {
    imageCacheSize: 0,
    criticalCacheSize: 0,
    apiCacheSize: 0,
    totalSize: 0,
    cacheNames: [],
    cacheDetails: {}
  };
  
  try {
    const cacheNames = await caches.keys();
    stats.cacheNames = cacheNames;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      const size = keys.length;
      
      stats.cacheDetails[cacheName] = {
        size,
        entries: keys.map(key => key.url)
      };
      
      if (cacheName === IMAGE_CACHE_NAME) {
        stats.imageCacheSize = size;
      } else if (cacheName === CRITICAL_IMAGES_CACHE) {
        stats.criticalCacheSize = size;
      } else if (cacheName === API_CACHE_NAME) {
        stats.apiCacheSize = size;
      }
      
      stats.totalSize += size;
    }
  } catch (error) {
    console.error('[SW] Error getting cache stats:', error);
  }
  
  return stats;
}