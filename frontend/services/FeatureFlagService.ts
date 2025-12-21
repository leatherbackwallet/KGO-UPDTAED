/**
 * Feature Flag Service
 * Manages feature flags with rollout percentages, conditions, and remote configuration
 */

export interface FeatureFlagConditions {
  environment?: string[];
  userAgent?: string[];
  userId?: string[];
}

export interface FeatureFlagMetadata {
  description: string;
  owner: string;
  createdAt: Date | string;
  lastModified: Date | string;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: FeatureFlagConditions;
  metadata: FeatureFlagMetadata;
}

interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
}

class FeatureFlagServiceClass {
  private flags: Record<string, FeatureFlag> = {};
  private userId: string | null = null;
  private readonly STORAGE_KEY = 'featureFlags';
  private readonly REMOTE_API_URL = '/api/feature-flags';
  private readonly DEFAULT_USER_COUNT = 1000;

  constructor() {
    this.loadFromLocalStorage();
    this.loadFromRemote();
  }

  /**
   * Check if a feature flag is enabled for the current user
   */
  isEnabled(flagName: string): boolean {
    const flag = this.flags[flagName];

    if (!flag) {
      return false;
    }

    if (!flag.enabled) {
      return false;
    }

    // Check conditions
    if (flag.conditions) {
      // Environment check
      if (flag.conditions.environment) {
        const currentEnv = process.env.NODE_ENV || 'development';
        if (!flag.conditions.environment.includes(currentEnv)) {
          return false;
        }
      }

      // User agent check
      if (flag.conditions.userAgent && typeof window !== 'undefined') {
        const userAgent = navigator.userAgent;
        const matches = flag.conditions.userAgent.some(ua => userAgent.includes(ua));
        if (!matches) {
          return false;
        }
      }

      // User ID check
      if (flag.conditions.userId) {
        if (!this.userId || !flag.conditions.userId.includes(this.userId)) {
          return false;
        }
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const userHash = this.getUserHash(flagName);
      const percentage = userHash % 100;
      if (percentage >= flag.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get full flag configuration
   */
  getFlag(flagName: string): FeatureFlag | null {
    return this.flags[flagName] || null;
  }

  /**
   * Create a new feature flag
   */
  createFlag(flag: FeatureFlag): void {
    this.flags[flag.name] = {
      ...flag,
      metadata: {
        ...flag.metadata,
        createdAt: flag.metadata.createdAt instanceof Date 
          ? flag.metadata.createdAt 
          : new Date(flag.metadata.createdAt),
        lastModified: flag.metadata.lastModified instanceof Date 
          ? flag.metadata.lastModified 
          : new Date(flag.metadata.lastModified)
      }
    };
    this.saveToLocalStorage();
  }

  /**
   * Update an existing feature flag
   */
  updateFlag(flagName: string, updates: Partial<FeatureFlag>): void {
    if (!this.flags[flagName]) {
      throw new Error(`Feature flag ${flagName} does not exist`);
    }

    this.flags[flagName] = {
      ...this.flags[flagName],
      ...updates,
      metadata: {
        ...this.flags[flagName].metadata,
        ...updates.metadata,
        lastModified: new Date()
      }
    };
    this.saveToLocalStorage();
  }

  /**
   * Get enabled status for all flags
   */
  getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const flagName in this.flags) {
      result[flagName] = this.isEnabled(flagName);
    }
    return result;
  }

  /**
   * Get metrics for a feature flag
   */
  getFlagMetrics(flagName: string): {
    enabled: boolean;
    rolloutPercentage: number;
    estimatedUsers: number;
  } {
    const flag = this.flags[flagName];
    if (!flag) {
      return {
        enabled: false,
        rolloutPercentage: 0,
        estimatedUsers: 0
      };
    }

    return {
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage,
      estimatedUsers: Math.floor((flag.rolloutPercentage / 100) * this.DEFAULT_USER_COUNT)
    };
  }

  /**
   * Set the current user ID for condition checking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Generate a consistent hash for the user based on flag name
   */
  private getUserHash(flagName: string): number {
    const seed = this.userId || (typeof window !== 'undefined' ? window.location.href : 'anonymous');
    const combined = `${flagName}-${seed}`;
    
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  /**
   * Load flags from localStorage
   */
  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const config: FeatureFlagConfig = JSON.parse(stored);
        if (config.flags) {
          // Convert date strings back to Date objects
          for (const flagName in config.flags) {
            const flag = config.flags[flagName];
            if (flag.metadata) {
              flag.metadata.createdAt = new Date(flag.metadata.createdAt);
              flag.metadata.lastModified = new Date(flag.metadata.lastModified);
            }
          }
          this.flags = config.flags;
        }
      }
    } catch (error) {
      console.warn('Failed to load feature flags from localStorage:', error);
    }
  }

  /**
   * Save flags to localStorage
   */
  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const config: FeatureFlagConfig = {
        flags: this.flags
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save feature flags to localStorage:', error);
    }
  }

  /**
   * Load flags from remote API
   */
  private async loadFromRemote(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const response = await fetch(this.REMOTE_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.flags) {
          // Merge remote flags with local flags (remote takes precedence)
          for (const flagName in data.flags) {
            const flag = data.flags[flagName];
            if (flag.metadata) {
              flag.metadata.createdAt = new Date(flag.metadata.createdAt);
              flag.metadata.lastModified = new Date(flag.metadata.lastModified);
            }
            this.flags[flagName] = flag;
          }
          this.saveToLocalStorage();
        }
      }
    } catch (error) {
      // Silently fail - remote loading is optional
      console.debug('Failed to load feature flags from remote API:', error);
    }
  }
}

// Export singleton instance
export const featureFlagService = new FeatureFlagServiceClass();



