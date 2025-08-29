import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';
import { getMultilingualText } from '../utils/api';
import { Product } from '../types/product';

interface QuickViewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Get the main image path directly
  const mainImagePath = product?.images?.[selectedImage] || product?.defaultImage;
  const imagePath = mainImagePath ? getProductImage(mainImagePath, product?.slug) : DEFAULT_PRODUCT_IMAGE;

  if (!product || !isOpen) return null;

  const handleAddToCart = () => {
    addToCart({
      product: product._id,
      name: getMultilingualText(product.name),
      price: product.price || 0,
      image: imagePath,
      quantity,
      stock: product.stock || 0
    });
    onClose();
  };

  const getCategoryName = () => {
    if (!product.categories || product.categories.length === 0) return 'Uncategorized';
    const category = product.categories[0];
    if (typeof category === 'string') return category;
    if (category.name) {
      return getMultilingualText(category.name);
    }
    return 'Uncategorized';
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error('Image failed to load:', target.src);
    target.src = DEFAULT_PRODUCT_IMAGE;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {getMultilingualText(product.name)}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="aspect-w-1 aspect-h-1 w-full">
                  <img
                    src={imagePath}
                    alt={getMultilingualText(product.name)}
                    className="w-full h-96 object-cover rounded-lg"
                    onError={handleImageError}
                  />
                </div>
                
                {/* Thumbnail images - Show all images like ProductModal */}
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((image, index) => (
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
                          onError={handleImageError}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details - Enhanced with all ProductModal features */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {getMultilingualText(product.name)}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {getMultilingualText(product.description)}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      ₹{product.price?.toFixed(2) || '0.00'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {product.stock !== undefined ? `${product.stock} in stock` : 'Stock not available'}
                    </span>
                  </div>
                </div>

                {/* Category and Occasions */}
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-sm text-gray-600">{getCategoryName()}</span>
                  </div>
                  {product.occasions && product.occasions.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Occasions:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {product.occasions.map((occasion, index) => (
                          <span
                            key={index}
                            className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                          >
                            {occasion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantity and Add to Cart */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">Quantity:</label>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-gray-900">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock || 999, quantity + 1))}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={(product.stock || 0) === 0}
                    className="w-full bg-kgo-red text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {(product.stock || 0) === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 