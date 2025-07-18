import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 px-4 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-2xl text-blue-600">
            OnYourBehalf
          </Link>
          <Link href="/products" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
            Products
          </Link>
          <Link href="/celebration" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
            Celebrations
          </Link>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Wishlist Icon */}
          <Link href="/wishlist" className="relative text-gray-700 hover:text-red-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {typeof window !== 'undefined' && wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>
          
          {/* Cart Icon */}
          <Link href="/cart" className="relative text-gray-700 hover:text-blue-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
          </Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              {user.role === 'Admin' && (
                <Link href="/admin" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Admin
                </Link>
              )}
              <button 
                onClick={logout} 
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Login
              </Link>
              <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
