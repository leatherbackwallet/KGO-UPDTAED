/**
 * Cache Persistence Integration Tests
 * Tests cache behavior across browser sessions and page reloads
 */

import { CacheManager } from '../CacheManager';
import { ReliableApiService } from '../ReliableApiService';
import { ImageCacheService } from '../ImageCacheService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage with persistence simulation
const createMockLocalStorage = () => {
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
    },
    // Test helper to simulate persistence
    _getStore: () => ({ ...store }),
    _setStore: (newStore: Record<string, string>) => {
      store = { ...newStore };
    }
  };
};

// Mock IndexedDB for Service Worker cache
const mockIndexedDB = {
  databases: new Map(),
  open: jest.fn((name: string) => {
    if (!mockIndexedDB.databases.has(name)) {
      mockIndexedDB.databases.set(name, new Map());
    }
    return Promise.resolve({
      objectStoreNames: ['cache'],
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          get: jest.fn((key: string) => ({
            onsuccess: null,
            result: mockIndexedDB.databases.get(name)?.get(key) || null
          })),
          put: jest.fn((value: any, key: string) => {
            mockIndexedDB.databases.get(name)?.set(key, value);
            return { onsuccess: null };
          }),
          delete: jest.fn((key: string) => {
            mockIndexedDB.databases.get(name)?.delete(key);
            return { onsuccess: null };
          })
        }))
      }))
    });
  })
};

// Mock caches API with persistence
const createMockCaches = () => {
  const cacheStorage = new Map<string, Map<string, any>>();
  
  return {
    open: jest.fn((cacheName: string) => {
      if (!cacheStorage.has(cacheName)) {
        cacheStorage.set(cacheName, new Map());
      }
      
      const cache = cacheStorage.get(cacheName)!;
      
      return Promise.resolve({
        match: jest.fn((request: string) => {
          const response = cache.get(request);
          return Promise.resolve(response || null);
        }),
        put: jest.fn((request: string, response: any) => {
          cache.set(request, response);
          return Promise.resolve();
        }),
        delete: jest.fn((request: string) => {
          const existed = cache.has(request);
          cache.delete(request);
          return Promise.resolve(existed);
        }),
        keys: jest.fn(() => {
          return Promise.resolve(Array.from(cache.keys()));
        })
      });
    }),
    delete: jest.fn((cacheName: string) => {
      const existed = cacheStorage.has(cacheName);
      cacheStorage.delete(cacheName);
      return Promise.resolve(existed);
    }),
    keys: jest.fn(() => {
      return Promise.resolve(Array.from(cacheStorage.keys()));
    }),
    // Test helper
    _getCacheStorage: () => cacheStorage
  };
};

describe('Cache Persistence Integration Tests', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;
  let mockCaches: ReturnType<typeof createMockCaches>;
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
    
    // Setup fresh mock storage
    mockLocalStorage = createMockLocalStorage();
    mockCaches = createMockCaches();
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      configurable: true
    });
    
    Object.defineProperty(window, 'caches', {
      value: mockCaches,
      configurable: true
    });

    Object.defineProperty(window, 'indexedDB', {
      value: mockIndexedDB,
      configurable: true
    });

    // Setup axios mock
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
  });

  describe('LocalStorage Cache Persistence', () => {
    it('should persist API cache data across browser sessions', async () => {
      // Session 1: Load and cache data
      const apiService1 = new ReliableApiService('http://localhost:3001');
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { products: mockProducts },
        status: 200
      });

      await apiService1.get('/api/products');
      
      // Simulate browser session end
      const persistedStore = mockLocalStorage._getStore();
      apiService1.destroy();

      // Session 2: New browser session with persisted storage
      mockLocalStorage._setStore(persistedStore);
      const apiService2 = new ReliableApiService('http://localhost:3001');

      // Should load from cache without network request
      const cachedResponse = await apiService2.get('/api/products', { 
        cacheStrategy: 'cache-first' 
      });

      expect(cachedResponse.success).toBe(true);
      expect(cachedResponse.cached).toBe(true);
      expect(cachedResponse.data.products).toEqual(mockProducts);
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1); // Only from first session

      apiService2.destroy();
    });

    it('should handle cache expiration across sessions', async () => {
      const cacheManager = new CacheManager();
      
      // Set data with short TTL
      await cacheManager.set('test-key', 'test-value', { ttl: 100 });
      
      // Verify data is cached
      expect(await cacheManager.get('test-key')).toBe('test-value');
      
      // Simulate session restart after TTL expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Create new cache manager instance (simulating new session)
      const newCacheManager = new CacheManager();
      
      // Data should be expired
      expect(await newCacheManager.get('test-key')).toBeNull();
    });

    it('should maintain cache statistics across sessions', async () => {
      const cacheManager1 = new CacheManager();
      
      // Generate some cache activity
      await cacheManager1.set('key1', 'value1');
      await cacheManager1.get('key1'); // Hit
      await cacheManager1.get('key2'); // Miss
      
      const stats1 = cacheManager1.getStats();
      expect(stats1.hits).toBe(1);
      expect(stats1.misses).toBe(1);
      
      // Simulate session restart
      const persistedStore = mockLocalStorage._getStore();
      mockLocalStorage._setStore(persistedStore);
      
      const cacheManager2 = new CacheManager();
      
      // Continue activity in new session
      await cacheManager2.get('key1'); // Hit
      await cacheManager2.get('key3'); // Miss
      
      const stats2 = cacheManager2.getStats();
      expect(stats2.hits).toBe(2); // Accumulated across sessions
      expect(stats2.misses).toBe(2);
    });
  });

  describe('Service Worker Cache Persistence', () => {
    it('should persist image cache across page reloads', async () => {
      const imageCacheService = new ImageCacheService();
      const imageUrl = 'https://cdn.example.com/test-image.jpg';
      const imageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      
      // Cache image in first session
      await imageCacheService.cacheImage(imageUrl, imageBlob);
      
      // Verify image is cached
      const cachedBlob = await imageCacheService.getCachedImageBlob(imageUrl);
      expect(cachedBlob).toBeTruthy();
      
      // Simulate page reload by creating new service instance
      const newImageCacheService = new ImageCacheService();
      
      // Should still have cached image
      const persistedBlob = await newImageCacheService.getCachedImageBlob(imageUrl);
      expect(persistedBlob).toBeTruthy();
    });

    it('should handle cache size limits and LRU eviction', async () => {
      const imageCacheService = new ImageCacheService();
      const maxCacheSize = 5; // Simulate small cache for testing
      
      // Fill cache beyond limit
      const imageUrls = Array.from({ length: maxCacheSize + 2 }, (_, i) => 
        `https://cdn.example.com/image-${i}.jpg`
      );
      
      const imageBlobs = imageUrls.map((_, i) => 
        new Blob([`fake-image-data-${i}`], { type: 'image/jpeg' })
      );
      
      // Cache all images
      for (let i = 0; i < imageUrls.length; i++) {
        await imageCacheService.cacheImage(imageUrls[i], imageBlobs[i]);
      }
      
      // First images should be evicted due to LRU policy
      const firstImageCached = await imageCacheService.getCachedImageBlob(imageUrls[0]);
      const lastImageCached = await imageCacheService.getCachedImageBlob(imageUrls[imageUrls.length - 1]);
      
      expect(firstImageCached).toBeNull(); // Evicted
      expect(lastImageCached).toBeTruthy(); // Still cached
    });

    it('should warm cache for above-fold images', async () => {
      const imageCacheService = new ImageCacheService();
      const productIds = ['1', '2', '3'];
      
      // Mock image URLs for products
      const mockGetProductImage = jest.fn((productId: string) => 
        `https://cdn.example.com/product-${productId}.jpg`
      );
      
      // Mock successful image fetching
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['fake-image'], { type: 'image/jpeg' }))
        } as Response)
      );
      
      await imageCacheService.warmAboveFoldImages(productIds);
      
      // Verify images were cached
      for (const productId of productIds) {
        const imageUrl = `https://cdn.example.com/product-${productId}.jpg`;
        const cachedBlob = await imageCacheService.getCachedImageBlob(imageUrl);
        expect(cachedBlob).toBeTruthy();
      }
      
      expect(global.fetch).toHaveBeenCalledTimes(productIds.length);
    });
  });

  describe('Cross-Tab Cache Synchronization', () => {
    it('should synchronize cache updates across tabs', async () => {
      const cacheManager1 = new CacheManager(); // Tab 1
      const cacheManager2 = new CacheManager(); // Tab 2
      
      // Set data in tab 1
      await cacheManager1.set('shared-key', 'tab1-value');
      
      // Simulate storage event (cross-tab communication)
      const storageEvent = new StorageEvent('storage', {
        key: 'cache:shared-key',
        newValue: JSON.stringify({
          data: 'tab1-value',
          timestamp: Date.now(),
          ttl: Infinity
        }),
        storageArea: localStorage
      });
      
      window.dispatchEvent(storageEvent);
      
      // Tab 2 should see the updated value
      const valueInTab2 = await cacheManager2.get('shared-key');
      expect(valueInTab2).toBe('tab1-value');
    });

    it('should handle cache invalidation across tabs', async () => {
      const cacheManager1 = new CacheManager();
      const cacheManager2 = new CacheManager();
      
      // Set data in both tabs
      await cacheManager1.set('shared-key', 'shared-value');
      await cacheManager2.set('shared-key', 'shared-value');
      
      // Invalidate in tab 1
      await cacheManager1.delete('shared-key');
      
      // Simulate storage event for deletion
      const storageEvent = new StorageEvent('storage', {
        key: 'cache:shared-key',
        newValue: null,
        oldValue: JSON.stringify({
          data: 'shared-value',
          timestamp: Date.now(),
          ttl: Infinity
        }),
        storageArea: localStorage
      });
      
      window.dispatchEvent(storageEvent);
      
      // Tab 2 should also see the deletion
      const valueInTab2 = await cacheManager2.get('shared-key');
      expect(valueInTab2).toBeNull();
    });
  });

  describe('Cache Migration and Versioning', () => {
    it('should handle cache format migration', async () => {
      // Simulate old cache format in localStorage
      const oldCacheData = {
        'cache:products': JSON.stringify({
          data: mockProducts,
          timestamp: Date.now() - 1000,
          // Missing TTL field (old format)
        })
      };
      
      mockLocalStorage._setStore(oldCacheData);
      
      const cacheManager = new CacheManager();
      
      // Should handle old format gracefully
      const products = await cacheManager.get('products');
      expect(products).toEqual(mockProducts);
      
      // Should migrate to new format on next write
      await cacheManager.set('products', mockProducts, { ttl: 3600000 });
      
      const migratedData = JSON.parse(mockLocalStorage.getItem('cache:products') || '{}');
      expect(migratedData.ttl).toBeDefined();
    });

    it('should clear incompatible cache versions', async () => {
      // Simulate incompatible cache version
      const incompatibleData = {
        'cache:version': '1.0.0', // Old version
        'cache:products': 'incompatible-format'
      };
      
      mockLocalStorage._setStore(incompatibleData);
      
      const cacheManager = new CacheManager();
      
      // Should clear incompatible cache
      const products = await cacheManager.get('products');
      expect(products).toBeNull();
      
      // Should set new version
      const version = mockLocalStorage.getItem('cache:version');
      expect(version).not.toBe('1.0.0');
    });
  });

  describe('Cache Performance Under Load', () => {
    it('should maintain performance with large cache sizes', async () => {
      const cacheManager = new CacheManager();
      const numberOfEntries = 1000;
      
      // Fill cache with many entries
      const startTime = Date.now();
      
      for (let i = 0; i < numberOfEntries; i++) {
        await cacheManager.set(`key-${i}`, `value-${i}`);
      }
      
      const writeTime = Date.now() - startTime;
      
      // Read all entries
      const readStartTime = Date.now();
      
      for (let i = 0; i < numberOfEntries; i++) {
        await cacheManager.get(`key-${i}`);
      }
      
      const readTime = Date.now() - readStartTime;
      
      // Performance should be reasonable (adjust thresholds as needed)
      expect(writeTime).toBeLessThan(5000); // 5 seconds for 1000 writes
      expect(readTime).toBeLessThan(2000);  // 2 seconds for 1000 reads
    });

    it('should handle concurrent cache operations', async () => {
      const cacheManager = new CacheManager();
      const numberOfOperations = 100;
      
      // Perform concurrent read/write operations
      const operations = Array.from({ length: numberOfOperations }, (_, i) => {
        if (i % 2 === 0) {
          return cacheManager.set(`concurrent-key-${i}`, `value-${i}`);
        } else {
          return cacheManager.get(`concurrent-key-${i - 1}`);
        }
      });
      
      const results = await Promise.allSettled(operations);
      
      // All operations should complete successfully
      const failures = results.filter(result => result.status === 'rejected');
      expect(failures).toHaveLength(0);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from localStorage quota exceeded errors', async () => {
      const cacheManager = new CacheManager();
      
      // Mock localStorage quota exceeded error
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });
      
      // Should handle error gracefully and continue operation
      await expect(cacheManager.set('test-key', 'test-value')).resolves.not.toThrow();
      
      // Subsequent operations should work
      mockLocalStorage.setItem.mockRestore();
      await cacheManager.set('test-key-2', 'test-value-2');
      
      const value = await cacheManager.get('test-key-2');
      expect(value).toBe('test-value-2');
    });

    it('should handle corrupted cache data', async () => {
      // Simulate corrupted cache data
      mockLocalStorage._setStore({
        'cache:corrupted-key': 'invalid-json-data'
      });
      
      const cacheManager = new CacheManager();
      
      // Should handle corrupted data gracefully
      const value = await cacheManager.get('corrupted-key');
      expect(value).toBeNull();
      
      // Should be able to set new data
      await cacheManager.set('corrupted-key', 'new-value');
      const newValue = await cacheManager.get('corrupted-key');
      expect(newValue).toBe('new-value');
    });

    it('should handle Service Worker cache failures', async () => {
      const imageCacheService = new ImageCacheService();
      
      // Mock Service Worker cache failure
      mockCaches.open.mockRejectedValueOnce(new Error('Cache API not available'));
      
      // Should handle gracefully
      await expect(
        imageCacheService.cacheImage('https://example.com/image.jpg', new Blob())
      ).resolves.not.toThrow();
    });
  });
});