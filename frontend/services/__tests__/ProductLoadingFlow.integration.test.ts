/**
 * Integration Tests for Product Loading Flow
 * Tests complete product loading flow with network failures and recovery
 */

import { ReliableApiService } from '../ReliableApiService';
import { CacheManager } from '../CacheManager';
import { ImageManager } from '../ImageManager';
import { ConnectionMonitor } from '../ConnectionMonitor';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Mock caches API
const cachesMock = {
  open: jest.fn(() => Promise.resolve({
    match: jest.fn(() => Promise.resolve(null)),
    put: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve(true)),
    keys: jest.fn(() => Promise.resolve([])),
  })),
  delete: jest.fn(() => Promise.resolve(true))
};

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock Image constructor
const mockImage = {
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
  complete: false
};

global.Image = jest.fn(() => mockImage) as any;

// Setup mocks
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'caches', {
  value: cachesMock
});

describe('Product Loading Flow Integration Tests', () => {
  let apiService: ReliableApiService;
  let cacheManager: CacheManager;
  let imageManager: ImageManager;
  let connectionMonitor: ConnectionMonitor;
  let mockAxiosInstance: any;

  const mockProducts = [
    {
      _id: '1',
      name: 'Wedding Cake Deluxe',
      price: 299.99,
      image: 'https://cdn.example.com/wedding-cake-1.jpg',
      category: 'wedding-cakes'
    },
    {
      _id: '2',
      name: 'Birthday Cake Special',
      price: 49.99,
      image: 'https://cdn.example.com/birthday-cake-1.jpg',
      category: 'birthday-cakes'
    },
    {
      _id: '3',
      name: 'Custom Cupcakes',
      price: 24.99,
      image: 'https://cdn.example.com/cupcakes-1.jpg',
      category: 'cupcakes'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    
    mockAxiosInstance = {
      create: jest.fn().mockReturnThis(),
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      },
      defaults: {
        baseURL: 'http://localhost:3001'
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    apiService = new ReliableApiService('http://localhost:3001');
    cacheManager = new CacheManager();
    imageManager = new ImageManager();
    connectionMonitor = new ConnectionMonitor();
  });

  afterEach(() => {
    apiService.destroy();
    imageManager.clearAll();
  });

  describe('Complete Product Loading Flow', () => {
    it('should load products and images successfully on first attempt', async () => {
      // Mock successful API response
      mockAxiosInstance.request.mockResolvedValue({
        data: { products: mockProducts },
        status: 200
      });

      // Mock successful image loads
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      // Load products
      const productsResponse = await apiService.get('/api/products');
      expect(productsResponse.success).toBe(true);
      expect(productsResponse.data.products).toEqual(mockProducts);

      // Load images for each product
      const imageResults = await Promise.all(
        mockProducts.map(product => imageManager.loadImage(product.image))
      );

      imageResults.forEach((result, index) => {
        expect(result.url).toBe(mockProducts[index].image);
        expect(result.cached).toBe(false);
        expect(result.fallbackUsed).toBe(false);
      });
    });

    it('should handle API failure with retry and eventual success', async () => {
      // Mock API failure then success
      mockAxiosInstance.request
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValue({
          data: { products: mockProducts },
          status: 200
        });

      // Load products with retry
      const productsResponse = await apiService.get('/api/products', { retries: 2 });
      
      expect(productsResponse.success).toBe(true);
      expect(productsResponse.data.products).toEqual(mockProducts);
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use cached data when API fails completely', async () => {
      // First, populate cache with successful request
      mockAxiosInstance.request.mockResolvedValue({
        data: { products: mockProducts },
        status: 200
      });

      await apiService.get('/api/products');

      // Now simulate complete API failure
      mockAxiosInstance.request.mockRejectedValue(new Error('Server Down'));

      // Should return cached data
      const cachedResponse = await apiService.get('/api/products', { 
        cacheStrategy: 'cache-first',
        retries: 1 
      });

      expect(cachedResponse.success).toBe(true);
      expect(cachedResponse.cached).toBe(true);
      expect(cachedResponse.data.products).toEqual(mockProducts);
    });

    it('should handle partial image loading failures with fallbacks', async () => {
      // Mock successful API response
      mockAxiosInstance.request.mockResolvedValue({
        data: { products: mockProducts },
        status: 200
      });

      // Mock mixed image loading results
      const originalImage = global.Image;
      let imageLoadAttempts = 0;
      
      global.Image = jest.fn(() => {
        const img = {
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null,
          src: '',
          complete: false
        };
        
        Object.defineProperty(img, 'src', {
          set: function(value: string) {
            imageLoadAttempts++;
            setTimeout(() => {
              // First image fails, others succeed
              if (value === mockProducts[0].image && img.onerror) {
                img.onerror();
              } else if (value.includes('placeholder.svg') && img.onload) {
                img.onload();
              } else if (img.onload) {
                img.onload();
              }
            }, 10);
          }
        });
        
        return img;
      }) as any;

      // Load products
      const productsResponse = await apiService.get('/api/products');
      expect(productsResponse.success).toBe(true);

      // Load images
      const imageResults = await Promise.all(
        mockProducts.map(product => imageManager.loadImage(product.image))
      );

      // First image should use placeholder, others should succeed
      expect(imageResults[0].fallbackUsed).toBe(true);
      expect(imageResults[0].url).toBe('/images/products/placeholder.svg');
      expect(imageResults[1].url).toBe(mockProducts[1].image);
      expect(imageResults[2].url).toBe(mockProducts[2].image);

      global.Image = originalImage;
    });

    it('should handle complete network failure gracefully', async () => {
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', { value: false });

      // Mock complete network failure
      mockAxiosInstance.request.mockRejectedValue(new Error('Network Error'));

      // Should handle gracefully
      await expect(
        apiService.get('/api/products', { retries: 1 })
      ).rejects.toThrow('Network Error');

      // Connection monitor should detect offline state
      expect(connectionMonitor.isOnline()).toBe(false);
    });
  });

  describe('Cache Persistence Across Sessions', () => {
    it('should persist API cache across browser sessions', async () => {
      // Mock successful API response
      mockAxiosInstance.request.mockResolvedValue({
        data: { products: mockProducts },
        status: 200
      });

      // Load products and cache them
      await apiService.get('/api/products');

      // Simulate browser session restart by creating new service instance
      const newApiService = new ReliableApiService('http://localhost:3001');

      // Should load from cache without making network request
      const cachedResponse = await newApiService.get('/api/products', { 
        cacheStrategy: 'cache-first' 
      });

      expect(cachedResponse.success).toBe(true);
      expect(cachedResponse.cached).toBe(true);
      expect(cachedResponse.data.products).toEqual(mockProducts);

      newApiService.destroy();
    });

    it('should persist image cache across page reloads', async () => {
      const imageUrl = 'https://cdn.example.com/test-image.jpg';
      const cachedBlob = 'blob:cached-image-data';

      // Mock image cache service to return cached data
      const mockImageCacheService = require('../ImageCacheService').imageCacheService;
      mockImageCacheService.getCachedImageBlob = jest.fn().mockResolvedValue(cachedBlob);

      // Load image (should use cached version)
      const result = await imageManager.loadImage(imageUrl);

      expect(result.url).toBe(cachedBlob);
      expect(result.cached).toBe(true);
      expect(mockImageCacheService.getCachedImageBlob).toHaveBeenCalledWith(imageUrl);
    });

    it('should handle cache invalidation correctly', async () => {
      // Populate cache
      mockAxiosInstance.request.mockResolvedValue({
        data: { products: mockProducts },
        status: 200
      });

      await apiService.get('/api/products');

      // Clear cache
      apiService.clearCache();

      // Next request should go to network
      const response = await apiService.get('/api/products');
      expect(response.cached).toBe(false);
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
    });
  });

  describe('Offline/Online Transitions', () => {
    it('should detect online/offline transitions', async () => {
      const statusChanges: boolean[] = [];
      
      connectionMonitor.onStatusChange((status) => {
        statusChanges.push(status.online);
      });

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      // Allow events to process
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(statusChanges).toContain(false);
      expect(statusChanges).toContain(true);
    });

    it('should automatically retry when connection is restored', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', { value: false });

      // Mock network error initially
      mockAxiosInstance.request.mockRejectedValue(new Error('Network Error'));

      // Attempt to load products (should fail)
      const loadPromise = apiService.get('/api/products', { retries: 3 });

      // Simulate connection restoration
      setTimeout(() => {
        Object.defineProperty(navigator, 'onLine', { value: true });
        window.dispatchEvent(new Event('online'));
        
        // Mock successful response after connection restoration
        mockAxiosInstance.request.mockResolvedValue({
          data: { products: mockProducts },
          status: 200
        });
      }, 50);

      // Should eventually succeed after connection restoration
      const result = await loadPromise;
      expect(result.success).toBe(true);
    });

    it('should queue requests during offline periods', async () => {
      // Start online
      Object.defineProperty(navigator, 'onLine', { value: true });

      // Mock successful response
      mockAxiosInstance.request.mockResolvedValue({
        data: { products: mockProducts },
        status: 200
      });

      // Make request while online
      const onlineResult = await apiService.get('/api/products');
      expect(onlineResult.success).toBe(true);

      // Go offline
      Object.defineProperty(navigator, 'onLine', { value: false });

      // Mock network error for offline requests
      mockAxiosInstance.request.mockRejectedValue(new Error('Network Error'));

      // Attempt request while offline (should use cache if available)
      const offlineResult = await apiService.get('/api/products', { 
        cacheStrategy: 'cache-first' 
      });
      
      expect(offlineResult.success).toBe(true);
      expect(offlineResult.cached).toBe(true);
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle concurrent product and image loading', async () => {
      // Mock successful responses
      mockAxiosInstance.request.mockResolvedValue({
        data: { products: mockProducts },
        status: 200
      });

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      // Load products and images concurrently
      const [productsResponse, ...imageResults] = await Promise.all([
        apiService.get('/api/products'),
        ...mockProducts.map(product => imageManager.loadImage(product.image))
      ]);

      expect(productsResponse.success).toBe(true);
      imageResults.forEach((result, index) => {
        expect(result.url).toBe(mockProducts[index].image);
      });
    });

    it('should handle large number of concurrent requests', async () => {
      const numberOfRequests = 50;
      const requests = Array.from({ length: numberOfRequests }, (_, i) => 
        `/api/products?page=${i}`
      );

      // Mock successful responses
      mockAxiosInstance.request.mockImplementation((config) => {
        return Promise.resolve({
          data: { products: mockProducts, page: config.url.split('=')[1] },
          status: 200
        });
      });

      // Make concurrent requests
      const results = await Promise.all(
        requests.map(url => apiService.get(url))
      );

      expect(results).toHaveLength(numberOfRequests);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle memory cleanup during stress testing', async () => {
      const numberOfImages = 100;
      const imageUrls = Array.from({ length: numberOfImages }, (_, i) => 
        `https://cdn.example.com/image-${i}.jpg`
      );

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      // Load many images
      const results = await Promise.all(
        imageUrls.map(url => imageManager.loadImage(url))
      );

      expect(results).toHaveLength(numberOfImages);

      // Clear all to test memory cleanup
      imageManager.clearAll();

      // Verify cleanup
      imageUrls.forEach(url => {
        expect(imageManager.getLoadingState(url)).toBeNull();
      });
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from temporary server errors', async () => {
      // Mock temporary server error followed by success
      mockAxiosInstance.request
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValue({
          data: { products: mockProducts },
          status: 200
        });

      const result = await apiService.get('/api/products', { retries: 3 });
      
      expect(result.success).toBe(true);
      expect(result.data.products).toEqual(mockProducts);
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(3);
    });

    it('should handle rate limiting with exponential backoff', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      // Mock setTimeout to capture delays
      global.setTimeout = jest.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0); // Execute immediately for test
      }) as any;

      // Mock rate limiting error followed by success
      mockAxiosInstance.request
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockResolvedValue({
          data: { products: mockProducts },
          status: 200
        });

      const result = await apiService.get('/api/products', { 
        retries: 3,
        baseDelay: 100,
        backoffFactor: 2
      });

      expect(result.success).toBe(true);
      expect(delays).toEqual([100, 200]); // Exponential backoff
      
      global.setTimeout = originalSetTimeout;
    });

    it('should provide graceful degradation with partial data', async () => {
      // Mock API returning partial data
      const partialProducts = mockProducts.slice(0, 2);
      mockAxiosInstance.request.mockResolvedValue({
        data: { products: partialProducts, partial: true },
        status: 200
      });

      const result = await apiService.get('/api/products');
      
      expect(result.success).toBe(true);
      expect(result.data.products).toEqual(partialProducts);
      expect(result.data.partial).toBe(true);
    });
  });

  describe('Cache Strategy Integration', () => {
    it('should implement stale-while-revalidate strategy', async () => {
      // Initial load
      mockAxiosInstance.request.mockResolvedValue({
        data: { products: mockProducts },
        status: 200
      });

      await cacheManager.set('products', mockProducts, { ttl: 50 });

      // Wait for cache to become stale
      await new Promise(resolve => setTimeout(resolve, 75));

      // Mock updated data
      const updatedProducts = [...mockProducts, {
        _id: '4',
        name: 'New Product',
        price: 99.99,
        image: 'https://cdn.example.com/new-product.jpg',
        category: 'new'
      }];

      mockAxiosInstance.request.mockResolvedValue({
        data: { products: updatedProducts },
        status: 200
      });

      // Should return stale data immediately while revalidating
      const result = await cacheManager.staleWhileRevalidate(
        'products',
        () => apiService.get('/api/products').then(r => r.data.products)
      );

      expect(result).toEqual(mockProducts); // Stale data returned immediately

      // Wait for revalidation
      await new Promise(resolve => setTimeout(resolve, 10));

      // Cache should now have fresh data
      const freshResult = await cacheManager.get('products');
      expect(freshResult).toEqual(updatedProducts);
    });
  });
});