/**
 * ImageManager - Robust Image Loading System with Fallback Chain
 * Implements image loading with multiple fallback sources, progressive loading,
 * and preloading system for above-the-fold content
 */

import { getProductImage, getOptimizedImagePath, imageExists } from '../utils/imageUtils';
import { imageCacheService } from './ImageCacheService';
import { errorTracker, ErrorType as TrackerErrorType, ErrorSeverity } from './ErrorTracker';
import { ErrorType } from './types';
import { ImageOptimizationService, getImageOptimizationService } from './ImageOptimizationService';
import { ConnectionMonitor } from './ConnectionMonitor';

export interface ImageLoadOptions {
  lazy?: boolean;
  placeholder?: string;
  sizes?: string;
  priority?: 'high' | 'normal' | 'low';
  onProgress?: (loaded: number, total: number) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  fallbackSources?: string[];
  enableBlurTransition?: boolean;
  preloadSize?: 'thumb' | 'small' | 'medium' | 'large';
  // WebP and responsive options
  enableWebP?: boolean;
  enableResponsive?: boolean;
  containerWidth?: number;
  containerHeight?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpeg' | 'png' | 'avif';
}

export interface ImageLoadResult {
  url: string;
  cached: boolean;
  fallbackUsed: boolean;
  loadTime: number;
  source: 'primary' | 'fallback' | 'placeholder';
  error?: Error;
  // WebP and optimization info
  format?: string;
  optimized: boolean;
  originalSize?: { width: number; height: number };
  optimizedSize?: { width: number; height: number };
  compressionRatio?: number;
}

export interface ImageLoadingState {
  loading: boolean;
  loaded: boolean;
  error: Error | null;
  fallbackUsed: boolean;
  cached: boolean;
  progress: number;
  source: 'primary' | 'fallback' | 'placeholder';
}

export interface PreloadOptions {
  priority?: 'high' | 'normal' | 'low';
  sizes?: Array<'thumb' | 'small' | 'medium' | 'large'>;
  concurrent?: number;
}

/**
 * ImageManager class for robust image loading with fallback chains
 */
export class ImageManager {
  private loadingStates = new Map<string, ImageLoadingState>();
  private loadingPromises = new Map<string, Promise<ImageLoadResult>>();
  private preloadQueue: Array<{ url: string; options: PreloadOptions }> = [];
  private isProcessingQueue = false;
  private abortControllers = new Map<string, AbortController>();
  private intersectionObserver: IntersectionObserver | null = null;
  private lazyLoadQueue: Array<{ element: HTMLElement; priority: 'high' | 'normal' | 'low' }> = [];
  private optimizationService: ImageOptimizationService;
  private connectionMonitor: ConnectionMonitor;

  constructor(connectionMonitor?: ConnectionMonitor) {
    // Initialize connection monitor
    this.connectionMonitor = connectionMonitor || new ConnectionMonitor();
    
    // Initialize optimization service
    this.optimizationService = getImageOptimizationService(this.connectionMonitor);
    
    // Initialize with default settings
    this.setupIntersectionObserver();
  }

  /**
   * Load image with fallback chain and progressive loading
   */
  async loadImage(
    primaryUrl: string,
    fallbackUrls: string[] = [],
    options: ImageLoadOptions = {}
  ): Promise<ImageLoadResult> {
    const {
      priority = 'normal',
      onProgress,
      onLoadStart,
      onLoadEnd,
      enableBlurTransition = true,
      preloadSize = 'medium'
    } = options;

    const cacheKey = this.getCacheKey(primaryUrl, options);
    
    // Return existing promise if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    // Initialize loading state
    this.setLoadingState(cacheKey, {
      loading: true,
      loaded: false,
      error: null,
      fallbackUsed: false,
      cached: false,
      progress: 0,
      source: 'primary'
    });

    const loadPromise = this.performImageLoad(primaryUrl, fallbackUrls, options);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      onLoadStart?.();
      const result = await loadPromise;
      
      this.updateLoadingState(cacheKey, {
        loading: false,
        loaded: true,
        cached: result.cached,
        fallbackUsed: result.fallbackUsed,
        source: result.source,
        progress: 100
      });

      onLoadEnd?.();
      return result;
    } catch (error) {
      this.updateLoadingState(cacheKey, {
        loading: false,
        loaded: false,
        error: error as Error,
        progress: 0
      });

      onLoadEnd?.();
      throw error;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Perform the actual image loading with fallback chain
   */
  private async performImageLoad(
    primaryUrl: string,
    fallbackUrls: string[],
    options: ImageLoadOptions
  ): Promise<ImageLoadResult> {
    const startTime = Date.now();
    const abortController = new AbortController();
    const cacheKey = this.getCacheKey(primaryUrl, options);
    
    this.abortControllers.set(cacheKey, abortController);

    try {
      // Build optimized URL chain with WebP support
      const urlChain = await this.buildOptimizedUrlChain(primaryUrl, fallbackUrls, options);

      let lastError: Error | null = null;
      let originalSize: { width: number; height: number } | undefined;
      let optimizedSize: { width: number; height: number } | undefined;

      for (let i = 0; i < urlChain.length; i++) {
        const urlInfo = urlChain[i];
        const isLastAttempt = i === urlChain.length - 1;
        
        try {
          // Check if image is cached first
          const cachedUrl = await imageCacheService.getCachedImageBlob(urlInfo.url);
          if (cachedUrl) {
            return {
              url: cachedUrl,
              cached: true,
              fallbackUsed: i > 0,
              loadTime: Date.now() - startTime,
              source: i === 0 ? 'primary' : (isLastAttempt ? 'placeholder' : 'fallback'),
              format: urlInfo.format,
              optimized: urlInfo.optimized,
              originalSize,
              optimizedSize
            };
          }

          // Update progress
          const progress = ((i + 0.5) / urlChain.length) * 100;
          this.updateLoadingState(cacheKey, { progress });
          options.onProgress?.(progress, 100);

          // Attempt to load the image
          const result = await this.loadSingleImage(urlInfo.url, abortController.signal);
          
          // Get image dimensions for optimization metrics
          if (i === 0 && result.url.includes('cloudinary')) {
            originalSize = await this.optimizationService.getImageDimensions(primaryUrl) || undefined;
            if (options.containerWidth && options.containerHeight) {
              optimizedSize = { width: options.containerWidth, height: options.containerHeight };
            }
          }
          
          // Cache successful loads (except placeholders)
          if (!isLastAttempt && !urlInfo.url.includes('placeholder')) {
            imageCacheService.cacheImage(urlInfo.url).catch(console.warn);
          }

          return {
            url: result.url,
            cached: false,
            fallbackUsed: i > 0,
            loadTime: Date.now() - startTime,
            source: i === 0 ? 'primary' : (isLastAttempt ? 'placeholder' : 'fallback'),
            format: urlInfo.format,
            optimized: urlInfo.optimized,
            originalSize,
            optimizedSize,
            compressionRatio: originalSize && optimizedSize ? 
              (originalSize.width * originalSize.height) / (optimizedSize.width * optimizedSize.height) : undefined
          };

        } catch (error) {
          lastError = error as Error;
          
          // If this is not the last attempt, continue to next fallback
          if (!isLastAttempt) {
            console.warn(`Failed to load image ${urlInfo.url}, trying fallback:`, error);
            continue;
          }
        }
      }

      // If we get here, all attempts failed
      throw new Error(`Failed to load image after ${urlChain.length} attempts. Last error: ${lastError?.message}`);

    } finally {
      this.abortControllers.delete(cacheKey);
    }
  }

  /**
   * Build optimized URL chain with WebP support and responsive sizing
   */
  private async buildOptimizedUrlChain(
    primaryUrl: string,
    fallbackUrls: string[],
    options: ImageLoadOptions
  ): Promise<Array<{ url: string; format?: string; optimized: boolean }>> {
    const urlChain: Array<{ url: string; format?: string; optimized: boolean }> = [];

    // Handle Cloudinary URLs with optimization
    if (primaryUrl.startsWith('keralagiftsonline/products/')) {
      const optimizationOptions = {
        width: options.containerWidth,
        height: options.containerHeight,
        quality: options.quality,
        format: options.format || 'auto'
      };

      // Add WebP version if enabled and supported
      if (options.enableWebP !== false) {
        const formatSupport = this.optimizationService.getFormatSupport();
        
        if (formatSupport.avif) {
          urlChain.push({
            url: this.optimizationService.getOptimizedImageUrl(primaryUrl, {
              ...optimizationOptions,
              format: 'avif'
            }),
            format: 'avif',
            optimized: true
          });
        }
        
        if (formatSupport.webp) {
          urlChain.push({
            url: this.optimizationService.getOptimizedImageUrl(primaryUrl, {
              ...optimizationOptions,
              format: 'webp'
            }),
            format: 'webp',
            optimized: true
          });
        }
      }

      // Add JPEG fallback
      urlChain.push({
        url: this.optimizationService.getOptimizedImageUrl(primaryUrl, {
          ...optimizationOptions,
          format: 'jpeg'
        }),
        format: 'jpeg',
        optimized: true
      });

      // Add original URL as fallback
      urlChain.push({
        url: getProductImage(primaryUrl),
        format: 'original',
        optimized: false
      });
    } else {
      // Non-Cloudinary URL, use as-is
      urlChain.push({
        url: getProductImage(primaryUrl),
        format: 'original',
        optimized: false
      });
    }

    // Add additional fallback URLs
    for (const fallbackUrl of fallbackUrls) {
      if (fallbackUrl.startsWith('keralagiftsonline/products/')) {
        urlChain.push({
          url: this.optimizationService.getOptimizedImageUrl(fallbackUrl, {
            width: options.containerWidth,
            height: options.containerHeight,
            format: 'jpeg'
          }),
          format: 'jpeg',
          optimized: true
        });
      } else {
        urlChain.push({
          url: getProductImage(fallbackUrl),
          format: 'fallback',
          optimized: false
        });
      }
    }

    // Add category-based fallback if available
    const categoryFallback = this.getCategoryFallback(primaryUrl);
    if (categoryFallback) {
      urlChain.push({
        url: categoryFallback,
        format: 'category-fallback',
        optimized: false
      });
    }

    // Add default placeholder as final fallback
    urlChain.push({
      url: '/images/products/placeholder.svg',
      format: 'placeholder',
      optimized: false
    });

    return urlChain;
  }

  /**
   * Load a single image with timeout and abort support
   */
  private loadSingleImage(url: string, signal?: AbortSignal): Promise<{ url: string }> {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      let abortHandler: (() => void) | null = null;
      
      const timeout = setTimeout(() => {
        cleanup();
        const loadTime = performance.now() - startTime;
        
        // Track timeout error
        errorTracker.trackError({
          type: TrackerErrorType.IMAGE_LOAD_ERROR,
          severity: ErrorSeverity.MEDIUM,
          message: `Image load timeout: ${url}`,
          context: {
            url,
            responseTime: loadTime,
            action: 'Image Load Timeout'
          }
        });
        
        errorTracker.trackImagePerformance(url, loadTime, false);
        reject(new Error(`Image load timeout: ${url}`));
      }, 5000); // 5 second timeout for tests

      const cleanup = () => {
        clearTimeout(timeout);
        img.onload = null;
        img.onerror = null;
        if (abortHandler && signal) {
          signal.removeEventListener('abort', abortHandler);
        }
      };

      img.onload = () => {
        cleanup();
        const loadTime = performance.now() - startTime;
        
        // Track successful image load
        errorTracker.trackImagePerformance(url, loadTime, true);
        resolve({ url });
      };

      img.onerror = () => {
        cleanup();
        const loadTime = performance.now() - startTime;
        
        // Track image load error
        errorTracker.trackError({
          type: TrackerErrorType.IMAGE_LOAD_ERROR,
          severity: ErrorSeverity.LOW,
          message: `Failed to load image: ${url}`,
          context: {
            url,
            responseTime: loadTime,
            action: 'Image Load Error'
          }
        });
        
        errorTracker.trackImagePerformance(url, loadTime, false);
        reject(new Error(`Failed to load image: ${url}`));
      };

      // Handle abort signal
      if (signal) {
        abortHandler = () => {
          cleanup();
          const loadTime = performance.now() - startTime;
          
          // Track aborted image load
          errorTracker.trackError({
            type: TrackerErrorType.IMAGE_LOAD_ERROR,
            severity: ErrorSeverity.LOW,
            message: 'Image load aborted',
          context: {
            url,
            responseTime: loadTime,
            action: 'Image Load Aborted'
          }
          });
          
          errorTracker.trackImagePerformance(url, loadTime, false);
          reject(new Error('Image load aborted'));
        };
        signal.addEventListener('abort', abortHandler);
      }

      img.src = url;
    });
  }

  /**
   * Generate responsive image set with WebP support
   */
  generateResponsiveImageSet(
    publicId: string,
    options: ImageLoadOptions = {}
  ): {
    webp: string;
    fallback: string;
    srcSet: string;
    sizes: string;
  } {
    if (!publicId.startsWith('keralagiftsonline/products/')) {
      const fallbackUrl = getProductImage(publicId);
      return {
        webp: fallbackUrl,
        fallback: fallbackUrl,
        srcSet: fallbackUrl,
        sizes: '100vw'
      };
    }

    return this.optimizationService.generateResponsiveImageSet(publicId, undefined, {
      width: options.containerWidth,
      height: options.containerHeight,
      quality: options.quality,
      format: options.format
    });
  }

  /**
   * Get progressive loading placeholder
   */
  getProgressivePlaceholder(publicId: string, options: ImageLoadOptions = {}): string {
    if (!publicId.startsWith('keralagiftsonline/products/')) {
      return getProductImage(publicId);
    }

    return this.optimizationService.getProgressivePlaceholder(publicId, {
      width: options.containerWidth,
      height: options.containerHeight
    });
  }

  /**
   * Calculate optimal image size for container
   */
  calculateOptimalImageSize(
    containerWidth: number,
    containerHeight?: number,
    maxWidth?: number
  ): { width: number; height?: number } {
    return this.optimizationService.calculateOptimalSize(
      containerWidth,
      containerHeight,
      maxWidth
    );
  }

  /**
   * Preload images for above-the-fold content
   */
  async preloadImages(urls: string[], options: PreloadOptions = {}): Promise<void> {
    const { priority = 'normal', sizes = ['small', 'medium'], concurrent = 3 } = options;

    // Add to preload queue
    for (const url of urls) {
      this.preloadQueue.push({ url, options: { priority, sizes, concurrent } });
    }

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processPreloadQueue();
    }
  }

  /**
   * Process the preload queue with concurrency control
   */
  private async processPreloadQueue(): Promise<void> {
    if (this.isProcessingQueue || this.preloadQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.preloadQueue.length > 0) {
        const batch = this.preloadQueue.splice(0, 3); // Process 3 at a time
        
        await Promise.allSettled(
          batch.map(async ({ url, options }) => {
            try {
              // Generate optimized URLs for different sizes
              const urlsToPreload: string[] = [];
              
              if (url.startsWith('keralagiftsonline/products/')) {
                for (const size of options.sizes || ['small']) {
                  urlsToPreload.push(getOptimizedImagePath(url, size));
                }
              } else {
                urlsToPreload.push(getProductImage(url));
              }

              // Preload each size
              for (const preloadUrl of urlsToPreload) {
                await this.loadImage(preloadUrl, [], {
                  priority: options.priority,
                  lazy: false
                });
              }
            } catch (error) {
              console.warn('Failed to preload image:', url, error);
            }
          })
        );

        // Small delay between batches to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Preload critical above-the-fold images with optimization
   */
  async preloadAboveFoldImages(productIds: string[]): Promise<void> {
    const imagePaths = productIds.map(id => `keralagiftsonline/products/product-${id}`);
    
    // Use optimization service for critical image preloading
    await this.optimizationService.preloadCriticalImages(imagePaths);
    
    // Also preload through regular preload system
    await this.preloadImages(imagePaths, {
      priority: 'high',
      sizes: ['thumb', 'small'],
      concurrent: 5
    });

    // Also warm the cache through the service
    await imageCacheService.warmAboveFoldImages(productIds);
  }

  /**
   * Get category-based fallback image
   */
  private getCategoryFallback(url: string): string | null {
    // Extract potential category info from URL or filename
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('wedding')) {
      return '/images/products/wedding-cake.svg';
    }
    if (urlLower.includes('birthday')) {
      return '/images/products/birthday-cake.svg';
    }
    if (urlLower.includes('chocolate')) {
      return '/images/products/chocolates.svg';
    }
    if (urlLower.includes('flower') || urlLower.includes('rose')) {
      return '/images/products/rose-bouquet.svg';
    }
    if (urlLower.includes('gift') || urlLower.includes('basket')) {
      return '/images/products/gift-basket-premium.svg';
    }
    if (urlLower.includes('cake')) {
      return '/images/products/birthday-cake.svg';
    }
    
    return null;
  }

  /**
   * Get loading state for an image
   */
  getLoadingState(url: string, options: ImageLoadOptions = {}): ImageLoadingState | null {
    const cacheKey = this.getCacheKey(url, options);
    return this.loadingStates.get(cacheKey) || null;
  }

  /**
   * Cancel image loading
   */
  cancelImageLoad(url: string, options: ImageLoadOptions = {}): void {
    const cacheKey = this.getCacheKey(url, options);
    const abortController = this.abortControllers.get(cacheKey);
    
    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cacheKey);
    }

    this.loadingPromises.delete(cacheKey);
    this.loadingStates.delete(cacheKey);
  }

  /**
   * Clear all loading states and cancel pending loads
   */
  clearAll(): void {
    // Cancel all pending loads
    this.abortControllers.forEach((controller, key) => {
      controller.abort();
    });
    
    this.abortControllers.clear();
    this.loadingPromises.clear();
    this.loadingStates.clear();
    this.preloadQueue.length = 0;
    this.lazyLoadQueue.length = 0;

    // Disconnect intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
      this.setupIntersectionObserver();
    }
  }

  /**
   * Get cache key for an image load operation
   */
  private getCacheKey(url: string, options: ImageLoadOptions): string {
    return `${url}-${options.priority || 'normal'}-${options.sizes || 'default'}`;
  }

  /**
   * Set loading state
   */
  private setLoadingState(key: string, state: ImageLoadingState): void {
    this.loadingStates.set(key, state);
  }

  /**
   * Update loading state
   */
  private updateLoadingState(key: string, updates: Partial<ImageLoadingState>): void {
    const current = this.loadingStates.get(key);
    if (current) {
      this.loadingStates.set(key, { ...current, ...updates });
    }
  }

  /**
   * Setup intersection observer for lazy loading
   */
  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const imageUrl = element.dataset.src;
            const fallbackUrls = element.dataset.fallbacks?.split(',') || [];
            const priority = (element.dataset.priority as 'high' | 'normal' | 'low') || 'normal';

            if (imageUrl) {
              this.loadImage(imageUrl, fallbackUrls, { priority })
                .then((result) => {
                  // Update the element with the loaded image
                  if (element.tagName === 'IMG') {
                    (element as HTMLImageElement).src = result.url;
                  } else {
                    element.style.backgroundImage = `url(${result.url})`;
                  }
                  element.classList.add('loaded');
                  element.classList.remove('loading');
                })
                .catch((error) => {
                  console.error('Lazy load failed:', error);
                  element.classList.add('error');
                  element.classList.remove('loading');
                });

              // Stop observing this element
              this.intersectionObserver?.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1
      }
    );
  }

  /**
   * Register an element for lazy loading
   */
  observeForLazyLoading(
    element: HTMLElement,
    imageUrl: string,
    options: {
      fallbackUrls?: string[];
      priority?: 'high' | 'normal' | 'low';
      placeholder?: string;
    } = {}
  ): void {
    if (!this.intersectionObserver) {
      // Fallback: load immediately if intersection observer not available
      this.loadImage(imageUrl, options.fallbackUrls || [], {
        priority: options.priority || 'normal'
      }).then((result) => {
        if (element.tagName === 'IMG') {
          (element as HTMLImageElement).src = result.url;
        } else {
          element.style.backgroundImage = `url(${result.url})`;
        }
      }).catch(console.error);
      return;
    }

    // Set data attributes for the intersection observer
    element.dataset.src = imageUrl;
    element.dataset.fallbacks = options.fallbackUrls?.join(',') || '';
    element.dataset.priority = options.priority || 'normal';
    
    // Add loading class and placeholder
    element.classList.add('loading');
    if (options.placeholder) {
      if (element.tagName === 'IMG') {
        (element as HTMLImageElement).src = options.placeholder;
      } else {
        element.style.backgroundImage = `url(${options.placeholder})`;
      }
    }

    // Add to lazy load queue for priority management
    this.lazyLoadQueue.push({
      element,
      priority: options.priority || 'normal'
    });

    // Start observing
    this.intersectionObserver.observe(element);
  }

  /**
   * Stop observing an element for lazy loading
   */
  unobserveForLazyLoading(element: HTMLElement): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }

    // Remove from lazy load queue
    this.lazyLoadQueue = this.lazyLoadQueue.filter(item => item.element !== element);
  }

  /**
   * Process lazy load queue with priority-based loading
   */
  private processLazyLoadQueue(): void {
    // Sort by priority: high -> normal -> low
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    this.lazyLoadQueue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Process high priority items first
    const highPriorityItems = this.lazyLoadQueue.filter(item => item.priority === 'high');
    const normalPriorityItems = this.lazyLoadQueue.filter(item => item.priority === 'normal');
    const lowPriorityItems = this.lazyLoadQueue.filter(item => item.priority === 'low');

    // Limit concurrent requests
    const maxConcurrent = 3;
    let currentConcurrent = 0;

    const processItems = (items: typeof this.lazyLoadQueue) => {
      items.forEach((item) => {
        if (currentConcurrent >= maxConcurrent) return;

        const imageUrl = item.element.dataset.src;
        if (imageUrl && this.isElementInViewport(item.element)) {
          currentConcurrent++;
          
          const fallbackUrls = item.element.dataset.fallbacks?.split(',').filter(Boolean) || [];
          
          this.loadImage(imageUrl, fallbackUrls, { priority: item.priority })
            .then((result) => {
              if (item.element.tagName === 'IMG') {
                (item.element as HTMLImageElement).src = result.url;
              } else {
                item.element.style.backgroundImage = `url(${result.url})`;
              }
              item.element.classList.add('loaded');
              item.element.classList.remove('loading');
            })
            .catch((error) => {
              console.error('Priority lazy load failed:', error);
              item.element.classList.add('error');
              item.element.classList.remove('loading');
            })
            .finally(() => {
              currentConcurrent--;
            });

          // Remove from queue
          this.lazyLoadQueue = this.lazyLoadQueue.filter(queueItem => queueItem !== item);
        }
      });
    };

    // Process in priority order
    processItems(highPriorityItems);
    processItems(normalPriorityItems);
    processItems(lowPriorityItems);
  }

  /**
   * Check if element is in viewport
   */
  private isElementInViewport(element: HTMLElement): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Preload visible images with high priority
   */
  async preloadVisibleImages(): Promise<void> {
    const visibleElements = this.lazyLoadQueue
      .filter(item => this.isElementInViewport(item.element))
      .sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    const urls = visibleElements
      .map(item => item.element.dataset.src)
      .filter(Boolean) as string[];

    if (urls.length > 0) {
      await this.preloadImages(urls, { priority: 'high', concurrent: 5 });
    }
  }

  /**
   * Get statistics about image loading performance
   */
  getStats(): {
    totalLoads: number;
    successfulLoads: number;
    failedLoads: number;
    cacheHits: number;
    fallbacksUsed: number;
    averageLoadTime: number;
    lazyLoadQueueSize: number;
  } {
    // This would be implemented with proper metrics collection
    // For now, return mock data
    return {
      totalLoads: 0,
      successfulLoads: 0,
      failedLoads: 0,
      cacheHits: 0,
      fallbacksUsed: 0,
      averageLoadTime: 0,
      lazyLoadQueueSize: this.lazyLoadQueue.length
    };
  }
}

// Export singleton instance
let imageManagerInstance: ImageManager | null = null;

export const getImageManager = (connectionMonitor?: ConnectionMonitor): ImageManager => {
  if (!imageManagerInstance) {
    imageManagerInstance = new ImageManager(connectionMonitor);
  }
  return imageManagerInstance;
};

export const imageManager = getImageManager();