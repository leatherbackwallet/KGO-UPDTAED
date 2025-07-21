import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import WishlistButton from './WishlistButton';
import { getProductImage } from '../utils/imageUtils';

interface Product {
  _id: string;
  name: string | { en: string; de: string };
  description: string | { en: string; de: string };
  price?: number;
  category: string | { _id: string; name: string; slug: string };
  stock?: number;
  images: string[];
  slug?: string;
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

  // Helper function to get text from multilingual object or string
  const getText = (text: string | { en: string; de: string }): string => {
    if (typeof text === 'string') return text;
    return text.en || text.de || '';
  };

  if (!product || !isOpen) return null;

  const handleAddToCart = () => {
    addToCart({
      product: product._id,
      name: getText(product.name),
      price: product.price || 0,
      image: getProductImage(product.images[0], product.slug),
      quantity,
      stock: product.stock || 0
    });
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/images/products/placeholder.svg';
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Quick View</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Image Section */}
          <div className="lg:w-1/2 p-6">
            <div className="relative">
              <img
                src={getProductImage(product.images[selectedImage], product.slug)}
                alt={getText(product.name)}
                className="w-full h-80 object-cover rounded-lg"
                onError={handleImageError}
              />
              <WishlistButton 
                product={{
                  _id: product._id,
                  name: getText(product.name),
                  price: product.price,
                  images: product.images,
                  slug: product.slug
                }} 
                className="absolute top-4 right-4"
              />
            </div>
            
            {/* Image Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-blue-500' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={getProductImage(image, product.slug)}
                      alt={`${getText(product.name)} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="lg:w-1/2 p-6 flex flex-col">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{getText(product.name)}</h3>
              <p className="text-3xl font-bold text-blue-600 mb-4">${(product.price || 0).toFixed(2)}</p>
              
              <div className="mb-4">
                <span className="text-sm text-gray-500">Category:</span>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {typeof product.category === 'object' ? getText(product.category.name) : product.category}
                </span>
              </div>
              
              <div className="mb-4">
                <span className="text-sm text-gray-500">Stock:</span>
                <span className={`ml-2 text-sm font-medium ${
                  (product.stock || 0) > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(product.stock || 0) > 0 ? `${product.stock} available` : 'Out of stock'}
                </span>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">{getText(product.description)}</p>
            </div>

            {/* Actions */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={product.stock || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock || 1, Number(e.target.value))))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={(product.stock || 0) === 0}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 