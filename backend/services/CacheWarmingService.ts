/**
 * Cache Warming Service
 * Automated cache warming and maintenance procedures for optimal performance
 */

import cron from 'node-cron';
import { productionMonitoringService } from './ProductionMonitoringService';

interface CacheWarmingConfig {
  enabled: boolean;
  schedule: string;
  endpoints: CacheEndpoint[];
  concurrency: number;
  timeout: number;
  retries: number;
}

interface CacheEndpoint {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  priority: 'high' | 'medium' | 'low';
  frequency: 'always' | 'daily' | 'weekly';
  lastWarmed?: Date;
  successCount: number;
  failureCount: number;
}

interface CacheWarmingResult {
  endpoint: string;
  success: boolean;
  responseTime: number;
  error?: string;
  timestamp: Date;
}

class CacheWarmingService {
  private config: CacheWarmingConfig;
  private isRunning: boolean = false;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private warmingHistory: CacheWarmingResult[] = [];

  constructor() {
    this.config = this.getDefaultConfig();
    this.initializeScheduledJobs();
  }

  private getDefaultConfig(): CacheWarmingConfig {
    return {
      enabled: process.env.CACHE_WARMING_ENABLED === 'true',
      schedule: process.env.CACHE_WARMING_SCHEDULE || '0 */6 * * *', // Every 6 hours
      concurrency: parseInt(process.env.CACHE_WARMING_CONCURRENCY || '5'),
      timeout: parseInt(process.env.CACHE_WARMING_TIMEOUT || '30000'), // 30 seconds
      retries: parseInt(process.env.CACHE_WARMING_RETRIES || '2'),
      endpoints: [
        // Product-related endpoints
        {
          url: '/api/products?limit=50&sort=popular',
          method: 'GET',
          priority: 'high',
          frequency: 'always',
          successCount: 0,
          failureCount: 0
        },
        {
          url: '/api/products?limit=50&sort=newest',
          method: 'GET',
          priority: 'high',
          frequency: 'always',
          successCount: 0,
          failureCount: 0
        },
        {
          url: '/api/categories',
          method: 'GET',
          priority: 'high',
          frequency: 'always',
          successCount: 0,
          failureCount: 0
        },
        {
          url: '/api/products?category=electronics&limit=20',
          method: 'GET',
          priority: 'medium',
          frequency: 'daily',
          successCount: 0,
          failureCount: 0
        },
        {
          url: '/api/products?category=clothing&limit=20',
          method: 'GET',
          priority: 'medium',
          frequency: 'daily',
          successCount: 0,
          failureCount: 0
        },
        {
          url: '/api/products?category=home&limit=20',
          method: 'GET',
          priority: 'medium',
          frequency: 'daily',
          successCount: 0,
          failureCount: 0
        },
        // Image endpoints
        {
          url: '/api/images/popular',
          method: 'GET',
          priority: 'medium',
          frequency: 'daily',
          successCount: 0,
          failureCount: 0
        },
        // Health and monitoring endpoints
        {
          url: '/api/health/check',
          method: 'GET',
          priority: 'low',
          frequency: 'always',
          successCount: 0,
          failureCount: 0
        },
        {
          url: '/api/feature-flags/health/check',
          method: 'GET',
          priority: 'low',
          frequency: 'always',
          successCount: 0,
          failureCount: 0
        }
      ]
    };
  }

  private initializeScheduledJobs(): void {
    if (!this.config.enabled) {
      console.log('Cache warming is disabled');
      return;
    }

    // Main cache warming job
    const mainJob = cron.schedule(this.config.schedule, async () => {
      await this.performCacheWarming();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.scheduledJobs.set('main', mainJob);

    // High-priority endpoints every hour
    const highPriorityJob = cron.schedule('0 * * * *', async () => {
      await this.warmHighPriorityEndpoints();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.scheduledJobs.set('high-priority', highPriorityJob);

    // Cache maintenance every 4 hours
    const maintenanceJob = cron.schedule('0 */4 * * *', async () => {
      await this.performCacheMaintenance();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.scheduledJobs.set('maintenance', maintenanceJob);

    console.log('Cache warming jobs initialized');
  }

  public start(): void {
    if (this.isRunning) {
      console.warn('Cache warming service is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('Cache warming is disabled, not starting');
      return;
    }

    this.isRunning = true;
    
    // Start all scheduled jobs
    this.scheduledJobs.forEach((job, name) => {
      job.start();
      console.log(`Started cache warming job: ${name}`);
    });

    // Perform initial cache warming
    setTimeout(() => {
      this.performInitialCacheWarming();
    }, 5000); // Wait 5 seconds after startup

    console.log('Cache warming service started');
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Stop all scheduled jobs
    this.scheduledJobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped cache warming job: ${name}`);
    });

    console.log('Cache warming service stopped');
  }

  private async performInitialCacheWarming(): Promise<void> {
    console.log('Performing initial cache warming...');
    
    try {
      // Warm high-priority endpoints first
      await this.warmHighPriorityEndpoints();
      
      // Then warm medium priority endpoints
      const mediumPriorityEndpoints = this.config.endpoints.filter(e => e.priority === 'medium');
      await this.warmEndpoints(mediumPriorityEndpoints);
      
      console.log('Initial cache warming completed');
    } catch (error) {
      console.error('Initial cache warming failed:', error);
    }
  }

  private async performCacheWarming(): Promise<void> {
    console.log('Performing scheduled cache warming...');
    
    try {
      const endpointsToWarm = this.getEndpointsToWarm();
      const results = await this.warmEndpoints(endpointsToWarm);
      
      this.logWarmingResults(results);
      this.updateEndpointStats(results);
      
      // Report to monitoring service
      const successRate = results.filter(r => r.success).length / results.length * 100;
      console.log(`Cache warming completed: ${results.length} endpoints, ${successRate.toFixed(1)}% success rate`);
      
    } catch (error) {
      console.error('Scheduled cache warming failed:', error);
    }
  }

  private async warmHighPriorityEndpoints(): Promise<void> {
    const highPriorityEndpoints = this.config.endpoints.filter(e => e.priority === 'high');
    const results = await this.warmEndpoints(highPriorityEndpoints);
    
    console.log(`High-priority cache warming: ${results.length} endpoints warmed`);
  }

  private getEndpointsToWarm(): CacheEndpoint[] {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.config.endpoints.filter(endpoint => {
      switch (endpoint.frequency) {
        case 'always':
          return true;
        case 'daily':
          return !endpoint.lastWarmed || endpoint.lastWarmed < oneDayAgo;
        case 'weekly':
          return !endpoint.lastWarmed || endpoint.lastWarmed < oneWeekAgo;
        default:
          return false;
      }
    });
  }

  private async warmEndpoints(endpoints: CacheEndpoint[]): Promise<CacheWarmingResult[]> {
    const results: CacheWarmingResult[] = [];
    
    // Process endpoints in batches based on concurrency setting
    for (let i = 0; i < endpoints.length; i += this.config.concurrency) {
      const batch = endpoints.slice(i, i + this.config.concurrency);
      const batchPromises = batch.map(endpoint => this.warmEndpoint(endpoint));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            endpoint: batch[index]?.url || 'unknown',
            success: false,
            responseTime: 0,
            error: result.reason?.message || 'Unknown error',
            timestamp: new Date()
          });
        }
      });
      
      // Small delay between batches to avoid overwhelming the server
      if (i + this.config.concurrency < endpoints.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  private async warmEndpoint(endpoint: CacheEndpoint): Promise<CacheWarmingResult> {
    const startTime = Date.now();
    let attempt = 0;
    
    while (attempt <= this.config.retries) {
      try {
        const baseUrl = process.env.API_URL || 'http://localhost:3001';
        const fullUrl = `${baseUrl}${endpoint.url}`;
        
        const response = await fetch(fullUrl, {
          method: endpoint.method,
          headers: {
            'User-Agent': 'CacheWarmingService/1.0',
            'Cache-Control': 'no-cache',
            ...endpoint.headers
          },
          body: endpoint.body ? JSON.stringify(endpoint.body) : null,
          signal: AbortSignal.timeout(this.config.timeout)
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          // Consume the response to ensure it's fully processed
          await response.text();
          
          return {
            endpoint: endpoint.url,
            success: true,
            responseTime,
            timestamp: new Date()
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
      } catch (error) {
        attempt++;
        
        if (attempt > this.config.retries) {
          return {
            endpoint: endpoint.url,
            success: false,
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date()
          };
        }
        
        // Exponential backoff for retries
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    // This should never be reached, but TypeScript requires it
    return {
      endpoint: endpoint.url,
      success: false,
      responseTime: Date.now() - startTime,
      error: 'Max retries exceeded',
      timestamp: new Date()
    };
  }

  private logWarmingResults(results: CacheWarmingResult[]): void {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`Cache warming results: ${successful.length} successful, ${failed.length} failed`);
    
    if (failed.length > 0) {
      console.warn('Failed endpoints:');
      failed.forEach(result => {
        console.warn(`  ${result.endpoint}: ${result.error}`);
      });
    }
    
    // Keep warming history (last 1000 results)
    this.warmingHistory.push(...results);
    if (this.warmingHistory.length > 1000) {
      this.warmingHistory = this.warmingHistory.slice(-1000);
    }
  }

  private updateEndpointStats(results: CacheWarmingResult[]): void {
    results.forEach(result => {
      const endpoint = this.config.endpoints.find(e => e.url === result.endpoint);
      if (endpoint) {
        endpoint.lastWarmed = result.timestamp;
        if (result.success) {
          endpoint.successCount++;
        } else {
          endpoint.failureCount++;
        }
      }
    });
  }

  private async performCacheMaintenance(): Promise<void> {
    console.log('Performing cache maintenance...');
    
    try {
      // Clear stale cache entries (this would depend on your cache implementation)
      await this.clearStaleCache();
      
      // Optimize cache storage
      await this.optimizeCacheStorage();
      
      // Update cache statistics
      await this.updateCacheStatistics();
      
      console.log('Cache maintenance completed');
    } catch (error) {
      console.error('Cache maintenance failed:', error);
    }
  }

  private async clearStaleCache(): Promise<void> {
    // Implementation would depend on your cache system
    // For example, with Redis:
    // await redis.eval('return redis.call("del", unpack(redis.call("keys", ARGV[1])))', 0, 'cache:stale:*');
    console.log('Clearing stale cache entries...');
  }

  private async optimizeCacheStorage(): Promise<void> {
    // Implementation would depend on your cache system
    // For example, compacting cache files or optimizing memory usage
    console.log('Optimizing cache storage...');
  }

  private async updateCacheStatistics(): Promise<void> {
    // Calculate and update cache statistics
    const stats = this.getCacheStatistics();
    console.log('Cache statistics updated:', stats);
  }

  // Public API methods
  public getCacheStatistics(): {
    totalEndpoints: number;
    activeEndpoints: number;
    successRate: number;
    averageResponseTime: number;
    lastWarmingTime: Date | null;
  } {
    const totalEndpoints = this.config.endpoints.length;
    const activeEndpoints = this.config.endpoints.filter(e => e.lastWarmed).length;
    
    const recentResults = this.warmingHistory.slice(-100); // Last 100 results
    const successRate = recentResults.length > 0 
      ? recentResults.filter(r => r.success).length / recentResults.length * 100 
      : 0;
    
    const averageResponseTime = recentResults.length > 0
      ? recentResults.reduce((sum, r) => sum + r.responseTime, 0) / recentResults.length
      : 0;
    
    const lastWarmingTime = this.warmingHistory.length > 0
      ? this.warmingHistory[this.warmingHistory.length - 1]?.timestamp || null
      : null;
    
    return {
      totalEndpoints,
      activeEndpoints,
      successRate,
      averageResponseTime,
      lastWarmingTime
    };
  }

  public getEndpointStats(): Array<{
    url: string;
    priority: string;
    successCount: number;
    failureCount: number;
    successRate: number;
    lastWarmed: Date | null;
  }> {
    return this.config.endpoints.map(endpoint => ({
      url: endpoint.url,
      priority: endpoint.priority,
      successCount: endpoint.successCount,
      failureCount: endpoint.failureCount,
      successRate: endpoint.successCount + endpoint.failureCount > 0
        ? endpoint.successCount / (endpoint.successCount + endpoint.failureCount) * 100
        : 0,
      lastWarmed: endpoint.lastWarmed || null
    }));
  }

  public getWarmingHistory(limit: number = 50): CacheWarmingResult[] {
    return this.warmingHistory.slice(-limit);
  }

  public async manualWarmup(endpointUrls?: string[]): Promise<CacheWarmingResult[]> {
    console.log('Performing manual cache warmup...');
    
    const endpointsToWarm = endpointUrls
      ? this.config.endpoints.filter(e => endpointUrls.includes(e.url))
      : this.config.endpoints.filter(e => e.priority === 'high');
    
    const results = await this.warmEndpoints(endpointsToWarm);
    this.logWarmingResults(results);
    this.updateEndpointStats(results);
    
    return results;
  }

  public updateConfig(newConfig: Partial<CacheWarmingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.isRunning) {
      console.log('Restarting cache warming service with new configuration...');
      this.stop();
      this.initializeScheduledJobs();
      this.start();
    }
  }

  public getConfig(): CacheWarmingConfig {
    return { ...this.config };
  }
}

export const cacheWarmingService = new CacheWarmingService();
export default cacheWarmingService;