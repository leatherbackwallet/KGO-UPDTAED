import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import Navbar from '../../components/Navbar';
import { getProductImage } from '../../utils/imageUtils';
import { getMultilingualText } from '../../utils/api';

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

const ProductDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      setProduct(response.data.data || response.data);
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <a href="/products" className="text-blue-600 hover:text-blue-800">Back to Products</a>
        </div>
      </div>
    );
  }

  const getCategoryName = () => {
    if (typeof product.category === 'string') return product.category;
    return getMultilingualText(product.category.name);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              {/* Product Images */}
              <div className="space-y-4">
                <div className="aspect-w-1 aspect-h-1 w-full">
                  <img
                    src={getProductImage(product.images[selectedImage], product.slug)}
                    alt={getMultilingualText(product.name)}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                
                {/* Thumbnail Images */}
                {product.images.length > 1 && (
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
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {getMultilingualText(product.name)}
                  </h1>
                  <p className="text-sm text-gray-500 mb-4">
                    Category: {getCategoryName()}
                  </p>
                  <div className="text-4xl font-bold text-gray-900 mb-4">
                    €{product.price?.toFixed(2) || '0.00'}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {getMultilingualText(product.description)}
                  </p>
                </div>

                {/* Occasions */}
                {product.occasions && product.occasions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Perfect for</h3>
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

                {/* Stock Status */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {product.stock !== undefined ? `${product.stock} in stock` : 'Stock not available'}
                  </div>
                  {product.isFeatured && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                      Featured
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    disabled={(product.stock || 0) === 0}
                    className="flex-1 bg-kgo-red text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {(product.stock || 0) === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Add to Wishlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage; 