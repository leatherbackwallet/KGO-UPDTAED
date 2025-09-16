import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Custom500() {
  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>500 - Server Error | OnYourBehlf</title>
        <meta name="description" content="Something went wrong on our end." />
      </Head>
      
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">500</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Server Error</h2>
          <p className="text-gray-600 mb-8">
            Something went wrong on our end. Please try again later.
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
            <button 
              onClick={handleReload}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
