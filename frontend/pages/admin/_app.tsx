/**
 * Admin App Wrapper
 * Completely isolated app wrapper for admin routes
 * Excludes all main application components and layout
 */

import React, { Component, ReactNode } from 'react';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../../context/AuthContext';
import { LoadingProvider } from '../../context/LoadingContext';
import '../../styles/globals.css';

// Simple ErrorBoundary for admin pages
class AdminErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
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
            <h1 className="text-2xl font-bold text-red-600 mb-4">Admin Panel Error</h1>
            <p className="text-gray-600 mb-4">Something went wrong in the admin panel</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
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

// Admin-specific app content
function AdminAppContent({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Component {...pageProps} />
    </div>
  );
}

// Admin App - completely isolated from main application
export default function AdminApp(props: AppProps) {
  return (
    <AdminErrorBoundary>
      <LoadingProvider>
        <AuthProvider>
          <AdminAppContent {...props} />
        </AuthProvider>
      </LoadingProvider>
    </AdminErrorBoundary>
  );
}
