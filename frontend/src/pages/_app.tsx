import React, { Component, ReactNode, useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import WhatsAppButton from '../components/WhatsAppButton';
import Footer from '../components/Footer';
import '../styles/globals.css';

// Simple ErrorBoundary without complex dependencies
class SimpleErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <SimpleErrorBoundary>
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
    </SimpleErrorBoundary>
  );
}