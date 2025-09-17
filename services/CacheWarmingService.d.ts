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
declare class CacheWarmingService {
    private config;
    private isRunning;
    private scheduledJobs;
    private warmingHistory;
    constructor();
    private getDefaultConfig;
    private initializeScheduledJobs;
    start(): void;
    stop(): void;
    private performInitialCacheWarming;
    private performCacheWarming;
    private warmHighPriorityEndpoints;
    private getEndpointsToWarm;
    private warmEndpoints;
    private warmEndpoint;
    private logWarmingResults;
    private updateEndpointStats;
    private performCacheMaintenance;
    private clearStaleCache;
    private optimizeCacheStorage;
    private updateCacheStatistics;
    getCacheStatistics(): {
        totalEndpoints: number;
        activeEndpoints: number;
        successRate: number;
        averageResponseTime: number;
        lastWarmingTime: Date | null;
    };
    getEndpointStats(): Array<{
        url: string;
        priority: string;
        successCount: number;
        failureCount: number;
        successRate: number;
        lastWarmed: Date | null;
    }>;
    getWarmingHistory(limit?: number): CacheWarmingResult[];
    manualWarmup(endpointUrls?: string[]): Promise<CacheWarmingResult[]>;
    updateConfig(newConfig: Partial<CacheWarmingConfig>): void;
    getConfig(): CacheWarmingConfig;
}
export declare const cacheWarmingService: CacheWarmingService;
export default cacheWarmingService;
//# sourceMappingURL=CacheWarmingService.d.ts.map