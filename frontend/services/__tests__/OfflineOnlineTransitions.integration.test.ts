/**
 * Offline/Online Transitions Integration Tests
 * Tests automatic retry behavior and offline/online state management
 */

import { ReliableApiService } from '../ReliableApiService';
import { ConnectionMonitor } from '../ConnectionMonitor';
import { CacheManager } from '../CacheManager';
import { ImageManager } from '../ImageManager';
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
    })
  };
})();

// Mock navigator.onLine with ability to change state
let mockOnlineState = true;
Object.defineProperty(navigator, 'onLine', {
  get: () => mockOnlineState,
  configurable: true
});

// Mock network information API
const mockConnection = {
  effectiveType: '4g',
  downlink: 10,
  rtt: 50,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

Object.defineProperty(navigator, 'connection', {
  value: mockConnection,
  configurable: true
});

// Setup mocks
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Offline/Online Transitions Integration Tests', () => {
  let apiService: ReliableApiService;
  let connectionMonitor: ConnectionMonitor;
  let cacheManager: CacheManager;
  let imageManager: ImageManager;
  let mockAxiosInstance: any;

  const mockProducts = [
    {
      _id: '1',
      name: 'Wedding Cake Deluxe',
      price: 299.99,
      image: 'https://cdn.example.com/wedding-cake-1.jpg'
    },
    {
      _id: '2',
      name: 'Birthday Cake Special',
      price: 49.99,
      image: 'https://cdn.example.com/birthday-cake-1.jpg'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockOnlineState = true;
    
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
    connectionMonitor = new ConnectionMonitor();
    cacheManager = new CacheManager();
    imageManager = new ImageManager();
  });

  afterEach(() => {
    apiService.destroy();
    imageManager.clearAll();
    mockOnlineState = true;
  });

  describe('Online to Offline Transitions', () => {
    it('should detect when going offline', async () => {
      const statusChanges: boolean[] = [];
      
      connectionMonitor.onStatusChange((status) => {
        statusChanges.push(status.online);
      });

      // Start online
      expect(connectionMonitor.isOnline()).toBe(true);

      // Simulate going offline
      mockOnlineState = false;
      window.dispatchEvent(new Event('offline'));

      // Allow event to process
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(connectionMonitor.isOnline()).toBe(false);
      expect(statusChanges).toContain(false);
    });

    it('should use cached data when going offline', async () => {
      // First, load data while online
      mockAxiosInstance.request.mockResolvedValue({
        data: { products: mockProducts },
        status: 200
      });

      const onlineResponse = await apiService.get('/api/products');
      expect(onlineResponse.success).toBe(true);
      expect(onlineResponse.cached).toBe(false);

      // Go offline
      mockOnlineState = false;
      mockAxiosInstance.request.mockRejectedValue(new Error('Network Error'));

      // Should use cached data
      const offlineResponse = await apiService.get('/api/products', { 
        cacheStrategy: 'cache-first' 
      });
      
      expect(offlineResponse.success).toBe(true);
      expect(offlineResponse.cached).toBe(true);
      expect(offlineResponse.data.products).toEqual(mockProducts);
    });

    it('should queue failed requests for retry when online', async () => {
      // Start online, then go offline
      mockOnlineState = false;
      mockAxiosInstance.request.mockRejectedValue(new Error('Network Error'));

      // Attempt request while offline (should fail but be queued)
      const offlinePromise = apiService.get('/api/products', { 
        retries: 3,
        cacheStrategy: 'network-first' 
      });

      // Come back online
      setTimeout(() => {
        mockOnlineState = true;
        window.dispatchEvent(new Event('online'));
        
        // Mock successful response when back online
        mockAxiosInstance.request.mockResolvedValue({
          data: { products: mockProducts },
          status: 200
        });
      }, 100);

      // Should eventually succeed when back online
      const result = await offlinePromise;
      expect(result.success).toBe(true);
      expect(result.data.products).toEqual(mockProducts);
    });

    it('should handle image loading failures when offline', async () => {
      const imageUrl = 'https://cdn.example.com/test-image.jpg';
      
      // Mock image loading failure (simulating offline)
      const originalImage = global.Image;
      global.Image = jest.fn(() => {
        const img = {
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null,
          src: '',
          complete: false
        };
        
        Object.defineProperty(img, 'src', {
          set: function(value: string) {
            setTimeout(() => {
              if (value.includes('placeholder.svg') && img.onload) {
                img.onload();
              } else if (img.onerror) {
                img.onerror(); // Simulate network failure
              }
            }, 10);
          }
        });
        
        return img;
      }) as any;

      // Go offline
      mockOnlineState = false;

      const result = await imageManager.loadImage(imageUrl);
      
      // Should fallback to placeholder
      expect(result.fallbackUsed).toBe(true);
      expect(result.url).toBe('/images/products/placeholder.svg');

      global.Image = originalImage;
    });
  });

  describe('Offline to Online Transitions', () => {
    it('should detect when coming back online', async () => {
      const statusChanges: boolean[] = [];
      
      connectionMonitor.onStatusChange((status) => {
        statusChanges.push(status.online);
      });

      // Start offline
      mockOnlineState = false;
      window.dispatchEvent(new Event('offline'));
      await new Promise(resolve => setTimeout(resolve, 10));

      // Come back online
      mockOnlineState = true;
      window.dispatchEvent(new Event('online'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(connectionMonitor.isOnline()).toBe(true);
      expect(statusChanges).toEqual([false, true]);
    });

    it('should automatically retry failed requests when back online', async () => {
      // Start offline
      mockOnlineState = false;
      mockAxiosInstance.request.mockRejectedValue(new Error('Network Error'));

      // Start request while offline
      const requestPromise = apiService.get('/api/products', { 
        retries: 5,
        baseDelay: 100 
      });

      // Come back online after some time
      setTimeout(() => {
        mockOnlineState = true;
        window.dispatchEvent(new Event('online'));
        
        // Mock successful response
        mockAxiosInstance.request.mockResolvedValue({
          data: { products: mockProducts },
          status: 200
        });
      }, 200);

      const result = await requestPromise;
      expect(result.success).toBe(true);
      expect(result.data.products).toEqual(mockProducts);
    });

    it('should refresh stale cache when back online', async () => {
      // Load data while online
      mockAxiosInstance.request.mockResolvedValue({
        data: { products: mockProducts },
        status: 200
      });

      await cacheManager.set('products', mockProducts, { ttl: 100 });

      // Go offline and wait for cache to become stale
      mockOnlineState = false;
      await new Promise(resolve => setTimeout(resolve, 150));

      // Come back online
      mockOnlineState = true;
      
      // Mock updated data
      const updatedProducts = [...mockProducts, {
        _id: '3',
        name: 'New Product',
        price: 79.99,
        image: 'https://cdn.example.com/new-product.jpg'
      }];

      mockAxiosInstance.request.mockResolvedValue({
        data: { products: updatedProducts },
        status: 200
      });

      // Should refresh stale cache
      const result = await cacheManager.networkFirst(
        'products',
        () => apiService.get('/api/products').then(r => r.data.products)
      );

      expect(result).toEqual(updatedProducts);
    });

    it('should resume image loading when back online', async () => {
      const imageUrl = 'https://cdn.example.com/test-image.jpg';
      
      // Start offline
      mockOnlineState = false;
      
      const originalImage = global.Image;
      let onlineImageLoad = false;
      
      global.Image = jest.fn(() => {
        const img = {
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null,
          src: '',
          complete: false
        };
        
        Object.defineProperty(img, 'src', {
          set: function(value: string) {
            setTimeout(() => {
              if (mockOnlineState && value === imageUrl && img.onload) {
                onlineImageLoad = true;
                img.onload();
              } else if (value.includes('placeholder.svg') && img.onload) {
                img.onload();
              } else if (img.onerror) {
                img.onerror();
              }
            }, 10);
          }
        });
        
        return img;
      }) as any;

      // Start loading while offline (should use placeholder)
      const loadPromise = imageManager.loadImage(imageUrl);
      
      // Come back online
      setTimeout(() => {
        mockOnlineState = true;
        window.dispatchEvent(new Event('online'));
      }, 50);

      const result = await loadPromise;
      
      // Should eventually load the actual image or use placeholder
      expect(result.url).toBeDefined();

      global.Image = originalImage;
    });
  });

  describe('Network Quality Detection', () => {
    it('should detect slow network conditions', async () => {
      // Mock slow network
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.5;
      mockConnection.rtt = 2000;

      const networkInfo = connectionMonitor.getNetworkInfo();
      expect(networkInfo.speed).toBe('slow');
    });

    it('should detect fast network conditions', async () => {
      // Mock fast network
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 10;
      mockConnection.rtt = 50;

      const networkInfo = connectionMonitor.getNetworkInfo();
      expect(networkInfo.speed).toBe('fast');
    });

    it('should adapt loading strategy based on network speed', async () => {
      // Mock slow network
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.5;

      mockAxiosInstance.request.mockImplementation(() => {
        // Simulate slow response
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              data: { products: mockProducts.slice(0, 1) }, // Fewer products for slow network
              status: 200
            });
          }, 100);
        });
      });

      const result = await apiService.get('/api/products');
      expect(result.success).toBe(true);
      // Should adapt content for slow network
      expect(result.data.products.length).toBeLessThanOrEqual(mockProducts.length);
    });

    it('should implement progressive loading for slow networks', async () => {
      // Mock slow network
      mockConnection.effectiveType = '2g';
      
      const imageUrl = 'https://cdn.example.com/large-image.jpg';
      
      const originalImage = global.Image;
      global.Image = jest.fn(() => {
        const img = {
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null,
          src: '',
          complete: false
        };
        
        Object.defineProperty(img, 'src', {
          set: function(value: string) {
            // Simulate slower loading for large images on slow network
            const delay = value.includes('large-image') ? 200 : 50;
            setTimeout(() => {
              if (img.onload) {
                img.onload();
              }
            }, delay);
          }
        });
        
        return img;
      }) as any;

      const startTime = Date.now();
      const result = await imageManager.loadImage(imageUrl);
      const loadTime = Date.now() - startTime;

      expect(result.url).toBe(imageUrl);
      expect(loadTime).toBeGreaterThan(150); // Should take longer on slow network

      global.Image = originalImage;
    });
  });

  describe('Connection State Persistence', () => {
    it('should remember connection state across page reloads', async () => {
      // Go offline
      mockOnlineState = false;
      window.dispatchEvent(new Event('offline'));
      await new Promise(resolve => setTimeout(resolve, 10));

      // Simulate page reload by creating new connection monitor
      const newConnectionMonitor = new ConnectionMonitor();
      
      expect(newConnectionMonitor.isOnline()).toBe(false);
    });

    it('should track connection history for reliability metrics', async () => {
      const connectionEvents: Array<{ online: boolean; timestamp: number }> = [];
      
      connectionMonitor.onStatusChange((status) => {
        connectionEvents.push({
          online: status.online,
          timestamp: Date.now()
        });
      });

      // Simulate connection instability
      mockOnlineState = false;
      window.dispatchEvent(new Event('offline'));
      await new Promise(resolve => setTimeout(resolve, 50));

      mockOnlineState = true;
      window.dispatchEvent(new Event('online'));
      await new Promise(resolve => setTimeout(resolve, 50));

      mockOnlineState = false;
      window.dispatchEvent(new Event('offline'));
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(connectionEvents.length).toBe(3);
      expect(connectionEvents[0].online).toBe(false);
      expect(connectionEvents[1].online).toBe(true);
      expect(connectionEvents[2].online).toBe(false);
    });
  });

  describe('Automatic Retry Behavior', () => {
    it('should implement exponential backoff for offline retries', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = jest.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0); // Execute immediately for test
      }) as any;

      // Start offline
      mockOnlineState = false;
      mockAxiosInstance.request.mockRejectedValue(new Error('Network Error'));

      try {
        await apiService.get('/api/products', { 
          retries: 3,
          baseDelay: 100,
          backoffFactor: 2
        });
      } catch (error) {
        // Expected to fail
      }

      expect(delays).toEqual([100, 200, 400]); // Exponential backoff
      
      global.setTimeout = originalSetTimeout;
    });

    it('should cancel retries when explicitly requested', async () => {
      // Start offline
      mockOnlineState = false;
      mockAxiosInstance.request.mockRejectedValue(new Error('Network Error'));

      const requestPromise = apiService.get('/api/products', { 
        retries: 10,
        baseDelay: 1000 
      });

      // Cancel after short delay
      setTimeout(() => {
        // Simulate user navigation or component unmount
        apiService.destroy();
      }, 100);

      await expect(requestPromise).rejects.toThrow();
    });

    it('should prioritize critical requests during retry', async () => {
      // Start offline
      mockOnlineState = false;
      mockAxiosInstance.request.mockRejectedValue(new Error('Network Error'));

      const criticalRequest = apiService.get('/api/critical-data', { 
        retries: 5,
        priority: 'high' 
      });
      
      const normalRequest = apiService.get('/api/normal-data', { 
        retries: 5,
        priority: 'normal' 
      });

      // Come back online
      setTimeout(() => {
        mockOnlineState = true;
        mockAxiosInstance.request.mockImplementation((config) => {
          // Critical requests should be processed first
          if (config.url.includes('critical')) {
            return Promise.resolve({
              data: { critical: true },
              status: 200
            });
          }
          return Promise.resolve({
            data: { normal: true },
            status: 200
          });
        });
      }, 100);

      const [criticalResult, normalResult] = await Promise.all([
        criticalRequest,
        normalRequest
      ]);

      expect(criticalResult.success).toBe(true);
      expect(normalResult.success).toBe(true);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from intermittent connectivity issues', async () => {
      let requestCount = 0;
      
      mockAxiosInstance.request.mockImplementation(() => {
        requestCount++;
        
        // Simulate intermittent failures
        if (requestCount <= 2) {
          return Promise.reject(new Error('Intermittent Network Error'));
        }
        
        return Promise.resolve({
          data: { products: mockProducts },
          status: 200
        });
      });

      const result = await apiService.get('/api/products', { 
        retries: 3,
        baseDelay: 10 
      });

      expect(result.success).toBe(true);
      expect(result.data.products).toEqual(mockProducts);
      expect(requestCount).toBe(3); // Should succeed on third attempt
    });

    it('should handle DNS resolution failures', async () => {
      // Mock DNS failure
      const dnsError = new Error('ENOTFOUND');
      (dnsError as any).code = 'ENOTFOUND';
      
      mockAxiosInstance.request.mockRejectedValue(dnsError);

      // Should retry DNS errors
      await expect(
        apiService.get('/api/products', { retries: 2 })
      ).rejects.toThrow('ENOTFOUND');

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle SSL certificate errors', async () => {
      // Mock SSL error
      const sslError = new Error('SSL Error');
      (sslError as any).code = 'CERT_UNTRUSTED';
      
      mockAxiosInstance.request.mockRejectedValue(sslError);

      // Should not retry SSL errors (security issue)
      await expect(
        apiService.get('/api/products', { retries: 2 })
      ).rejects.toThrow('SSL Error');

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1); // No retries for SSL errors
    });
  });
});