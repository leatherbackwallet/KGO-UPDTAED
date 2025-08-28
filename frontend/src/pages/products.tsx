import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductFilters from '../components/ProductFilters';
import api from '../utils/api';
import { getMultilingualText } from '../utils/api';
import performanceMonitor from '../utils/performance';
import { Product } from '../types/product';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{_id: string, name: string | { en: string; ml: string }, slug: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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
    
    // Add a fallback timeout to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      if (loading) {
        console.log('⚠️ Fallback timeout triggered - forcing loading to false');
        setLoading(false);
        setError('Request timed out. Please try again.');
      }
    }, 20000); // 20 seconds fallback
    
    return () => clearTimeout(fallbackTimeout);
  }, []);

  // Debounced search effect (only for filters, not initial load)
  useEffect(() => {
    if (!isInitialLoad) {
      const timeoutId = setTimeout(() => {
        fetchProducts();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [search, category, selectedOccasions, min, max, isInitialLoad]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Fetching products...');
      console.log('🔗 API Base URL:', api.defaults.baseURL);
      console.log('🔗 Environment:', process.env.NODE_ENV);
      console.log('🔗 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
      
      // performanceMonitor.startTimer('products-fetch');

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (selectedOccasions.length > 0) params.append('occasions', selectedOccasions.join(','));
      if (min) params.append('minPrice', min);
      if (max) params.append('maxPrice', max);
      
      // Add cache busting parameter
      params.append('_t', Date.now().toString());

      const apiUrl = `/products?${params.toString()}`;
      console.log('🔗 Full API URL:', `${api.defaults.baseURL}${apiUrl}`);
      
      // Add a timeout promise to catch hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000);
      });
      
      const apiPromise = api.get(apiUrl);
      const response = await Promise.race([apiPromise, timeoutPromise]);
      
      console.log('✅ API Response Status:', response.status);
      console.log('✅ API Response Headers:', response.headers);
      console.log('✅ API Response Data:', response.data);
      
      const productsData = response.data?.data || response.data || [];
      console.log('📦 Products data length:', productsData.length);
      console.log('📦 First product:', productsData[0]);
      
      setProducts(Array.isArray(productsData) ? productsData : []);

      // performanceMonitor.endTimer('products-fetch');
    } catch (err: any) {
      console.error('❌ Error fetching products:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error request:', err.request);
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  }, [search, category, selectedOccasions, min, max]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      const categoriesData = response.data?.data || response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setShowQuickView(true);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
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
            onClearFilters={clearFilters}
          />

          {/* Products Grid */}
          <div className="mt-8">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <LoadingSpinner key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Products</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onQuickView={handleQuickView}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Quick View Modal */}
      {selectedProduct && (
        <QuickViewModal
          product={selectedProduct}
          isOpen={showQuickView}
          onClose={closeQuickView}
        />
      )}
    </>
  );
};

export default ProductsPage;
