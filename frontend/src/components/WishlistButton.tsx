import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { getProductImage } from '../utils/imageUtils';

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
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product._id);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlisted) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist({
        product: product._id,
        name: product.name,
        price: product.price || 0,
        image: getProductImage(product.images[0], product.slug)
      });
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg ${className}`}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
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
    </button>
  );
} 