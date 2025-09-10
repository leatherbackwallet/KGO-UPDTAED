/**
 * React Hook for Lazy Loading
 * Provides easy access to lazy loading functionality with priority management
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { imageManager } from '../services';

export interface UseLazyLoadingOptions {
  fallbackUrls?: string[];
  priority?: 'high' | 'normal' | 'low';
  placeholder?: string;
  rootMargin?: string;
  threshold?: number;
  enabled?: boolean;
}

export interface UseLazyLoadingReturn {
  ref: React.RefObject<HTMLElement>;
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  currentSrc: string | null;
  reload: () => void;
}

/**
 * Hook for lazy loading images with intersection observer
 */
export function useLazyLoading(
  src: string | null,
  options: UseLazyLoadingOptions = {}
): UseLazyLoadingReturn {
  const {
    fallbackUrls = [],
    priority = 'normal',
    placeholder = '/images/products/placeholder.svg',
    enabled = true
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(placeholder);

  const reload = useCallback(() => {
    if (!src || !ref.current) return;

    setIsLoading(true);
    setIsLoaded(false);
    setHasError(false);
    setCurrentSrc(placeholder);

    // Re-register for lazy loading
    imageManager.observeForLazyLoading(ref.current, src, {
      fallbackUrls,
      priority,
      placeholder
    });
  }, [src, fallbackUrls, priority, placeholder]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !src || !enabled) {
      return;
    }

    // Register for lazy loading
    imageManager.observeForLazyLoading(element, src, {
      fallbackUrls,
      priority,
      placeholder
    });

    // Monitor for class changes to detect loading states
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const classList = element.classList;
          
          if (classList.contains('loaded')) {
            setIsLoading(false);
            setIsLoaded(true);
            setHasError(false);
            
            // Update current src
            if (element.tagName === 'IMG') {
              setCurrentSrc((element as HTMLImageElement).src);
            } else {
              const bgImage = element.style.backgroundImage;
              const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
              if (match) {
                setCurrentSrc(match[1]);
              }
            }
          } else if (classList.contains('error')) {
            setIsLoading(false);
            setIsLoaded(false);
            setHasError(true);
          } else if (classList.contains('loading')) {
            setIsLoading(true);
            setIsLoaded(false);
            setHasError(false);
          }
        }
      });
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      imageManager.unobserveForLazyLoading(element);
      observer.disconnect();
    };
  }, [src, fallbackUrls, priority, placeholder, enabled]);

  return {
    ref,
    isLoading,
    isLoaded,
    hasError,
    currentSrc,
    reload
  };
}

/**
 * Hook for managing multiple lazy loaded images
 */
export function useLazyLoadingBatch(
  images: Array<{
    src: string;
    fallbackUrls?: string[];
    priority?: 'high' | 'normal' | 'low';
  }>,
  options: {
    placeholder?: string;
    enabled?: boolean;
  } = {}
) {
  const { placeholder = '/images/products/placeholder.svg', enabled = true } = options;
  
  const [loadingStates, setLoadingStates] = useState<Record<string, {
    isLoading: boolean;
    isLoaded: boolean;
    hasError: boolean;
    currentSrc: string | null;
  }>>({});

  const refs = useRef<Record<string, HTMLElement>>({});

  const registerElement = useCallback((src: string, element: HTMLElement) => {
    refs.current[src] = element;
  }, []);

  const unregisterElement = useCallback((src: string) => {
    delete refs.current[src];
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const cleanup: Array<() => void> = [];

    images.forEach(({ src, fallbackUrls = [], priority = 'normal' }) => {
      const element = refs.current[src];
      if (!element) return;

      // Initialize loading state
      setLoadingStates(prev => ({
        ...prev,
        [src]: {
          isLoading: true,
          isLoaded: false,
          hasError: false,
          currentSrc: placeholder
        }
      }));

      // Register for lazy loading
      imageManager.observeForLazyLoading(element, src, {
        fallbackUrls,
        priority,
        placeholder
      });

      // Monitor for class changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const classList = element.classList;
            
            setLoadingStates(prev => ({
              ...prev,
              [src]: {
                ...prev[src],
                isLoading: classList.contains('loading'),
                isLoaded: classList.contains('loaded'),
                hasError: classList.contains('error')
              }
            }));
          }
        });
      });

      observer.observe(element, {
        attributes: true,
        attributeFilter: ['class']
      });

      cleanup.push(() => {
        imageManager.unobserveForLazyLoading(element);
        observer.disconnect();
      });
    });

    return () => {
      cleanup.forEach(fn => fn());
    };
  }, [images, placeholder, enabled]);

  return {
    loadingStates,
    registerElement,
    unregisterElement
  };
}

/**
 * Hook for preloading visible images
 */
export function useVisibleImagePreloader() {
  const [isPreloading, setIsPreloading] = useState(false);

  const preloadVisibleImages = useCallback(async () => {
    setIsPreloading(true);
    try {
      await imageManager.preloadVisibleImages();
    } catch (error) {
      console.error('Failed to preload visible images:', error);
    } finally {
      setIsPreloading(false);
    }
  }, []);

  // Auto-preload on scroll end
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        preloadVisibleImages();
      }, 150); // Debounce scroll events
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [preloadVisibleImages]);

  return {
    isPreloading,
    preloadVisibleImages
  };
}