/**
 * ImageOptimizationService - Advanced Image Optimization with WebP Support
 * Handles responsive image sizes, format optimization, and network-aware quality adjustment
 */

import { ConnectionMonitor } from './ConnectionMonitor';
import { NetworkSpeed } from './types';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpeg' | 'png' | 'avif';
  crop?: 'fill' | 'fit' | 'scale' | 'crop';
  gravity?: 'center' | 'face' | 'faces' | 'north' | 'south' | 'east' | 'west';
  dpr?: number; // Device pixel ratio
  progressive?: boolean;
  blur?: number; // For progressive loading
}

export interface ResponsiveImageSet {
  webp: string;
  fallback: string;
  sizes: string;
  srcSet: string;
}

export interface ViewportInfo {
  width: number;
  height: number;
  dpr: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export class ImageOptimizationService {
  private connectionMonitor: ConnectionMonitor;
  private viewportInfo: ViewportInfo;
  private webpSupported: boolean | null = null;
  private avifSupported: boolean | null = null;

  constructor(connectionMonitor: ConnectionMonitor) {
    this.connectionMonitor = connectionMonitor;
    this.viewportInfo = this.initializeViewportInfo();
    this.initializeFormatSupport();
    this.setupViewportListener();
  }

  /**
   * Get optimized image URL with WebP support and network-aware quality
   */
  getOptimizedImageUrl(
    publicId: string,
    options: ImageOptimizationOptions = {}
  ): string {
    if (!publicId.startsWith('keralagiftsonline/products/')) {
      return publicId;
    }

    const networkSpeed = this.connectionMonitor.getNetworkInfo().speed;
    const optimizedOptions = this.getNetworkAwareOptions(options, networkSpeed);
    const format = this.getBestSupportedFormat(optimizedOptions.format);

    const transformations = this.buildTransformations({
      ...optimizedOptions,
      format
    });

    return `https://res.cloudinary.com/deojqbepy/image/upload/${transformations}/${publicId}`;
  }

  /**
   * Generate responsive image set with WebP and fallback formats
   */
  generateResponsiveImageSet(
    publicId: string,
    breakpoints: number[] = [320, 640, 768, 1024, 1280, 1920],
    options: ImageOptimizationOptions = {}
  ): ResponsiveImageSet {
    if (!publicId.startsWith('keralagiftsonline/products/')) {
      return {
        webp: publicId,
        fallback: publicId,
        sizes: '100vw',
        srcSet: publicId
      };
    }

    const networkSpeed = this.connectionMonitor.getNetworkInfo().speed;
    const baseOptions = this.getNetworkAwareOptions(options, networkSpeed);

    // Generate WebP srcSet
    const webpSrcSet = breakpoints
      .map(width => {
        const url = this.getOptimizedImageUrl(publicId, {
          ...baseOptions,
          width,
          format: 'webp'
        });
        return `${url} ${width}w`;
      })
      .join(', ');

    // Generate fallback srcSet (JPEG)
    const fallbackSrcSet = breakpoints
      .map(width => {
        const url = this.getOptimizedImageUrl(publicId, {
          ...baseOptions,
          width,
          format: 'jpeg'
        });
        return `${url} ${width}w`;
      })
      .join(', ');

    // Generate sizes attribute based on viewport
    const sizes = this.generateSizesAttribute(breakpoints);

    return {
      webp: this.getOptimizedImageUrl(publicId, { ...baseOptions, format: 'webp' }),
      fallback: this.getOptimizedImageUrl(publicId, { ...baseOptions, format: 'jpeg' }),
      sizes,
      srcSet: this.webpSupported ? webpSrcSet : fallbackSrcSet
    };
  }

  /**
   * Get network-aware optimization options
   */
  private getNetworkAwareOptions(
    options: ImageOptimizationOptions,
    networkSpeed: NetworkSpeed
  ): ImageOptimizationOptions {
    const baseOptions = { ...options };

    // Adjust quality based on network speed
    if (!baseOptions.quality) {
      switch (networkSpeed) {
        case 'fast':
          baseOptions.quality = 85;
          break;
        case 'medium':
          baseOptions.quality = 75;
          break;
        case 'slow':
          baseOptions.quality = 60;
          break;
      }
    }

    // Adjust progressive loading for slow connections
    if (networkSpeed === 'slow') {
      baseOptions.progressive = true;
    }

    // Adjust DPR for mobile devices on slow connections
    if (networkSpeed === 'slow' && this.viewportInfo.isMobile) {
      baseOptions.dpr = Math.min(baseOptions.dpr || this.viewportInfo.dpr, 2);
    }

    return baseOptions;
  }

  /**
   * Get the best supported image format
   */
  private getBestSupportedFormat(preferredFormat?: string): 'auto' | 'webp' | 'jpeg' | 'png' | 'avif' {
    if (preferredFormat && preferredFormat !== 'auto') {
      return preferredFormat as 'auto' | 'webp' | 'jpeg' | 'png' | 'avif';
    }

    // Check for AVIF support first (best compression)
    if (this.avifSupported) {
      return 'avif';
    }

    // Check for WebP support (good compression, wide support)
    if (this.webpSupported) {
      return 'webp';
    }

    // Fallback to JPEG
    return 'jpeg';
  }

  /**
   * Build Cloudinary transformation string
   */
  private buildTransformations(options: ImageOptimizationOptions): string {
    const transformations: string[] = [];

    // Dimensions
    if (options.width) {
      transformations.push(`w_${options.width}`);
    }
    if (options.height) {
      transformations.push(`h_${options.height}`);
    }

    // Crop mode
    if (options.crop) {
      transformations.push(`c_${options.crop}`);
    } else if (options.width && options.height) {
      transformations.push('c_fill');
    }

    // Gravity
    if (options.gravity) {
      transformations.push(`g_${options.gravity}`);
    }

    // Quality
    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    } else {
      transformations.push('q_auto');
    }

    // Format
    if (options.format && options.format !== 'auto') {
      transformations.push(`f_${options.format}`);
    } else {
      transformations.push('f_auto');
    }

    // Device pixel ratio
    if (options.dpr && options.dpr > 1) {
      transformations.push(`dpr_${options.dpr}`);
    }

    // Progressive loading
    if (options.progressive) {
      transformations.push('fl_progressive');
    }

    // Blur for progressive loading
    if (options.blur) {
      transformations.push(`e_blur:${options.blur}`);
    }

    // Additional optimizations
    transformations.push('fl_lossy'); // Enable lossy compression for better file sizes

    return transformations.join(',');
  }

  /**
   * Generate sizes attribute for responsive images
   */
  private generateSizesAttribute(breakpoints: number[]): string {
    const { isMobile, isTablet, isDesktop } = this.viewportInfo;

    if (isMobile) {
      return '100vw';
    } else if (isTablet) {
      return '(max-width: 768px) 100vw, 50vw';
    } else if (isDesktop) {
      return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
    }

    // Default responsive sizes
    return breakpoints
      .map((bp, index) => {
        if (index === breakpoints.length - 1) {
          return '100vw';
        }
        const nextBp = breakpoints[index + 1];
        const vw = Math.round((bp / nextBp) * 100);
        return `(max-width: ${nextBp}px) ${vw}vw`;
      })
      .join(', ');
  }

  /**
   * Get current viewport information
   */
  private initializeViewportInfo(): ViewportInfo {
    if (typeof window === 'undefined') {
      return {
        width: 1920,
        height: 1080,
        dpr: 1,
        isMobile: false,
        isTablet: false,
        isDesktop: true
      };
    }

    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

    return {
      width,
      height,
      dpr,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024
    };
  }

  /**
   * Initialize format support detection
   */
  private async initializeFormatSupport(): Promise<void> {
    if (typeof window === 'undefined') {
      this.webpSupported = false;
      this.avifSupported = false;
      return;
    }

    // Check WebP support
    this.webpSupported = await this.checkFormatSupport('webp');
    
    // Check AVIF support
    this.avifSupported = await this.checkFormatSupport('avif');
  }

  /**
   * Check if a specific image format is supported
   */
  private checkFormatSupport(format: 'webp' | 'avif'): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      
      // Test images for format support
      const testImages = {
        webp: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
      };
      
      img.src = testImages[format];
    });
  }

  /**
   * Setup viewport change listener
   */
  private setupViewportListener(): void {
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      this.viewportInfo = this.initializeViewportInfo();
    };

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
  }

  /**
   * Get progressive loading placeholder
   */
  getProgressivePlaceholder(
    publicId: string,
    options: ImageOptimizationOptions = {}
  ): string {
    return this.getOptimizedImageUrl(publicId, {
      ...options,
      width: 40,
      height: 40,
      quality: 30,
      blur: 20,
      format: 'jpeg'
    });
  }

  /**
   * Preload critical images with optimal format
   */
  async preloadCriticalImages(publicIds: string[]): Promise<void> {
    const networkSpeed = this.connectionMonitor.getNetworkInfo().speed;
    const isSlowConnection = networkSpeed === 'slow';

    // Limit concurrent preloads on slow connections
    const concurrency = isSlowConnection ? 2 : 5;
    const batches = [];
    
    for (let i = 0; i < publicIds.length; i += concurrency) {
      batches.push(publicIds.slice(i, i + concurrency));
    }

    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(async (publicId) => {
          const options: ImageOptimizationOptions = {
            width: this.viewportInfo.isMobile ? 400 : 600,
            quality: isSlowConnection ? 60 : 80,
            format: 'auto'
          };

          const url = this.getOptimizedImageUrl(publicId, options);
          
          return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to preload ${url}`));
            img.src = url;
          });
        })
      );

      // Small delay between batches on slow connections
      if (isSlowConnection && batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  /**
   * Get image dimensions for layout optimization
   */
  async getImageDimensions(publicId: string): Promise<{ width: number; height: number } | null> {
    try {
      // Use Cloudinary's auto-crop to get original dimensions
      const infoUrl = `https://res.cloudinary.com/deojqbepy/image/upload/w_1,h_1,c_scale/${publicId}`;
      
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight
          });
        };
        img.onerror = () => resolve(null);
        img.src = infoUrl;
      });
    } catch (error) {
      console.warn('Failed to get image dimensions:', error);
      return null;
    }
  }

  /**
   * Calculate optimal image size based on container and viewport
   */
  calculateOptimalSize(
    containerWidth: number,
    containerHeight?: number,
    maxWidth?: number
  ): { width: number; height?: number } {
    const { dpr, isMobile } = this.viewportInfo;
    const networkSpeed = this.connectionMonitor.getNetworkInfo().speed;

    // Apply device pixel ratio
    let optimalWidth = containerWidth * dpr;

    // Limit DPR on slow connections
    if (networkSpeed === 'slow') {
      optimalWidth = containerWidth * Math.min(dpr, 2);
    }

    // Apply maximum width constraint
    if (maxWidth) {
      optimalWidth = Math.min(optimalWidth, maxWidth);
    }

    // Round to nearest multiple of 50 for better caching
    optimalWidth = Math.ceil(optimalWidth / 50) * 50;

    const result: { width: number; height?: number } = { width: optimalWidth };

    if (containerHeight) {
      let optimalHeight = containerHeight * (networkSpeed === 'slow' ? Math.min(dpr, 2) : dpr);
      optimalHeight = Math.ceil(optimalHeight / 50) * 50;
      result.height = optimalHeight;
    }

    return result;
  }

  /**
   * Get format support information
   */
  getFormatSupport(): { webp: boolean; avif: boolean } {
    return {
      webp: this.webpSupported ?? false,
      avif: this.avifSupported ?? false
    };
  }

  /**
   * Get current viewport information
   */
  getViewportInfo(): ViewportInfo {
    return { ...this.viewportInfo };
  }

  /**
   * Update viewport information manually
   */
  updateViewportInfo(): void {
    this.viewportInfo = this.initializeViewportInfo();
  }
}

// Export singleton instance
let imageOptimizationServiceInstance: ImageOptimizationService | null = null;

export const getImageOptimizationService = (connectionMonitor: ConnectionMonitor): ImageOptimizationService => {
  if (!imageOptimizationServiceInstance) {
    imageOptimizationServiceInstance = new ImageOptimizationService(connectionMonitor);
  }
  return imageOptimizationServiceInstance;
};