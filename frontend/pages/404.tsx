import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SEOHead from '../components/SEOHead';

export default function Custom404() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SEOHead
        title="404 - Page Not Found | KeralGiftsOnline"
        description="The page you're looking for doesn't exist. Browse our collection of premium gifts and traditional Kerala products instead."
        noindex={true}
      />
      
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
          
          <div>
            <Link 
              href="/products"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
