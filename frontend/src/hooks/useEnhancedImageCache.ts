/**
 * Enhanced Image Cache Hook
 * Integrates multi-level caching with Service Worker image caching
 */

import { useState, useEffect, useCallback } from 'react';
import { getProductImage } from '../utils/imageUtils';
import { imageCacheService } from '../services/ImageCacheService';
import { cacheManager } from '../services/CacheManager';

interface EnhancedImageCacheOptions {
  staleTime?: number;
  enabled?: boolean;
  priority?: 'high' | 'normal' | 'low';
  sizes?: Array<'thumb' | 'small' | 'medium' | 'large'>;
  warmCache?: boolean;
}

interface EnhancedImageCacheResult {
  data: string | null;
  isLoading: boolean;
  error: Error | null;
  isCached: boolean;
  refetch: () => Promise<void>;
  warmCache: () => Promise<void>;
}

/**
 * Enhanced hook for caching product images with multi-level caching
 */
export function useEnhancedImageCache(
  imagePath?: string,
  slug?: string,
  options: EnhancedImageCacheOptions = {}
): EnhancedImageCacheResult {
  const {
    staleTime = 1000 * 60 * 60 * 24, // 24 hours
    enabled = true,
    priority = 'normal',
    sizes = ['small', 'medium'],
    warmCache = false
  } = options;

  const [data, setData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);

  const cacheKey = `enhanced-image-${imagePath}-${slug}`;

  const fetchImage = useCallback(async () => {
    if (!imagePath || !enabled) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, try to get from multi-level cache
      const cachedData = await cacheManager.get<string>(cacheKey);
      
      if (cachedData) {
        setData(cachedData);
        setIsCached(true);
        setIsLoading(false);
        return;
      }

      // Generate the image URL
      const imageUrl = getProductImage(imagePath, slug);
      
      // Check if image is cached in Service Worker
      const isSwCached = await imageCacheService.isImageCached(imageUrl);
      
      if (isSwCached) {
        // Try to get cached blob URL for better performance
        const blobUrl = await imageCacheService.getCachedImageBlob(imageUrl);
        const finalUrl = blobUrl || imageUrl;
        
        setData(finalUrl);
        setIsCached(true);
        
        // Cache in multi-level cache for faster future access
        await cacheManager.set(cacheKey, finalUrl, { 
          ttl: staleTime,
          priority: priority as 'high' | 'normal' | 'low'
        });
      } else {
        // Load image and verify it exists
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            setData(imageUrl);
            setIsCached(false);
            resolve();
          };
          img.onerror = () => {
            reject(new Error('Failed to load image'));
          };
          img.src = imageUrl;
        });

        // Cache in both multi-level cache and Service Worker
        await Promise.all([
          cacheManager.set(cacheKey, imageUrl, { 
            ttl: staleTime,
            priority: priority as 'high' | 'normal' | 'low'
          }),
          imageCacheService.cacheImage(imageUrl)
        ]);
      }

      // Warm cache for different sizes if requested
      if (warmCache && imagePath.startsWith('keralagiftsonline/products/')) {
        await imageCacheService.warmCriticalImages([imagePath], {
          sizes,
          priority
        });
      }

    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      setError(errorObj);
      console.error('Enhanced image cache error:', errorObj);
    } finally {
      setIsLoading(false);
    }
  }, [imagePath, slug, enabled, staleTime, cacheKey, priority, sizes, warmCache]);

  const warmCacheManually = useCallback(async () => {
    if (!imagePath) return;

    try {
      if (imagePath.startsWith('keralagiftsonline/products/')) {
        await imageCacheService.warmCriticalImages([imagePath], {
          sizes,
          priority
        });
      } else {
        const imageUrl = getProductImage(imagePath, slug);
        await imageCacheService.cacheImage(imageUrl);
      }
    } catch (error) {
      console.error('Error warming cache manually:', error);
    }
  }, [imagePath, slug, sizes, priority]);

  useEffect(() => {
    fetchImage();
  }, [fetchImage]);

  return {
    data,
    isLoading,
    error,
    isCached,
    refetch: fetchImage,
    warmCache: warmCacheManually
  };
}

/**
 * Hook for warming cache for multiple images
 */
export function useImageCacheWarming() {
  const [isWarming, setIsWarming] = useState(false);

  const warmImages = useCallback(async (
    imagePaths: string[],
    options: EnhancedImageCacheOptions = {}
  ) => {
    setIsWarming(true);
    
    try {
      await imageCacheService.warmCriticalImages(imagePaths, {
        sizes: options.sizes || ['thumb', 'small'],
        priority: options.priority || 'normal'
      });
    } catch (error) {
      console.error('Error warming image cache:', error);
    } finally {
      setIsWarming(false);
    }
  }, []);

  const warmAboveFoldImages = useCallback(async (productIds: string[]) => {
    setIsWarming(true);
    
    try {
      await imageCacheService.warmAboveFoldImages(productIds);
    } catch (error) {
      console.error('Error warming above-fold images:', error);
    } finally {
      setIsWarming(false);
    }
  }, []);

  const warmCriticalImages = useCallback(async () => {
    setIsWarming(true);
    
    try {
      await imageCacheService.warmCriticalImagesFromAPI();
    } catch (error) {
      console.error('Error warming critical images from API:', error);
    } finally {
      setIsWarming(false);
    }
  }, []);

  return {
    warmImages,
    warmAboveFoldImages,
    warmCriticalImages,
    isWarming
  };
}

/**
 * Hook for cache statistics and management
 */
export function useImageCacheStats() {
  const [stats, setStats] = useState({
    imageCacheSize: 0,
    criticalCacheSize: 0,
    totalSize: 0,
    cacheNames: [] as string[],
    serviceWorkerActive: false
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const refreshStats = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const cacheStats = await imageCacheService.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Error getting cache stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await imageCacheService.clearCache();
      await refreshStats();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [refreshStats]);

  const clearAllCache = useCallback(async () => {
    try {
      await imageCacheService.clearAllCache();
      await refreshStats();
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }, [refreshStats]);

  const performCacheCleanup = useCallback(async () => {
    try {
      await imageCacheService.performCacheCleanup();
      await refreshStats();
    } catch (error) {
      console.error('Error performing cache cleanup:', error);
    }
  }, [refreshStats]);

  const optimizeCache = useCallback(async () => {
    try {
      await imageCacheService.optimizeCache();
      await refreshStats();
    } catch (error) {
      console.error('Error optimizing cache:', error);
    }
  }, [refreshStats]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    isLoading,
    refreshStats,
    clearCache,
    clearAllCache,
    performCacheCleanup,
    optimizeCache
  };
}