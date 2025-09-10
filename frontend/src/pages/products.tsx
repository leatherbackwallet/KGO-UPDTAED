import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductFilters from '../components/ProductFilters';
import ProductSkeleton from '../components/ProductSkeleton';
import VirtualizedProductGrid from '../components/VirtualizedProductGrid';
import api from '../utils/api';
import { getMultilingualText } from '../utils/api';
import performanceMonitor from '../utils/performance';
import { Product } from '../types/product';
import { ReliableApiService } from '../services/ReliableApiService';
import { ConnectionMonitor } from '../services/ConnectionMonitor';
import { ApiError, ErrorType, ConnectionStatus } from '../services/types';
import { useConnectionMonitor } from '../hooks/useConnectionMonitor';
import { ConnectionIndicator } from '../components/ConnectionIndicator';

// Dynamically import heavy components to reduce initial bundle size
const DynamicQuickViewModal = dynamic(() => import('../components/QuickViewModal'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

// Memoized filter component to prevent unnecessary re-renders
const MemoizedProductFilters = memo(ProductFilters);

// Memoized connection indicator
const MemoizedConnectionIndicator = memo(ConnectionIndicator);

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{_id: string, name: string | { en: string; ml: string }, slug: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [partialData, setPartialData] = useState<Product[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [cacheStatus, setCacheStatus] = useState<'fresh' | 'stale' | 'none'>('none');
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);
  
  // Use connection monitor hook
  const {
    isOnline,
    networkSpeed,
    connectionQuality,
    indicator,
    queueForRetry,
    getEstimatedLoadTime
  } = useConnectionMonitor();
  
  // Service instances
  const reliableApiService = useRef<ReliableApiService | null>(null);
  const connectionMonitor = useRef<ConnectionMonitor | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Memoize occasions array to prevent unnecessary re-renders
  const occasions = useMemo(() => [
    'DIWALI', 'ANNIVERSARY', 'BIRTHDAY', 'CONDOLENCES', 'CONGRATULATION',
    'FATHERS DAY', 'GET WELL SOON', 'HOUSE WARMING', 'JUST BECAUSE',
    'MISS YOU', 'NEW BORN', 'ONAM', 'SYMPATHY', 'THANK YOU',
    'TRADITIONAL', 'WEDDING'
  ], []);

  // Determine if we should use virtual scrolling based on product count
  useEffect(() => {
    setUseVirtualScrolling(products.length > 50);
  }, [products.length]);

  // Memoize filtered and sorted products to prevent unnecessary re-computations
  const displayProducts = useMemo(() => {
    let filtered = [...products];
    
    // Apply any additional client-side filtering if needed
    // (Most filtering should be done server-side for performance)
    
    return filtered;
  }, [products]);

  // Memoize expensive computations
  const productStats = useMemo(() => ({
    total: products.length,
    inStock: products.filter(p => (p.stock || 0) > 0).length,
    outOfStock: products.filter(p => (p.stock || 0) === 0).length,
    featured: products.filter(p => p.isFeatured).length
  }), [products]);

  useEffect(() => {
    // Initialize services
    reliableApiService.current = new ReliableApiService();
    
    // Fetch initial data
    fetchCategories();
    fetchProducts();
    setIsInitialLoad(false);
    
    // Cleanup on unmount
    return () => {
      reliableApiService.current?.destroy();
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

  const fetchProducts = useCallback(async (isRetry = false) => {
    if (!reliableApiService.current) return;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (selectedOccasions.length > 0) params.append('occasions', selectedOccasions.join(','));
    if (min) params.append('minPrice', min);
    if (max) params.append('maxPrice', max);
    
    const apiUrl = `/products?${params.toString()}`;
    
    try {
      setLoading(true);
      setError(null);
      setIsRetrying(isRetry);
      
      console.log('🔍 Fetching products...', isRetry ? `(Retry ${retryCount + 1})` : '');
      
      // Adaptive timeout and retry strategy based on connection quality
      const adaptiveTimeout = connectionQuality === 'poor' ? 15000 : 
                             connectionQuality === 'good' ? 8000 : 5000;
      const adaptiveRetries = connectionQuality === 'poor' ? 5 : 3;
      
      // Use ReliableApiService with intelligent caching and retry logic
      const response = await reliableApiService.current.get<Product[]>(apiUrl, {
        timeout: adaptiveTimeout,
        retries: adaptiveRetries,
        cacheStrategy: isRetry ? 'network-first' : 'cache-first',
        cacheTTL: 300000, // 5 minutes
        priority: 'high'
      });
      
      console.log('✅ API Response:', response);
      
      const productsData = response.data || [];
      console.log('📦 Products data length:', productsData.length);
      
      // Update state with successful response
      setProducts(Array.isArray(productsData) ? productsData : []);
      setPartialData([]); // Clear partial data on success
      setRetryCount(0);
      setLastFetchTime(new Date());
      setCacheStatus(response.cached ? 'fresh' : 'fresh');
      
      // Clear any existing error
      setError(null);
      
    } catch (err: any) {
      console.error('❌ Error fetching products:', err);
      
      const apiError: ApiError = err.type ? err : {
        type: ErrorType.NETWORK_ERROR,
        message: err.message || 'Failed to fetch products',
        retryable: true,
        timestamp: new Date(),
        context: {
          url: apiUrl,
          retryCount,
          isRetry
        }
      };
      
      setError(apiError);
      
      // Try to show partial data if available (from cache or previous successful load)
      if (products.length > 0 && apiError.retryable) {
        setPartialData(products);
        console.log('📦 Showing cached/partial data while retrying');
      } else {
        setProducts([]);
        setPartialData([]);
      }
      
      // Update retry count for retryable errors
      if (apiError.retryable && retryCount < 3) {
        setRetryCount(prev => prev + 1);
        
        // Queue for automatic retry when connection is restored
        if (!isOnline || connectionQuality === 'poor') {
          queueForRetry({
            id: 'fetch-products',
            operation: () => fetchProducts(true),
            onSuccess: () => {
              console.log('✅ Products loaded successfully after connection restored');
            },
            onError: (retryError) => {
              console.error('❌ Retry failed after connection restored:', retryError);
            }
          });
        }
      }
      
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [search, category, selectedOccasions, min, max, retryCount, products]);

  const fetchCategories = async () => {
    if (!reliableApiService.current) return;
    
    try {
      const response = await reliableApiService.current.get('/categories', {
        timeout: 5000,
        retries: 2,
        cacheStrategy: 'cache-first',
        cacheTTL: 600000, // 10 minutes for categories
        priority: 'normal'
      });
      
      const categoriesData = response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      // Categories are not critical, so we don't show error to user
      setCategories([]);
    }
  };

  const handleQuickView = useCallback((product: Product) => {
    setSelectedProduct(product);
    setShowQuickView(true);
  }, []);

  const closeQuickView = useCallback(() => {
    setSelectedProduct(null);
    setShowQuickView(false);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setCategory('');
    setSelectedOccasions([]);
    setMin('');
    setMax('');
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount(0);
    fetchProducts(true);
  }, [fetchProducts]);

  const handleRefreshPage = useCallback(() => {
    window.location.reload();
  }, []);

  const getErrorMessage = (error: ApiError): string => {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return 'Network connection failed. Please check your internet connection.';
      case ErrorType.TIMEOUT_ERROR:
        return 'Request timed out. The server is taking too long to respond.';
      case ErrorType.SERVER_ERROR:
        return 'Server error occurred. Please try again in a moment.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  };

  const shouldShowPartialContent = (): boolean => {
    return partialData.length > 0 && error?.retryable === true;
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
          <MemoizedProductFilters
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

          {/* Connection Status Banner */}
          <MemoizedConnectionIndicator className="mb-4" />
          {!isOnline && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    You're currently offline. Showing cached content when available.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Retry Status Banner */}
          {isRetrying && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="animate-spin h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    Retrying request... (Attempt {retryCount + 1}/3)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="mt-8">
            {loading && !shouldShowPartialContent() ? (
              <>
                {/* Connection-aware loading message */}
                <div className="text-center mb-6">
                  <div className="text-gray-600">
                    {connectionQuality === 'poor' 
                      ? `Loading products... This may take longer due to slow connection (~${Math.round(getEstimatedLoadTime(100 * 1024) / 1000)}s)`
                      : connectionQuality === 'good'
                      ? 'Loading products...'
                      : 'Loading products quickly...'}
                  </div>
                  {isRetrying && (
                    <div className="text-sm text-blue-600 mt-1">
                      Retrying... (attempt {retryCount + 1})
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              </>
            ) : error && !shouldShowPartialContent() ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Products</h3>
                <p className="text-gray-600 mb-2">{getErrorMessage(error)}</p>
                
                {/* Connection-specific messaging */}
                {error.type === ErrorType.NETWORK_ERROR && (
                  <p className="text-sm text-gray-500 mb-4">
                    {!isOnline 
                      ? 'You appear to be offline. Products will load automatically when your connection is restored.'
                      : connectionQuality === 'poor'
                      ? 'Slow connection detected. Retrying with extended timeout...'
                      : 'Network connection is unstable. Retrying automatically...'}
                  </p>
                )}
                
                {/* Retry status */}
                {error.retryable && retryCount > 0 && retryCount < 3 && (
                  <p className="text-sm text-blue-600 mb-4">
                    Auto-retry in progress... (Attempt {retryCount}/3)
                  </p>
                )}
                
                {/* Circuit breaker status */}
                {!error.retryable && (
                  <p className="text-sm text-gray-500 mb-4">
                    Service temporarily unavailable. Please try again later.
                  </p>
                )}
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isRetrying && (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    Try Again
                  </button>
                  <button
                    onClick={handleRefreshPage}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Refresh Page
                  </button>
                </div>
                
                {/* Last successful fetch time */}
                {lastFetchTime && (
                  <p className="text-xs text-gray-400 mt-4">
                    Last successful update: {lastFetchTime.toLocaleTimeString()}
                  </p>
                )}
              </div>
            ) : (products.length === 0 && partialData.length === 0) ? (
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
                {/* Partial content warning */}
                {shouldShowPartialContent() && (
                  <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm text-orange-800">
                          Showing cached products. Some content may be outdated.
                        </p>
                      </div>
                      <div className="ml-3">
                        <button
                          onClick={handleRetry}
                          disabled={isRetrying}
                          className="text-sm text-orange-800 hover:text-orange-900 underline disabled:opacity-50"
                        >
                          {isRetrying ? 'Retrying...' : 'Refresh'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Grid - Use virtual scrolling for large catalogs */}
                {useVirtualScrolling ? (
                  <VirtualizedProductGrid
                    products={shouldShowPartialContent() ? partialData : displayProducts}
                    loading={loading}
                    onQuickView={handleQuickView}
                    className="min-h-96"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {(shouldShowPartialContent() ? partialData : displayProducts).map((product, index) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        onQuickView={handleQuickView}
                        priority={index < 8 ? 'high' : 'normal'} // First 8 products get high priority
                        lazy={index >= 8} // Products beyond first 8 are lazy loaded
                        index={index}
                      />
                    ))}
                  </div>
                )}

                {/* Product Statistics */}
                {process.env.NODE_ENV === 'development' && displayProducts.length > 0 && (
                  <div className="mt-6 text-center">
                    <div className="text-xs text-gray-400 space-x-4">
                      <span>Total: {productStats.total}</span>
                      <span>In Stock: {productStats.inStock}</span>
                      <span>Featured: {productStats.featured}</span>
                      <span>Virtual Scrolling: {useVirtualScrolling ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>
                )}

                {/* Cache status indicator */}
                {cacheStatus !== 'none' && (
                  <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400">
                      {cacheStatus === 'fresh' ? '✓ Content is up to date' : '⚠ Content may be outdated'}
                      {lastFetchTime && ` • Last updated: ${lastFetchTime.toLocaleTimeString()}`}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Quick View Modal - Dynamically loaded */}
      {selectedProduct && (
        <DynamicQuickViewModal
          product={selectedProduct}
          isOpen={showQuickView}
          onClose={closeQuickView}
        />
      )}
    </>
  );
};

export default ProductsPage;
