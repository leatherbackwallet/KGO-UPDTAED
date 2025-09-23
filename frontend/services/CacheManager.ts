/**
 * Multi-Level Cache Manager
 * Implements a comprehensive caching system with memory, localStorage, and Service Worker caches
 * Supports TTL management, LRU eviction, and multiple cache strategies
 */

import { CacheStats, ErrorType, ApiError } from './types';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  priority: 'high' | 'normal' | 'low';
  accessCount: number;
  lastAccessed: Date;
}

export interface CacheGetOptions {
  allowStale?: boolean;
  updateInBackground?: boolean;
}

export interface CacheSetOptions {
  ttl?: number;
  priority?: 'high' | 'normal' | 'low';
  tags?: string[];
}

export type CacheStrategy = 'cache-first' | 'network-first' | 'cache-only';

interface CacheLevel {
  name: string;
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

/**
 * Memory Cache Level (L1 - Fastest)
 */
class MemoryCache implements CacheLevel {
  name = 'memory';
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key);
    if (entry) {
      entry.accessCount++;
      entry.lastAccessed = new Date();
      return entry;
    }
    return null;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed.getTime() < oldestTime) {
        oldestTime = entry.lastAccessed.getTime();
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

/**
 * LocalStorage Cache Level (L2 - Persistent)
 */
class LocalStorageCache implements CacheLevel {
  name = 'localStorage';
  private prefix: string;

  constructor(prefix: string = 'cache_') {
    this.prefix = prefix;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (item) {
        const entry = JSON.parse(item);
        entry.lastAccessed = new Date(entry.lastAccessed);
        entry.accessCount++;
        
        // Update access info
        await this.set(key, entry);
        return entry;
      }
    } catch (error) {
      console.warn('LocalStorage cache get error:', error);
    }
    return null;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      console.warn('LocalStorage cache set error:', error);
      // Handle quota exceeded by clearing old entries
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        await this.clearOldEntries();
        try {
          localStorage.setItem(this.prefix + key, JSON.stringify(entry));
        } catch (retryError) {
          console.error('Failed to set cache after cleanup:', retryError);
        }
      }
    }
  }

  async delete(key: string): Promise<void> {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.prefix + key);
    }
  }

  async clear(): Promise<void> {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const keys = await this.keys();
      keys.forEach(key => localStorage.removeItem(this.prefix + key));
    }
  }

  async keys(): Promise<string[]> {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }

  private async clearOldEntries(): Promise<void> {
    const keys = await this.keys();
    const entries: Array<{ key: string; lastAccessed: Date }> = [];

    for (const key of keys) {
      const entry = await this.get(key);
      if (entry) {
        entries.push({ key, lastAccessed: entry.lastAccessed });
      }
    }

    // Sort by last accessed and remove oldest 25%
    entries.sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
    const toRemove = Math.ceil(entries.length * 0.25);
    
    for (let i = 0; i < toRemove; i++) {
      await this.delete(entries[i].key);
    }
  }
}

/**
 * Service Worker Cache Level (L3 - Network Independent)
 */
class ServiceWorkerCache implements CacheLevel {
  name = 'serviceWorker';
  private cacheName: string;

  constructor(cacheName: string = 'app-cache-v1') {
    this.cacheName = cacheName;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!('caches' in window)) return null;

    try {
      const cache = await caches.open(this.cacheName);
      const response = await cache.match(key);
      
      if (response) {
        const text = await response.text();
        const entry = JSON.parse(text);
        entry.lastAccessed = new Date(entry.lastAccessed);
        entry.accessCount++;
        
        // Update access info
        await this.set(key, entry);
        return entry;
      }
    } catch (error) {
      console.warn('Service Worker cache get error:', error);
    }
    return null;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open(this.cacheName);
      const response = new Response(JSON.stringify(entry), {
        headers: { 'Content-Type': 'application/json' }
      });
      await cache.put(key, response);
    } catch (error) {
      console.warn('Service Worker cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open(this.cacheName);
      await cache.delete(key);
    } catch (error) {
      console.warn('Service Worker cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      await caches.delete(this.cacheName);
    } catch (error) {
      console.warn('Service Worker cache clear error:', error);
    }
  }

  async keys(): Promise<string[]> {
    if (!('caches' in window)) return [];

    try {
      const cache = await caches.open(this.cacheName);
      const requests = await cache.keys();
      return requests.map(req => req.url);
    } catch (error) {
      console.warn('Service Worker cache keys error:', error);
      return [];
    }
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }
}

/**
 * Multi-Level Cache Manager
 */
export class CacheManager {
  private levels: CacheLevel[];
  private stats: CacheStats;

  constructor() {
    this.levels = [
      new MemoryCache(100),
      new LocalStorageCache('app_cache_'),
      new ServiceWorkerCache('app-cache-v1')
    ];
    
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0
    };
  }

  /**
   * Get value from cache with multi-level lookup
   */
  async get<T>(key: string, options: CacheGetOptions = {}): Promise<T | null> {
    const { allowStale = false, updateInBackground = false } = options;

    for (let i = 0; i < this.levels.length; i++) {
      const level = this.levels[i];
      const entry = await level.get<T>(key);

      if (entry) {
        const now = Date.now();
        const isExpired = now > (entry.timestamp + entry.ttl);
        
        if (!isExpired || allowStale) {
          this.stats.hits++;
          this.updateHitRate();

          // Promote to higher levels
          for (let j = 0; j < i; j++) {
            await this.levels[j].set(key, entry);
          }

          // Update in background if stale
          if (isExpired && updateInBackground) {
            this.backgroundUpdate(key, entry);
          }

          return entry.data;
        } else {
          // Remove expired entry
          await level.delete(key);
        }
      }
    }

    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Set value in all cache levels
   */
  async set<T>(key: string, value: T, options: CacheSetOptions = {}): Promise<void> {
    const {
      ttl = 1000 * 60 * 60, // 1 hour default
      priority = 'normal',
      tags = []
    } = options;

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      tags,
      priority,
      accessCount: 1,
      lastAccessed: new Date()
    };

    // Set in all levels
    const promises = this.levels.map(level => level.set(key, entry));
    await Promise.allSettled(promises);

    await this.updateSize();
  }

  /**
   * Delete from all cache levels
   */
  async delete(key: string): Promise<void> {
    const promises = this.levels.map(level => level.delete(key));
    await Promise.allSettled(promises);
    await this.updateSize();
  }

  /**
   * Invalidate cache entries by pattern or tags
   */
  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    
    for (const level of this.levels) {
      const keys = await level.keys();
      const toDelete = keys.filter(key => regex.test(key));
      
      const promises = toDelete.map(key => level.delete(key));
      await Promise.allSettled(promises);
    }

    await this.updateSize();
  }

  /**
   * Clear all cache levels
   */
  async clear(): Promise<void> {
    const promises = this.levels.map(level => level.clear());
    await Promise.allSettled(promises);
    
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache size across all levels
   */
  async getSize(): Promise<number> {
    await this.updateSize();
    return this.stats.size;
  }

  /**
   * Cache-first strategy: Check cache first, fallback to network
   */
  async cacheFirst<T>(
    key: string,
    networkFn: () => Promise<T>,
    options: CacheSetOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, { allowStale: true });
    
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await networkFn();
      await this.set(key, data, options);
      return data;
    } catch (error) {
      throw this.createCacheError('Cache-first strategy failed', error);
    }
  }

  /**
   * Network-first strategy: Try network first, fallback to cache
   */
  async networkFirst<T>(
    key: string,
    networkFn: () => Promise<T>,
    options: CacheSetOptions = {}
  ): Promise<T> {
    try {
      const data = await networkFn();
      await this.set(key, data, options);
      return data;
    } catch (error) {
      const cached = await this.get<T>(key, { allowStale: true });
      
      if (cached !== null) {
        return cached;
      }

      throw this.createCacheError('Network-first strategy failed', error);
    }
  }

  /**
   * Cache-only strategy: Only return cached data
   */
  async cacheOnly<T>(key: string): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    throw this.createCacheError('Cache-only strategy failed: No cached data found');
  }

  private async updateSize(): Promise<void> {
    let totalSize = 0;
    for (const level of this.levels) {
      totalSize += await level.size();
    }
    this.stats.size = totalSize;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private async backgroundUpdate<T>(key: string, staleEntry: CacheEntry<T>): Promise<void> {
    // This would typically trigger a background network request
    // For now, we'll just mark it for future implementation
    console.log(`Background update needed for key: ${key}`);
  }

  private createCacheError(message: string, originalError?: any): ApiError {
    return {
      type: ErrorType.CACHE_ERROR,
      message,
      retryable: false,
      timestamp: new Date(),
      context: originalError ? { originalError: originalError.message } : undefined
    };
  }
}

// Export singleton instance
let cacheManagerInstance: CacheManager | null = null;

export const getCacheManager = (): CacheManager => {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
};

export const cacheManager = getCacheManager();