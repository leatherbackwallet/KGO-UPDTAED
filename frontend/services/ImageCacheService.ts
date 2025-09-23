/**
 * Image Cache Service
 * Manages Service Worker image caching and cache warming for critical images
 */

import { getProductImage, getOptimizedImagePath } from '../utils/imageUtils';

export interface ImageCacheStats {
  imageCacheSize: number;
  criticalCacheSize: number;
  apiCacheSize: number;
  totalSize: number;
  cacheNames: string[];
  cacheDetails: Record<string, { size: number; entries: string[] }>;
  serviceWorkerActive: boolean;
}

export interface CacheWarmingOptions {
  sizes?: Array<'thumb' | 'small' | 'medium' | 'large'>;
  priority?: 'high' | 'normal' | 'low';
}

export class ImageCacheService {
  private serviceWorker: ServiceWorker | null = null;
  private isServiceWorkerSupported: boolean;

  constructor() {
    this.isServiceWorkerSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
    this.initializeServiceWorker();
  }

  /**
   * Initialize Service Worker for image caching
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!this.isServiceWorkerSupported || typeof navigator === 'undefined') {
      console.warn('Service Worker not supported in this browser');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw-image-cache.js', {
        scope: '/'
      });

      console.log('Image cache Service Worker registered:', registration);

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      this.serviceWorker = registration.active;

      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        console.log('New image cache Service Worker version available');
      });

    } catch (error) {
      console.error('Failed to register image cache Service Worker:', error);
    }
  }

  /**
   * Check if Service Worker is active and ready
   */
  isReady(): boolean {
    return this.isServiceWorkerSupported && this.serviceWorker !== null;
  }

  /**
   * Warm cache for critical product images
   */
  async warmCriticalImages(productImages: string[], options: CacheWarmingOptions = {}): Promise<void> {
    if (!this.isReady()) {
      console.warn('Service Worker not ready for cache warming');
      return;
    }

    const { sizes = ['thumb', 'small', 'medium'], priority = 'normal' } = options;
    const urlsToWarm: string[] = [];

    // Generate URLs for different sizes
    for (const imagePath of productImages) {
      if (!imagePath) continue;

      // Get the base image URL
      const baseUrl = getProductImage(imagePath);
      urlsToWarm.push(baseUrl);

      // If it's a Cloudinary image, generate optimized versions
      if (imagePath.startsWith('keralagiftsonline/products/')) {
        for (const size of sizes) {
          const optimizedUrl = getOptimizedImagePath(imagePath, size);
          urlsToWarm.push(optimizedUrl);
        }
      }
    }

    // Remove duplicates
    const uniqueUrls = Array.from(new Set(urlsToWarm));

    console.log(`Warming cache for ${uniqueUrls.length} images with priority: ${priority}`);

    // Send message to Service Worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'WARM_CACHE',
        data: { urls: uniqueUrls, priority }
      });
    }
  }

  /**
   * Warm cache for above-the-fold images using backend API
   */
  async warmAboveFoldImages(productIds: string[]): Promise<void> {
    if (!this.isReady()) {
      console.warn('ImageCacheService: Service Worker not ready for cache warming');
      return;
    }

    try {
      // Use backend cache warming endpoint for better optimization
      const response = await fetch('/api/images/warm-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicIds: productIds,
          priority: 'high',
          sizes: ['thumb', 'small'] // Only smaller sizes for above-the-fold
        })
      });

      if (!response.ok) {
        throw new Error(`Cache warming API failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data.urls) {
        const urls = data.data.urls.map((item: any) => item.proxyUrl);
        
        console.log(`ImageCacheService: Warming cache for ${urls.length} above-the-fold images`);

        // Send message to Service Worker with enhanced data
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'WARM_CACHE',
            data: { 
              urls, 
              priority: 'high',
              strategy: 'cache-first',
              source: 'above-fold'
            }
          });
        }
      }
    } catch (error) {
      console.error('ImageCacheService: Error warming above-the-fold cache:', error);
      
      // Fallback to direct URL generation
      const imagePaths = productIds.map(id => `keralagiftsonline/products/product-${id}`);
      await this.warmCriticalImages(imagePaths, {
        sizes: ['thumb', 'small'],
        priority: 'high'
      });
    }
  }

  /**
   * Warm critical images from backend API
   */
  async warmCriticalImagesFromAPI(): Promise<void> {
    if (!this.isReady()) {
      console.warn('ImageCacheService: Service Worker not ready for critical cache warming');
      return;
    }

    try {
      console.log('ImageCacheService: Fetching critical images from API');
      
      const response = await fetch('/api/images/critical');
      if (!response.ok) {
        throw new Error(`Critical images API failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data.images) {
        const criticalUrls = data.data.images
          .filter((img: any) => img.priority === 'critical')
          .map((img: any) => img.proxyUrl);
        
        console.log(`ImageCacheService: Warming ${criticalUrls.length} critical images`);

        // Send message to Service Worker
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'WARM_CRITICAL_CACHE',
            data: { 
              urls: criticalUrls,
              immediate: true
            }
          });
        }
      }
    } catch (error) {
      console.error('ImageCacheService: Error warming critical images from API:', error);
    }
  }

  /**
   * Preload images for a specific product
   */
  async preloadProductImages(productId: string, imagePaths: string[]): Promise<void> {
    if (!imagePaths.length) return;

    await this.warmCriticalImages(imagePaths, {
      sizes: ['small', 'medium'],
      priority: 'normal'
    });
  }

  /**
   * Clear image cache
   */
  async clearCache(): Promise<void> {
    if (!this.isReady()) {
      console.warn('Service Worker not ready for cache clearing');
      return;
    }

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_IMAGE_CACHE'
      });
    }

    console.log('Image cache clearing requested');
  }

  /**
   * Clear all caches including API cache
   */
  async clearAllCache(): Promise<void> {
    if (!this.isReady()) {
      console.warn('Service Worker not ready for cache clearing');
      return;
    }

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_ALL_CACHE'
      });
    }

    console.log('All cache clearing requested');
  }

  /**
   * Perform cache cleanup and optimization
   */
  async performCacheCleanup(): Promise<void> {
    if (!this.isReady()) {
      console.warn('Service Worker not ready for cache cleanup');
      return;
    }

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEANUP_CACHE'
      });
    }

    console.log('Cache cleanup requested');
  }

  /**
   * Get enhanced cache statistics
   */
  async getCacheStats(): Promise<ImageCacheStats> {
    const defaultStats: ImageCacheStats = {
      imageCacheSize: 0,
      criticalCacheSize: 0,
      apiCacheSize: 0,
      totalSize: 0,
      cacheNames: [],
      cacheDetails: {},
      serviceWorkerActive: this.isReady()
    };

    if (!this.isReady()) {
      return defaultStats;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_STATS') {
          resolve({
            ...event.data.data,
            serviceWorkerActive: true
          });
        }
      };

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_STATS' },
          [messageChannel.port2]
        );
      }

      // Timeout after 5 seconds
      setTimeout(() => resolve(defaultStats), 5000);
    });
  }

  /**
   * Check if an image is cached
   */
  async isImageCached(imageUrl: string): Promise<boolean> {
    if (!('caches' in window)) return false;

    try {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        if (cacheName.includes('product-images') || cacheName.includes('critical-images')) {
          const cache = await caches.open(cacheName);
          const response = await cache.match(imageUrl);
          if (response) return true;
        }
      }
      
      return false;
    } catch (error) {
      console.warn('Error checking image cache:', error);
      return false;
    }
  }

  /**
   * Manually cache an image
   */
  async cacheImage(imageUrl: string, cacheName: string = 'product-images-cache-v1'): Promise<boolean> {
    if (!('caches' in window)) return false;

    try {
      const cache = await caches.open(cacheName);
      const response = await fetch(imageUrl);
      
      if (response.ok) {
        await cache.put(imageUrl, response);
        console.log('Manually cached image:', imageUrl);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error manually caching image:', error);
      return false;
    }
  }

  /**
   * Get cached image as blob URL
   */
  async getCachedImageBlob(imageUrl: string): Promise<string | null> {
    if (!('caches' in window)) return null;

    try {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        if (cacheName.includes('product-images') || cacheName.includes('critical-images')) {
          const cache = await caches.open(cacheName);
          const response = await cache.match(imageUrl);
          
          if (response) {
            const blob = await response.blob();
            return URL.createObjectURL(blob);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Error getting cached image blob:', error);
      return null;
    }
  }

  /**
   * Monitor cache performance
   */
  async monitorCachePerformance(): Promise<{
    hitRate: number;
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
  }> {
    // This would typically be implemented with performance monitoring
    // For now, return mock data
    return {
      hitRate: 0.85,
      totalRequests: 100,
      cacheHits: 85,
      cacheMisses: 15
    };
  }

  /**
   * Optimize cache by removing old entries
   */
  async optimizeCache(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        if (cacheName.includes('product-images')) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          
          // Remove entries older than 30 days
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
          
          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              const cacheDate = response.headers.get('sw-cached');
              if (cacheDate && new Date(cacheDate).getTime() < thirtyDaysAgo) {
                await cache.delete(request);
                console.log('Removed old cached image:', request.url);
              }
            }
          }
        }
      }
      
      console.log('Cache optimization completed');
    } catch (error) {
      console.error('Error optimizing cache:', error);
    }
  }
}

// Export singleton instance
let imageCacheServiceInstance: ImageCacheService | null = null;

export const getImageCacheService = (): ImageCacheService => {
  if (!imageCacheServiceInstance) {
    imageCacheServiceInstance = new ImageCacheService();
  }
  return imageCacheServiceInstance;
};

export const imageCacheService = getImageCacheService();