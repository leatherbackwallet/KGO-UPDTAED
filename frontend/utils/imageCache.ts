/**
 * Image Caching Utility
 * Provides caching for product images to reduce API calls and improve performance
 * Uses React's built-in features without external dependencies
 */

import { useState, useEffect, useCallback } from 'react';
import { getProductImage } from './imageUtils';

interface ImageCacheOptions {
  staleTime?: number;
  enabled?: boolean;
}

// Simple in-memory cache
const imageCache = new Map<string, { data: string; timestamp: number; staleTime: number }>();

/**
 * Custom hook for caching product images
 * @param imagePath - Image path or URL
 * @param slug - Product slug for fallback
 * @param options - Cache options
 * @returns Cached image data
 */
export function useImageCache(
  imagePath?: string, 
  slug?: string, 
  options: ImageCacheOptions = {}
) {
  const {
    staleTime = 1000 * 60 * 60 * 24, // 24 hours
    enabled = true
  } = options;

  const [data, setData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchImage = useCallback(async () => {
    if (!imagePath || !enabled) {
      setData(null);
      return;
    }

    const cacheKey = `image-${imagePath}-${slug}`;
    const cached = imageCache.get(cacheKey);
    const now = Date.now();

    // Check if we have a valid cached version
    if (cached && (now - cached.timestamp) < cached.staleTime) {
      setData(cached.data);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const imageUrl = getProductImage(imagePath, slug);
      
      // For external URLs, we can preload the image
      if (imageUrl.startsWith('http')) {
        await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(imageUrl);
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = imageUrl;
        });
      }
      
      // Cache the result
      imageCache.set(cacheKey, {
        data: imageUrl,
        timestamp: now,
        staleTime
      });
      
      setData(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [imagePath, slug, enabled, staleTime]);

  useEffect(() => {
    fetchImage();
  }, [fetchImage]);

  return { data, isLoading, error, refetch: fetchImage };
}

/**
 * Preload multiple images
 * @param imageUrls - Array of image URLs to preload
 */
export function preloadImages(imageUrls: string[]): Promise<void[]> {
  const promises = imageUrls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
      img.src = url;
    });
  });
  
  return Promise.all(promises);
}

/**
 * Cache image in browser's cache storage (Service Worker compatible)
 * @param imageUrl - Image URL to cache
 * @param cacheName - Cache name
 */
export async function cacheImage(imageUrl: string, cacheName: string = 'product-images'): Promise<void> {
  if ('caches' in window) {
    try {
      const cache = await caches.open(cacheName);
      await cache.add(imageUrl);
    } catch (error) {
      console.warn('Failed to cache image:', error);
    }
  }
}

/**
 * Get cached image from browser cache
 * @param imageUrl - Image URL to retrieve
 * @param cacheName - Cache name
 */
export async function getCachedImage(imageUrl: string, cacheName: string = 'product-images'): Promise<Response | null> {
  if ('caches' in window) {
    try {
      const cache = await caches.open(cacheName);
      const response = await cache.match(imageUrl);
      return response || null;
    } catch (error) {
      console.warn('Failed to get cached image:', error);
      return null;
    }
  }
  return null;
}

/**
 * Clear image cache
 * @param cacheName - Cache name to clear
 */
export async function clearImageCache(cacheName: string = 'product-images'): Promise<void> {
  if ('caches' in window) {
    try {
      await caches.delete(cacheName);
    } catch (error) {
      console.warn('Failed to clear image cache:', error);
    }
  }
}

/**
 * Clear in-memory cache
 */
export function clearMemoryCache(): void {
  imageCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: imageCache.size,
    entries: Array.from(imageCache.keys())
  };
}
