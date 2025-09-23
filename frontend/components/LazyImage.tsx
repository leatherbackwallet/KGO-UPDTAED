/**
 * LazyImage Component
 * Implements lazy loading with Intersection Observer and priority-based loading
 */

import React, { useRef, useEffect, useState } from 'react';
import { imageManager } from '../services';

export interface LazyImageProps {
  src: string;
  alt: string;
  fallbackSources?: string[];
  className?: string;
  style?: React.CSSProperties;
  priority?: 'high' | 'normal' | 'low';
  placeholder?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  enableBlurTransition?: boolean;
  showLoadingSpinner?: boolean;
}

/**
 * LazyImage component with intersection observer-based lazy loading
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallbackSources = [],
  className = '',
  style = {},
  priority = 'normal',
  placeholder = '/images/products/placeholder.svg',
  width,
  height,
  onLoad,
  onError,
  enableBlurTransition = true,
  showLoadingSpinner = false,
  ...props
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);

  useEffect(() => {
    const imgElement = imgRef.current;
    if (!imgElement) return;

    // Set up lazy loading with ImageManager
    imageManager.observeForLazyLoading(imgElement, src, {
      fallbackUrls: fallbackSources,
      priority,
      placeholder
    });

    // Custom load handler to update state
    const handleLoad = () => {
      setIsLoading(false);
      setIsLoaded(true);
      setHasError(false);
      onLoad?.();
    };

    const handleError = (error: Event) => {
      setIsLoading(false);
      setIsLoaded(false);
      setHasError(true);
      onError?.(new Error('Image load failed'));
    };

    // Listen for src changes (when lazy loading completes)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
          const newSrc = imgElement.src;
          if (newSrc !== placeholder && newSrc !== currentSrc) {
            setCurrentSrc(newSrc);
            setIsLoading(false);
            setIsLoaded(true);
            onLoad?.();
          }
        }
      });
    });

    observer.observe(imgElement, {
      attributes: true,
      attributeFilter: ['src']
    });

    imgElement.addEventListener('load', handleLoad);
    imgElement.addEventListener('error', handleError);

    return () => {
      imageManager.unobserveForLazyLoading(imgElement);
      observer.disconnect();
      imgElement.removeEventListener('load', handleLoad);
      imgElement.removeEventListener('error', handleError);
    };
  }, [src, fallbackSources, priority, placeholder, currentSrc, onLoad, onError]);

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
    filter: isLoading && enableBlurTransition ? 'blur(5px)' : 'none',
    opacity: isLoaded ? 1 : 0.7,
    ...(width && { width }),
    ...(height && { height })
  };

  const spinnerStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '24px',
    height: '24px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    opacity: isLoading && showLoadingSpinner ? 1 : 0,
    transition: 'opacity 0.3s ease-out'
  };

  return (
    <div className={className} style={containerStyles}>
      <img
        ref={imgRef}
        src={placeholder}
        alt={alt}
        style={imageStyles}
        {...props}
      />
      
      {/* Loading spinner */}
      {showLoadingSpinner && (
        <div style={spinnerStyles} />
      )}
      
      {/* Error state */}
      {hasError && (
        <div
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
          <div>Failed to load</div>
        </div>
      )}

      {/* Priority indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            background: priority === 'high' ? 'red' : priority === 'normal' ? 'orange' : 'green',
            color: 'white',
            fontSize: '10px',
            padding: '2px 4px',
            borderRadius: '2px',
            pointerEvents: 'none'
          }}
        >
          {priority}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/**
 * LazyProductImage component specifically for product images
 */
export interface LazyProductImageProps extends Omit<LazyImageProps, 'fallbackSources'> {
  productSlug?: string;
  size?: 'thumb' | 'small' | 'medium' | 'large';
}

export const LazyProductImage: React.FC<LazyProductImageProps> = ({
  src,
  productSlug,
  size = 'medium',
  priority = 'normal',
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

  return (
    <LazyImage
      src={src}
      fallbackSources={fallbackSources}
      priority={priority}
      {...props}
    />
  );
};