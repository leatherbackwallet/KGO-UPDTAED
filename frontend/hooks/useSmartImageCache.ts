/**
 * React Hook for Smart Image Caching
 * Provides a simple interface for using the smart image cache in React components
 */

import { useState, useEffect, useCallback } from 'react';
import smartImageCache from '../utils/smartImageCache';
import { DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';

interface UseSmartImageCacheOptions {
  preload?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

interface UseSmartImageCacheReturn {
  imageUrl: string;
  isLoading: boolean;
  isCached: boolean;
  error: Error | null;
  preload: () => Promise<void>;
}

/**
 * Hook for smart image caching
 */
export function useSmartImageCache(
  imagePath?: string,
  productSlug?: string,
  options: UseSmartImageCacheOptions = {}
): UseSmartImageCacheReturn {
  const { preload: shouldPreload = false, priority = 'normal' } = options;
  
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_PRODUCT_IMAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getImageUrl = useCallback(() => {
    if (!imagePath) {
      setImageUrl(DEFAULT_PRODUCT_IMAGE);
      setIsCached(false);
      return;
    }

    try {
      const url = smartImageCache.getImageUrl(imagePath, productSlug);
      setImageUrl(url);
      setIsCached(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setImageUrl(DEFAULT_PRODUCT_IMAGE);
      setIsCached(false);
    }
  }, [imagePath, productSlug]);

  const preloadImage = useCallback(async () => {
    if (!imagePath) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = await smartImageCache.preloadImage(imagePath, productSlug);
      setImageUrl(url);
      setIsCached(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to preload image'));
      setImageUrl(DEFAULT_PRODUCT_IMAGE);
      setIsCached(false);
    } finally {
      setIsLoading(false);
    }
  }, [imagePath, productSlug]);

  // Get initial image URL
  useEffect(() => {
    getImageUrl();
  }, [getImageUrl]);

  // Preload if requested
  useEffect(() => {
    if (shouldPreload && imagePath && !isCached) {
      preloadImage();
    }
  }, [shouldPreload, imagePath, isCached, preloadImage]);

  return {
    imageUrl,
    isLoading,
    isCached,
    error,
    preload: preloadImage
  };
}

/**
 * Hook for preloading multiple images
 */
export function usePreloadImages() {
  const [isPreloading, setIsPreloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const preloadImages = useCallback(async (
    imagePaths: string[],
    productSlugs?: string[]
  ) => {
    if (imagePaths.length === 0) return;

    setIsPreloading(true);
    setProgress(0);

    try {
      await smartImageCache.preloadImages(imagePaths, productSlugs);
      setProgress(100);
    } catch (error) {
      console.error('Failed to preload images:', error);
    } finally {
      setIsPreloading(false);
    }
  }, []);

  return {
    preloadImages,
    isPreloading,
    progress
  };
}

/**
 * Hook for cache management
 */
export function useCacheManagement() {
  const [stats, setStats] = useState(smartImageCache.getStats());

  const refreshStats = useCallback(() => {
    setStats(smartImageCache.getStats());
  }, []);

  const clearExpired = useCallback(() => {
    smartImageCache.clearExpired();
    refreshStats();
  }, [refreshStats]);

  const clearAll = useCallback(() => {
    smartImageCache.clearAll();
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
    clearExpired,
    clearAll
  };
}
