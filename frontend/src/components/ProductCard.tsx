import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import WishlistButton from './WishlistButton';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';
import { getMultilingualText } from '../utils/api';

interface Product {
  _id: string;
  name: string | { en: string; de: string };
  description: string | { en: string; de: string };
  price?: number;
  category: string | { _id: string; name: string | { en: string; de: string }; slug: string };
  stock?: number;
  images: string[];
  slug?: string;
  occasions?: string[];
  isFeatured?: boolean;
}

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onClick?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView, onClick }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  // Get image path
  const imagePath = getProductImage(product.images[0], product.slug);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      product: product._id,
      name: getMultilingualText(product.name),
      price: product.price || 0,
      image: getProductImage(product.images[0], product.slug),
      quantity: 1,
      stock: product.stock || 0
    });
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    }
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
        <img
          src={imagePath}
          alt={getMultilingualText(product.name)}
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            console.error('Image failed to load:', target.src);
            target.src = DEFAULT_PRODUCT_IMAGE;
          }}
        />
        
        {/* Overlay with actions */}
        <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all duration-200 hover:scale-110"
              aria-label="Quick view"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            
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
          <WishlistButton product={{
            _id: product._id,
            name: getMultilingualText(product.name),
            price: product.price,
            images: product.images,
            slug: product.slug
          }} />
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
          <div className="absolute bottom-3 left-3">
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            {typeof product.category === 'object' ? getMultilingualText(product.category.name) : product.category}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {getMultilingualText(product.name)}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {getMultilingualText(product.description)}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">
              €{product.price?.toFixed(2) || '0.00'}
            </span>
            {product.stock !== undefined && (
              <span className="text-sm text-gray-500">
                ({product.stock} in stock)
              </span>
            )}
          </div>
        </div>

        {/* Occasions */}
        {product.occasions && product.occasions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {product.occasions.slice(0, 3).map((occasion, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
              >
                {occasion}
              </span>
            ))}
            {product.occasions.length > 3 && (
              <span className="text-xs text-gray-500">
                +{product.occasions.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
