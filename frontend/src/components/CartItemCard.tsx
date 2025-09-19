import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { getProductImage, getOptimizedImagePath, DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';
import { useImageCache } from '../utils/imageCache';
import { getMultilingualText } from '../utils/api';

interface CartItem {
  product: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
}

interface CartItemCardProps {
  item: CartItem;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartItemCard({ item, onQuantityChange, onRemove }: CartItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Use image caching hook for optimized image loading
  const { data: cachedImageUrl, isLoading: imageLoading, error: imageError } = useImageCache(
    item.image,
    item.product,
    {
      staleTime: 1000 * 60 * 60 * 24, // 24 hours
      enabled: true
    }
  );

  // Get the final image path with fallback
  const imagePath = cachedImageUrl || item.image || DEFAULT_PRODUCT_IMAGE;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error('Image failed to load:', target.src);
    
    // Try fallback image paths
    if (target.src !== DEFAULT_PRODUCT_IMAGE) {
      target.src = DEFAULT_PRODUCT_IMAGE;
    } else {
      // If default image also fails, use a data URI placeholder
      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgNzVMMTgwIDEwNUwxNTAgMTM1TDEyMCAxMDVMMTUwIDc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8dGV4dCB4PSIxNTAiIHk9IjE4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjc3NDhEIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = Math.max(1, Math.min(item.stock, parseInt(e.target.value) || 1));
    onQuantityChange(item.product, newQuantity);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(item.product);
  };

  const totalPrice = item.price * item.quantity;

  return (
    <div 
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
            alt={item.name}
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
          />
        )}
        
        {/* Remove Button Overlay */}
        <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={handleRemove}
            className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-all duration-200 hover:scale-110"
            aria-label="Remove from cart"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Quantity Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-kgo-red text-white text-xs px-2 py-1 rounded-full font-medium">
            Qty: {item.quantity}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {item.name}
        </h3>
        
        {/* Price and Quantity Controls */}
        <div className="space-y-3">
          {/* Price Display */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Unit Price:</span>
            <span className="text-lg font-semibold text-gray-900">
              ₹{item.price.toFixed(2)}
            </span>
          </div>
          
          {/* Total Price */}
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-base font-medium text-gray-900">Total:</span>
            <span className="text-xl font-bold text-kgo-red">
              ₹{totalPrice.toFixed(2)}
            </span>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Quantity:</label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onQuantityChange(item.product, Math.max(1, item.quantity - 1))}
                disabled={item.quantity <= 1}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 flex items-center justify-center transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <input
                type="number"
                min="1"
                max={item.stock}
                value={item.quantity}
                onChange={handleQuantityChange}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-kgo-red focus:border-transparent"
              />
              
              <button
                onClick={() => onQuantityChange(item.product, Math.min(item.stock, item.quantity + 1))}
                disabled={item.quantity >= item.stock}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 flex items-center justify-center transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stock Info */}
          <div className="text-xs text-gray-500 text-center">
            {item.stock} available in stock
          </div>
        </div>
      </div>
    </div>
  );
}
