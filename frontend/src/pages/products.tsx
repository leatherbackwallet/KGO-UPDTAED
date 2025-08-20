import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import ProductModal from '../components/ProductModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductFilters from '../components/ProductFilters';
import api from '../utils/api';
import { getMultilingualText } from '../utils/api';
import performanceMonitor from '../utils/performance';
import { Product } from '../types/product';

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
    
    const fetchFunction = async () => {
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
    };

    // Use performance monitor if available, otherwise just call the function
    if (performanceMonitor && typeof performanceMonitor.measureAsyncInteraction === 'function') {
      return performanceMonitor.measureAsyncInteraction('fetch_products', fetchFunction);
    } else {
      return fetchFunction();
    }
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
          {/* Modern Filters - Moved to top */}
          <div className="mb-8">
            <ProductFilters
              search={search}
              setSearch={setSearch}
              category={category}
              setCategory={setCategory}
              selectedOccasions={selectedOccasions}
              setSelectedOccasions={setSelectedOccasions}
              min={min}
              setMin={setMin}
              max={max}
              setMax={setMax}
              categories={categories}
              occasions={occasions}
              clearFilters={clearFilters}
            />
          </div>

          {/* Results Header */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                {loading ? 'Loading...' : `${products.length} products found`}
              </div>
              {!loading && products.length > 0 && (
                <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error loading products</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No products found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">We couldn't find any products matching your criteria. Try adjusting your filters or search terms.</p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear all filters
              </button>
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
