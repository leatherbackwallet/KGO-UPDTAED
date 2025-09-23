/**
 * React Hook for ImageManager
 * Provides easy access to robust image loading with fallback chains
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { imageManager, ImageLoadOptions, ImageLoadResult, ImageLoadingState } from '../services';

export interface UseImageManagerOptions extends ImageLoadOptions {
  enabled?: boolean;
  fallbackUrls?: string[];
}

export interface UseImageManagerReturn {
  imageUrl: string | null;
  loading: boolean;
  loaded: boolean;
  error: Error | null;
  cached: boolean;
  fallbackUsed: boolean;
  progress: number;
  source: 'primary' | 'fallback' | 'placeholder';
  reload: () => void;
  cancel: () => void;
}

/**
 * Hook for loading images with robust fallback chain
 */
export function useImageManager(
  primaryUrl: string | null,
  options: UseImageManagerOptions = {}
): UseImageManagerReturn {
  const {
    enabled = true,
    fallbackUrls = [],
    priority = 'normal',
    lazy = false,
    placeholder,
    onProgress,
    onLoadStart,
    onLoadEnd,
    ...restOptions
  } = options;

  const [state, setState] = useState<{
    imageUrl: string | null;
    loading: boolean;
    loaded: boolean;
    error: Error | null;
    cached: boolean;
    fallbackUsed: boolean;
    progress: number;
    source: 'primary' | 'fallback' | 'placeholder';
  }>({
    imageUrl: null,
    loading: false,
    loaded: false,
    error: null,
    cached: false,
    fallbackUsed: false,
    progress: 0,
    source: 'primary'
  });

  const loadingRef = useRef<boolean>(false);
  const currentUrlRef = useRef<string | null>(null);

  const loadImage = useCallback(async () => {
    if (!primaryUrl || !enabled || loadingRef.current) {
      return;
    }

    // Skip if URL hasn't changed and already loaded
    if (currentUrlRef.current === primaryUrl && state.loaded && !state.error) {
      return;
    }

    loadingRef.current = true;
    currentUrlRef.current = primaryUrl;

    setState(prev => ({
      ...prev,
      loading: true,
      loaded: false,
      error: null,
      progress: 0
    }));

    try {
      onLoadStart?.();

      const result: ImageLoadResult = await imageManager.loadImage(
        primaryUrl,
        fallbackUrls,
        {
          priority,
          lazy,
          placeholder,
          onProgress: (loaded, total) => {
            const progressPercent = (loaded / total) * 100;
            setState(prev => ({ ...prev, progress: progressPercent }));
            onProgress?.(loaded, total);
          },
          ...restOptions
        }
      );

      // Only update state if this is still the current load
      if (currentUrlRef.current === primaryUrl) {
        setState(prev => ({
          ...prev,
          imageUrl: result.url,
          loading: false,
          loaded: true,
          cached: result.cached,
          fallbackUsed: result.fallbackUsed,
          source: result.source,
          progress: 100,
          error: null
        }));
      }

      onLoadEnd?.();
    } catch (error) {
      // Only update state if this is still the current load
      if (currentUrlRef.current === primaryUrl) {
        setState(prev => ({
          ...prev,
          loading: false,
          loaded: false,
          error: error as Error,
          progress: 0
        }));
      }

      onLoadEnd?.();
      console.error('Image load failed:', error);
    } finally {
      loadingRef.current = false;
    }
  }, [primaryUrl, enabled, fallbackUrls, priority, lazy, placeholder, onProgress, onLoadStart, onLoadEnd, restOptions, state.loaded, state.error]);

  const reload = useCallback(() => {
    loadingRef.current = false;
    currentUrlRef.current = null;
    setState(prev => ({
      ...prev,
      imageUrl: null,
      loading: false,
      loaded: false,
      error: null,
      progress: 0
    }));
    loadImage();
  }, [loadImage]);

  const cancel = useCallback(() => {
    if (primaryUrl) {
      imageManager.cancelImageLoad(primaryUrl, options);
      loadingRef.current = false;
      setState(prev => ({
        ...prev,
        loading: false,
        progress: 0
      }));
    }
  }, [primaryUrl, options]);

  // Load image when URL or options change
  useEffect(() => {
    loadImage();
  }, [loadImage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (primaryUrl) {
        imageManager.cancelImageLoad(primaryUrl, options);
      }
    };
  }, [primaryUrl, options]);

  return {
    imageUrl: state.imageUrl,
    loading: state.loading,
    loaded: state.loaded,
    error: state.error,
    cached: state.cached,
    fallbackUsed: state.fallbackUsed,
    progress: state.progress,
    source: state.source,
    reload,
    cancel
  };
}

/**
 * Hook for preloading multiple images
 */
export function useImagePreloader() {
  const [preloading, setPreloading] = useState(false);
  const [preloadedCount, setPreloadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const preloadImages = useCallback(async (
    urls: string[],
    options: { priority?: 'high' | 'normal' | 'low'; sizes?: Array<'thumb' | 'small' | 'medium' | 'large'> } = {}
  ) => {
    if (urls.length === 0) return;

    setPreloading(true);
    setPreloadedCount(0);
    setTotalCount(urls.length);

    try {
      await imageManager.preloadImages(urls, options);
      setPreloadedCount(urls.length);
    } catch (error) {
      console.error('Failed to preload images:', error);
    } finally {
      setPreloading(false);
    }
  }, []);

  const preloadAboveFoldImages = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) return;

    setPreloading(true);
    setPreloadedCount(0);
    setTotalCount(productIds.length);

    try {
      await imageManager.preloadAboveFoldImages(productIds);
      setPreloadedCount(productIds.length);
    } catch (error) {
      console.error('Failed to preload above-fold images:', error);
    } finally {
      setPreloading(false);
    }
  }, []);

  return {
    preloading,
    preloadedCount,
    totalCount,
    progress: totalCount > 0 ? (preloadedCount / totalCount) * 100 : 0,
    preloadImages,
    preloadAboveFoldImages
  };
}