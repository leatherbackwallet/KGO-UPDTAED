import React, { useState, useEffect } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { getProductImage } from '../utils/imageUtils';
import api from '../utils/api';

interface WishlistButtonProps {
  product: {
    _id: string;
    name: string;
    price?: number;
    images: string[];
    slug?: string;
  };
  className?: string;
}

export default function WishlistButton({ product, className = '' }: WishlistButtonProps) {
  const { user } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check server wishlist status when component mounts
  useEffect(() => {
    if (user) {
      checkServerWishlistStatus();
    } else {
      // Fallback to local wishlist for non-authenticated users
      setIsWishlisted(isInWishlist(product._id));
    }
  }, [user, product._id]);

  const checkServerWishlistStatus = async () => {
    try {
      const response = await api.get(`/wishlist/check/${product._id}`);
      const data = response.data as { isInWishlist: boolean };
      setIsWishlisted(data.isInWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      // Fallback to local wishlist
      setIsWishlisted(isInWishlist(product._id));
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isWishlisted) {
        if (user) {
          // Remove from server
          await api.delete(`/wishlist/remove/${product._id}`);
        }
        // Remove from local context
        removeFromWishlist(product._id);
        setIsWishlisted(false);
      } else {
        if (user) {
          // Add to server
          await api.post(`/wishlist/add/${product._id}`);
        }
        // Add to local context
        const wishlistItem = {
          product: product._id,
          name: product.name,
          price: product.price || 0,
          image: getProductImage(product.images[0], product.slug)
        };
        addToWishlist(wishlistItem);
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      // Revert state on error
      setIsWishlisted(!isWishlisted);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
      ) : (
        <svg
          className={`w-5 h-5 transition-all duration-200 ${
            isWishlisted 
              ? 'text-red-500 fill-current' 
              : 'text-gray-400 hover:text-red-400'
          }`}
          fill={isWishlisted ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  );
} 