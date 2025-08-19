import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
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

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product || !isOpen) return null;

  const handleAddToCart = () => {
    addToCart({
      product: product._id,
      name: getMultilingualText(product.name),
      price: product.price || 0,
      image: getProductImage(product.images[selectedImage], product.slug),
      quantity,
      stock: product.stock || 0
    });
    onClose();
  };

  const getCategoryName = () => {
    if (typeof product.category === 'string') return product.category;
    return getMultilingualText(product.category.name);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {getMultilingualText(product.name)}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Gallery */}
              <div className="space-y-3">
                <div className="aspect-w-1 aspect-h-1 w-full">
                  <img
                    src={getProductImage(product.images[selectedImage], product.slug)}
                    alt={getMultilingualText(product.name)}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_PRODUCT_IMAGE;
                    }}
                  />
                </div>
                
                {/* Thumbnail images */}
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.slice(0, 4).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-w-1 aspect-h-1 w-full rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={getProductImage(image, product.slug)}
                          alt={`${getMultilingualText(product.name)} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = DEFAULT_PRODUCT_IMAGE;
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {getMultilingualText(product.name)}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {getCategoryName()}
                  </p>
                  <div className="text-2xl font-bold text-gray-900 mb-3">
                    €{product.price?.toFixed(2) || '0.00'}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Description</h4>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    {getMultilingualText(product.description)}
                  </p>
                </div>

                {/* Occasions */}
                {product.occasions && product.occasions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Perfect for</h4>
                    <div className="flex flex-wrap gap-1">
                      {product.occasions.slice(0, 3).map((occasion, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
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
                  </div>
                )}

                {/* Stock Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                      Qty:
                    </label>
                    <select
                      id="quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                      disabled={(product.stock || 0) === 0}
                    >
                      {[...Array(Math.min(5, product.stock || 0))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-sm text-gray-500">
                    {product.stock !== undefined ? `${product.stock} in stock` : 'Stock not available'}
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={(product.stock || 0) === 0}
                  className="w-full bg-kgo-red text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {(product.stock || 0) === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 