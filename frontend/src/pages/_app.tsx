import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import WhatsAppButton from '../components/WhatsAppButton';
import Footer from '../components/Footer';
import { imageCacheService } from '../services/ImageCacheService';
import '../styles/globals.css';

// Register service workers for caching
function registerServiceWorkers() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        // Register main service worker
        const mainRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Main Service Worker registered successfully:', mainRegistration);

        // Register image cache service worker
        const imageRegistration = await navigator.serviceWorker.register('/sw-image-cache.js', {
          scope: '/'
        });
        console.log('Image Cache Service Worker registered successfully:', imageRegistration);

        // Wait for service workers to be ready
        await navigator.serviceWorker.ready;

        // Warm critical images cache after service workers are ready
        setTimeout(async () => {
          try {
            console.log('Warming critical images cache...');
            await imageCacheService.warmCriticalImagesFromAPI();
            console.log('Critical images cache warming completed');
          } catch (error) {
            console.warn('Failed to warm critical images cache:', error);
          }
        }, 2000); // Delay to ensure service workers are fully active

      } catch (error) {
        console.log('Service Worker registration failed:', error);
      }
    });
  }
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    registerServiceWorkers();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">
                <Component {...pageProps} />
              </main>
              <Footer />
            </div>
            <WhatsAppButton />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
