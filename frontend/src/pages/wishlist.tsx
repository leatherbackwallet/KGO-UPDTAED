/**
 * Wishlist Page - User's saved products
 * Displays wishlist items with options to remove, add to cart, and clear all
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getProductImage } from '../utils/imageUtils';
import { Product } from '../types/product';
import api from '../utils/api';

export default function Wishlist() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);
  const [serverWishlist, setServerWishlist] = useState<Product[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/wishlist');
    }
  }, [user, router]);

  // Fetch wishlist from server if user is authenticated
  useEffect(() => {
    if (user) {
      fetchServerWishlist();
    }
  }, [user]);

  const fetchServerWishlist = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await api.get('/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setServerWishlist(response.data.data.products || []);
      } else {
        console.error('Error fetching wishlist:', response.data.error);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      // Fallback to local wishlist if server fails
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get text from multilingual object or string
  const getText = (text: string | { en: string; de: string }): string => {
    if (typeof text === 'string') return text;
    return text.en || text.de || '';
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      product: product._id,
      name: getText(product.name),
      price: product.price || 0,
      image: getProductImage(product.images[0], product.slug),
      quantity: 1,
      stock: product.stock || 0
    });
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      // Remove from server
      await api.delete(`/wishlist/remove/${productId}`);
      // Remove from local state
      setServerWishlist(prev => prev.filter(p => p._id !== productId));
      // Also remove from local context
      removeFromWishlist(productId);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      // Still remove from local context even if server fails
      removeFromWishlist(productId);
    }
  };

  const handleClearWishlist = async () => {
    try {
      // Clear from server
      await api.delete('/wishlist/clear');
      // Clear from local state
      setServerWishlist([]);
      // Clear from local context
      clearWishlist();
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      // Still clear from local context even if server fails
      clearWishlist();
      setShowClearConfirm(false);
    }
  };

  const handleViewProduct = (product: Product) => {
    router.push(`/products/${product._id}`);
  };

  // Use server wishlist if user is authenticated and we have server data, otherwise fall back to local wishlist
  const displayWishlist = user && !loading ? serverWishlist : wishlist;
  const totalItems = displayWishlist.length;



  // Redirect if user is not authenticated and has no local wishlist items
  useEffect(() => {
    if (!user && wishlist.length === 0) {
      router.push('/login?redirect=/wishlist');
    }
  }, [user, wishlist.length, router]);

  // Show loading or redirect state
  if (!user && wishlist.length === 0) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto py-8 px-4">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-2">
              {totalItems === 0 
                ? 'No items in your wishlist yet' 
                : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your wishlist`
              }
            </p>
          </div>
          
          {totalItems > 0 && (
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/products')}
                className="btn-outline"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="btn-primary"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">Start adding products you love to your wishlist</p>
            <button
              onClick={() => router.push('/products')}
              className="btn-primary px-8 py-3"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayWishlist.map((item) => {
              // Handle both server Product objects and local WishlistItem objects
              const isProduct = '_id' in item;
              const productId = isProduct ? item._id : item.product;
              const productName = isProduct ? getText(item.name) : item.name;
              const productPrice = item.price || 0;
              const productImage = isProduct ? item.images?.[0] : item.image;
              const productSlug = isProduct ? item.slug : undefined;
              const productStock = isProduct ? item.stock || 0 : 0;

              return (
                <div
                  key={productId}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={getProductImage(productImage || '', productSlug || '')}
                      alt={productName || 'Product'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/products/placeholder.svg';
                      }}
                    />
                    
                    {/* Quick Actions Overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <div className="flex gap-2">
                        {isProduct && (
                          <button
                            onClick={() => handleViewProduct(item as Product)}
                            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all duration-200 hover:scale-110"
                            aria-label="View product"
                          >
                            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                        
                        {isProduct && (
                          <button
                            onClick={() => handleAddToCart(item as Product)}
                            disabled={productStock === 0}
                            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-all duration-200 hover:scale-110 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            aria-label="Add to cart"
                          >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(productId)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all duration-200"
                      aria-label="Remove from wishlist"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Stock Badge */}
                    {productStock === 0 && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:line-clamp-none">
                      {productName}
                    </h3>
                    <div className="flex items-center justify-between">
                                          <span className="text-lg font-bold text-kgo-red">
                      ₹{productPrice.toFixed(2)}
                    </span>
                      <span className="text-sm text-gray-500">
                        Stock: {productStock}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Clear Wishlist
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove all items from your wishlist? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearWishlist}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
} 