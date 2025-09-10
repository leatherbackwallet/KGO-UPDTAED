/**
 * Tests for CacheManager
 * Comprehensive test suite for multi-level caching functionality
 */

import { CacheManager, getCacheManager } from '../CacheManager';
import { ErrorType } from '../types';

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

// Setup mocks
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'caches', {
  value: cachesMock
});

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Basic Cache Operations', () => {
    test('should set and get values from cache', async () => {
      const key = 'test-key';
      const value = { id: 1, name: 'Test' };

      await cacheManager.set(key, value);
      const result = await cacheManager.get(key);

      expect(result).toEqual(value);
    });

    test('should return null for non-existent keys', async () => {
      const result = await cacheManager.get('non-existent');
      expect(result).toBeNull();
    });

    test('should delete values from cache', async () => {
      const key = 'test-key';
      const value = { id: 1, name: 'Test' };

      await cacheManager.set(key, value);
      await cacheManager.delete(key);
      const result = await cacheManager.get(key);

      expect(result).toBeNull();
    });

    test('should clear all cache levels', async () => {
      await cacheManager.set('key1', 'value1');
      await cacheManager.set('key2', 'value2');

      await cacheManager.clear();

      expect(await cacheManager.get('key1')).toBeNull();
      expect(await cacheManager.get('key2')).toBeNull();
    });
  });

  describe('TTL and Expiration', () => {
    test('should respect TTL and expire entries', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const shortTTL = 10; // 10ms

      await cacheManager.set(key, value, { ttl: shortTTL });

      // Should be available immediately
      expect(await cacheManager.get(key)).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should be expired
      expect(await cacheManager.get(key)).toBeNull();
    });

    test('should allow stale data when allowStale is true', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const shortTTL = 10; // 10ms

      await cacheManager.set(key, value, { ttl: shortTTL });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should return stale data when allowStale is true
      const result = await cacheManager.get(key, { allowStale: true });
      expect(result).toBe(value);
    });

    test('should handle different TTL values correctly', async () => {
      const shortTTL = 50;
      const longTTL = 200;

      await cacheManager.set('short-key', 'short-value', { ttl: shortTTL });
      await cacheManager.set('long-key', 'long-value', { ttl: longTTL });

      // Both should be available initially
      expect(await cacheManager.get('short-key')).toBe('short-value');
      expect(await cacheManager.get('long-key')).toBe('long-value');

      // Wait for short TTL to expire
      await new Promise(resolve => setTimeout(resolve, 75));

      // Short should be expired, long should still be available
      expect(await cacheManager.get('short-key')).toBeNull();
      expect(await cacheManager.get('long-key')).toBe('long-value');

      // Wait for long TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Both should be expired
      expect(await cacheManager.get('short-key')).toBeNull();
      expect(await cacheManager.get('long-key')).toBeNull();
    });

    test('should handle infinite TTL (no expiration)', async () => {
      const key = 'infinite-key';
      const value = 'infinite-value';

      await cacheManager.set(key, value, { ttl: Infinity });

      // Should be available after a long time
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(await cacheManager.get(key)).toBe(value);
    });

    test('should update TTL when setting existing key', async () => {
      const key = 'test-key';
      const value1 = 'value1';
      const value2 = 'value2';

      // Set with short TTL
      await cacheManager.set(key, value1, { ttl: 50 });

      // Update with longer TTL
      await cacheManager.set(key, value2, { ttl: 200 });

      // Wait past original TTL
      await new Promise(resolve => setTimeout(resolve, 75));

      // Should still be available with new value
      expect(await cacheManager.get(key)).toBe(value2);
    });

    test('should handle zero TTL (immediate expiration)', async () => {
      const key = 'zero-ttl-key';
      const value = 'zero-ttl-value';

      await cacheManager.set(key, value, { ttl: 0 });

      // Should be immediately expired
      expect(await cacheManager.get(key)).toBeNull();
    });
  });

  describe('Cache Strategies', () => {
    test('cacheFirst should return cached data if available', async () => {
      const key = 'test-key';
      const cachedValue = 'cached-value';
      const networkValue = 'network-value';

      // Pre-populate cache
      await cacheManager.set(key, cachedValue);

      const networkFn = jest.fn().mockResolvedValue(networkValue);
      const result = await cacheManager.cacheFirst(key, networkFn);

      expect(result).toBe(cachedValue);
      expect(networkFn).not.toHaveBeenCalled();
    });

    test('cacheFirst should fetch from network if cache miss', async () => {
      const key = 'test-key';
      const networkValue = 'network-value';

      const networkFn = jest.fn().mockResolvedValue(networkValue);
      const result = await cacheManager.cacheFirst(key, networkFn);

      expect(result).toBe(networkValue);
      expect(networkFn).toHaveBeenCalled();

      // Should now be cached
      const cachedResult = await cacheManager.get(key);
      expect(cachedResult).toBe(networkValue);
    });

    test('cacheFirst should update cache in background when updateInBackground is true', async () => {
      const key = 'test-key';
      const cachedValue = 'cached-value';
      const networkValue = 'updated-value';

      // Pre-populate cache
      await cacheManager.set(key, cachedValue);

      const networkFn = jest.fn().mockResolvedValue(networkValue);
      const result = await cacheManager.cacheFirst(key, networkFn, { 
        updateInBackground: true 
      });

      expect(result).toBe(cachedValue); // Returns cached value immediately
      expect(networkFn).toHaveBeenCalled(); // But still calls network function

      // Wait for background update
      await new Promise(resolve => setTimeout(resolve, 10));

      // Cache should now have updated value
      const updatedResult = await cacheManager.get(key);
      expect(updatedResult).toBe(networkValue);
    });

    test('networkFirst should try network first', async () => {
      const key = 'test-key';
      const cachedValue = 'cached-value';
      const networkValue = 'network-value';

      // Pre-populate cache
      await cacheManager.set(key, cachedValue);

      const networkFn = jest.fn().mockResolvedValue(networkValue);
      const result = await cacheManager.networkFirst(key, networkFn);

      expect(result).toBe(networkValue);
      expect(networkFn).toHaveBeenCalled();
    });

    test('networkFirst should fallback to cache on network error', async () => {
      const key = 'test-key';
      const cachedValue = 'cached-value';

      // Pre-populate cache
      await cacheManager.set(key, cachedValue);

      const networkFn = jest.fn().mockRejectedValue(new Error('Network error'));
      const result = await cacheManager.networkFirst(key, networkFn);

      expect(result).toBe(cachedValue);
      expect(networkFn).toHaveBeenCalled();
    });

    test('networkFirst should throw error if network fails and no cache', async () => {
      const key = 'non-existent-key';
      const networkFn = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(cacheManager.networkFirst(key, networkFn)).rejects.toThrow('Network error');
    });

    test('cacheOnly should only return cached data', async () => {
      const key = 'test-key';
      const cachedValue = 'cached-value';

      // Pre-populate cache
      await cacheManager.set(key, cachedValue);

      const result = await cacheManager.cacheOnly(key);
      expect(result).toBe(cachedValue);
    });

    test('cacheOnly should throw error if no cached data', async () => {
      const key = 'non-existent-key';

      await expect(cacheManager.cacheOnly(key)).rejects.toMatchObject({
        type: ErrorType.CACHE_ERROR,
        message: 'Cache-only strategy failed: No cached data found'
      });
    });

    test('networkOnly should always fetch from network', async () => {
      const key = 'test-key';
      const cachedValue = 'cached-value';
      const networkValue = 'network-value';

      // Pre-populate cache
      await cacheManager.set(key, cachedValue);

      const networkFn = jest.fn().mockResolvedValue(networkValue);
      const result = await cacheManager.networkOnly(key, networkFn);

      expect(result).toBe(networkValue);
      expect(networkFn).toHaveBeenCalled();

      // Cache should be updated with new value
      const updatedCache = await cacheManager.get(key);
      expect(updatedCache).toBe(networkValue);
    });

    test('staleWhileRevalidate should return stale data while updating', async () => {
      const key = 'test-key';
      const staleValue = 'stale-value';
      const freshValue = 'fresh-value';

      // Pre-populate cache with expired data
      await cacheManager.set(key, staleValue, { ttl: 10 });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      const networkFn = jest.fn().mockResolvedValue(freshValue);
      const result = await cacheManager.staleWhileRevalidate(key, networkFn);

      expect(result).toBe(staleValue); // Returns stale data immediately
      expect(networkFn).toHaveBeenCalled(); // But triggers revalidation

      // Wait for revalidation
      await new Promise(resolve => setTimeout(resolve, 10));

      // Cache should now have fresh value
      const updatedResult = await cacheManager.get(key);
      expect(updatedResult).toBe(freshValue);
    });
  });

  describe('Cache Invalidation', () => {
    test('should invalidate entries by pattern', async () => {
      await cacheManager.set('user:1', { id: 1, name: 'User 1' });
      await cacheManager.set('user:2', { id: 2, name: 'User 2' });
      await cacheManager.set('product:1', { id: 1, name: 'Product 1' });

      await cacheManager.invalidate('user:.*');

      expect(await cacheManager.get('user:1')).toBeNull();
      expect(await cacheManager.get('user:2')).toBeNull();
      expect(await cacheManager.get('product:1')).not.toBeNull();
    });
  });

  describe('Cache Statistics', () => {
    test('should track cache hits and misses', async () => {
      const key = 'test-key';
      const value = 'test-value';

      // Initial stats
      let stats = cacheManager.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);

      // Cache miss
      await cacheManager.get(key);
      stats = cacheManager.getStats();
      expect(stats.misses).toBe(1);

      // Set value
      await cacheManager.set(key, value);

      // Cache hit
      await cacheManager.get(key);
      stats = cacheManager.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.hitRate).toBe(0.5); // 1 hit out of 2 total requests
    });

    test('should calculate hit rate correctly', async () => {
      await cacheManager.set('key1', 'value1');
      await cacheManager.set('key2', 'value2');

      // 2 hits
      await cacheManager.get('key1');
      await cacheManager.get('key2');

      // 1 miss
      await cacheManager.get('key3');

      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(2/3);
    });
  });

  describe('Priority and Tags', () => {
    test('should set entries with priority and tags', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const options = {
        priority: 'high' as const,
        tags: ['user', 'profile']
      };

      await cacheManager.set(key, value, options);
      const result = await cacheManager.get(key);

      expect(result).toBe(value);
    });
  });

  describe('Error Handling', () => {
    test('should handle localStorage quota exceeded error', async () => {
      // Mock localStorage to throw quota exceeded error
      localStorageMock.setItem.mockImplementationOnce(() => {
        const error = new Error('Quota exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      });

      // Should not throw error
      await expect(cacheManager.set('test-key', 'test-value')).resolves.not.toThrow();
    });

    test('should handle Service Worker cache errors gracefully', async () => {
      // Mock caches.open to throw error
      cachesMock.open.mockRejectedValueOnce(new Error('Cache error'));

      // Should not throw error
      await expect(cacheManager.set('test-key', 'test-value')).resolves.not.toThrow();
    });
  });

  describe('Singleton Pattern', () => {
    test('getCacheManager should return same instance', () => {
      const instance1 = getCacheManager();
      const instance2 = getCacheManager();

      expect(instance1).toBe(instance2);
    });
  });
});