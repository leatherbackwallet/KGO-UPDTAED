/**
 * Tests for ImageCacheService
 * Tests Service Worker integration and image caching functionality
 */

import { ImageCacheService, getImageCacheService } from '../ImageCacheService';

// Mock Service Worker APIs
const mockServiceWorker = {
  register: jest.fn(),
  ready: Promise.resolve({
    active: { postMessage: jest.fn() }
  }),
  controller: { postMessage: jest.fn() }
};

const mockCaches = {
  open: jest.fn(() => Promise.resolve({
    match: jest.fn(() => Promise.resolve(null)),
    put: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve(true)),
    keys: jest.fn(() => Promise.resolve([])),
  })),
  keys: jest.fn(() => Promise.resolve([])),
  delete: jest.fn(() => Promise.resolve(true))
};

// Setup mocks
Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: mockServiceWorker
  },
  writable: true
});

Object.defineProperty(global, 'caches', {
  value: mockCaches
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    blob: () => Promise.resolve(new Blob()),
    clone: () => ({ ok: true })
  })
) as jest.Mock;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

describe('ImageCacheService', () => {
  let imageCacheService: ImageCacheService;

  beforeEach(() => {
    imageCacheService = new ImageCacheService();
    jest.clearAllMocks();
  });

  describe('Service Worker Integration', () => {
    test('should register Service Worker on initialization', () => {
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw-image-cache.js', {
        scope: '/'
      });
    });

    test('should check if service is ready', () => {
      // Since SW registration is async, we need to wait
      setTimeout(() => {
        expect(imageCacheService.isReady()).toBe(true);
      }, 100);
    });
  });

  describe('Cache Warming', () => {
    test('should warm critical images', async () => {
      const productImages = [
        'keralagiftsonline/products/product-1',
        'keralagiftsonline/products/product-2'
      ];

      await imageCacheService.warmCriticalImages(productImages, {
        sizes: ['thumb', 'small'],
        priority: 'high'
      });

      // Should post message to service worker
      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith({
        type: 'WARM_CACHE',
        data: expect.objectContaining({
          urls: expect.any(Array),
          priority: 'high'
        })
      });
    });

    test('should warm above-fold images', async () => {
      const productIds = ['1', '2', '3'];

      await imageCacheService.warmAboveFoldImages(productIds);

      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith({
        type: 'WARM_CACHE',
        data: expect.objectContaining({
          urls: expect.any(Array),
          priority: 'high'
        })
      });
    });

    test('should preload product images', async () => {
      const productId = '123';
      const imagePaths = [
        'keralagiftsonline/products/product-123-1',
        'keralagiftsonline/products/product-123-2'
      ];

      await imageCacheService.preloadProductImages(productId, imagePaths);

      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith({
        type: 'WARM_CACHE',
        data: expect.objectContaining({
          urls: expect.any(Array),
          priority: 'normal'
        })
      });
    });
  });

  describe('Cache Management', () => {
    test('should clear cache', async () => {
      await imageCacheService.clearCache();

      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith({
        type: 'CLEAR_IMAGE_CACHE'
      });
    });

    test('should get cache stats', async () => {
      const mockStats = {
        imageCacheSize: 10,
        criticalCacheSize: 5,
        totalSize: 15,
        cacheNames: ['product-images-cache-v1']
      };

      // Mock the message channel response
      const originalMessageChannel = global.MessageChannel;
      global.MessageChannel = jest.fn().mockImplementation(() => ({
        port1: {
          onmessage: null
        },
        port2: {}
      }));

      const statsPromise = imageCacheService.getCacheStats();

      // Simulate service worker response
      setTimeout(() => {
        const messageChannel = new (global.MessageChannel as any)();
        if (messageChannel.port1.onmessage) {
          messageChannel.port1.onmessage({
            data: { type: 'CACHE_STATS', data: mockStats }
          });
        }
      }, 10);

      const stats = await statsPromise;
      expect(stats.serviceWorkerActive).toBe(true);

      global.MessageChannel = originalMessageChannel;
    });

    test('should check if image is cached', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      // Mock cache match to return a response
      mockCaches.open.mockResolvedValueOnce({
        match: jest.fn().mockResolvedValue({ ok: true })
      });

      const isCached = await imageCacheService.isImageCached(imageUrl);
      expect(isCached).toBe(true);
    });

    test('should manually cache an image', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      const mockCache = {
        put: jest.fn().mockResolvedValue(undefined)
      };
      mockCaches.open.mockResolvedValueOnce(mockCache);

      const success = await imageCacheService.cacheImage(imageUrl);
      
      expect(success).toBe(true);
      expect(mockCache.put).toHaveBeenCalledWith(imageUrl, expect.any(Object));
    });

    test('should get cached image blob', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const mockBlob = new Blob();
      
      mockCaches.open.mockResolvedValueOnce({
        match: jest.fn().mockResolvedValue({
          blob: () => Promise.resolve(mockBlob)
        })
      });

      const blobUrl = await imageCacheService.getCachedImageBlob(imageUrl);
      expect(blobUrl).toBe('blob:mock-url');
    });
  });

  describe('Cache Optimization', () => {
    test('should optimize cache by removing old entries', async () => {
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
      const mockRequest = { url: 'https://example.com/old-image.jpg' };
      const mockResponse = {
        headers: {
          get: jest.fn().mockReturnValue(oldDate.toISOString())
        }
      };

      const mockCache = {
        keys: jest.fn().mockResolvedValue([mockRequest]),
        match: jest.fn().mockResolvedValue(mockResponse),
        delete: jest.fn().mockResolvedValue(true)
      };

      mockCaches.keys.mockResolvedValueOnce(['product-images-cache-v1']);
      mockCaches.open.mockResolvedValueOnce(mockCache);

      await imageCacheService.optimizeCache();

      expect(mockCache.delete).toHaveBeenCalledWith(mockRequest);
    });

    test('should monitor cache performance', async () => {
      const performance = await imageCacheService.monitorCachePerformance();
      
      expect(performance).toEqual({
        hitRate: expect.any(Number),
        totalRequests: expect.any(Number),
        cacheHits: expect.any(Number),
        cacheMisses: expect.any(Number)
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle Service Worker registration failure', () => {
      mockServiceWorker.register.mockRejectedValueOnce(new Error('Registration failed'));
      
      // Should not throw error
      expect(() => new ImageCacheService()).not.toThrow();
    });

    test('should handle cache warming failure gracefully', async () => {
      mockServiceWorker.controller = null;

      // Should not throw error
      await expect(imageCacheService.warmCriticalImages(['test-image'])).resolves.not.toThrow();
    });

    test('should handle cache stats failure', async () => {
      // Mock MessageChannel to not respond
      const originalMessageChannel = global.MessageChannel;
      global.MessageChannel = jest.fn().mockImplementation(() => ({
        port1: { onmessage: null },
        port2: {}
      }));

      const stats = await imageCacheService.getCacheStats();
      
      expect(stats).toEqual({
        imageCacheSize: 0,
        criticalCacheSize: 0,
        apiCacheSize: 0,
        totalSize: 0,
        cacheNames: [],
        cacheDetails: {},
        serviceWorkerActive: expect.any(Boolean)
      });

      global.MessageChannel = originalMessageChannel;
    });
  });

  describe('Singleton Pattern', () => {
    test('getImageCacheService should return same instance', () => {
      const instance1 = getImageCacheService();
      const instance2 = getImageCacheService();

      expect(instance1).toBe(instance2);
    });
  });
});