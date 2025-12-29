import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Elegant Cart Icon Component
const CartIcon = () => {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
    </svg>
  );
};

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const { cart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    
    // Handle scroll effect for navbar
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100' 
        : 'bg-white/80 backdrop-blur-xl border-b border-gray-100/50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative">
              <img 
                src="/images/logo.png" 
                alt="KeralaGiftsOnline Logo" 
                className="h-12 w-auto hidden md:block transition-transform duration-300 group-hover:scale-105"
                suppressHydrationWarning
              />
              <img 
                src="/images/logo-mobile.png" 
                alt="KeralaGiftsOnline Logo" 
                className="h-10 w-auto md:hidden transition-transform duration-300 group-hover:scale-105"
                suppressHydrationWarning
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="/products" 
              className="nav-link px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Products
            </Link>
            <Link 
              href="/about" 
              className="nav-link px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              About
            </Link>
          </div>

          {/* Right side - Cart, User */}
          <div className="flex items-center space-x-3">
            {/* Cart */}
            <Link 
              href="/cart" 
              className="relative flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-kgo-red transition-all duration-200 group"
            >
              <CartIcon />
              <span className="hidden sm:block font-semibold">Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-kgo-red to-kgo-red-dark text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-200">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              {!isHydrated ? (
                <>
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="hidden sm:block w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                </>
              ) : isLoading ? (
                <>
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="hidden sm:block w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                </>
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-kgo-red to-kgo-red-dark rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
                      <span className="text-white text-sm font-bold">
                        {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="hidden sm:block text-gray-700 font-semibold">
                      {(user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : user.email}
                    </span>
                    <svg 
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsMenuOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl py-2 z-50 border border-gray-100 overflow-hidden">
                        <Link 
                          href="/profile" 
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Profile</span>
                          </div>
                        </Link>
                        <Link 
                          href="/orders" 
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>My Orders</span>
                          </div>
                        </Link>
                        <Link 
                          href="/wishlist" 
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>Wishlist</span>
                          </div>
                        </Link>
                        <hr className="my-2 border-gray-100" />
                        <button
                          onClick={() => {
                            logout();
                            setIsMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 font-medium"
                        >
                          <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="nav-link px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 font-semibold"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register" 
                    className="btn-primary text-sm px-6 py-2.5"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="py-4 space-y-2 border-t border-gray-100">
            <Link 
              href="/products" 
              className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-semibold"
              onClick={() => setIsMenuOpen(false)}
            >
              Products
            </Link>
            <Link 
              href="/about" 
              className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-semibold"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            {!user && (
              <>
                <Link 
                  href="/login" 
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="block px-4 py-3 bg-gradient-to-r from-kgo-red to-kgo-red-dark text-white rounded-lg font-semibold text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
