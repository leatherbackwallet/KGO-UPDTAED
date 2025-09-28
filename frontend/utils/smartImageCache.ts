/**
 * Smart Image Cache System
 * Provides intelligent caching for product images with cache-first strategy
 * Uses browser's built-in caching mechanisms and localStorage for metadata
 */

import { getOptimizedImagePath, DEFAULT_PRODUCT_IMAGE } from './imageUtils';

interface CacheEntry {
  url: string;
  timestamp: number;
  size: number;
  loaded: boolean;
}

interface CacheStats {
  totalImages: number;
  cachedImages: number;
  cacheHitRate: number;
  totalSize: number;
}

class SmartImageCache {
  private cache = new Map<string, CacheEntry>();
  private maxCacheSize = 50; // Maximum number of images to cache
  private maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private preloadQueue: string[] = [];
  private isPreloading = false;

  constructor() {
    this.loadFromStorage();
    this.setupCleanup();
  }

  /**
   * Get cached image URL or return optimized URL
   */
  getImageUrl(imagePath: string, productSlug?: string): string {
    if (!imagePath) return DEFAULT_PRODUCT_IMAGE;

    const cacheKey = this.getCacheKey(imagePath, productSlug);
    const cached = this.cache.get(cacheKey);

    // Return cached URL if valid and not expired
    if (cached && this.isValidCacheEntry(cached)) {
      return cached.url;
    }

    // Return optimized URL for immediate loading
    const optimizedUrl = getOptimizedImagePath(imagePath, 'medium');
    
    // Queue for preloading if not already cached
    if (!cached || !cached.loaded) {
      this.queueForPreload(optimizedUrl, cacheKey);
    }

    return optimizedUrl;
  }

  /**
   * Preload image and cache it
   */
  async preloadImage(imagePath: string, productSlug?: string): Promise<string> {
    if (!imagePath) return DEFAULT_PRODUCT_IMAGE;

    const cacheKey = this.getCacheKey(imagePath, productSlug);
    const cached = this.cache.get(cacheKey);

    // Return cached URL if already loaded
    if (cached && cached.loaded && this.isValidCacheEntry(cached)) {
      return cached.url;
    }

    const optimizedUrl = getOptimizedImagePath(imagePath, 'medium');

    try {
      // Preload the image
      await this.loadImage(optimizedUrl);
      
      // Cache the successful load
      this.cache.set(cacheKey, {
        url: optimizedUrl,
        timestamp: Date.now(),
        size: 0, // We don't track actual size for simplicity
        loaded: true
      });

      this.saveToStorage();
      return optimizedUrl;
    } catch (error) {
      // If preload fails, return the URL anyway for immediate loading
      return optimizedUrl;
    }
  }

  /**
   * Preload multiple images with priority
   */
  async preloadImages(imagePaths: string[], productSlugs?: string[]): Promise<void> {
    const preloadPromises = imagePaths.map((imagePath, index) => {
      const slug = productSlugs?.[index];
      return this.preloadImage(imagePath, slug);
    });

    // Preload in batches to avoid overwhelming the browser
    const batchSize = 3;
    for (let i = 0; i < preloadPromises.length; i += batchSize) {
      const batch = preloadPromises.slice(i, i + batchSize);
      await Promise.allSettled(batch);
      
      // Small delay between batches to prevent blocking
      if (i + batchSize < preloadPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalImages = this.cache.size;
    const cachedImages = Array.from(this.cache.values()).filter(entry => entry.loaded).length;
    const cacheHitRate = totalImages > 0 ? (cachedImages / totalImages) * 100 : 0;
    const totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);

    return {
      totalImages,
      cachedImages,
      cacheHitRate,
      totalSize
    };
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      this.saveToStorage();
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  private getCacheKey(imagePath: string, productSlug?: string): string {
    return `${imagePath}-${productSlug || 'default'}`;
  }

  private isValidCacheEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    return entry.loaded && (now - entry.timestamp) < this.maxAge;
  }

  private async loadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  private queueForPreload(url: string, cacheKey: string): void {
    if (!this.preloadQueue.includes(cacheKey)) {
      this.preloadQueue.push(cacheKey);
    }

    if (!this.isPreloading) {
      this.processPreloadQueue();
    }
  }

  private async processPreloadQueue(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) return;

    this.isPreloading = true;

    while (this.preloadQueue.length > 0) {
      const cacheKey = this.preloadQueue.shift()!;
      const entry = this.cache.get(cacheKey);

      if (entry && !entry.loaded) {
        try {
          await this.loadImage(entry.url);
          entry.loaded = true;
          entry.timestamp = Date.now();
          this.cache.set(cacheKey, entry);
        } catch (error) {
          // Silently handle preload failures
        }
      }

      // Small delay between preloads
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.isPreloading = false;
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('smart-image-cache');
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data);
      }
    } catch (error) {
      // Silently handle storage errors
    }
  }

  private saveToStorage(): void {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem('smart-image-cache', JSON.stringify(data));
    } catch (error) {
      // Silently handle storage errors
    }
  }

  private setupCleanup(): void {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Clean up expired entries every hour
    setInterval(() => {
      this.clearExpired();
    }, 60 * 60 * 1000);

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.clearExpired();
    });
  }
}

// Create singleton instance
const smartImageCache = new SmartImageCache();

export default smartImageCache;
export type { CacheStats };
