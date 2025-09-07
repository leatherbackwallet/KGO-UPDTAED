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
      setError('');
      const response = await api.get(`/products?featured=true&limit=8&_t=${Date.now()}`);
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
        <meta name="description" content="Discover premium quality gifts, cakes, flowers, and celebration items. Fast delivery across Kerala with our advanced logistics network." />
        <meta name="keywords" content="gifts, cakes, flowers, celebrations, Kerala, online shopping" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen">
        {/* Hero Section with Onam Background */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/images/onam-background.svg')`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-green-900/40 via-green-800/60 to-green-900/80"></div>
          </div>

          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/20 rounded-full float-animation"></div>
            <div className="absolute top-40 right-20 w-16 h-16 bg-yellow-300/15 rounded-full float-animation-delay-1"></div>
            <div className="absolute bottom-40 left-20 w-24 h-24 bg-yellow-500/25 rounded-full float-animation-delay-2"></div>
            <div className="absolute bottom-20 right-10 w-12 h-12 bg-yellow-400/20 rounded-full float-animation-delay-3"></div>
            <div className="absolute top-60 left-1/4 w-8 h-8 bg-white/30 rounded-full float-animation"></div>
            <div className="absolute top-80 right-1/3 w-10 h-10 bg-white/25 rounded-full float-animation-delay-1"></div>
            <div className="absolute bottom-60 left-1/3 w-6 h-6 bg-white/35 rounded-full float-animation-delay-2"></div>
            <div className="absolute bottom-80 right-1/4 w-14 h-14 bg-white/20 rounded-full float-animation-delay-3"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
                <span className="block text-yellow-300 onam-text-glow">Happy Onam</span>
                <span className="block text-3xl md:text-5xl mt-4">Celebrate Every Moment</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-green-100 leading-relaxed">
                Premium quality gifts with fast delivery across Kerala.<br />
                <span className="text-yellow-200 font-medium">Festive celebrations made special</span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/products"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-green-900 bg-yellow-400 rounded-full hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10">Shop Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link 
                href="/about"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white rounded-full hover:bg-white hover:text-green-900 transition-all duration-300 transform hover:scale-105"
              >
                Learn More
              </Link>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
                <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-green-50 to-white relative">
          <div className="absolute inset-0 bg-pattern opacity-5"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-green-900 mb-4">Why Choose KeralGiftsOnline?</h2>
              <p className="text-xl text-green-700 max-w-3xl mx-auto">
                We bring the spirit of Kerala's celebrations to your doorstep with premium quality and exceptional service
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-4">Lightning Fast Delivery</h3>
                <p className="text-green-700 leading-relaxed">Express delivery across Kerala with real-time tracking and guaranteed on-time delivery</p>
              </div>
              
              <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-4">Premium Quality</h3>
                <p className="text-green-700 leading-relaxed">Handpicked selection of the finest gifts, cakes, and celebration items</p>
              </div>
              
              <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-4">Personal Touch</h3>
                <p className="text-green-700 leading-relaxed">Personalized service and custom gift arrangements for every celebration</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-green-900 mb-4">Featured Products</h2>
              <p className="text-xl text-green-700">Discover our most popular celebration items</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[...Array(8)].map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="text-red-500 mb-6">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-4">Error Loading Products</h3>
                <p className="text-green-700 mb-6">{error}</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={fetchProducts}
                    className="bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-green-400 mb-6">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-4">No Products Available</h3>
                <p className="text-green-700">Check back later for new products</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
              <div className="text-center mt-16">
                <Link
                  href="/products"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  View All Products
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Celebration Banner */}
        <section className="py-20 bg-gradient-to-r from-green-600 via-green-700 to-green-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-pattern opacity-10"></div>
          <div className="absolute inset-0 festive-pattern opacity-5"></div>
          
          {/* Decorative Elements */}
          <div className="absolute top-10 left-10 w-16 h-16 bg-yellow-400/20 rounded-full float-animation"></div>
          <div className="absolute top-20 right-20 w-12 h-12 bg-yellow-300/15 rounded-full float-animation-delay-1"></div>
          <div className="absolute bottom-20 left-20 w-20 h-20 bg-yellow-500/25 rounded-full float-animation-delay-2"></div>
          <div className="absolute bottom-10 right-10 w-14 h-14 bg-yellow-400/20 rounded-full float-animation-delay-3"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 onam-text-glow">
                Celebrate Onam with Us
              </h2>
              <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                Join thousands of happy customers who trust us for their celebrations. 
                From traditional to modern, we have everything you need to make your Onam special.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/register"
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-green-900 rounded-full font-semibold hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10">Join Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                href="/contact"
                className="group inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-green-900 transition-all duration-300 transform hover:scale-105"
              >
                Contact Us
              </Link>
            </div>
            
            {/* Festive Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">10K+</div>
                <div className="text-green-100">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">500+</div>
                <div className="text-green-100">Cities Served</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">24/7</div>
                <div className="text-green-100">Customer Support</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quick View Modal */}
      {selectedProduct && (
        <QuickViewModal
          product={selectedProduct}
          isOpen={showQuickView}
          onClose={closeQuickView}
        />
      )}

      <style jsx>{`
        .bg-pattern {
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0);
          background-size: 20px 20px;
        }
      `}</style>
    </>
  );
}
