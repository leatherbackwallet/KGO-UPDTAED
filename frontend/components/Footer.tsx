import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-kgo-red rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-kgo-green rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <img 
                src="/images/logo.png" 
                alt="KeralaGiftsOnline Logo" 
                className="h-10 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-gray-300 mb-8 max-w-md leading-relaxed text-lg">
              Bringing the authentic taste and culture of Kerala to the global diaspora through carefully curated gifts and traditional products.
            </p>
            
            {/* Contact Information */}
            <div className="space-y-4">
              <a 
                href="https://wa.me/918075030919" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center group hover:text-kgo-green transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mr-4 group-hover:bg-green-500/30 transition-colors duration-200">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-400">WhatsApp</div>
                  <div className="font-semibold">+91 8075030919</div>
                </div>
              </a>
              
              <a 
                href="mailto:sales@keralagiftsonline.com"
                className="flex items-center group hover:text-blue-400 transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mr-4 group-hover:bg-blue-500/30 transition-colors duration-200">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Email</div>
                  <div className="font-semibold">sales@keralagiftsonline.com</div>
                </div>
              </a>
              
              <a 
                href="https://instagram.com/keralagiftsonline" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center group hover:text-pink-400 transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mr-4 group-hover:bg-pink-500/30 transition-colors duration-200">
                  <svg className="w-6 h-6 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Instagram</div>
                  <div className="font-semibold">@keralagiftsonline</div>
                </div>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/products" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium inline-block transform hover:translate-x-1"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link 
                  href="/content" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium inline-block transform hover:translate-x-1"
                >
                  Cultural Content
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium inline-block transform hover:translate-x-1"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium inline-block transform hover:translate-x-1"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white">Customer Service</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/orders" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium inline-block transform hover:translate-x-1"
                >
                  My Orders
                </Link>
              </li>
              <li>
                <Link 
                  href="/wishlist" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium inline-block transform hover:translate-x-1"
                >
                  Wishlist
                </Link>
              </li>
              <li>
                <Link 
                  href="/cart" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium inline-block transform hover:translate-x-1"
                >
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link 
                  href="/profile" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium inline-block transform hover:translate-x-1"
                >
                  My Profile
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} Kerala Gifts Online. All rights reserved.
              <span className="ml-2 text-gray-500 text-xs">
                v{process.env.NEXT_PUBLIC_APP_VERSION || '3.0.0'} | {process.env.NEXT_PUBLIC_GIT_BRANCH || 'unknown'}
              </span>
            </div>
            <div className="flex flex-wrap gap-6 justify-center md:justify-end">
              <Link 
                href="/terms" 
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Terms & Conditions
              </Link>
              <Link 
                href="/privacy" 
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/refund" 
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Refund Policy
              </Link>
              <Link 
                href="/shipping" 
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Shipping Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
