/**
 * ProgressiveImage Component - Enhanced image loading with WebP support and blur-to-sharp transitions
 * Supports lazy loading, fallback chains, responsive images, and smooth loading states
 */

import React, { useState, useRef, useEffect } from 'react';
import { useOptimizedImage, useLazyOptimizedImage } from '../hooks/useOptimizedImage';

export interface ProgressiveImageProps {
  src: string;
  alt: string;
  fallbackSources?: string[];
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  lazy?: boolean;
  priority?: 'high' | 'normal' | 'low';
  sizes?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  enableBlurTransition?: boolean;
  rootMargin?: string;
  threshold?: number;
  showLoadingProgress?: boolean;
  width?: number;
  height?: number;
  // WebP and optimization options
  enableWebP?: boolean;
  enableResponsive?: boolean;
  containerWidth?: number;
  containerHeight?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpeg' | 'png';
  autoResize?: boolean;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  fallbackSources = [],
  className = '',
  style = {},
  placeholder,
  lazy = false,
  priority = 'normal',
  sizes,
  onLoad,
  onError,
  enableBlurTransition = true,
  rootMargin = '50px',
  threshold = 0.1,
  showLoadingProgress = false,
  width,
  height,
  enableWebP = true,
  enableResponsive = true,
  containerWidth,
  containerHeight,
  quality,
  format = 'auto',
  autoResize = false,
  ...props
}) => {
  const [showBlur, setShowBlur] = useState(enableBlurTransition);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = {
    lazy,
    priority,
    sizes,
    fallbackSources,
    enableBlurTransition,
    enableWebP,
    enableResponsive,
    containerWidth: containerWidth || width,
    containerHeight: containerHeight || height,
    quality,
    format,
    autoResize,
    containerRef: autoResize ? containerRef : undefined,
    rootMargin,
    threshold
  };

  // Use appropriate hook based on lazy loading
  const imageState = lazy 
    ? useLazyOptimizedImage(src, fallbackSources, options)
    : useOptimizedImage(src, fallbackSources, options);

  const { 
    src: imageUrl, 
    loading, 
    loaded, 
    error, 
    progress, 
    cached, 
    fallbackUsed,
    optimized,
    format: loadedFormat,
    srcSet,
    sizes: responsiveSizes,
    webpSrc,
    placeholder: generatedPlaceholder,
    reload
  } = imageState;

  // Handle load and error events
  useEffect(() => {
    if (loaded && !error) {
      if (enableBlurTransition) {
        // Add a small delay for smooth transition
        setTimeout(() => setShowBlur(false), 100);
      }
      onLoad?.();
    } else if (error) {
      onError?.(error);
    }
  }, [loaded, error, onLoad, onError, enableBlurTransition]);

  // Reset blur state when loading starts
  useEffect(() => {
    if (loading && enableBlurTransition) {
      setShowBlur(true);
    }
  }, [loading, enableBlurTransition]);

  // Determine what to show
  const shouldShowPlaceholder = !loaded && !loading && !error;
  const shouldShowImage = imageUrl && (loaded || loading);
  const shouldShowError = error && !loading;

  // Use generated placeholder if available and no custom placeholder provided
  const effectivePlaceholder = placeholder || generatedPlaceholder;

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    overflow: 'hidden',
    ...style
  };

  const imageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: enableBlurTransition ? 'filter 0.3s ease-out, opacity 0.3s ease-out' : 'opacity 0.3s ease-out',
    filter: showBlur && enableBlurTransition ? 'blur(5px)' : 'none',
    opacity: loaded ? 1 : (loading && !cached ? 0.7 : 0),
    ...(width && { width }),
    ...(height && { height })
  };

  const skeletonStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: loading ? 'shimmer 1.5s infinite' : 'none',
    opacity: loading && !shouldShowImage ? 1 : 0,
    transition: 'opacity 0.3s ease-out'
  };

  const progressBarStyles: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '2px',
    backgroundColor: '#007bff',
    width: `${progress}%`,
    transition: 'width 0.3s ease-out',
    opacity: loading && showLoadingProgress && progress > 0 ? 1 : 0
  };

  return (
    <div 
      ref={containerRef}
      className={`progressive-image-container ${className}`} 
      style={containerStyles}
    >
      {/* Loading skeleton */}
      <div style={skeletonStyles} />

      {/* Placeholder */}
      {shouldShowPlaceholder && effectivePlaceholder && (
        <img
          ref={lazy ? (imageState as any).ref : undefined}
          src={effectivePlaceholder}
          alt={alt}
          style={imageStyles}
          {...props}
        />
      )}

      {/* Main Image with WebP support */}
      {shouldShowImage && (
        <>
          {/* WebP version with fallback */}
          {enableWebP && webpSrc && srcSet ? (
            <picture>
              <source 
                srcSet={srcSet} 
                sizes={responsiveSizes || sizes}
                type="image/webp"
              />
              <img
                ref={lazy && !effectivePlaceholder ? (imageState as any).ref : undefined}
                src={imageUrl}
                alt={alt}
                style={imageStyles}
                sizes={responsiveSizes || sizes}
                loading={lazy ? 'lazy' : 'eager'}
                {...props}
              />
            </picture>
          ) : (
            <img
              ref={lazy && !effectivePlaceholder ? (imageState as any).ref : undefined}
              src={imageUrl}
              srcSet={srcSet}
              alt={alt}
              style={imageStyles}
              sizes={responsiveSizes || sizes}
              loading={lazy ? 'lazy' : 'eager'}
              {...props}
            />
          )}
        </>
      )}

      {/* Progress bar */}
      {showLoadingProgress && (
        <div style={progressBarStyles} />
      )}

      {/* Error State */}
      {shouldShowError && (
        <div
          ref={lazy && !effectivePlaceholder && !imageUrl ? (imageState as any).ref : undefined}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#666',
            fontSize: '12px'
          }}
        >
          <div>Failed to load image</div>
          <button
            onClick={reload}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              fontSize: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && loaded && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontSize: '10px',
            padding: '2px 4px',
            borderRadius: '2px',
            pointerEvents: 'none'
          }}
        >
          {cached ? '💾' : '🌐'} {fallbackUsed ? '⚠️' : '✅'} {optimized ? '🚀' : '📷'}
          {loadedFormat && <span> {loadedFormat.toUpperCase()}</span>}
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * ProductImage component specifically for product images with category fallbacks and optimization
 */
export interface ProductImageProps extends Omit<ProgressiveImageProps, 'fallbackSources'> {
  productSlug?: string;
  size?: 'thumb' | 'small' | 'medium' | 'large';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  productSlug,
  size = 'medium',
  containerWidth,
  containerHeight,
  ...props
}) => {
  // Generate fallback sources based on product category
  const fallbackSources = React.useMemo(() => {
    const fallbacks: string[] = [];
    
    if (productSlug) {
      const slug = productSlug.toLowerCase();
      
      // Add category-specific fallbacks
      if (slug.includes('wedding')) {
        fallbacks.push('/images/products/wedding-cake.svg');
      } else if (slug.includes('birthday')) {
        fallbacks.push('/images/products/birthday-cake.svg');
      } else if (slug.includes('chocolate')) {
        fallbacks.push('/images/products/chocolates.svg');
      } else if (slug.includes('flower') || slug.includes('rose')) {
        fallbacks.push('/images/products/rose-bouquet.svg');
      } else if (slug.includes('gift') || slug.includes('basket')) {
        fallbacks.push('/images/products/gift-basket-premium.svg');
      } else if (slug.includes('cake')) {
        fallbacks.push('/images/products/birthday-cake.svg');
      }
    }
    
    // Always add default placeholder as final fallback
    fallbacks.push('/images/products/placeholder.svg');
    
    return fallbacks;
  }, [productSlug]);

  // Set default dimensions based on size if not provided
  const sizeDefaults = {
    thumb: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 }
  };

  const defaultDimensions = sizeDefaults[size];

  return (
    <ProgressiveImage
      src={src}
      fallbackSources={fallbackSources}
      containerWidth={containerWidth || defaultDimensions.width}
      containerHeight={containerHeight || defaultDimensions.height}
      enableWebP={true}
      enableResponsive={true}
      quality={size === 'thumb' ? 70 : size === 'small' ? 75 : 80}
      {...props}
    />
  );
};