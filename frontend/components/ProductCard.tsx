import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import WishlistButton from './WishlistButton';
import { DEFAULT_PRODUCT_IMAGE, getProductImage, getOriginalImagePath } from '../utils/imageUtils';
import { Product } from '../types/shared';
import { useSmartImageCache } from '../hooks/useSmartImageCache';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onClick?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView, onClick }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get the base image path
  const baseImagePath = product.images?.[0] || product.defaultImage;
  
  // Use smart image cache for optimized loading
  const { imageUrl, isLoading, isCached } = useSmartImageCache(
    baseImagePath,
    product.slug,
    { preload: true, priority: 'high' }
  );

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    
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
      name: product.name,
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

  const isOutOfStock = (product.stock || 0) === 0;

  return (
    <div 
      className="group bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 cursor-pointer transform hover:-translate-y-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {(!imageLoaded || isLoading) && (
          <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="animate-pulse bg-gray-300 rounded-lg w-full h-full"></div>
            {isCached && (
              <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg z-10">
                Cached
              </div>
            )}
          </div>
        )}
        <img
          src={imageUrl}
          alt={product.name}
          className={`w-full aspect-square object-contain transition-all duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
          } ${isHovered ? 'scale-110' : 'scale-100'}`}
          onError={handleImageError}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        
        {/* Gradient Overlay on Hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 transition-opacity duration-500 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}></div>
        
        {/* Action Buttons Overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-kgo-red to-kgo-red-dark flex items-center justify-center hover:from-kgo-red-dark hover:to-kgo-red transform hover:scale-110 transition-all duration-300 shadow-2xl disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 group/btn"
              aria-label="Add to cart"
            >
              <svg className="w-6 h-6 text-white transform group-hover/btn:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </button>
          </div>
        </div>

        {/* Wishlist Button */}
        <div className={`absolute top-4 right-4 transition-all duration-300 ${
          isHovered ? 'opacity-100 scale-100' : 'opacity-90 scale-100'
        }`}>
          <WishlistButton product={product} />
        </div>

        {/* Stock Badge */}
        {isOutOfStock && (
          <div className="absolute top-4 left-4">
            <span className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg backdrop-blur-sm">
              Out of Stock
            </span>
          </div>
        )}

        {/* Featured Badge */}
        {product.isFeatured && !isOutOfStock && (
          <div className="absolute top-4 left-4">
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg backdrop-blur-sm">
              ⭐ Featured
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5 bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-kgo-red transition-colors duration-300">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
          {product.description}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900">
              ₹{product.price?.toFixed(2) || '0.00'}
            </span>
            {product.originalPrice && product.originalPrice > (product.price || 0) && (
              <span className="text-sm text-gray-500 line-through">
                ₹{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          {!isOutOfStock && (
            <div className="flex items-center text-green-600 text-sm font-semibold">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              In Stock
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
