/**
 * Simplified Product Image Component
 * Replaces complex caching system with reliable, simple image loading
 */

import React, { useState, useEffect } from 'react';
import { getProductImage } from '../utils/imageUtils';

interface SimpleProductImageProps {
  imagePath?: string;
  slug?: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
}

const SimpleProductImage: React.FC<SimpleProductImageProps> = ({
  imagePath,
  slug,
  alt = 'Product image',
  className = '',
  width,
  height,
  fallbackSrc = '/images/products/placeholder.svg'
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!imagePath) {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      return;
    }

    // Generate the image URL
    const imageUrl = getProductImage(imagePath, slug);
    setImageSrc(imageUrl);
    setIsLoading(true);
    setHasError(false);

    // Preload the image to check if it exists
    const img = new Image();
    
    img.onload = () => {
      setIsLoading(false);
      setHasError(false);
    };
    
    img.onerror = () => {
      console.warn(`Failed to load image: ${imageUrl}`);
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      setHasError(true);
    };
    
    img.src = imageUrl;
  }, [imagePath, slug, fallbackSrc]);

  const imageStyle: React.CSSProperties = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoading ? 0.5 : 1,
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '200px' }}
        >
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={imageStyle}
        loading="lazy"
        onError={() => {
          if (!hasError) {
            setImageSrc(fallbackSrc);
            setHasError(true);
          }
        }}
      />
      
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-xs text-center">
            Image unavailable
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleProductImage;
