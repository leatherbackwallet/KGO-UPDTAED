import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import ProductSkeleton, { ProductSkeletonGrid } from '../components/ProductSkeleton';
import ProductFilters from '../components/ProductFilters';
import api from '../utils/api';
import { getMultilingualText } from '../utils/api';
import { preloadProductImages } from '../utils/imageUtils';
import performanceMonitor from '../utils/performance';
import { Product } from '../types/product';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{_id: string, name: string | { en: string; ml: string }, slug: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Timeout reference for cleanup
  const [fallbackTimeoutRef, setFallbackTimeoutRef] = useState<NodeJS.Timeout | null>(null);
  
  // Professional batch loading strategy
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allProductsLoaded, setAllProductsLoaded] = useState(false);
  const PRODUCTS_PER_PAGE = 12; // Standard ecommerce batch size
  const PRELOAD_SCROLLS = 2; // Preload 2 scrolls worth of content
  
  // Professional loading states
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showSkeletonOverlay, setShowSkeletonOverlay] = useState(false);
  
  // Refs for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Available occasions
  const occasions = [
    'DIWALI', 'ANNIVERSARY', 'BIRTHDAY', 'CONDOLENCES', 'CONGRATULATION',
    'FATHERS DAY', 'GET WELL SOON', 'HOUSE WARMING', 'JUST BECAUSE',
    'MISS YOU', 'NEW BORN', 'ONAM', 'SYMPATHY', 'THANK YOU',
    'TRADITIONAL', 'WEDDING'
  ];

  useEffect(() => {
    // Set client flag to prevent hydration mismatch
    setIsClient(true);
    setIsHydrated(true);
    
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
    
    // Store timeout reference for cleanup
    setFallbackTimeoutRef(fallbackTimeout);
    
    return () => {
      clearTimeout(fallbackTimeout);
      setFallbackTimeoutRef(null);
    };
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fallbackTimeoutRef) {
        clearTimeout(fallbackTimeoutRef);
        console.log('🧹 Cleaned up fallback timeout on unmount');
      }
    };
  }, [fallbackTimeoutRef]);

  // Smart lazy loading with intersection observer
  // No longer needed - showing all products at once

  const fetchProducts = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    
    try {
      setLoading(true);
      setError('');
      console.log(`🔍 Fetching products... (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      console.log('🔗 API Base URL:', api.defaults.baseURL);
      console.log('🔗 Environment:', process.env.NODE_ENV);
      console.log('🔗 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
      
      // Clear any existing fallback timeout since we're starting a new request
      if (fallbackTimeoutRef) {
        clearTimeout(fallbackTimeoutRef);
        setFallbackTimeoutRef(null);
        console.log('🧹 Cleared existing fallback timeout');
      }

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (selectedOccasions.length > 0) params.append('occasions', selectedOccasions.join(','));
      if (min) params.append('minPrice', min);
      if (max) params.append('maxPrice', max);
      
      // Fetch all products initially to avoid pagination issues
      params.append('limit', '100');
      
      // Add cache busting parameter
      params.append('_t', Date.now().toString());

      const apiUrl = `/products?${params.toString()}`;
      console.log('🔗 Full API URL:', `${api.defaults.baseURL}${apiUrl}`);
      
      // Add a timeout promise with longer timeout for stability
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 20 seconds')), 20000);
      });
      
      const apiPromise = api.get(apiUrl);
      const response = await Promise.race([apiPromise, timeoutPromise]) as any;
      
      console.log('✅ API Response Status:', response.status);
      console.log('✅ API Response Headers:', response.headers);
      console.log('✅ API Response Data length:', response.data?.data?.length || 0);
      
      const productsData = response.data?.data || response.data || [];
      console.log('📦 Products data length:', productsData.length);
      console.log('📦 First product:', productsData[0]?.name || 'No products');
      
      // Validate products data with detailed logging
      const validProducts = Array.isArray(productsData) ? productsData.filter((product, index) => {
        const isValid = product && product._id && product.name;
        if (!isValid) {
          console.warn(`❌ Invalid product at index ${index}:`, {
            hasProduct: !!product,
            hasId: !!product?._id,
            hasName: !!product?.name,
            product: product
          });
        }
        return isValid;
      }) : [];
      
      console.log('✅ Valid products count:', validProducts.length);
      console.log('📋 Valid product names:', validProducts.map(p => p.name).slice(0, 5));
      
      setProducts(validProducts);
      setError('');
      
      // Professional loading state management
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
      
      // Set hasMore based on product count
      setAllProductsLoaded(validProducts.length > 0);
      setHasMore(validProducts.length > PRODUCTS_PER_PAGE);
      
      // Professional image preloading - preload current + next batch
      if (validProducts.length > 0) {
        console.log('🖼️ Starting image preloading for better UX...');
        preloadProductImages(validProducts, currentPage, PRODUCTS_PER_PAGE);
      }
      
    } catch (err: any) {
      console.error(`❌ Error fetching products (attempt ${retryCount + 1}):`, err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error response:', err.response?.data);
      
      // Retry logic for network errors
      if (retryCount < MAX_RETRIES && (
        err.message.includes('timeout') || 
        err.message.includes('Network Error') ||
        err.code === 'ECONNABORTED'
      )) {
        console.log(`🔄 Retrying in ${(retryCount + 1) * 2} seconds...`);
        setTimeout(() => {
          fetchProducts(retryCount + 1);
        }, (retryCount + 1) * 2000); // Exponential backoff
        return;
      }
      
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch products';
      setError(errorMessage);
      setProducts([]);
      
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  }, [search, category, selectedOccasions, min, max, fallbackTimeoutRef]);

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

  // Debug function to help troubleshoot
  const debugProductsState = () => {
    console.log('🐛 Debug Products State:');
    console.log('Products array length:', products.length);
    console.log('Current page:', currentPage);
    console.log('Products per page:', PRODUCTS_PER_PAGE);
    console.log('Products being displayed:', currentPage * PRODUCTS_PER_PAGE);
    console.log('Loading state:', loading);
    console.log('Error state:', error);
    console.log('Is client:', isClient);
  };

  return (
    <>
      <Head>
        <title>Products - KeralGiftsOnline</title>
        <meta name="description" content="Discover our collection of gifts, traditional products, and authentic Kerala items" />
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
            {!isHydrated ? (
              // Show skeleton loading during SSR - this ensures server and client render the same thing
              <div className="space-y-6">
                <ProductSkeletonGrid count={12} />
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm font-medium">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Loading products...
                  </div>
                </div>
              </div>
            ) : loading && !initialLoadComplete ? (
              // Show skeleton loading during initial client-side loading
              <div className="space-y-6">
                <ProductSkeletonGrid count={12} />
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm font-medium">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Loading products...
                  </div>
                </div>
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
                  onClick={() => {
                    console.log('🔄 Error retry clicked');
                    setCurrentPage(1); // Reset pagination
                    setProducts([]); // Clear current products
                    setError(''); // Clear error
                    fetchProducts(0); // Fetch fresh data
                  }}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Retrying...' : 'Try Again'}
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
              <>
                {/* Professional Product Grid with Smooth Transitions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product, index) => (
                    <div 
                      key={product._id}
                      className="opacity-0 animate-fade-in"
                      style={{ 
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'forwards'
                      }}
                    >
                      <ProductCard
                        product={product}
                        onQuickView={handleQuickView}
                      />
                    </div>
                  ))}
                  
                  {/* Show skeleton cards for loading more */}
                  {loadingMore && (
                    <>
                      {Array.from({ length: Math.min(PRODUCTS_PER_PAGE, 4) }).map((_, index) => (
                        <ProductSkeleton key={`skeleton-${index}`} />
                      ))}
                    </>
                  )}
                </div>
                
                {/* Product count display */}
                <div className="text-center mt-12">
                  <div className="inline-flex items-center px-4 py-2 bg-gray-50 rounded-full text-gray-600 text-sm">
                    Showing {products.length} products
                  </div>
                </div>
                
                {/* Reload Button if few products */}
                {products.length > 0 && products.length <= 10 && (
                  <div className="text-center mt-8 space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        Only {products.length} products loaded. Our catalog has many more items!
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={() => {
                          console.log('🔄 Manual reload clicked');
                          setCurrentPage(1); // Reset pagination
                          setProducts([]); // Clear current products
                          setError(''); // Clear any errors
                          fetchProducts(0); // Fetch fresh data
                        }}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Reloading...
                          </div>
                        ) : (
                          <>🔄 Reload to see all products</>
                        )}
                      </button>
                      
                      <button
                        onClick={debugProductsState}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        🐛 Debug Info
                      </button>
                    </div>
                  </div>
                )}
              </>
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

// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  };
}
