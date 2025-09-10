/**
 * Feature Flag Service for Gradual Rollout Strategy
 * Manages feature flags for reliability improvements with controlled testing
 */

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: {
    userAgent?: string[];
    userId?: string[];
    environment?: string[];
  };
  metadata?: {
    description: string;
    owner: string;
    createdAt: Date;
    lastModified: Date;
  };
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  defaultEnabled: boolean;
  environment: 'development' | 'staging' | 'production';
}

class FeatureFlagService {
  private config: FeatureFlagConfig;
  private userId: string | null = null;
  private userAgent: string;

  constructor() {
    this.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    this.config = this.getDefaultConfig();
    this.loadConfig();
  }

  private getDefaultConfig(): FeatureFlagConfig {
    return {
      flags: {
        // Reliability improvement feature flags
        'enhanced-retry-logic': {
          name: 'enhanced-retry-logic',
          enabled: false,
          rolloutPercentage: 0,
          metadata: {
            description: 'Enhanced API retry logic with exponential backoff',
            owner: 'reliability-team',
            createdAt: new Date(),
            lastModified: new Date()
          }
        },
        'advanced-caching': {
          name: 'advanced-caching',
          enabled: false,
          rolloutPercentage: 0,
          metadata: {
            description: 'Multi-level caching with intelligent invalidation',
            owner: 'reliability-team',
            createdAt: new Date(),
            lastModified: new Date()
          }
        },
        'robust-image-loading': {
          name: 'robust-image-loading',
          enabled: false,
          rolloutPercentage: 0,
          metadata: {
            description: 'Enhanced image loading with fallback chains',
            owner: 'reliability-team',
            createdAt: new Date(),
            lastModified: new Date()
          }
        },
        'connection-monitoring': {
          name: 'connection-monitoring',
          enabled: false,
          rolloutPercentage: 0,
          metadata: {
            description: 'Real-time connection status monitoring',
            owner: 'reliability-team',
            createdAt: new Date(),
            lastModified: new Date()
          }
        },
        'performance-monitoring': {
          name: 'performance-monitoring',
          enabled: false,
          rolloutPercentage: 0,
          metadata: {
            description: 'Comprehensive performance metrics collection',
            owner: 'reliability-team',
            createdAt: new Date(),
            lastModified: new Date()
          }
        },
        'error-recovery-ui': {
          name: 'error-recovery-ui',
          enabled: false,
          rolloutPercentage: 0,
          metadata: {
            description: 'Enhanced error recovery user interface',
            owner: 'reliability-team',
            createdAt: new Date(),
            lastModified: new Date()
          }
        }
      },
      defaultEnabled: false,
      environment: this.getEnvironment()
    };
  }

  private getEnvironment(): 'development' | 'staging' | 'production' {
    if (typeof window === 'undefined') return 'development';
    
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'development';
    } else if (hostname.includes('staging') || hostname.includes('dev')) {
      return 'staging';
    }
    return 'production';
  }

  private async loadConfig(): Promise<void> {
    try {
      // Try to load from remote config service
      const response = await fetch('/api/feature-flags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const remoteConfig = await response.json();
        this.config = { ...this.config, ...remoteConfig };
      }
    } catch (error) {
      console.warn('Failed to load remote feature flag config, using defaults:', error);
    }

    // Load from localStorage for development/testing
    try {
      const localConfig = localStorage.getItem('featureFlags');
      if (localConfig) {
        const parsedConfig = JSON.parse(localConfig);
        this.config = { ...this.config, flags: { ...this.config.flags, ...parsedConfig.flags } };
      }
    } catch (error) {
      console.warn('Failed to load local feature flag config:', error);
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public isEnabled(flagName: string): boolean {
    const flag = this.config.flags[flagName];
    if (!flag) {
      return this.config.defaultEnabled;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.getUserHash(flagName);
      if (hash > flag.rolloutPercentage) {
        return false;
      }
    }

    // Check conditions
    if (flag.conditions) {
      if (flag.conditions.environment && !flag.conditions.environment.includes(this.config.environment)) {
        return false;
      }

      if (flag.conditions.userAgent && !flag.conditions.userAgent.some(ua => this.userAgent.includes(ua))) {
        return false;
      }

      if (flag.conditions.userId && this.userId && !flag.conditions.userId.includes(this.userId)) {
        return false;
      }
    }

    return true;
  }

  private getUserHash(flagName: string): number {
    const identifier = this.userId || this.userAgent || 'anonymous';
    const combined = `${identifier}-${flagName}`;
    
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash) % 100;
  }

  public getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    Object.keys(this.config.flags).forEach(flagName => {
      result[flagName] = this.isEnabled(flagName);
    });
    return result;
  }

  public updateFlag(flagName: string, updates: Partial<FeatureFlag>): void {
    if (this.config.flags[flagName]) {
      this.config.flags[flagName] = {
        ...this.config.flags[flagName],
        ...updates,
        metadata: {
          ...this.config.flags[flagName].metadata!,
          lastModified: new Date()
        }
      };

      // Save to localStorage for development
      if (this.config.environment === 'development') {
        localStorage.setItem('featureFlags', JSON.stringify(this.config));
      }
    }
  }

  public createFlag(flag: FeatureFlag): void {
    this.config.flags[flag.name] = flag;
    
    // Save to localStorage for development
    if (this.config.environment === 'development') {
      localStorage.setItem('featureFlags', JSON.stringify(this.config));
    }
  }

  public getFlag(flagName: string): FeatureFlag | null {
    return this.config.flags[flagName] || null;
  }

  public getFlagMetrics(flagName: string): {
    enabled: boolean;
    rolloutPercentage: number;
    estimatedUsers: number;
  } {
    const flag = this.config.flags[flagName];
    if (!flag) {
      return { enabled: false, rolloutPercentage: 0, estimatedUsers: 0 };
    }

    return {
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage,
      estimatedUsers: Math.floor((flag.rolloutPercentage / 100) * 1000) // Estimated based on 1000 users
    };
  }
}

export const featureFlagService = new FeatureFlagService();
export default featureFlagService;