import React, { useState, useEffect } from 'react';
import { reliableApi } from '../services';
import { ApiError, ConnectionStatus } from '../services/types';

// Example component showing how to use the ReliableApiService
const ReliableApiServiceExample: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);

  useEffect(() => {
    // Monitor connection status
    const unsubscribe = reliableApi.onConnectionChange((status) => {
      setConnectionStatus(status);
    });

    // Get initial connection status
    setConnectionStatus(reliableApi.getConnectionStatus());

    return unsubscribe;
  }, []);

  const fetchProducts = async (cacheStrategy: 'cache-first' | 'network-first' | 'cache-only' = 'network-first') => {
    try {
      setLoading(true);
      setError(null);

      const response = await reliableApi.get('/products', {
        cacheStrategy,
        retries: 3,
        timeout: 10000,
        cacheTTL: 300000 // 5 minutes
      });

      setProducts(Array.isArray(response.data) ? response.data : []);
      setCacheStats(reliableApi.getCacheStats());
      
      console.log('Response cached:', response.cached);
      console.log('Response timestamp:', new Date(response.timestamp));
    } catch (err) {
      setError(err as ApiError);
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    reliableApi.clearCache();
    setCacheStats(reliableApi.getCacheStats());
  };

  const resetCircuitBreaker = () => {
    reliableApi.resetCircuitBreaker();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reliable API Service Example</h1>
      
      {/* Connection Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
        {connectionStatus && (
          <div className="space-y-1 text-sm">
            <div>Online: <span className={connectionStatus.online ? 'text-green-600' : 'text-red-600'}>
              {connectionStatus.online ? 'Yes' : 'No'}
            </span></div>
            <div>Speed: <span className="font-mono">{connectionStatus.speed}</span></div>
            <div>Latency: <span className="font-mono">{connectionStatus.latency}ms</span></div>
            <div>Last Checked: <span className="font-mono">{connectionStatus.lastChecked.toLocaleTimeString()}</span></div>
          </div>
        )}
      </div>

      {/* Cache Statistics */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Cache Statistics</h2>
        {cacheStats && (
          <div className="space-y-1 text-sm">
            <div>Cache Hits: <span className="font-mono">{cacheStats.hits}</span></div>
            <div>Cache Misses: <span className="font-mono">{cacheStats.misses}</span></div>
            <div>Cache Size: <span className="font-mono">{cacheStats.size}</span></div>
            <div>Hit Rate: <span className="font-mono">{(cacheStats.hitRate * 100).toFixed(1)}%</span></div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mb-6 space-x-2">
        <button
          onClick={() => fetchProducts('network-first')}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Fetch (Network First)
        </button>
        <button
          onClick={() => fetchProducts('cache-first')}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Fetch (Cache First)
        </button>
        <button
          onClick={() => fetchProducts('cache-only')}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Fetch (Cache Only)
        </button>
        <button
          onClick={clearCache}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Cache
        </button>
        <button
          onClick={resetCircuitBreaker}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Reset Circuit Breaker
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            Loading products...
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold">Error</h3>
          <p className="text-red-700">{error.message}</p>
          <div className="mt-2 text-sm text-red-600">
            <div>Type: {error.type}</div>
            <div>Retryable: {error.retryable ? 'Yes' : 'No'}</div>
            <div>Timestamp: {error.timestamp.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Products ({products.length})</h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.slice(0, 6).map((product, index) => (
              <div key={product._id || index} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-gray-600">${product.price}</p>
                {product.category && (
                  <p className="text-sm text-gray-500">Category: {product.category}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          !loading && !error && (
            <p className="text-gray-500">No products loaded. Click a fetch button to load products.</p>
          )
        )}
      </div>
    </div>
  );
};

export default ReliableApiServiceExample;