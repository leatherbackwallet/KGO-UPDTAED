import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { Product, Category, Occasion } from '../types/shared';
import { getProductImage } from '../utils/imageUtils';
import { getMultilingualText } from '../utils/api';

interface ProductsPageProps {
  products: Product[];
  categories: Category[];
  occasions: Occasion[];
}

const ProductsPage: React.FC<ProductsPageProps> = ({ products: allProducts, categories, occasions }) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('');
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
        getMultilingualText(product.name).toLowerCase().includes(searchLower) ||
        getMultilingualText(product.description).toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => 
        product.categories?.some(cat => {
          const catId = typeof cat === 'string' ? cat : cat._id;
          return catId === selectedCategory;
        })
      );
    }

    // Occasion filter
    if (selectedOccasion) {
      filtered = filtered.filter(product => 
        product.occasions?.includes(selectedOccasion)
      );
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
          getMultilingualText(a.name).localeCompare(getMultilingualText(b.name))
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
  }, [allProducts, searchTerm, selectedCategory, selectedOccasion, sortBy]);

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
                      {getMultilingualText(category.name)}
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
                      {getMultilingualText(occasion.name)}
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
              Showing {filteredProducts.length} of {allProducts.length} products
            </p>
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onQuickView={handleProductClick}
                  onClick={() => handleProductClick(product)}
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

// Server-side rendering - fetch data on each request
export const getServerSideProps: GetServerSideProps<ProductsPageProps> = async () => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    
    // Fetch all data in parallel
    const [productsResponse, categoriesResponse, occasionsResponse] = await Promise.all([
      fetch(`${apiUrl}/products?limit=1000`).catch(() => ({ ok: false, json: () => Promise.resolve({ data: [] }) })),
      fetch(`${apiUrl}/categories`).catch(() => ({ ok: false, json: () => Promise.resolve({ data: [] }) })),
      fetch(`${apiUrl}/occasions`).catch(() => ({ ok: false, json: () => Promise.resolve({ data: [] }) }))
    ]);

    let products: Product[] = [];
    let categories: Category[] = [];
    let occasions: Occasion[] = [];

    // Parse products data
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      products = productsData.data || productsData || [];
    }

    // Parse categories data
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      categories = categoriesData.data || categoriesData || [];
    }

    // Parse occasions data
    if (occasionsResponse.ok) {
      const occasionsData = await occasionsResponse.json();
      occasions = occasionsData.data || occasionsData || [];
    }

    return {
      props: {
        products,
        categories,
        occasions
      }
    };
  } catch (error) {
    console.error('Error fetching data for products page:', error);
    
    // Return empty data on error
    return {
      props: {
        products: [],
        categories: [],
        occasions: []
      }
    };
  }
};

export default ProductsPage;