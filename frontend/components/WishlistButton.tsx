import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../utils/api';
import { Product } from '../types/shared';

interface WishlistButtonProps {
  product: Product;
  className?: string;
}

export default function WishlistButton({ product, className = '' }: WishlistButtonProps) {
  const { user } = useAuth();
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Redirect to login or show login modal
      window.location.href = '/login';
      return;
    }

    setIsLoading(true);
    try {
      if (isInWishlist(product._id)) {
        // Remove from server if user is authenticated
        try {
          await api.delete(`/wishlist/remove/${product._id}`);
        } catch (error) {
          console.error('Error removing from server wishlist:', error);
        }
        // Remove from local context
        removeFromWishlist(product._id);
      } else {
        // Add to server if user is authenticated
        try {
          await api.post(`/wishlist/add/${product._id}`);
        } catch (error) {
          console.error('Error adding to server wishlist:', error);
        }
        // Add to local context
        addToWishlist({
          product: product._id,
          name: product.name,
          price: product.price || 0,
          image: product.images?.[0] || product.defaultImage || '/images/products/placeholder.svg'
        });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleWishlist}
      disabled={isLoading}
      className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all duration-200 hover:scale-110 disabled:opacity-50 ${className}`}
      aria-label={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {isLoading ? (
        <svg className="w-5 h-5 text-gray-700 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : isInWishlist(product._id) ? (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
    </button>
  );
} 