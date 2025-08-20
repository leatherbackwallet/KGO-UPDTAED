import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { getMultilingualText } from '../utils/api';
import { Product } from '../types/product';
import { useImageCache } from '../utils/imageCache';
import { DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Use cached image for the main selected image only
  const { data: mainImagePath, isLoading: mainImageLoading } = useImageCache(
    product?.images?.[selectedImage] || product?.defaultImage,
    product?.slug,
    {
      staleTime: 1000 * 60 * 60 * 24, // 24 hours
    }
  );

  if (!product || !isOpen) return null;

  const handleAddToCart = () => {
    addToCart({
      product: product._id,
      name: getMultilingualText(product.name),
      price: product.price || 0,
      image: mainImagePath || product.images[selectedImage],
      quantity,
      stock: product.stock || 0
    });
    onClose();
  };

  const getCategoryName = () => {
    if (!product.category) return 'Uncategorized';
    if (typeof product.category === 'string') return product.category;
    if (product.category.name) {
      return getMultilingualText(product.category.name);
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
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel - Updated to max-w-4xl like ProductModal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="aspect-w-1 aspect-h-1 w-full">
                  <img
                    src={mainImagePath || DEFAULT_PRODUCT_IMAGE}
                    alt={getMultilingualText(product.name)}
                    className="w-full h-96 object-cover rounded-lg"
                    onError={handleImageError}
                    style={{ opacity: mainImageLoading ? 0.7 : 1 }}
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
                          src={image || DEFAULT_PRODUCT_IMAGE}
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {getMultilingualText(product.name)}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Category: {getCategoryName()}
                  </p>
                  <div className="text-3xl font-bold text-gray-900 mb-4">
                    ₹{product.price?.toFixed(2) || '0.00'}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600 leading-relaxed">
                    {getMultilingualText(product.description) || 'No description available.'}
                  </p>
                </div>

                {/* Occasions */}
                {product.occasions && product.occasions.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Perfect for</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.occasions.map((occasion, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                        >
                          {occasion.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock Status and Quantity Selector */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                      Quantity:
                    </label>
                    <select
                      id="quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      disabled={(product.stock || 0) === 0}
                    >
                      {[...Array(Math.min(10, product.stock || 0))].map((_, i) => (
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

                {/* Featured Badge */}
                {product.isFeatured && (
                  <div className="flex items-center">
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                      Featured Product
                    </span>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={(product.stock || 0) === 0}
                  className="w-full bg-kgo-red text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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