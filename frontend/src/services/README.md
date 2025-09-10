# Reliable API Service

The Reliable API Service provides enhanced HTTP request handling with built-in retry logic, circuit breaker pattern, connection monitoring, and intelligent caching. This service addresses the intermittent loading issues by implementing robust error handling and recovery mechanisms.

## Features

- **Automatic Retry Logic**: Exponential backoff retry for transient failures
- **Circuit Breaker Pattern**: Prevents cascading failures by temporarily stopping requests to failing services
- **Connection Monitoring**: Real-time network status and speed detection
- **Intelligent Caching**: Multi-level caching with configurable TTL and strategies
- **Error Classification**: Detailed error types with retry recommendations
- **Request Timeout Handling**: Configurable timeouts with proper error handling

## Quick Start

```typescript
import { reliableApi } from '../services';

// Basic GET request
const response = await reliableApi.get('/products');
console.log(response.data);

// GET request with options
const response = await reliableApi.get('/products', {
  cacheStrategy: 'cache-first',
  retries: 3,
  timeout: 10000,
  cacheTTL: 300000 // 5 minutes
});

// POST request
const response = await reliableApi.post('/products', {
  name: 'New Product',
  price: 29.99
});
```

## Configuration Options

### RequestOptions

```typescript
interface RequestOptions {
  timeout?: number;           // Request timeout in milliseconds (default: 10000)
  retries?: number;          // Maximum retry attempts (default: 3)
  cacheStrategy?: string;    // 'cache-first' | 'network-first' | 'cache-only'
  cacheTTL?: number;         // Cache time-to-live in milliseconds (default: 300000)
  priority?: string;         // Request priority: 'high' | 'normal' | 'low'
}
```

### Cache Strategies

- **network-first**: Try network first, fallback to cache on failure
- **cache-first**: Try cache first, fallback to network if not found
- **cache-only**: Only use cache, throw error if not found

## API Methods

### HTTP Methods

```typescript
// GET request
reliableApi.get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>

// POST request
reliableApi.post<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>

// PUT request
reliableApi.put<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>

// DELETE request
reliableApi.delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>
```

### Cache Management

```typescript
// Clear all cache
reliableApi.clearCache();

// Clear cache by pattern
reliableApi.clearCache('products.*');

// Get cache statistics
const stats = reliableApi.getCacheStats();
console.log(`Hit rate: ${stats.hitRate * 100}%`);
```

### Connection Monitoring

```typescript
// Get current connection status
const status = reliableApi.getConnectionStatus();
console.log(`Online: ${status.online}, Speed: ${status.speed}`);

// Listen for connection changes
const unsubscribe = reliableApi.onConnectionChange((status) => {
  console.log('Connection changed:', status);
});

// Don't forget to unsubscribe
unsubscribe();
```

### Circuit Breaker

```typescript
// Get circuit breaker state
const state = reliableApi.getCircuitBreakerState();
console.log(`Circuit breaker state: ${state.state}`);

// Reset circuit breaker (useful for recovery)
reliableApi.resetCircuitBreaker();
```

## Response Format

```typescript
interface ApiResponse<T> {
  data: T;              // Response data
  success: boolean;     // Request success status
  cached: boolean;      // Whether response came from cache
  timestamp: number;    // Response timestamp
  error?: ApiError;     // Error details if failed
}
```

## Error Handling

The service provides detailed error information:

```typescript
interface ApiError {
  type: ErrorType;           // Error classification
  message: string;           // Human-readable error message
  retryable: boolean;        // Whether error is retryable
  timestamp: Date;           // When error occurred
  context?: Record<string, any>; // Additional error context
}

enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR'
}
```

## Usage Examples

### Basic Product Fetching

```typescript
import { reliableApi } from '../services';

const fetchProducts = async () => {
  try {
    const response = await reliableApi.get('/products', {
      cacheStrategy: 'cache-first',
      retries: 3,
      timeout: 10000
    });
    
    console.log('Products:', response.data);
    console.log('From cache:', response.cached);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    
    if (error.retryable) {
      // Could implement manual retry logic here
      console.log('Error is retryable, could try again');
    }
  }
};
```

### Connection-Aware Loading

```typescript
import { reliableApi } from '../services';

const fetchWithConnectionAwareness = async () => {
  const connectionStatus = reliableApi.getConnectionStatus();
  
  if (!connectionStatus.online) {
    // Try cache-only when offline
    try {
      const response = await reliableApi.get('/products', {
        cacheStrategy: 'cache-only'
      });
      return response.data;
    } catch (error) {
      throw new Error('No cached data available while offline');
    }
  }
  
  // Adjust timeout based on connection speed
  const timeout = connectionStatus.speed === 'slow' ? 30000 : 10000;
  
  const response = await reliableApi.get('/products', {
    timeout,
    cacheStrategy: 'network-first'
  });
  
  return response.data;
};
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { reliableApi } from '../services';

const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await reliableApi.get('/products', {
        cacheStrategy: 'cache-first',
        retries: 3
      });
      
      setProducts(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, error, refetch: fetchProducts };
};
```

## Testing

The service includes comprehensive tests for all components:

```bash
# Run all service tests
npm test -- --testPathPatterns="services"

# Run specific test file
npm test -- RetryManager.test.ts

# Run tests with coverage
npm test -- --coverage --testPathPatterns="services"
```

## Performance Considerations

- **Cache Size**: The service uses in-memory caching. Monitor memory usage in production
- **Connection Monitoring**: Network checks run every 30 seconds by default
- **Retry Delays**: Exponential backoff prevents overwhelming failing services
- **Circuit Breaker**: Automatically stops requests to failing services to prevent cascading failures

## Migration from Basic API

To migrate from the basic API utility:

```typescript
// Before
import api from '../utils/api';
const response = await api.get('/products');

// After
import { reliableApi } from '../services';
const response = await reliableApi.get('/products');
// response.data contains the actual data
// response.cached indicates if it came from cache
```

## Cleanup

When your application unmounts, clean up resources:

```typescript
import { cleanupReliableApi } from '../services';

// In your app cleanup
cleanupReliableApi();
```

This ensures proper cleanup of connection monitors and other resources.