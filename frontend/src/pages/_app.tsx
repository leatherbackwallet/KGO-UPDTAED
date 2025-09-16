import React, { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import ErrorBoundary from '../components/ErrorBoundary';
import WhatsAppButton from '../components/WhatsAppButton';
import Footer from '../components/Footer';
import '../styles/globals.css';

// Register service worker for caching
function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
}

// Check if this is a static error page that shouldn't use context
function isStaticErrorPage(Component: any) {
  return Component.name === 'Custom404' || Component.name === 'Custom500';
}

export default function App({ Component, pageProps }: AppProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Only register service worker on client side
    if (typeof window !== 'undefined') {
      registerServiceWorker();
      setIsClient(true);
    }
  }, []);

  // For static error pages, render without context providers
  if (isStaticErrorPage(Component)) {
    return (
      <ErrorBoundary>
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            <Component {...pageProps} />
          </main>
        </div>
      </ErrorBoundary>
    );
  }

  // Always wrap with AuthProvider to prevent context errors
  // The AuthProvider handles SSR/client differences internally
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">
                <Component {...pageProps} />
              </main>
              {isClient && <Footer />}
            </div>
            {isClient && <WhatsAppButton />}
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
