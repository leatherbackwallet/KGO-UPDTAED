import React, { useState, useEffect } from 'react';
import { useConnectionMonitor } from '../hooks/useConnectionMonitor';
import { ConnectionIndicator } from '../components/ConnectionIndicator';

/**
 * Example component demonstrating ConnectionMonitor integration
 * This shows how to use connection state management for adaptive loading
 */
export const ConnectionMonitorExample: React.FC = () => {
  const {
    isOnline,
    networkSpeed,
    connectionQuality,
    indicator,
    queueForRetry,
    getEstimatedLoadTime
  } = useConnectionMonitor();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate product loading with connection-aware behavior
  const loadProducts = async () => {
    if (!isOnline) {
      setError('No internet connection. Please check your network.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Estimate load time based on connection quality
      const estimatedTime = getEstimatedLoadTime(50 * 1024); // 50KB of data
      console.log(`Estimated load time: ${estimatedTime}ms`);

      // Simulate API call with adaptive timeout based on connection
      const timeout = connectionQuality === 'poor' ? 10000 : 5000;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch('/api/products', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      
      if (error.name === 'AbortError') {
        setError('Request timed out. This might be due to a slow connection.');
        
        // Queue for retry when connection improves
        queueForRetry({
          id: 'load-products',
          operation: loadProducts,
          onSuccess: () => {
            console.log('Products loaded successfully after retry');
          },
          onError: (retryError) => {
            console.error('Retry failed:', retryError);
            setError('Failed to load products even after retry.');
          }
        });
      } else {
        setError(error.message || 'Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Adaptive UI based on connection quality
  const getLoadingMessage = () => {
    switch (connectionQuality) {
      case 'poor':
        return 'Loading... This may take a while due to slow connection.';
      case 'good':
        return 'Loading products...';
      case 'excellent':
        return 'Loading...';
      default:
        return 'Loading...';
    }
  };

  const getConnectionBadge = () => {
    const colors = {
      poor: 'bg-red-100 text-red-800',
      good: 'bg-yellow-100 text-yellow-800',
      excellent: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[connectionQuality]}`}>
        {connectionQuality} connection ({networkSpeed})
      </span>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Connection Monitor Example</h1>
        
        {/* Connection Status */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
          <div className="flex items-center space-x-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {getConnectionBadge()}
          </div>
        </div>

        {/* Connection Indicator */}
        <ConnectionIndicator className="mb-4" />

        {/* Products Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Products</h2>
            <button
              onClick={loadProducts}
              disabled={loading || !isOnline}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Reload Products'}
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">{getLoadingMessage()}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Products</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  {!isOnline && (
                    <p className="mt-1 text-sm text-red-600">
                      Products will automatically reload when your connection is restored.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No products available
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-medium">{product.name || `Product ${index + 1}`}</h3>
                  <p className="text-gray-600 text-sm">{product.description || 'Sample product description'}</p>
                  <p className="text-lg font-semibold mt-2">₹{product.price || '99.99'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Debug Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
          <div className="text-sm space-y-1">
            <p><strong>Online:</strong> {isOnline ? 'Yes' : 'No'}</p>
            <p><strong>Network Speed:</strong> {networkSpeed}</p>
            <p><strong>Connection Quality:</strong> {connectionQuality}</p>
            <p><strong>Current Indicator:</strong> {indicator ? `${indicator.type}: ${indicator.message}` : 'None'}</p>
            <p><strong>Estimated Load Time (50KB):</strong> {getEstimatedLoadTime(50 * 1024)}ms</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionMonitorExample;