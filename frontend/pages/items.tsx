import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import ProductSkeleton, { ProductSkeletonGrid } from '../components/ProductSkeleton';
import SEOHead from '../components/SEOHead';
import api from '../utils/api';
import { preloadProductImages } from '../utils/imageUtils';
import { Product } from '../types/product';

const ItemsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Search state
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting state
  const [sortBy, setSortBy] = useState('newest'); // newest, price-low, price-high, name
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    setIsClient(true);
    setIsHydrated(true);

    // Clear service worker cache if available
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('api') || cacheName.includes('products')) {
            caches.delete(cacheName);
            console.log('🧹 Cleared cache:', cacheName);
          }
        });
      }).catch(err => {
        console.warn('Cache clearing failed:', err);
      });
    }

    fetchProducts();
    setIsInitialLoad(false);
  }, []);

  const fetchProducts = useCallback(async (options: {
    retryCount?: number;
    page?: number;
    search?: string;
    sort?: string;
  } = {}) => {
    const { retryCount = 0, page = currentPage, search = searchTerm, sort = sortBy } = options;
    const MAX_RETRIES = 2; // Reduced from 3 to 2
    
    try {
      setLoading(true);
      setError('');
      console.log(`🔍 Fetching items... (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      // Add sorting parameter
      if (sort && sort !== 'newest') {
        params.append('sort', sort);
      }
      
      // Add pagination parameters
      params.append('page', page.toString());
      params.append('limit', '24'); // Show 24 products per page
      
      console.log(`📄 Pagination: Page ${page}, Search: "${search}", Sort: ${sort}`);
      
      // Enhanced cache busting with random component
      const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      params.append('_t', cacheBuster);

      const apiUrl = `/products?${params.toString()}`;
      console.log('🔗 Full API URL:', `${api.defaults.baseURL}${apiUrl}`);
      console.log('🔗 Cache buster:', cacheBuster);
      
      // Use the ReliableApiService for better error handling
      const response = await api.get(apiUrl, {
        timeout: 15000, // Reduced timeout to 15 seconds
        // Remove problematic cache headers that cause CORS issues
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }) as any;
      
      const productsData = response.data?.data || response.data || [];
      
      // Extract pagination information
      const paginationInfo = response.data;
      setTotalProducts(paginationInfo.total || productsData.length);
      setTotalPages(paginationInfo.pages || 1);
      
      // Validate products data
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
      
      setProducts(validProducts);
      setError('');
      
      // Preload images for better UX
      if (validProducts.length > 0) {
        preloadProductImages(validProducts, 1, validProducts.length);
      }
      
    } catch (err: any) {
      console.error(`❌ Error fetching items (attempt ${retryCount + 1}):`, err);
      
      // Improved retry logic - only retry on specific network errors
      const shouldRetry = retryCount < MAX_RETRIES && (
        err.code === 'ECONNABORTED' || // Timeout
        err.code === 'ERR_NETWORK' || // Network error
        err.message?.includes('timeout') ||
        (err.response?.status >= 500 && err.response?.status < 600) // Server errors
      );
      
      if (shouldRetry) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
        console.log(`🔄 Retrying in ${delay}ms... (${retryCount + 1}/${MAX_RETRIES})`);
        setTimeout(() => {
          fetchProducts({ retryCount: retryCount + 1, page, search, sort });
        }, delay);
        return;
      }
      
      // Better error messages for users
      let errorMessage = 'Unable to load products';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. Please refresh the page.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      }
      
      setError(errorMessage);
      setProducts([]);
      
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Fetch products for the new page immediately
      fetchProducts({ page, search: searchTerm, sort: sortBy });
      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, totalPages, fetchProducts, searchTerm, sortBy]);

  // Handle search
  const handleSearch = useCallback((searchValue: string) => {
    setSearchTerm(searchValue);
    setCurrentPage(1); // Reset to first page when searching
    fetchProducts({ page: 1, search: searchValue, sort: sortBy });
  }, [fetchProducts, sortBy]);

  // Handle sorting change
  const handleSortChange = useCallback((newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page when sorting
    fetchProducts({ page: 1, search: searchTerm, sort: newSort });
  }, [fetchProducts, searchTerm]);

  // Debounced search effect
  useEffect(() => {
    if (!isInitialLoad) {
      const timeoutId = setTimeout(() => {
        handleSearch(search);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [search, isInitialLoad, handleSearch]);

  // No automatic fetching on state changes - only manual calls

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setShowQuickView(true);
  };

  const closeQuickView = () => {
    setSelectedProduct(null);
    setShowQuickView(false);
  };

  const clearSearch = () => {
    setSearch('');
    setSearchTerm('');
    setCurrentPage(1);
    fetchProducts({ page: 1, search: '', sort: sortBy });
  };

  // Generate SEO data
  const generateSEOData = () => {
    let title = 'All Items - Premium Product Collection | KeralGiftsOnline';
    let description = 'Browse our complete collection of premium items, traditional Kerala products & authentic gifts. Fast delivery across Kerala with 24 items per page for optimal browsing.';
    let keywords = 'kerala items, all products, traditional items, online shopping kerala, premium collection, authentic kerala products';

    if (searchTerm) {
      title = `${searchTerm} - Search Results | KeralGiftsOnline Items`;
      description = `Find ${searchTerm} and related premium items, traditional products. Browse all available items with fast delivery across Kerala.`;
      keywords += `, ${searchTerm}`;
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": title,
      "description": description,
      "url": "https://keralagiftsonline.in/items",
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": totalProducts,
        "itemListElement": products.slice(0, 10).map((product, index) => ({
          "@type": "Product",
          "position": index + 1,
          "name": product.name,
          "description": product.description,
          "image": product.images?.[0] || '',
          "url": `https://keralagiftsonline.in/product/${product._id}`,
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "INR",
            "availability": (product.stock && product.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        }))
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://keralagiftsonline.in/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Items",
            "item": "https://keralagiftsonline.in/items"
          }
        ]
      }
    };

    return { title, description, keywords, structuredData };
  };

  const seoData = generateSEOData();

  // Pagination Component
  const PaginationControls = ({ position = 'bottom' }: { position?: 'top' | 'bottom' }) => {
    if (totalPages <= 1) return null;

    return (
      <div className={`flex justify-center ${position === 'top' ? 'mb-8' : 'mt-12'}`}>
        <nav className="flex items-center space-x-2" aria-label="Pagination">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          
          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <svg className="w-4 h-4 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </nav>
      </div>
    );
  };

  return (
    <>
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        url="https://keralagiftsonline.in/items"
        structuredData={seoData.structuredData}
        products={products}
        searchTerm={searchTerm}
        location="Kerala"
      />

      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search Bar with Pagination */}
          <div className="max-w-6xl mx-auto mb-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Search Input */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search for items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                  {search && (
                    <button
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[160px]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="name">Name A-Z</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Pagination Controls - Inline */}
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <span className="text-sm text-gray-600 px-2">
                      {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="mt-4">
            {!isHydrated ? (
              // Show skeleton loading during SSR
              <div className="space-y-6">
                <ProductSkeletonGrid count={12} />
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm font-medium">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Loading items...
                  </div>
                </div>
              </div>
            ) : loading ? (
              // Show skeleton loading during client-side loading
              <div className="space-y-6">
                <ProductSkeletonGrid count={12} />
                <div className="text-center">
                  <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full text-blue-700 text-sm font-medium shadow-sm border border-blue-100">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    <span className="font-semibold">
                      {searchTerm ? `Searching for "${searchTerm}"...` : 'Loading amazing items...'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Finding the best products for you</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="bg-red-50 rounded-2xl p-8 max-w-md mx-auto">
                  <div className="text-red-500 mb-6">
                    <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Oops! Something went wrong</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
                  <div className="space-y-3">
                    <button
                  onClick={() => {
                    console.log('🔄 Error retry clicked');
                    setProducts([]);
                    setError('');
                    fetchProducts({ page: currentPage, search: searchTerm, sort: sortBy });
                  }}
                      disabled={loading}
                      className="w-full bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Retrying...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Try Again
                        </>
                      )}
                    </button>
                    <p className="text-sm text-gray-500">
                      If the problem persists, please contact our support team.
                    </p>
                  </div>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No Items Found' : 'No Items Available'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? `No items match "${searchTerm}". Try a different search term.` : 'No items are currently available.'}
                </p>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 border-t border-gray-200 pt-6 px-4 sm:px-6 lg:px-8">
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
                </div>
              </>
            )}
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

export default ItemsPage;

// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  };
}
