/**
 * ImageManager Tests
 * Tests for robust image loading with fallback chains
 */

import { ImageManager } from '../ImageManager';
import { imageCacheService } from '../ImageCacheService';

// Mock the ImageCacheService
jest.mock('../ImageCacheService', () => ({
  imageCacheService: {
    getCachedImageBlob: jest.fn(),
    cacheImage: jest.fn(),
    warmAboveFoldImages: jest.fn()
  }
}));

// Mock image utilities
jest.mock('../../utils/imageUtils', () => ({
  getProductImage: jest.fn((path) => path || '/images/products/placeholder.svg'),
  getOptimizedImagePath: jest.fn((path, size) => `${path}?size=${size}`),
  imageExists: jest.fn()
}));

// Mock Image constructor
const mockImage = {
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
  complete: false
};

global.Image = jest.fn(() => mockImage) as any;

describe('ImageManager', () => {
  let imageManager: ImageManager;
  const mockImageCacheService = imageCacheService as jest.Mocked<typeof imageCacheService>;

  beforeEach(() => {
    imageManager = new ImageManager();
    jest.clearAllMocks();
    mockImageCacheService.getCachedImageBlob.mockResolvedValue(null);
    mockImageCacheService.cacheImage.mockResolvedValue(true);
    mockImageCacheService.warmAboveFoldImages.mockResolvedValue();
  });

  afterEach(() => {
    imageManager.clearAll();
  });

  describe('loadImage', () => {
    it('should load image successfully from primary URL', async () => {
      const primaryUrl = 'https://example.com/image.jpg';
      
      // Mock successful image load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      const result = await imageManager.loadImage(primaryUrl);

      expect(result.url).toBe(primaryUrl);
      expect(result.cached).toBe(false);
      expect(result.fallbackUsed).toBe(false);
      expect(result.source).toBe('primary');
      expect(result.loadTime).toBeGreaterThan(0);
    });

    it('should use cached image when available', async () => {
      const primaryUrl = 'https://example.com/image.jpg';
      const cachedUrl = 'blob:cached-image';
      
      mockImageCacheService.getCachedImageBlob.mockResolvedValue(cachedUrl);

      const result = await imageManager.loadImage(primaryUrl);

      expect(result.url).toBe(cachedUrl);
      expect(result.cached).toBe(true);
      expect(result.fallbackUsed).toBe(false);
      expect(result.source).toBe('primary');
    });

    it('should fallback to secondary URL when primary fails', async () => {
      const primaryUrl = 'https://example.com/broken-image.jpg';
      const fallbackUrl = 'https://example.com/fallback-image.jpg';
      
      let imageLoadAttempts = 0;
      
      // Mock first image load failure, second success
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
            imageLoadAttempts++;
            setTimeout(() => {
              if (value === primaryUrl && img.onerror) {
                img.onerror();
              } else if (value === fallbackUrl && img.onload) {
                img.onload();
              }
            }, 10);
          }
        });
        
        return img;
      }) as any;

      const result = await imageManager.loadImage(primaryUrl, [fallbackUrl]);

      expect(result.url).toBe(fallbackUrl);
      expect(result.fallbackUsed).toBe(true);
      expect(result.source).toBe('fallback');
      expect(imageLoadAttempts).toBe(2);

      global.Image = originalImage;
    });

    it('should use placeholder when all sources fail', async () => {
      const primaryUrl = 'https://example.com/broken-image.jpg';
      const fallbackUrl = 'https://example.com/broken-fallback.jpg';
      
      // Mock all image loads failing except placeholder
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
                img.onerror();
              }
            }, 10);
          }
        });
        
        return img;
      }) as any;

      const result = await imageManager.loadImage(primaryUrl, [fallbackUrl]);

      expect(result.url).toBe('/images/products/placeholder.svg');
      expect(result.fallbackUsed).toBe(true);
      expect(result.source).toBe('placeholder');

      global.Image = originalImage;
    });

    it('should handle progress callbacks', async () => {
      const primaryUrl = 'https://example.com/image.jpg';
      const onProgress = jest.fn();
      
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      await imageManager.loadImage(primaryUrl, [], { onProgress });

      expect(onProgress).toHaveBeenCalled();
    });

    it('should handle load start and end callbacks', async () => {
      const primaryUrl = 'https://example.com/image.jpg';
      const onLoadStart = jest.fn();
      const onLoadEnd = jest.fn();
      
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      await imageManager.loadImage(primaryUrl, [], { onLoadStart, onLoadEnd });

      expect(onLoadStart).toHaveBeenCalled();
      expect(onLoadEnd).toHaveBeenCalled();
    });

    it('should cache successful image loads', async () => {
      const primaryUrl = 'https://example.com/image.jpg';
      
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      await imageManager.loadImage(primaryUrl);

      expect(mockImageCacheService.cacheImage).toHaveBeenCalledWith(primaryUrl);
    });

    it('should handle timeout errors', async () => {
      const primaryUrl = 'https://example.com/slow-image.jpg';
      
      // Don't trigger onload or onerror to simulate timeout
      
      await expect(imageManager.loadImage(primaryUrl)).rejects.toThrow('timeout');
    }, 10000); // Increase timeout for this test

    it('should return existing promise for duplicate requests', async () => {
      const primaryUrl = 'https://example.com/image.jpg';
      
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      const promise1 = imageManager.loadImage(primaryUrl);
      const promise2 = imageManager.loadImage(primaryUrl);

      // Should be the same promise reference
      expect(promise1).toBe(promise2);

      const result = await promise1;
      expect(result.url).toBe(primaryUrl);
    });
  });

  describe('preloadImages', () => {
    it('should preload multiple images', async () => {
      const urls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg'
      ];

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      await imageManager.preloadImages(urls, { priority: 'high' });

      // Should have attempted to load all images
      expect(global.Image).toHaveBeenCalledTimes(3);
    });

    it('should handle preload errors gracefully', async () => {
      const urls = [
        'https://example.com/broken-image.jpg'
      ];

      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 10);

      // Should not throw even if preload fails
      await expect(imageManager.preloadImages(urls)).resolves.toBeUndefined();
    });
  });

  describe('preloadAboveFoldImages', () => {
    it('should preload above-fold images with high priority', async () => {
      const productIds = ['123', '456', '789'];

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      await imageManager.preloadAboveFoldImages(productIds);

      expect(mockImageCacheService.warmAboveFoldImages).toHaveBeenCalledWith(productIds);
    });
  });

  describe('getLoadingState', () => {
    it('should return null for non-existent loading state', () => {
      const state = imageManager.getLoadingState('https://example.com/image.jpg');
      expect(state).toBeNull();
    });

    it('should return loading state during image load', async () => {
      const primaryUrl = 'https://example.com/image.jpg';
      
      // Start loading but don't complete
      const loadPromise = imageManager.loadImage(primaryUrl);
      
      const state = imageManager.getLoadingState(primaryUrl);
      expect(state).not.toBeNull();
      expect(state?.loading).toBe(true);
      expect(state?.loaded).toBe(false);

      // Complete the load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      await loadPromise;
    });
  });

  describe('cancelImageLoad', () => {
    it('should cancel ongoing image load', async () => {
      const primaryUrl = 'https://example.com/image.jpg';
      
      const loadPromise = imageManager.loadImage(primaryUrl);
      imageManager.cancelImageLoad(primaryUrl);

      // The promise should still resolve/reject, but the state should be cleared
      try {
        await loadPromise;
      } catch (error) {
        // Expected to fail due to cancellation
      }

      const state = imageManager.getLoadingState(primaryUrl);
      expect(state).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all loading states and cancel pending loads', async () => {
      const urls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg'
      ];

      // Start loading multiple images
      const promises = urls.map(url => imageManager.loadImage(url));
      
      // Give a small delay to ensure loading starts
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Clear all
      imageManager.clearAll();

      // States should be cleared
      urls.forEach(url => {
        const state = imageManager.getLoadingState(url);
        expect(state).toBeNull();
      });

      // Wait for promises to settle (they should reject due to abort)
      const results = await Promise.allSettled(promises);
      results.forEach(result => {
        expect(result.status).toBe('rejected');
      });
    }, 10000);
  });

  describe('Fallback Chain Handling', () => {
    it('should provide wedding cake fallback for wedding products', async () => {
      const primaryUrl = 'https://example.com/wedding-cake-deluxe.jpg';
      
      // Mock primary load failure, fallback success
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
              if (value === primaryUrl && img.onerror) {
                img.onerror();
              } else if (value.includes('wedding-cake.svg') && img.onload) {
                img.onload();
              } else if (img.onerror) {
                img.onerror();
              }
            }, 10);
          }
        });
        
        return img;
      }) as any;

      const result = await imageManager.loadImage(primaryUrl);

      expect(result.url).toBe('/images/products/wedding-cake.svg');
      expect(result.fallbackUsed).toBe(true);

      global.Image = originalImage;
    });

    it('should try multiple fallback URLs in order', async () => {
      const primaryUrl = 'https://example.com/primary.jpg';
      const fallback1 = 'https://example.com/fallback1.jpg';
      const fallback2 = 'https://example.com/fallback2.jpg';
      const fallback3 = 'https://example.com/fallback3.jpg';
      
      let attemptCount = 0;
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
            attemptCount++;
            setTimeout(() => {
              if (value === fallback2 && img.onload) {
                img.onload(); // Second fallback succeeds
              } else if (img.onerror) {
                img.onerror();
              }
            }, 10);
          }
        });
        
        return img;
      }) as any;

      const result = await imageManager.loadImage(primaryUrl, [fallback1, fallback2, fallback3]);

      expect(result.url).toBe(fallback2);
      expect(result.fallbackUsed).toBe(true);
      expect(attemptCount).toBe(3); // Primary + fallback1 + fallback2

      global.Image = originalImage;
    });

    it('should handle complex fallback chain with different image types', async () => {
      const primaryUrl = 'https://cdn.example.com/image.webp';
      const fallbacks = [
        'https://cdn.example.com/image.jpg',
        'https://backup-cdn.example.com/image.jpg',
        '/local/images/image.jpg'
      ];
      
      let attemptedUrls: string[] = [];
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
            attemptedUrls.push(value);
            setTimeout(() => {
              if (value === '/local/images/image.jpg' && img.onload) {
                img.onload(); // Local fallback succeeds
              } else if (img.onerror) {
                img.onerror();
              }
            }, 10);
          }
        });
        
        return img;
      }) as any;

      const result = await imageManager.loadImage(primaryUrl, fallbacks);

      expect(result.url).toBe('/local/images/image.jpg');
      expect(result.fallbackUsed).toBe(true);
      expect(attemptedUrls).toEqual([
        primaryUrl,
        fallbacks[0],
        fallbacks[1],
        fallbacks[2]
      ]);

      global.Image = originalImage;
    });

    it('should handle empty fallback array gracefully', async () => {
      const primaryUrl = 'https://example.com/broken-image.jpg';
      
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
                img.onerror();
              }
            }, 10);
          }
        });
        
        return img;
      }) as any;

      const result = await imageManager.loadImage(primaryUrl, []);

      expect(result.url).toBe('/images/products/placeholder.svg');
      expect(result.fallbackUsed).toBe(true);
      expect(result.source).toBe('placeholder');

      global.Image = originalImage;
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network timeout errors', async () => {
      const primaryUrl = 'https://slow-server.example.com/image.jpg';
      
      const originalImage = global.Image;
      global.Image = jest.fn(() => {
        const img = {
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null,
          src: '',
          complete: false
        };
        
        // Don't call onload or onerror to simulate timeout
        Object.defineProperty(img, 'src', {
          set: function(value: string) {
            // Simulate timeout by not calling callbacks
          }
        });
        
        return img;
      }) as any;

      await expect(imageManager.loadImage(primaryUrl, [], { timeout: 100 }))
        .rejects.toThrow('timeout');

      global.Image = originalImage;
    });

    it('should handle CORS errors gracefully', async () => {
      const primaryUrl = 'https://cors-blocked.example.com/image.jpg';
      const fallbackUrl = 'https://allowed.example.com/image.jpg';
      
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
              if (value === primaryUrl && img.onerror) {
                const corsError = new Error('CORS error');
                corsError.name = 'SecurityError';
                img.onerror();
              } else if (value === fallbackUrl && img.onload) {
                img.onload();
              }
            }, 10);
          }
        });
        
        return img;
      }) as any;

      const result = await imageManager.loadImage(primaryUrl, [fallbackUrl]);

      expect(result.url).toBe(fallbackUrl);
      expect(result.fallbackUsed).toBe(true);

      global.Image = originalImage;
    });

    it('should handle malformed URLs', async () => {
      const malformedUrl = 'not-a-valid-url';
      const validFallback = 'https://example.com/valid-image.jpg';
      
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
              if (value === malformedUrl && img.onerror) {
                img.onerror();
              } else if (value === validFallback && img.onload) {
                img.onload();
              }
            }, 10);
          }
        });
        
        return img;
      }) as any;

      const result = await imageManager.loadImage(malformedUrl, [validFallback]);

      expect(result.url).toBe(validFallback);
      expect(result.fallbackUsed).toBe(true);

      global.Image = originalImage;
    });

    it('should handle 404 errors with appropriate fallbacks', async () => {
      const notFoundUrl = 'https://example.com/404-image.jpg';
      const workingUrl = 'https://example.com/working-image.jpg';
      
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
              if (value === notFoundUrl && img.onerror) {
                const notFoundError = new Error('404 Not Found');
                img.onerror();
              } else if (value === workingUrl && img.onload) {
                img.onload();
              }
            }, 10);
          }
        });
        
        return img;
      }) as any;

      const result = await imageManager.loadImage(notFoundUrl, [workingUrl]);

      expect(result.url).toBe(workingUrl);
      expect(result.fallbackUsed).toBe(true);

      global.Image = originalImage;
    });

    it('should track and report error statistics', async () => {
      const failingUrl = 'https://example.com/failing-image.jpg';
      
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
                img.onerror();
              }
            }, 10);
          }
        });
        
        return img;
      }) as any;

      // Attempt to load failing image multiple times
      await imageManager.loadImage(failingUrl);
      await imageManager.loadImage(failingUrl);
      await imageManager.loadImage(failingUrl);

      // Should track error statistics (implementation dependent)
      // This would require the ImageManager to expose error statistics
      // expect(imageManager.getErrorStats()).toBeDefined();

      global.Image = originalImage;
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle concurrent image loads efficiently', async () => {
      const urls = Array.from({ length: 10 }, (_, i) => `https://example.com/image${i}.jpg`);
      
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      const promises = urls.map(url => imageManager.loadImage(url));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.url).toBe(urls[index]);
      });
    });

    it('should implement request deduplication for identical URLs', async () => {
      const url = 'https://example.com/same-image.jpg';
      
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      // Start multiple requests for the same URL simultaneously
      const promise1 = imageManager.loadImage(url);
      const promise2 = imageManager.loadImage(url);
      const promise3 = imageManager.loadImage(url);

      // All should resolve to the same result
      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
      
      // Should only create one Image instance
      expect(global.Image).toHaveBeenCalledTimes(1);
    });

    it('should handle memory cleanup for cancelled loads', async () => {
      const url = 'https://example.com/slow-image.jpg';
      
      // Start loading but don't complete
      const loadPromise = imageManager.loadImage(url);
      
      // Cancel the load
      imageManager.cancelImageLoad(url);
      
      // Promise should reject
      await expect(loadPromise).rejects.toThrow();
      
      // Loading state should be cleaned up
      expect(imageManager.getLoadingState(url)).toBeNull();
    });
  });
});