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

import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
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

// Banner images constant - defined outside component to avoid recreation
const BANNER_IMAGES = [
  '/images/products/christmas_banner_1.png',
  '/images/products/christmas_banner_2.png',
  '/images/products/christmas_banner_3.png'
];

const ProductsPage: React.FC<ProductsPageProps> = ({ products: allProducts, categories }) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);

  // Banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [nextBannerIndex, setNextBannerIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Preload banner images for smoother transitions
  useEffect(() => {
    BANNER_IMAGES.forEach((imageSrc) => {
      const img = new Image();
      img.src = imageSrc;
    });
  }, []);

  useEffect(() => {
    // Randomly select a banner on mount to ensure rotation on refresh
    const randomIndex = Math.floor(Math.random() * BANNER_IMAGES.length);
    setCurrentBannerIndex(randomIndex);
    setNextBannerIndex((randomIndex + 1) % BANNER_IMAGES.length);

    // Auto-rotate banners every 10 seconds
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      // After transition completes, update indices
      setTimeout(() => {
        setCurrentBannerIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % BANNER_IMAGES.length;
          setNextBannerIndex((newIndex + 1) % BANNER_IMAGES.length);
          return newIndex;
        });
        setIsTransitioning(false);
      }, 1000); // Match transition duration
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

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

      {/* Elegant Banner Section */}
      <div className="w-full relative">
        <div className="relative h-72 md:h-96 lg:h-[32rem] overflow-hidden rounded-b-3xl">
          {/* Current Banner - slides out to left */}
          <div 
            className="absolute top-0 left-0 right-0 bottom-0 transition-all duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${BANNER_IMAGES[currentBannerIndex]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              transform: isTransitioning ? 'translateX(-100%)' : 'translateX(0)',
              opacity: isTransitioning ? 0 : 1,
              zIndex: isTransitioning ? 1 : 2
            }}
          >
            {/* Elegant gradient overlay */}
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50"></div>
          </div>
          
          {/* Next Banner - slides in from left */}
          <div 
            className="absolute top-0 left-0 right-0 bottom-0 transition-all duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${BANNER_IMAGES[nextBannerIndex]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              transform: isTransitioning ? 'translateX(0)' : 'translateX(-100%)',
              opacity: isTransitioning ? 1 : 0,
              zIndex: isTransitioning ? 2 : 1
            }}
          >
            {/* Elegant gradient overlay */}
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50"></div>
          </div>
        </div>
      </div>

      {/* Random Product Carousel */}
      <RandomProductCarousel
        allProducts={allProducts}
        onProductClick={handleProductClick}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">


          {/* Elegant Search and Filters */}
          <div className="bg-white rounded-3xl shadow-elegant border border-gray-100 p-8 mb-10">
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

                  {/* Elegant Search Input */}
                  <input
                    type="text"
                    placeholder="Search products, categories, or descriptions..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="form-input w-full pl-12 pr-12 py-4 text-lg"
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

                {/* Elegant Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="form-input px-5 py-3 min-w-[180px] font-medium"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>


                {/* Elegant Sort */}
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="form-input px-5 py-3 min-w-[200px] font-medium"
                >
                  <option value="newest">Newest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>

                {/* Elegant Clear Filters */}
                {(searchTerm || selectedCategory || sortBy !== 'newest') && (
                  <button
                    onClick={clearFilters}
                    className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md flex items-center gap-2 transform hover:scale-105"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Elegant Results Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Products</h2>
                <p className="text-gray-600 text-lg">
                  Showing <span className="font-semibold text-kgo-red">{filteredProducts.length}</span> of <span className="font-semibold">{allProducts.length}</span> products
                </p>
              </div>
            </div>
          </div>

          {/* Elegant Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4-4-4m0 0l-4 4-4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No products found</h3>
              <p className="text-gray-600 mb-8 text-lg">Try adjusting your search or filter criteria</p>
              <button
                onClick={clearFilters}
                className="btn-primary px-8 py-3"
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