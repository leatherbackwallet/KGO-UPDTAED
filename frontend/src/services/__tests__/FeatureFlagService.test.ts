/**
 * Tests for Feature Flag Service
 * Validates feature flag functionality and rollout logic
 */

import { featureFlagService, FeatureFlag } from '../FeatureFlagService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = jest.fn();

describe('FeatureFlagService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({})
    });
  });

  describe('isEnabled', () => {
    it('should return false for non-existent flags', () => {
      const result = featureFlagService.isEnabled('non-existent-flag');
      expect(result).toBe(false);
    });

    it('should return false for disabled flags', () => {
      featureFlagService.updateFlag('test-flag', {
        name: 'test-flag',
        enabled: false,
        rolloutPercentage: 100,
        metadata: {
          description: 'Test flag',
          owner: 'test',
          createdAt: new Date(),
          lastModified: new Date()
        }
      });

      const result = featureFlagService.isEnabled('test-flag');
      expect(result).toBe(false);
    });

    it('should return true for enabled flags with 100% rollout', () => {
      featureFlagService.createFlag({
        name: 'test-flag',
        enabled: true,
        rolloutPercentage: 100,
        metadata: {
          description: 'Test flag',
          owner: 'test',
          createdAt: new Date(),
          lastModified: new Date()
        }
      });

      const result = featureFlagService.isEnabled('test-flag');
      expect(result).toBe(true);
    });

    it('should respect rollout percentage', () => {
      // Create a flag with 0% rollout
      featureFlagService.createFlag({
        name: 'test-flag',
        enabled: true,
        rolloutPercentage: 0,
        metadata: {
          description: 'Test flag',
          owner: 'test',
          createdAt: new Date(),
          lastModified: new Date()
        }
      });

      const result = featureFlagService.isEnabled('test-flag');
      expect(result).toBe(false);
    });

    it('should respect environment conditions', () => {
      featureFlagService.createFlag({
        name: 'test-flag',
        enabled: true,
        rolloutPercentage: 100,
        conditions: {
          environment: ['production']
        },
        metadata: {
          description: 'Test flag',
          owner: 'test',
          createdAt: new Date(),
          lastModified: new Date()
        }
      });

      // Should be false in development environment
      const result = featureFlagService.isEnabled('test-flag');
      expect(result).toBe(false);
    });

    it('should respect user agent conditions', () => {
      // Mock navigator.userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Chrome)',
        configurable: true
      });

      featureFlagService.createFlag({
        name: 'test-flag',
        enabled: true,
        rolloutPercentage: 100,
        conditions: {
          userAgent: ['Firefox']
        },
        metadata: {
          description: 'Test flag',
          owner: 'test',
          createdAt: new Date(),
          lastModified: new Date()
        }
      });

      const result = featureFlagService.isEnabled('test-flag');
      expect(result).toBe(false);
    });

    it('should respect user ID conditions', () => {
      featureFlagService.setUserId('user123');
      
      featureFlagService.createFlag({
        name: 'test-flag',
        enabled: true,
        rolloutPercentage: 100,
        conditions: {
          userId: ['user456']
        },
        metadata: {
          description: 'Test flag',
          owner: 'test',
          createdAt: new Date(),
          lastModified: new Date()
        }
      });

      const result = featureFlagService.isEnabled('test-flag');
      expect(result).toBe(false);
    });
  });

  describe('updateFlag', () => {
    it('should update existing flag properties', () => {
      featureFlagService.createFlag({
        name: 'test-flag',
        enabled: false,
        rolloutPercentage: 0,
        metadata: {
          description: 'Test flag',
          owner: 'test',
          createdAt: new Date(),
          lastModified: new Date()
        }
      });

      featureFlagService.updateFlag('test-flag', {
        enabled: true,
        rolloutPercentage: 50
      });

      const flag = featureFlagService.getFlag('test-flag');
      expect(flag?.enabled).toBe(true);
      expect(flag?.rolloutPercentage).toBe(50);
    });

    it('should update lastModified timestamp', () => {
      const originalDate = new Date('2023-01-01');
      featureFlagService.createFlag({
        name: 'test-flag',
        enabled: false,
        rolloutPercentage: 0,
        metadata: {
          description: 'Test flag',
          owner: 'test',
          createdAt: originalDate,
          lastModified: originalDate
        }
      });

      featureFlagService.updateFlag('test-flag', { enabled: true });

      const flag = featureFlagService.getFlag('test-flag');
      expect(flag?.metadata?.lastModified).not.toEqual(originalDate);
    });
  });

  describe('getAllFlags', () => {
    it('should return enabled status for all flags', () => {
      featureFlagService.createFlag({
        name: 'flag1',
        enabled: true,
        rolloutPercentage: 100,
        metadata: {
          description: 'Flag 1',
          owner: 'test',
          createdAt: new Date(),
          lastModified: new Date()
        }
      });

      featureFlagService.createFlag({
        name: 'flag2',
        enabled: false,
        rolloutPercentage: 100,
        metadata: {
          description: 'Flag 2',
          owner: 'test',
          createdAt: new Date(),
          lastModified: new Date()
        }
      });

      const allFlags = featureFlagService.getAllFlags();
      expect(allFlags).toHaveProperty('flag1', true);
      expect(allFlags).toHaveProperty('flag2', false);
    });
  });

  describe('getFlagMetrics', () => {
    it('should return metrics for existing flag', () => {
      featureFlagService.createFlag({
        name: 'test-flag',
        enabled: true,
        rolloutPercentage: 25,
        metadata: {
          description: 'Test flag',
          owner: 'test',
          createdAt: new Date(),
          lastModified: new Date()
        }
      });

      const metrics = featureFlagService.getFlagMetrics('test-flag');
      expect(metrics.enabled).toBe(true);
      expect(metrics.rolloutPercentage).toBe(25);
      expect(metrics.estimatedUsers).toBe(250); // 25% of 1000
    });

    it('should return default metrics for non-existent flag', () => {
      const metrics = featureFlagService.getFlagMetrics('non-existent');
      expect(metrics.enabled).toBe(false);
      expect(metrics.rolloutPercentage).toBe(0);
      expect(metrics.estimatedUsers).toBe(0);
    });
  });

  describe('localStorage integration', () => {
    it('should save to localStorage in development', () => {
      featureFlagService.createFlag({
        name: 'test-flag',
        enabled: true,
        rolloutPercentage: 100,
        metadata: {
          description: 'Test flag',
          owner: 'test',
          createdAt: new Date(),
          lastModified: new Date()
        }
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'featureFlags',
        expect.stringContaining('test-flag')
      );
    });

    it('should load from localStorage on initialization', () => {
      const mockConfig = {
        flags: {
          'stored-flag': {
            name: 'stored-flag',
            enabled: true,
            rolloutPercentage: 100,
            metadata: {
              description: 'Stored flag',
              owner: 'test',
              createdAt: new Date().toISOString(),
              lastModified: new Date().toISOString()
            }
          }
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockConfig));

      // Create new instance to test loading
      const newService = new (featureFlagService.constructor as any)();
      const result = newService.isEnabled('stored-flag');
      expect(result).toBe(true);
    });
  });

  describe('remote config loading', () => {
    it('should attempt to load from remote API', async () => {
      const mockRemoteConfig = {
        flags: {
          'remote-flag': {
            name: 'remote-flag',
            enabled: true,
            rolloutPercentage: 50,
            metadata: {
              description: 'Remote flag',
              owner: 'remote',
              createdAt: new Date().toISOString(),
              lastModified: new Date().toISOString()
            }
          }
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRemoteConfig)
      });

      // Create new instance to test remote loading
      const newService = new (featureFlagService.constructor as any)();
      
      // Wait for async loading
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(fetch).toHaveBeenCalledWith('/api/feature-flags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should handle remote config loading failure gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Should not throw error
      expect(() => {
        new (featureFlagService.constructor as any)();
      }).not.toThrow();
    });
  });

  describe('user hash calculation', () => {
    it('should generate consistent hash for same user', () => {
      featureFlagService.setUserId('user123');
      
      featureFlagService.createFlag({
        name: 'test-flag',
        enabled: true,
        rolloutPercentage: 50,
        metadata: {
          description: 'Test flag',
          owner: 'test',
          createdAt: new Date(),
          lastModified: new Date()
        }
      });

      const result1 = featureFlagService.isEnabled('test-flag');
      const result2 = featureFlagService.isEnabled('test-flag');
      
      expect(result1).toBe(result2);
    });

    it('should handle anonymous users', () => {
      featureFlagService.createFlag({
        name: 'test-flag',
        enabled: true,
        rolloutPercentage: 50,
        metadata: {
          description: 'Test flag',
          owner: 'test',
          createdAt: new Date(),
          lastModified: new Date()
        }
      });

      // Should not throw error for anonymous users
      expect(() => {
        featureFlagService.isEnabled('test-flag');
      }).not.toThrow();
    });
  });
});