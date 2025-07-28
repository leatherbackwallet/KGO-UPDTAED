import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { ProductSkeletonGrid } from '../components/ProductSkeleton';
import { Product } from '../types/product';

const celebrationTypes = [
  'Birthday',
  'Anniversary', 
  'Wedding',
  'Graduation',
  'Baby Shower',
  'House Warming',
  'Corporate Event',
  'Holiday',
  'Other'
];

export default function CelebrationCategory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  useEffect(() => {
    fetchCelebrationProducts();
  }, [selectedType]);

  const fetchCelebrationProducts = async () => {
    setLoading(true);
    try {
      const params: any = { category: 'celebration-cakes' };
      if (selectedType) params.celebrationType = selectedType;
      
      const res = await api.get<Product[]>('/products', { params });
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching celebration products:', error);
      setProducts([]); // Set empty array instead of demo data
    } finally {
      setLoading(false);
    }
  };

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setQuickViewProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Celebration Products</h1>
          <p className="text-gray-600">Make every celebration special with our curated collection</p>
        </div>

        {/* Celebration Type Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Filter by Celebration Type</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedType('')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Celebrations
            </button>
            {celebrationTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === type 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${Array.isArray(products) ? products.length : 0} celebration products found`}
            {selectedType && ` for ${selectedType}`}
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <ProductSkeletonGrid count={8} />
        ) : (!Array.isArray(products) || products.length === 0) ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No celebration products found</h3>
            <p className="text-gray-600 mb-4">
              {selectedType 
                ? `No products found for ${selectedType} celebrations. Try selecting a different celebration type.`
                : 'No celebration products are currently available. Please check back later.'
              }
            </p>
            {selectedType && (
              <button
                onClick={() => setSelectedType('')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Celebrations
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.isArray(products) && products.map(product => (
              <ProductCard 
                key={product._id} 
                product={product} 
                onQuickView={handleQuickView}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
      />
    </div>
  );
} 