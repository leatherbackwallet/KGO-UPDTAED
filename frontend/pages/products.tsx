import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import ProductSkeleton, { ProductSkeletonGrid } from '../components/ProductSkeleton';
import api from '../utils/api';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  occasions: string[];
  inStock: boolean;
  featured: boolean;
  slug: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Occasion {
  _id: string;
  name: string;
  slug: string;
}

const ProductsPage: React.FC = () => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (categories.length > 0) { // Only run after initial data is loaded
      loadProducts();
    }
  }, [searchTerm, selectedCategory, selectedOccasion, sortBy]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('Loading initial data...');
      
      // Load categories and occasions
      const [categoriesRes, occasionsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/occasions')
      ]);
      
      setCategories(categoriesRes.data.data || []);
      setOccasions(occasionsRes.data.data || []);
      
      // Load products
      await loadProducts();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('Loading products with filters:', { searchTerm, selectedCategory, selectedOccasion, sortBy });
      
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedOccasion) params.append('occasions', selectedOccasion);
      if (sortBy && sortBy !== 'newest') params.append('sort', sortBy);
      
      const response = await api.get(`/products?${params.toString()}`);
      setProducts(response.data.data || []);
      setError('');
      
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products');
      setProducts([]);
    }
  };

  // Event handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleOccasionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOccasion(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedOccasion('');
    setSortBy('newest');
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowQuickView(true);
  };

  const closeQuickView = () => {
    setShowQuickView(false);
    setSelectedProduct(null);
  };

  return (
    <>
      <Head>
        <title>Products - Premium Product Collection | KeralGiftsOnline</title>
        <meta name="description" content="Browse our complete collection of premium products, traditional Kerala gifts & authentic items. Fast delivery across Kerala." />
        <meta name="keywords" content="kerala products, traditional gifts, online shopping kerala, premium collection" />
      </Head>

      <Navbar />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Products</h1>
            <p className="text-xl text-gray-600">Discover our premium collection of traditional Kerala gifts</p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              
              {/* Search */}
              <div className="w-full lg:w-1/3">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {/* Occasion Filter */}
                <select
                  value={selectedOccasion}
                  onChange={handleOccasionChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
                >
                  <option value="">All Occasions</option>
                  {occasions.map((occasion) => (
                    <option key={occasion._id} value={occasion._id}>
                      {occasion.name}
                    </option>
                  ))}
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
                >
                  <option value="newest">Newest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>

                {/* Clear Filters */}
                {(searchTerm || selectedCategory || selectedOccasion || sortBy !== 'newest') && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mb-6">
            <p className="text-gray-600">
              {loading ? 'Loading...' : `Showing ${products.length} products`}
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
              <button
                onClick={loadInitialData}
                className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <ProductSkeletonGrid count={12} />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onClick={() => handleProductClick(product)}
                />
              ))}
            </div>
          ) : (
            !error && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4-4-4m0 0l-4 4-4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      {showQuickView && selectedProduct && (
        <QuickViewModal
          product={selectedProduct}
          onClose={closeQuickView}
        />
      )}

    </>
  );
};

export default ProductsPage;