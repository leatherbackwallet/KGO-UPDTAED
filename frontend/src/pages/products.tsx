import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { ProductSkeletonGrid } from '../components/ProductSkeleton';
import LoadingSpinner from '../components/LoadingSpinner';
import performanceMonitor from '../utils/performance';

interface Product {
  _id: string;
  name: string | { en: string; de: string };
  description: string | { en: string; de: string };
  price?: number;
  category: string | { _id: string; name: string; slug: string };
  stock?: number;
  images: string[];
  occasions?: string[];
  slug?: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{_id: string, name: string | { en: string; de: string }, slug: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Available occasions
  const availableOccasions = [
    'DIWALI', 'ANNIVERSARY', 'BIRTHDAY', 'CONDOLENCES', 'CONGRATULATION',
    'FATHERS DAY', 'GET WELL SOON', 'HOUSE WARMING', 'JUST BECAUSE',
    'MISS YOU', 'NEW BORN', 'ONAM', 'SYMPATHY', 'THANK YOU',
    'TRADITIONAL', 'WEDDING'
  ];

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [search, category, selectedOccasions, min, max]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    
    return performanceMonitor.measureAsyncInteraction('fetch_products', async () => {
      try {
        const params: any = {};
        if (search) params.search = search;
        if (category) params.category = category;
        if (selectedOccasions.length > 0) params.occasions = selectedOccasions.join(',');
        if (min) params.min = min;
        if (max) params.max = max;
        const res = await api.get('/products', { params });
        const responseData = res.data;
        setProducts(responseData.data || responseData || []);
      } catch (error: any) {
        console.error('Error fetching products:', error);
        setError(error.response?.data?.error?.message || 'Failed to fetch products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    });
  }, [search, category, selectedOccasions, min, max]);

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setQuickViewProduct(null);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setSelectedOccasions([]);
    setMin('');
    setMax('');
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
      

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-4">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => {
                    const categoryName = typeof cat.name === 'string' ? cat.name : cat.name.en || cat.name.de;
                    return (
                      <option key={cat._id} value={cat.slug}>
                        {categoryName}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={selectedOccasions[0] || ''}
                  onChange={e => setSelectedOccasions(e.target.value ? [e.target.value] : [])}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Occasions</option>
                  {availableOccasions.map(occasion => (
                    <option key={occasion} value={occasion}>
                      {occasion}
                    </option>
                  ))}
                </select>
                
                <input
                  type="number"
                  placeholder="Min Price"
                  value={min}
                  onChange={e => setMin(e.target.value)}
                  className="w-32 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <input
                  type="number"
                  placeholder="Max Price"
                  value={max}
                  onChange={e => setMax(e.target.value)}
                  className="w-32 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {loading ? 'Loading...' : `${Array.isArray(products) ? products.length : 0} products found`}
              </p>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.isArray(products) && products.map(product => {
                // Helper function to get text from multilingual object or string
                const getText = (text: string | { en: string; de: string }): string => {
                  if (typeof text === 'string') return text;
                  return text.en || text.de || '';
                };

                // Transform the product data to ensure proper rendering
                const transformedProduct = {
                  ...product,
                  name: getText(product.name),
                  description: getText(product.description),
                  category: typeof product.category === 'object' ? getText(product.category.name) : product.category,
                  slug: product.slug // Ensure slug is passed through
                };

                return (
                  <ProductCard 
                    key={product._id} 
                    product={transformedProduct} 
                    onQuickView={handleQuickView}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
      />
    </>
  );
}
