/**
 * ImageManager Lazy Loading Tests
 * Tests for lazy loading functionality with Intersection Observer
 */

import { ImageManager } from '../ImageManager';

// Mock IntersectionObserver
const mockIntersectionObserver = {
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
};

// Store the original IntersectionObserver
const originalIntersectionObserver = global.IntersectionObserver;

global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
  // Store callback for manual triggering
  (global as any).intersectionObserverCallback = callback;
  return mockIntersectionObserver;
}) as any;

// Mock element methods
const mockElement = {
  tagName: 'IMG',
  dataset: {},
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  },
  style: {},
  getBoundingClientRect: jest.fn(() => ({
    top: 100,
    left: 100,
    bottom: 200,
    right: 200,
    width: 100,
    height: 100
  }))
} as any;

// Mock window dimensions
Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 800
});

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1200
});

describe('ImageManager Lazy Loading', () => {
  let imageManager: ImageManager;

  beforeEach(() => {
    imageManager = new ImageManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    imageManager.clearAll();
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original IntersectionObserver if it existed
    if (originalIntersectionObserver) {
      global.IntersectionObserver = originalIntersectionObserver;
    }
  });

  describe('observeForLazyLoading', () => {
    it('should register element for lazy loading', () => {
      const imageUrl = 'https://example.com/image.jpg';
      const fallbackUrls = ['https://example.com/fallback.jpg'];

      imageManager.observeForLazyLoading(mockElement, imageUrl, {
        fallbackUrls,
        priority: 'high',
        placeholder: '/placeholder.jpg'
      });

      expect(mockElement.dataset.src).toBe(imageUrl);
      expect(mockElement.dataset.fallbacks).toBe(fallbackUrls.join(','));
      expect(mockElement.dataset.priority).toBe('high');
      expect(mockElement.classList.add).toHaveBeenCalledWith('loading');
      expect(mockIntersectionObserver.observe).toHaveBeenCalledWith(mockElement);
    });

    it('should set placeholder image', () => {
      const imageUrl = 'https://example.com/image.jpg';
      const placeholder = '/placeholder.jpg';

      imageManager.observeForLazyLoading(mockElement, imageUrl, {
        placeholder
      });

      expect(mockElement.src).toBe(placeholder);
    });

    it('should handle elements without intersection observer support', () => {
      // Temporarily disable IntersectionObserver
      delete (global as any).IntersectionObserver;

      const newImageManager = new ImageManager();
      const imageUrl = 'https://example.com/image.jpg';

      // Should not throw and should handle gracefully
      expect(() => {
        newImageManager.observeForLazyLoading(mockElement, imageUrl);
      }).not.toThrow();

      // Restore IntersectionObserver
      global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
        (global as any).intersectionObserverCallback = callback;
        return mockIntersectionObserver;
      }) as any;
    });
  });

  describe('unobserveForLazyLoading', () => {
    it('should stop observing element', () => {
      const imageUrl = 'https://example.com/image.jpg';

      imageManager.observeForLazyLoading(mockElement, imageUrl);
      imageManager.unobserveForLazyLoading(mockElement);

      expect(mockIntersectionObserver.unobserve).toHaveBeenCalledWith(mockElement);
    });

    it('should remove element from lazy load queue', () => {
      const imageUrl = 'https://example.com/image.jpg';

      imageManager.observeForLazyLoading(mockElement, imageUrl, { priority: 'high' });
      
      const statsBefore = imageManager.getStats();
      expect(statsBefore.lazyLoadQueueSize).toBe(1);

      imageManager.unobserveForLazyLoading(mockElement);
      
      const statsAfter = imageManager.getStats();
      expect(statsAfter.lazyLoadQueueSize).toBe(0);
    });
  });

  describe('intersection observer callback', () => {
    it('should load image when element enters viewport', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const fallbackUrls = ['https://example.com/fallback.jpg'];

      // Set up element
      mockElement.dataset.src = imageUrl;
      mockElement.dataset.fallbacks = fallbackUrls.join(',');
      mockElement.dataset.priority = 'normal';

      // Mock intersection observer entry
      const mockEntry = {
        target: mockElement,
        isIntersecting: true
      };

      // Spy on loadImage method
      const loadImageSpy = jest.spyOn(imageManager, 'loadImage').mockResolvedValue({
        url: imageUrl,
        cached: false,
        fallbackUsed: false,
        loadTime: 100,
        source: 'primary'
      });

      // Trigger intersection observer callback
      const callback = (global as any).intersectionObserverCallback;
      await callback([mockEntry]);

      expect(loadImageSpy).toHaveBeenCalledWith(imageUrl, fallbackUrls, {
        priority: 'normal'
      });

      expect(mockElement.src).toBe(imageUrl);
      expect(mockElement.classList.add).toHaveBeenCalledWith('loaded');
      expect(mockElement.classList.remove).toHaveBeenCalledWith('loading');
      expect(mockIntersectionObserver.unobserve).toHaveBeenCalledWith(mockElement);
    });

    it('should handle load errors', async () => {
      const imageUrl = 'https://example.com/broken-image.jpg';

      mockElement.dataset.src = imageUrl;
      mockElement.dataset.fallbacks = '';
      mockElement.dataset.priority = 'normal';

      const mockEntry = {
        target: mockElement,
        isIntersecting: true
      };

      // Mock loadImage to reject
      jest.spyOn(imageManager, 'loadImage').mockRejectedValue(new Error('Load failed'));

      const callback = (global as any).intersectionObserverCallback;
      await callback([mockEntry]);

      expect(mockElement.classList.add).toHaveBeenCalledWith('error');
      expect(mockElement.classList.remove).toHaveBeenCalledWith('loading');
    });

    it('should not load image when element is not intersecting', async () => {
      const imageUrl = 'https://example.com/image.jpg';

      mockElement.dataset.src = imageUrl;

      const mockEntry = {
        target: mockElement,
        isIntersecting: false
      };

      const loadImageSpy = jest.spyOn(imageManager, 'loadImage');

      const callback = (global as any).intersectionObserverCallback;
      await callback([mockEntry]);

      expect(loadImageSpy).not.toHaveBeenCalled();
    });
  });

  describe('isElementInViewport', () => {
    it('should return true for element in viewport', () => {
      mockElement.getBoundingClientRect.mockReturnValue({
        top: 100,
        left: 100,
        bottom: 200,
        right: 200,
        width: 100,
        height: 100
      });

      const result = (imageManager as any).isElementInViewport(mockElement);
      expect(result).toBe(true);
    });

    it('should return false for element outside viewport', () => {
      mockElement.getBoundingClientRect.mockReturnValue({
        top: -100,
        left: -100,
        bottom: -50,
        right: -50,
        width: 100,
        height: 100
      });

      const result = (imageManager as any).isElementInViewport(mockElement);
      expect(result).toBe(false);
    });

    it('should return false for element below viewport', () => {
      mockElement.getBoundingClientRect.mockReturnValue({
        top: 900,
        left: 100,
        bottom: 1000,
        right: 200,
        width: 100,
        height: 100
      });

      const result = (imageManager as any).isElementInViewport(mockElement);
      expect(result).toBe(false);
    });
  });

  describe('preloadVisibleImages', () => {
    it('should preload images for visible elements', async () => {
      const imageUrl1 = 'https://example.com/image1.jpg';
      const imageUrl2 = 'https://example.com/image2.jpg';

      const element1 = { ...mockElement, dataset: { src: imageUrl1 } };
      const element2 = { ...mockElement, dataset: { src: imageUrl2 } };

      // Mock elements as visible
      jest.spyOn(imageManager as any, 'isElementInViewport').mockReturnValue(true);

      // Add elements to lazy load queue
      imageManager.observeForLazyLoading(element1, imageUrl1, { priority: 'high' });
      imageManager.observeForLazyLoading(element2, imageUrl2, { priority: 'normal' });

      const preloadImagesSpy = jest.spyOn(imageManager, 'preloadImages').mockResolvedValue();

      await imageManager.preloadVisibleImages();

      expect(preloadImagesSpy).toHaveBeenCalledWith([imageUrl1, imageUrl2], {
        priority: 'high',
        concurrent: 5
      });
    });

    it('should prioritize high priority images', async () => {
      const highPriorityUrl = 'https://example.com/high-priority.jpg';
      const normalPriorityUrl = 'https://example.com/normal-priority.jpg';

      const element1 = { ...mockElement, dataset: { src: normalPriorityUrl } };
      const element2 = { ...mockElement, dataset: { src: highPriorityUrl } };

      jest.spyOn(imageManager as any, 'isElementInViewport').mockReturnValue(true);

      imageManager.observeForLazyLoading(element1, normalPriorityUrl, { priority: 'normal' });
      imageManager.observeForLazyLoading(element2, highPriorityUrl, { priority: 'high' });

      const preloadImagesSpy = jest.spyOn(imageManager, 'preloadImages').mockResolvedValue();

      await imageManager.preloadVisibleImages();

      // Should be called with high priority image first
      expect(preloadImagesSpy).toHaveBeenCalledWith([highPriorityUrl, normalPriorityUrl], {
        priority: 'high',
        concurrent: 5
      });
    });
  });

  describe('clearAll', () => {
    it('should disconnect intersection observer and clear lazy load queue', () => {
      const imageUrl = 'https://example.com/image.jpg';

      imageManager.observeForLazyLoading(mockElement, imageUrl);
      
      const statsBefore = imageManager.getStats();
      expect(statsBefore.lazyLoadQueueSize).toBe(1);

      imageManager.clearAll();

      expect(mockIntersectionObserver.disconnect).toHaveBeenCalled();
      
      const statsAfter = imageManager.getStats();
      expect(statsAfter.lazyLoadQueueSize).toBe(0);
    });
  });
});