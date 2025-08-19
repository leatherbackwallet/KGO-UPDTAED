import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import ProductModal from '../components/ProductModal';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';
import { getMultilingualText } from '../utils/api';
import { performanceMonitor } from '../utils/performance';

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

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{_id: string, name: string | { en: string; de: string }, slug: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Available occasions
  const occasions = [
    'DIWALI', 'ANNIVERSARY', 'BIRTHDAY', 'CONDOLENCES', 'CONGRATULATION',
    'FATHERS DAY', 'GET WELL SOON', 'HOUSE WARMING', 'JUST BECAUSE',
    'MISS YOU', 'NEW BORN', 'ONAM', 'SYMPATHY', 'THANK YOU',
    'TRADITIONAL', 'WEDDING'
  ];

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    setIsInitialLoad(false);
  }, []);

  // Debounced search effect (only for filters, not initial load)
  useEffect(() => {
    if (isInitialLoad) return; // Skip on initial load to prevent double call
    
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [search, category, selectedOccasions, min, max]); // Removed isInitialLoad from dependencies

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
    setSelectedProduct(product);
    setShowQuickView(true);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setShowModal(false);
  };

  const closeQuickView = () => {
    setSelectedProduct(null);
    setShowQuickView(false);
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
      <Head>
        <title>Products - KeralGiftsOnline</title>
        <meta name="description" content="Discover our collection of gifts, cakes, flowers, and celebration items" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Products</h1>
            <p className="text-gray-600">Discover perfect gifts for every occasion</p>
          </div>

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
                    const categoryName = typeof cat.name === 'string' ? cat.name : getMultilingualText(cat.name);
                    return (
                      <option key={cat._id} value={cat.slug}>
                        {categoryName}
                      </option>
                    );
                  })}
                </select>
                
                <button
                  onClick={clearFilters}
                  className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={min}
                    onChange={e => setMin(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={max}
                    onChange={e => setMax(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occasions</label>
                <select
                  multiple
                  value={selectedOccasions}
                  onChange={e => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedOccasions(values);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {occasions.map(occasion => (
                    <option key={occasion} value={occasion}>
                      {occasion.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mb-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {loading ? 'Loading...' : `${products.length} products found`}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or browse all products.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onQuickView={handleQuickView}
                  onClick={handleProductClick}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <ProductModal
        product={selectedProduct}
        isOpen={showModal}
        onClose={closeModal}
      />
      
      <QuickViewModal
        product={selectedProduct}
        isOpen={showQuickView}
        onClose={closeQuickView}
      />
    </>
  );
};

export default ProductsPage;
