import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/ProductSkeleton';
import ProductModal from '@/components/ProductModal';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import api from '@/utils/api';

interface Product {
  _id: string;
  name: {
    en: string;
    de: string;
  };
  description: {
    en: string;
    de: string;
  };
  slug: string;
  category: string | {
    _id: string;
    name: {
      en: string;
      de: string;
    };
    slug: string;
  };
  images: string[];
  defaultImage: string;
  isFeatured: boolean;
  price?: number;
  stock?: number;
  occasions?: string[];
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const fetchProducts = useCallback(async () => {
    try {
      console.log('Fetching products...');
      const response = await api.get('/products');
      console.log('Response status:', response.status);
      console.log('Products data:', response.data);
      // Handle both old and new API response formats
      const productsData = response.data.data || response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(`Failed to load products: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setProducts([]); // Ensure products is always an array
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddToCart = (product: Product) => {
    addToCart({
      product: product._id,
      name: product.name.en,
      price: 0, // Price will be handled by product attributes
      image: product.defaultImage,
      quantity: 1,
      stock: 10
    });
  };

  const handleWishlistToggle = (product: Product) => {
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist({
        product: product._id,
        name: product.name.en,
        price: 0,
        image: product.defaultImage
      });
    }
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>KeralGiftsOnline.com - Premium Gifts & Celebrations</title>
          <meta name="description" content="Discover beautiful gifts, cakes, flowers, and celebration items. Premium quality with fast delivery across Germany." />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        </Head>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to KeralGiftsOnline.com
            </h1>
            <p className="text-xl text-gray-600">
              Premium gifts and celebrations for every occasion
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>KeralGiftsOnline.com - Premium Gifts & Celebrations</title>
        <meta name="description" content="Discover beautiful gifts, cakes, flowers, and celebration items. Premium quality with fast delivery across Germany." />
        <meta name="keywords" content="gifts, cakes, flowers, celebrations, Germany, online shopping" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Welcome to KeralGiftsOnline.com
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Discover premium gifts, beautiful cakes, fresh flowers, and everything you need for perfect celebrations. 
              Fast delivery across Germany with our advanced logistics network.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products" className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Shop Now
              </Link>
              <Link href="/celebration" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors">
                Celebration Cakes
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose KeralGiftsOnline.com?
            </h2>
            <p className="text-lg text-gray-600">
              Enterprise-grade platform with advanced features for the best shopping experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Advanced logistics with hub-based delivery for quick and reliable service</p>
            </div>
            
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-gray-600">Curated selection of high-quality gifts and celebration items</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Quick and reliable delivery across Germany</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600">
              Handpicked premium items for your special occasions
            </p>
          </div>

          {error && (
            <div className="text-center text-red-600 mb-8">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.isArray(products) && products.map((product) => (
              <ProductCard
                key={product._id}
                product={{
                  _id: product._id,
                  name: product.name,
                  description: product.description,
                  category: product.category,
                  images: product.images,
                  slug: product.slug,
                  isFeatured: product.isFeatured,
                  price: product.price || 0,
                  stock: product.stock || 0,
                  occasions: product.occasions
                }}
                onQuickView={() => handleQuickView(product)}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>

          {(!Array.isArray(products) || products.length === 0) && !error && (
            <div className="text-center text-gray-500">
              No products available at the moment.
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of satisfied customers who trust KeralGiftsOnline.com for their celebration needs.
          </p>
          <Link href="/products" className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Explore All Products
          </Link>
        </div>
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={{
            _id: selectedProduct._id,
            name: selectedProduct.name,
            description: selectedProduct.description,
            price: selectedProduct.price || 0,
            category: selectedProduct.category,
            stock: selectedProduct.stock || 0,
            images: selectedProduct.images,
            slug: selectedProduct.slug,
            occasions: selectedProduct.occasions,
            isFeatured: selectedProduct.isFeatured
          }}
          isOpen={!!selectedProduct}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
