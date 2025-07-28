import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import BrowserCompatibility from '../components/BrowserCompatibility';
import ErrorBoundary from '../components/ErrorBoundary';

// Browser compatibility polyfills
const addPolyfills = () => {
  // Polyfill for older browsers that don't support Promise.allSettled
  if (!Promise.allSettled) {
    (Promise as any).allSettled = (promises: Promise<any>[]) => {
      return Promise.all(
        promises.map((promise) =>
          promise
            .then((value: any) => ({ status: 'fulfilled', value }))
            .catch((reason: any) => ({ status: 'rejected', reason }))
        )
      );
    };
  }

  // Polyfill for Object.fromEntries if not available
  if (!Object.fromEntries) {
    (Object as any).fromEntries = (entries: [string, any][]) => {
      const obj: { [key: string]: any } = {};
      for (const [key, value] of entries) {
        obj[key] = value;
      }
      return obj;
    };
  }

  // Polyfill for Array.prototype.flat if not available
  if (!Array.prototype.flat) {
    (Array.prototype as any).flat = function(depth: number = 1) {
      return this.reduce((flat: any[], toFlatten: any) => {
        return flat.concat((Array.isArray(toFlatten) && depth > 0) ? toFlatten.flat(depth - 1) : toFlatten);
      }, []);
    };
  }

  // Polyfill for Array.prototype.flatMap if not available
  if (!Array.prototype.flatMap) {
    (Array.prototype as any).flatMap = function(callback: Function, thisArg?: any) {
      return this.map(callback, thisArg).flat();
    };
  }
};

// Global error handler component
const GlobalErrorHandler = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      // You can add error reporting here
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // You can add error reporting here
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
};

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Add polyfills on client side
    if (typeof window !== 'undefined') {
      addPolyfills();
    }
  }, []);

  return (
    <ErrorBoundary>
      <GlobalErrorHandler>
        <BrowserCompatibility />
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Component {...pageProps} />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </GlobalErrorHandler>
    </ErrorBoundary>
  );
}
