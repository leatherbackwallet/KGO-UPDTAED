import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import ProductSkeleton, { ProductSkeletonGrid } from '../components/ProductSkeleton';
import QuickViewModal from '../components/QuickViewModal';
import SEOHead from '../components/SEOHead';
import api from '../utils/api';
import { Product } from '../types/product';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsHydrated(true);
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products?featured=true&limit=8`);
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

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await api.get(`/categories`);
      const categoriesData = response.data?.data || response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData.slice(0, 6) : []); // Limit to 6 categories for display
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
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

  // Generate enhanced homepage structured data with products
  const generateHomepageStructuredData = () => {
    const baseStructuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "KeralGiftsOnline - Premium Gifts & Traditional Products",
      "description": "Kerala's premier online gift store offering traditional products and premium gifts with fast delivery across Kerala and worldwide",
      "url": "https://keralagiftsonline.in/",
      "mainEntity": {
        "@type": "Organization",
        "name": "KeralGiftsOnline",
        "url": "https://keralagiftsonline.in",
        "description": "Premium gift delivery service specializing in authentic Kerala products and traditional gifts"
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://keralagiftsonline.in/"
          }
        ]
      }
    };

    // Add product information if available
    if (products.length > 0) {
      (baseStructuredData.mainEntity as any).hasOfferCatalog = {
        "@type": "OfferCatalog",
        "name": "Premium Kerala Gifts Collection",
        "itemListElement": products.slice(0, 10).map((product, index) => ({
          "@type": "Offer",
          "position": index + 1,
          "itemOffered": {
            "@type": "Product",
            "name": product.name,
            "description": product.description,
            "image": product.images?.[0] ? `https://keralagiftsonline.in/images/${product.images[0]}` : undefined,
            "url": `https://keralagiftsonline.in/product/${product._id}`
          },
          "price": product.price,
          "priceCurrency": "INR",
          "availability": "https://schema.org/InStock"
        }))
      };
    }

    return baseStructuredData;
  };

  return (
    <>
      <SEOHead
        title="KeralGiftsOnline - Premium Gifts & Traditional Products | Kerala's Best Online Gift Store"
        description="Discover premium quality gifts, traditional Kerala products & authentic items. Fast delivery across Kerala with advanced logistics. Perfect for festivals, occasions & special moments. Shop now!"
        url="https://keralagiftsonline.in/"
        type="website"
        products={products}
        categories={categories}
        isHomepage={true}
        structuredData={generateHomepageStructuredData()}
      />

      <main className="min-h-screen">
        <Navbar />
        
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
                <span className="text-yellow-200 font-medium">Traditional products made special</span>
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
                We bring the spirit of Kerala's culture to your doorstep with premium quality and exceptional service
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
                <p className="text-green-700 leading-relaxed">Handpicked selection of the finest gifts and traditional products</p>
              </div>
              
              <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-4">Personal Touch</h3>
                <p className="text-green-700 leading-relaxed">Personalized service and custom gift arrangements for every occasion</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Showcase */}
        <section className="py-20 bg-gray-50" aria-labelledby="categories-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 id="categories-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Shop by Category
              </h2>
              <p className="text-xl text-gray-600">
                Explore our carefully curated selection of authentic Kerala products
              </p>
            </div>

            {categoriesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                    <div className="bg-gray-200 h-40 rounded-xl mb-4"></div>
                    <div className="bg-gray-200 h-6 rounded mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((category) => (
                  <Link key={category._id} href={`/products?category=${category.slug}`}>
                    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group">
                      <div className="bg-gradient-to-br from-kgo-green to-emerald-600 h-40 rounded-xl mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <span className="text-white text-4xl font-bold">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                      <p className="text-gray-600">{category.description || `Discover authentic ${category.name.toLowerCase()}`}</p>
                      <div className="mt-4 flex items-center text-kgo-green font-medium group-hover:text-kgo-red transition-colors duration-300">
                        Shop Now
                        <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-20 bg-white" aria-labelledby="products-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 id="products-heading" className="text-4xl font-bold text-green-900 mb-4">Featured Products</h2>
              <p className="text-xl text-green-700">Discover our most popular traditional items and premium gifts</p>
            </div>

            {!isHydrated ? (
              // Show skeleton during SSR to prevent hydration mismatch
              <ProductSkeletonGrid count={8} />
            ) : loading ? (
              // Show skeleton during loading
              <ProductSkeletonGrid count={8} />
            ) : error ? (
              <div className="text-center py-16">
                <div className="text-red-500 mb-6">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-4">Error Loading Products</h3>
                <p className="text-green-700 mb-6">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors"
                >
                  Try Again
                </button>
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
                Join thousands of happy customers who trust us for their gift needs. 
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

// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  };
}
