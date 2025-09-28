import React, { Component, ReactNode, useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { LoadingProvider } from '../context/LoadingContext';
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

// Component that can use router hook
function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [showComponents, setShowComponents] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Add a small delay to prevent hydration mismatch and flashing
    const timer = setTimeout(() => {
      setShowComponents(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Completely exclude admin pages from main app layout
  const isAdminPage = router.pathname.startsWith('/admin');
  
  if (isAdminPage) {
    // Admin pages are handled by their own _app.tsx
    return <Component {...pageProps} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Component {...pageProps} />
      </main>
      {/* Render Footer with smooth transition */}
      <div className={`transition-opacity duration-300 ${showComponents ? 'opacity-100' : 'opacity-0'}`}>
        {isClient && <Footer />}
      </div>
      {/* Render WhatsApp Button with smooth transition */}
      <div className={`transition-opacity duration-300 ${showComponents ? 'opacity-100' : 'opacity-0'}`}>
        {isClient && <WhatsAppButton />}
      </div>
    </div>
  );
}

export default function App(props: AppProps) {
  return (
    <SimpleErrorBoundary>
      <LoadingProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppContent {...props} />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </LoadingProvider>
    </SimpleErrorBoundary>
  );
}