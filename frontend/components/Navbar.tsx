import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Cart Icon Component - Clean SVG
const CartIcon = () => {
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
    </svg>
  );
};


export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const { cart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="/images/logo.png" 
              alt="KeralaGiftsOnline Logo" 
              className="h-10 w-auto hidden md:block"
              suppressHydrationWarning
            />
            <img 
              src="/images/logo-mobile.png" 
              alt="KeralaGiftsOnline Logo" 
              className="h-8 w-auto md:hidden"
              suppressHydrationWarning
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-white hover:text-white hover:opacity-80 font-bold text-lg transition-colors">
              Products
            </Link>
            <Link href="/about" className="text-white hover:text-white hover:opacity-80 font-bold text-lg transition-colors">
              About
            </Link>
          </div>

          {/* Right side - Cart, User */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link href="/cart" className="relative flex items-center space-x-2 p-2 text-white hover:text-white hover:opacity-80 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
              <CartIcon />
              <span className="text-base font-bold">Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-kgo-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              {!isHydrated ? (
                // Show skeleton during SSR to prevent hydration mismatch
                <>
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="hidden sm:block w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </>
              ) : isLoading ? (
                // Show skeleton during loading
                <>
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="hidden sm:block w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </>
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 text-white hover:text-white hover:opacity-80 transition-colors"
                  >
                    <div className="w-8 h-8 bg-kgo-red rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                     <span className="hidden sm:block text-white font-bold text-lg">{(user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : user.email}</span>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Profile
                      </Link>
                      <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        My Orders
                      </Link>
                      <Link href="/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Wishlist
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login" className="text-white hover:text-white hover:opacity-80 font-bold text-lg transition-colors">
                    Login
                  </Link>
                  <Link href="/register" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white hover:text-white hover:opacity-80 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          {isMenuOpen && (
            <div className="border-t border-white border-opacity-20 py-4">
              <div className="flex flex-col space-y-4">
                {/* Main Navigation Links */}
                <Link href="/products" className="text-white hover:text-white hover:opacity-80 transition-colors font-bold text-lg">
                  Products
                </Link>
                <Link href="/about" className="text-white hover:text-white hover:opacity-80 transition-colors font-bold text-lg">
                  About
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
