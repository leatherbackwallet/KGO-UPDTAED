// Export all service classes and types
export { ReliableApiService } from './ReliableApiService';
export { RetryManager } from './RetryManager';
export { CircuitBreaker } from './CircuitBreaker';
export { ConnectionMonitor } from './ConnectionMonitor';
export { CacheManager, getCacheManager, cacheManager } from './CacheManager';
export { ImageCacheService, getImageCacheService, imageCacheService } from './ImageCacheService';
export { ImageManager, getImageManager, imageManager } from './ImageManager';

export * from './types';

// Create and export a singleton instance of the reliable API service
import { ReliableApiService } from './ReliableApiService';

// Singleton instance
let reliableApiInstance: ReliableApiService | null = null;

export const getReliableApiService = (): ReliableApiService => {
  if (!reliableApiInstance) {
    reliableApiInstance = new ReliableApiService();
  }
  return reliableApiInstance;
};

// Export the singleton instance as default
export const reliableApi = getReliableApiService();

// Cleanup function for when the app unmounts
export const cleanupReliableApi = (): void => {
  if (reliableApiInstance) {
    reliableApiInstance.destroy();
    reliableApiInstance = null;
  }
};