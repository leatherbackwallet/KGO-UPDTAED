/**
 * useOptimizedImage - React hook for optimized image loading with WebP support
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getImageManager } from '../services/ImageManager';
import { useConnectionMonitor } from './useConnectionMonitor';
import { ImageLoadOptions, ImageLoadResult } from '../services/ImageManager';

export interface OptimizedImageOptions extends Omit<ImageLoadOptions, 'onProgress' | 'onLoadStart' | 'onLoadEnd'> {
  // Container dimensions for responsive sizing
  containerRef?: React.RefObject<HTMLElement>;
  // Enable automatic responsive sizing
  autoResize?: boolean;
  // Intersection observer options for lazy loading
  rootMargin?: string;
  threshold?: number;
}

export interface OptimizedImageState {
  src: string | null;
  loading: boolean;
  loaded: boolean;
  error: Error | null;
  progress: number;
  cached: boolean;
  fallbackUsed: boolean;
  optimized: boolean;
  format?: string;
  // Responsive image data
  srcSet?: string;
  sizes?: string;
  webpSrc?: string;
  placeholder?: string;
}

export function useOptimizedImage(
  publicId: string | null,
  fallbackUrls: string[] = [],
  options: OptimizedImageOptions = {}
): OptimizedImageState & {
  reload: () => void;
  cancel: () => void;
  preload: () => Promise<void>;
} {
  const imageManager = getImageManager();
  
  const [state, setState] = useState<OptimizedImageState>({
    src: null,
    loading: false,
    loaded: false,
    error: null,
    progress: 0,
    cached: false,
    fallbackUsed: false,
    optimized: false
  });

  const loadingRef = useRef<boolean>(false);
  const containerDimensions = useRef<{ width: number; height: number } | null>(null);

  // Get container dimensions
  const updateContainerDimensions = useCallback(() => {
    if (options.containerRef?.current) {
      const rect = options.containerRef.current.getBoundingClientRect();
      containerDimensions.current = {
        width: rect.width,
        height: rect.height
      };
    }
  }, [options.containerRef]);

  // Load image with optimization
  const loadImage = useCallback(async () => {
    if (!publicId || loadingRef.current) return;

    loadingRef.current = true;
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      progress: 0
    }));

    try {
      // Update container dimensions if auto-resize is enabled
      if (options.autoResize) {
        updateContainerDimensions();
      }

      // Calculate optimal image size
      const containerWidth = containerDimensions.current?.width || options.containerWidth;
      const containerHeight = containerDimensions.current?.height || options.containerHeight;
      
      let optimalSize: { width: number; height?: number } | undefined;
      if (containerWidth) {
        optimalSize = imageManager.calculateOptimalImageSize(
          containerWidth,
          containerHeight,
          1920 // Max width
        );
      }

      // Prepare load options
      const loadOptions: ImageLoadOptions = {
        ...options,
        containerWidth: optimalSize?.width || containerWidth,
        containerHeight: optimalSize?.height || containerHeight,
        enableWebP: options.enableWebP !== false,
        enableResponsive: options.enableResponsive !== false,
        onProgress: (loaded, total) => {
          setState(prev => ({
            ...prev,
            progress: (loaded / total) * 100
          }));
        },
        onLoadStart: () => {
          setState(prev => ({ ...prev, loading: true }));
        },
        onLoadEnd: () => {
          setState(prev => ({ ...prev, loading: false }));
        }
      };

      // Generate responsive image set if enabled
      let responsiveData: { srcSet?: string; sizes?: string; webpSrc?: string; placeholder?: string } = {};
      
      if (options.enableResponsive !== false && publicId.startsWith('keralagiftsonline/products/')) {
        const imageSet = imageManager.generateResponsiveImageSet(publicId, loadOptions);
        responsiveData = {
          srcSet: imageSet.srcSet,
          sizes: imageSet.sizes,
          webpSrc: imageSet.webp,
          placeholder: imageManager.getProgressivePlaceholder(publicId, loadOptions)
        };
      }

      // Load the image
      const result: ImageLoadResult = await imageManager.loadImage(
        publicId,
        fallbackUrls,
        loadOptions
      );

      setState(prev => ({
        ...prev,
        src: result.url,
        loading: false,
        loaded: true,
        error: null,
        progress: 100,
        cached: result.cached,
        fallbackUsed: result.fallbackUsed,
        optimized: result.optimized,
        format: result.format,
        ...responsiveData
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        src: null,
        loading: false,
        loaded: false,
        error: error as Error,
        progress: 0
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [publicId, fallbackUrls, options, imageManager, updateContainerDimensions]);

  // Reload image
  const reload = useCallback(() => {
    if (publicId) {
      imageManager.cancelImageLoad(publicId, options);
      setState(prev => ({
        ...prev,
        src: null,
        loading: false,
        loaded: false,
        error: null,
        progress: 0
      }));
      loadImage();
    }
  }, [publicId, options, imageManager, loadImage]);

  // Cancel loading
  const cancel = useCallback(() => {
    if (publicId) {
      imageManager.cancelImageLoad(publicId, options);
      loadingRef.current = false;
      setState(prev => ({
        ...prev,
        loading: false,
        progress: 0
      }));
    }
  }, [publicId, options, imageManager]);

  // Preload image
  const preload = useCallback(async () => {
    if (!publicId) return;

    const containerWidth = containerDimensions.current?.width || options.containerWidth;
    const containerHeight = containerDimensions.current?.height || options.containerHeight;

    await imageManager.preloadImages([publicId], {
      priority: 'high',
      sizes: containerWidth ? ['small', 'medium'] : ['medium'],
      concurrent: 1
    });
  }, [publicId, options.containerWidth, imageManager]);

  // Load image when publicId changes or on mount
  useEffect(() => {
    if (publicId && !options.lazy) {
      loadImage();
    }

    return () => {
      if (publicId) {
        imageManager.cancelImageLoad(publicId, options);
      }
    };
  }, [publicId, loadImage, options.lazy, imageManager, options]);

  // Update container dimensions on resize if auto-resize is enabled
  useEffect(() => {
    if (!options.autoResize || !options.containerRef?.current) return;

    const resizeObserver = new ResizeObserver(() => {
      updateContainerDimensions();
      // Reload image with new dimensions if it's a significant change
      const newDimensions = containerDimensions.current;
      if (newDimensions && state.loaded) {
        const currentWidth = options.containerWidth || 0;
        const widthDiff = Math.abs(newDimensions.width - currentWidth);
        
        // Reload if width changed by more than 100px
        if (widthDiff > 100) {
          loadImage();
        }
      }
    });

    resizeObserver.observe(options.containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [options.autoResize, options.containerRef, updateContainerDimensions, loadImage, state.loaded, options.containerWidth]);

  return {
    ...state,
    reload,
    cancel,
    preload
  };
}

// Hook for lazy loading with intersection observer
export function useLazyOptimizedImage(
  publicId: string | null,
  fallbackUrls: string[] = [],
  options: OptimizedImageOptions = {}
): OptimizedImageState & {
  ref: React.RefObject<HTMLElement>;
  reload: () => void;
  cancel: () => void;
} {
  const elementRef = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  const imageState = useOptimizedImage(
    isIntersecting ? publicId : null,
    fallbackUrls,
    { ...options, lazy: true }
  );

  // Setup intersection observer
  useEffect(() => {
    if (!elementRef.current || !publicId) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: options.rootMargin || '50px',
        threshold: options.threshold || 0.1
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [publicId, options.rootMargin, options.threshold]);

  return {
    ...imageState,
    ref: elementRef
  };
}