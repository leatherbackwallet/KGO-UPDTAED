/**
 * Products Page - JSON Data Only
 * 
 * This page loads ALL data from JSON files only.
 * NO DATABASE CONNECTIONS - NO API CALLS - JSON FILES ONLY
 * 
 * Data Sources:
 * - Products: /public/data/keralagiftsonline.products.json
 * - Categories: /public/data/keralagiftsonline.categories.json  
 * - Occasions: /public/data/keralagiftsonline.occasions.json
 */

import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import RandomProductCarousel from '../components/RandomProductCarousel';
import { Product, Category } from '../types/shared';
import { loadProductsFromJSON, loadCategoriesFromJSON } from '../utils/jsonDataTransformers';

interface ProductsPageProps {
  products: Product[];
  categories: Category[];
}

const ProductsPage: React.FC<ProductsPageProps> = ({ products: allProducts, categories }) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);

  // Filter and sort products client-side
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        (product.name || '').toLowerCase().includes(searchLower) ||
        (product.description || '').toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (selectedCategory) {
      const selectedCategoryObj = categories.find(cat => cat._id === selectedCategory);
      if (selectedCategoryObj) {
        const selectedCategoryName = selectedCategoryObj.name.toLowerCase();

        filtered = filtered.filter(product => {
          // Since JSON products have empty categories arrays, we need to match by category name
          // Check if product name or description contains the category name
          const productName = (product.name || '').toLowerCase();
          const productDescription = (product.description || '').toLowerCase();

          return productName.includes(selectedCategoryName) ||
            productDescription.includes(selectedCategoryName);
        });
      }
    }


    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name':
        filtered.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        break;
      case 'newest':
      default:
        filtered.sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
    }

    return filtered;
  }, [allProducts, searchTerm, selectedCategory, sortBy, categories]);

  // Event handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };


  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
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

      {/* Banner Section */}
      <div className="w-full">
        <div className="relative h-64 md:h-80 lg:h-96">
          <Image
            src="/images/products/Banner Generic.jpg"
            alt="KGO Personalised Delivery - Premium Gifts & Traditional Products"
            fill
            className="object-cover"
            priority
          />
          {/* Optional overlay for better text readability if needed */}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>
      </div>

      {/* Random Product Carousel */}
      <RandomProductCarousel
        allProducts={allProducts}
        onProductClick={handleProductClick}
      />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">

              {/* Search */}
              <div className="w-full lg:w-1/3 relative">
                <div className="relative">
                  {/* Search Icon */}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Search Input */}
                  <input
                    type="text"
                    placeholder="Search products, categories, or descriptions..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                  />

                  {/* Clear Search Button */}
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-lg transition-colors"
                      aria-label="Clear search"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Search Results Count */}
                {searchTerm && (
                  <div className="mt-2 text-sm text-gray-600">
                    {filteredProducts.length === allProducts.length ? (
                      <span>Showing all {allProducts.length} products</span>
                    ) : (
                      <span>Found {filteredProducts.length} of {allProducts.length} products</span>
                    )}
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-center">

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md min-w-[160px]"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>


                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md min-w-[180px]"
                >
                  <option value="newest">Newest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>

                {/* Clear Filters */}
                {(searchTerm || selectedCategory || sortBy !== 'newest') && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredProducts.length} of {allProducts.length} products
            </p>
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onQuickView={handleProductClick}
                  onClick={handleProductClick}
                />
              ))}
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      {showQuickView && selectedProduct && (
        <QuickViewModal
          product={selectedProduct}
          isOpen={showQuickView}
          onClose={closeQuickView}
        />
      )}
    </>
  );
};

// Server-side rendering - load data from JSON files ONLY
// NO DATABASE CONNECTIONS - JSON FILES ONLY
export const getServerSideProps: GetServerSideProps<ProductsPageProps> = async () => {
  try {
    console.log('📦 Loading products data from JSON files ONLY (no database connections)...');

    // Load all data from JSON files in parallel with individual error handling
    const [productsResult, categoriesResult] = await Promise.allSettled([
      loadProductsFromJSON(),
      loadCategoriesFromJSON()
    ]);

    // Extract results with fallbacks
    const products = productsResult.status === 'fulfilled' ? productsResult.value : [];
    const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];

    // Log individual results
    if (productsResult.status === 'rejected') {
      console.error('❌ Failed to load products:', productsResult.reason);
    }
    if (categoriesResult.status === 'rejected') {
      console.error('❌ Failed to load categories:', categoriesResult.reason);
    }

    console.log(`✅ Loaded ${products.length} products, ${categories.length} categories from JSON`);

    return {
      props: {
        products,
        categories
      }
    };
  } catch (error) {
    console.error('❌ Critical error loading data from JSON files:', error);

    // Return empty data on critical error
    return {
      props: {
        products: [],
        categories: []
      }
    };
  }
};

export default ProductsPage;