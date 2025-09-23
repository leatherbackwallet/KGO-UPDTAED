import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import WishlistButton from './WishlistButton';
import { getProductImage, getOptimizedImagePath, DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';
import { useImageCache } from '../utils/imageCache';
import { getMultilingualText } from '../utils/api';
import { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onClick?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView, onClick }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  // Get the base image path for caching
  const baseImagePath = product.images?.[0] || product.defaultImage;
  
  // Use image caching hook for optimized image loading
  const { data: cachedImageUrl, isLoading: imageLoading, error: imageError } = useImageCache(
    baseImagePath,
    product.slug,
    {
      staleTime: 1000 * 60 * 60 * 24, // 24 hours
      enabled: true
    }
  );

  // Get the final image path with fallback
  const imagePath = cachedImageUrl || (baseImagePath ? getOptimizedImagePath(baseImagePath, 'medium') : DEFAULT_PRODUCT_IMAGE);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error('Image failed to load:', target.src);
    console.error('Image error details:', imageError);
    
    // Try fallback image paths
    if (target.src !== DEFAULT_PRODUCT_IMAGE) {
      target.src = DEFAULT_PRODUCT_IMAGE;
    } else {
      // If default image also fails, use a data URI placeholder
      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgNzVMMTgwIDEwNUwxNTAgMTM1TDEyMCAxMDVMMTUwIDc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8dGV4dCB4PSIxNTAiIHk9IjE4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjc3NDhEIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      product: product._id,
      name: getMultilingualText(product.name),
      price: product.price || 0,
      image: getProductImage(product.images?.[0], product.slug),
      quantity: 1,
      stock: product.stock || 0
    });
  };

  const handleCardClick = () => {
    // Always trigger quick view when card is clicked
    onQuickView(product);
  };

  return (
    <div 
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        {imageLoading ? (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kgo-red"></div>
          </div>
        ) : (
          <img
            src={imagePath}
            alt={getMultilingualText(product.name)}
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
          />
        )}
        
        {/* Overlay with only Add to Cart action */}
        <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={(product.stock || 0) === 0}
              className="w-12 h-12 rounded-full bg-kgo-red flex items-center justify-center hover:bg-red-700 transition-all duration-200 hover:scale-110 disabled:bg-gray-400 disabled:cursor-not-allowed"
              aria-label="Add to cart"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </button>
          </div>
        </div>

        {/* Wishlist Button */}
        <div className="absolute top-3 right-3">
          <WishlistButton product={product} />
        </div>

        {/* Stock Badge */}
        {(product.stock || 0) === 0 && (
          <div className="absolute top-3 left-3">
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Out of Stock
            </span>
          </div>
        )}

        {/* Featured Badge */}
        {product.isFeatured && (
          <div className="absolute top-3 left-3">
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {getMultilingualText(product.name)}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {getMultilingualText(product.description)}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            ₹{product.price?.toFixed(2) || '0.00'}
          </span>
        </div>
      </div>
    </div>
  );
}
