import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import QuickViewModal from '../components/QuickViewModal';
import api from '../utils/api';
import { Product } from '../types/product';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products?featured=true&limit=8');
      const productsData = response.data?.data || response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
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

  return (
    <>
      <Head>
        <title>KeralGiftsOnline - Premium Gifts & Celebrations</title>
        <meta name="description" content="Discover premium quality gifts, cakes, flowers, and celebration items. Fast delivery across India with our advanced logistics network." />
        <meta name="keywords" content="gifts, cakes, flowers, celebrations, India, online shopping" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-red-600 to-red-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Celebrate Every Moment
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-red-100">
                Premium quality with fast delivery across India.
              </p>
              <Link 
                href="/products"
                className="inline-block bg-white text-red-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-50 transition-colors"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p className="text-gray-600">Quick and reliable delivery across India</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
                <p className="text-gray-600">Carefully curated selection of high-quality items</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Personal Touch</h3>
                <p className="text-gray-600">Personalized service for every celebration</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
              <p className="text-gray-600">Discover our most popular items</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <ProductSkeleton key={i} />
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h3>
                <p className="text-gray-600">Check back later for new products</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.slice(0, 8).map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onQuickView={handleQuickView}
                  />
                ))}
              </div>
            )}

            {products.length > 8 && (
              <div className="text-center mt-12">
                <Link
                  href="/products"
                  className="inline-block bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  View All Products
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Quick View Modal */}
      <QuickViewModal
        product={selectedProduct}
        isOpen={showQuickView}
        onClose={closeQuickView}
      />
    </>
  );
}
