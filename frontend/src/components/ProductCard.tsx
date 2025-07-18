import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import WishlistButton from './WishlistButton';
import { getProductImage } from '../utils/imageUtils';

interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  category: string | { _id: string; name: string; slug: string };
  celebrationType?: string;
  stock?: number;
  images: string[];
  tags?: string[];
  isFeatured?: boolean;
  slug?: string;
}

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      product: product._id,
      name: product.name,
      price: product.price || 0,
      image: getProductImage(product.images[0], product.slug),
      quantity: 1,
      stock: product.stock || 0
    });
  };

  return (
    <div 
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <img
          src={getProductImage(product.images[0], product.slug)}
          alt={product.name}
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/products/placeholder.svg';
          }}
        />
        
        {/* Overlay with actions */}
        <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex gap-3">
            <button
              onClick={() => onQuickView(product)}
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
              className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-all duration-200 hover:scale-110 disabled:bg-gray-400 disabled:cursor-not-allowed"
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

      {/* Content */}
      <div className="p-6">
        <div className="mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {typeof product.category === 'object' ? product.category.name : product.category}
            {product.celebrationType && ` • ${product.celebrationType}`}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">
            ${(product.price || 0).toFixed(2)}
          </div>
          
          <Link 
            href={`/products/${product._id}`}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
