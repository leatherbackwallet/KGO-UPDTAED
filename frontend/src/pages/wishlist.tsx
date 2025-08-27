/**
 * Wishlist Page - User's saved products
 * Displays wishlist items with options to remove, add to cart, and clear all
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../utils/api';
import { getMultilingualText } from '../utils/api';
import { getProductImage } from '../utils/imageUtils';
import { Product } from '../types/product';

interface WishlistItem {
  product: string;
  name: string;
  price: number;
  image: string;
}

const WishlistPage: React.FC = () => {
  const { user, tokens } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverWishlist, setServerWishlist] = useState<Product[]>([]);
  const [isLoadingServer, setIsLoadingServer] = useState(true);

  // Fetch server wishlist on component mount
  useEffect(() => {
    const fetchServerWishlist = async () => {
      if (!user) {
        setIsLoadingServer(false);
        return;
      }

      try {
        if (!tokens?.accessToken) {
          console.error('No authentication token found');
          setIsLoadingServer(false);
          return;
        }

        const response = await api.get('/wishlist', {
          headers: { Authorization: `Bearer ${tokens.accessToken}` }
        });

        if (response.data.success) {
          setServerWishlist(response.data.data.products || []);
        } else {
          console.error('Error fetching wishlist:', response.data.error);
        }
      } catch (error) {
        console.error('Error fetching server wishlist:', error);
      } finally {
        setIsLoadingServer(false);
      }
    };

    fetchServerWishlist();
  }, [user]);

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      setLoading(true);
      if (user) {
        // Remove from server if user is authenticated
        try {
          await api.delete(`/wishlist/remove/${productId}`, {
            headers: { Authorization: `Bearer ${tokens?.accessToken}` }
          });
          
          // Refresh server wishlist after successful removal
          const response = await api.get('/wishlist', {
            headers: { Authorization: `Bearer ${tokens?.accessToken}` }
          });
          
          if (response.data.success) {
            setServerWishlist(response.data.data.products || []);
          }
        } catch (error) {
          console.error('Error removing from server wishlist:', error);
          setError('Failed to remove item from wishlist');
        }
      }
      // Remove from local context
      removeFromWishlist(productId);
    } catch (err: any) {
      console.error('Error removing from wishlist:', err);
      setError('Failed to remove item from wishlist');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your wishlist</h2>
          <a href="/login" className="text-blue-600 hover:text-blue-800">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Wishlist - KeralGiftsOnline</title>
        <meta name="description" content="View and manage your wishlist items" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-2">Save your favorite items for later</p>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {isLoadingServer ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kgo-red mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading your wishlist...</p>
            </div>
          ) : serverWishlist.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-4">Start adding items to your wishlist while browsing our products.</p>
              <a href="/products" className="btn-primary">
                Browse Products
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {serverWishlist.map((product) => (
                <div key={product._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="relative">
                    <img
                      src={getProductImage(product.images?.[0] || product.defaultImage, product.slug)}
                      alt={getMultilingualText(product.name)}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/products/placeholder.svg';
                      }}
                    />
                    <button
                      onClick={() => handleRemoveFromWishlist(product._id)}
                      disabled={loading}
                      className="absolute top-2 right-2 w-8 h-8 bg-kgo-red text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors disabled:opacity-50"
                      aria-label="Remove from wishlist"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {getMultilingualText(product.name)}
                    </h3>
                    <p className="text-xl font-bold text-kgo-red mb-3">
                      ₹{(product.price || 0).toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      <a
                        href={`/products/${product._id}`}
                        className="flex-1 btn-primary"
                      >
                        View Details
                      </a>
                      <button
                        onClick={() => handleRemoveFromWishlist(product._id)}
                        disabled={loading}
                        className="btn-outline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WishlistPage; 