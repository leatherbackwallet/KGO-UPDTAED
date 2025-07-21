import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { ProductSkeletonGrid } from '../components/ProductSkeleton';

interface Product {
  _id: string;
  name: string | { en: string; de: string };
  description: string | { en: string; de: string };
  price?: number;
  category: string | { _id: string; name: string; slug: string };
  stock?: number;
  images: string[];
  slug?: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [search, category, min, max]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (min) params.min = min;
      if (max) params.max = max;
      const res = await api.get('/products', { params });
      setProducts(res.data as Product[]);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setQuickViewProduct(null);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setMin('');
    setMax('');
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
      

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
                  <option value="celebration-cakes">Celebration Cakes</option>
                  <option value="wedding-cakes">Wedding Cakes</option>
                  <option value="birthday-cakes">Birthday Cakes</option>
                  <option value="cupcakes">Cupcakes</option>
                  <option value="pastries">Pastries</option>
                  <option value="cookies">Cookies</option>
                  <option value="breads">Breads</option>
                </select>
                

                
                <input
                  type="number"
                  placeholder="Min Price"
                  value={min}
                  onChange={e => setMin(e.target.value)}
                  className="w-32 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <input
                  type="number"
                  placeholder="Max Price"
                  value={max}
                  onChange={e => setMax(e.target.value)}
                  className="w-32 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {loading ? 'Loading...' : `${products.length} products found`}
              </p>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <ProductSkeletonGrid count={8} />
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => {
                // Helper function to get text from multilingual object or string
                const getText = (text: string | { en: string; de: string }): string => {
                  if (typeof text === 'string') return text;
                  return text.en || text.de || '';
                };

                // Transform the product data to ensure proper rendering
                const transformedProduct = {
                  ...product,
                  name: getText(product.name),
                  description: getText(product.description),
                  category: typeof product.category === 'object' ? getText(product.category.name) : product.category
                };

                return (
                  <ProductCard 
                    key={product._id} 
                    product={transformedProduct} 
                    onQuickView={handleQuickView}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
      />
    </>
  );
}
