"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheWarmingService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
class CacheWarmingService {
    constructor() {
        this.isRunning = false;
        this.scheduledJobs = new Map();
        this.warmingHistory = [];
        this.config = this.getDefaultConfig();
        this.initializeScheduledJobs();
    }
    getDefaultConfig() {
        return {
            enabled: process.env.CACHE_WARMING_ENABLED === 'true',
            schedule: process.env.CACHE_WARMING_SCHEDULE || '0 */6 * * *',
            concurrency: parseInt(process.env.CACHE_WARMING_CONCURRENCY || '5'),
            timeout: parseInt(process.env.CACHE_WARMING_TIMEOUT || '30000'),
            retries: parseInt(process.env.CACHE_WARMING_RETRIES || '2'),
            endpoints: [
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
                {
                    url: '/api/images/popular',
                    method: 'GET',
                    priority: 'medium',
                    frequency: 'daily',
                    successCount: 0,
                    failureCount: 0
                },
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
    initializeScheduledJobs() {
        if (!this.config.enabled) {
            console.log('Cache warming is disabled');
            return;
        }
        const mainJob = node_cron_1.default.schedule(this.config.schedule, async () => {
            await this.performCacheWarming();
        }, {
            scheduled: false,
            timezone: 'UTC'
        });
        this.scheduledJobs.set('main', mainJob);
        const highPriorityJob = node_cron_1.default.schedule('0 * * * *', async () => {
            await this.warmHighPriorityEndpoints();
        }, {
            scheduled: false,
            timezone: 'UTC'
        });
        this.scheduledJobs.set('high-priority', highPriorityJob);
        const maintenanceJob = node_cron_1.default.schedule('0 */4 * * *', async () => {
            await this.performCacheMaintenance();
        }, {
            scheduled: false,
            timezone: 'UTC'
        });
        this.scheduledJobs.set('maintenance', maintenanceJob);
        console.log('Cache warming jobs initialized');
    }
    start() {
        if (this.isRunning) {
            console.warn('Cache warming service is already running');
            return;
        }
        if (!this.config.enabled) {
            console.log('Cache warming is disabled, not starting');
            return;
        }
        this.isRunning = true;
        this.scheduledJobs.forEach((job, name) => {
            job.start();
            console.log(`Started cache warming job: ${name}`);
        });
        setTimeout(() => {
            this.performInitialCacheWarming();
        }, 5000);
        console.log('Cache warming service started');
    }
    stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        this.scheduledJobs.forEach((job, name) => {
            job.stop();
            console.log(`Stopped cache warming job: ${name}`);
        });
        console.log('Cache warming service stopped');
    }
    async performInitialCacheWarming() {
        console.log('Performing initial cache warming...');
        try {
            await this.warmHighPriorityEndpoints();
            const mediumPriorityEndpoints = this.config.endpoints.filter(e => e.priority === 'medium');
            await this.warmEndpoints(mediumPriorityEndpoints);
            console.log('Initial cache warming completed');
        }
        catch (error) {
            console.error('Initial cache warming failed:', error);
        }
    }
    async performCacheWarming() {
        console.log('Performing scheduled cache warming...');
        try {
            const endpointsToWarm = this.getEndpointsToWarm();
            const results = await this.warmEndpoints(endpointsToWarm);
            this.logWarmingResults(results);
            this.updateEndpointStats(results);
            const successRate = results.filter(r => r.success).length / results.length * 100;
            console.log(`Cache warming completed: ${results.length} endpoints, ${successRate.toFixed(1)}% success rate`);
        }
        catch (error) {
            console.error('Scheduled cache warming failed:', error);
        }
    }
    async warmHighPriorityEndpoints() {
        const highPriorityEndpoints = this.config.endpoints.filter(e => e.priority === 'high');
        const results = await this.warmEndpoints(highPriorityEndpoints);
        console.log(`High-priority cache warming: ${results.length} endpoints warmed`);
    }
    getEndpointsToWarm() {
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
    async warmEndpoints(endpoints) {
        const results = [];
        for (let i = 0; i < endpoints.length; i += this.config.concurrency) {
            const batch = endpoints.slice(i, i + this.config.concurrency);
            const batchPromises = batch.map(endpoint => this.warmEndpoint(endpoint));
            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    results.push({
                        endpoint: batch[index]?.url || 'unknown',
                        success: false,
                        responseTime: 0,
                        error: result.reason?.message || 'Unknown error',
                        timestamp: new Date()
                    });
                }
            });
            if (i + this.config.concurrency < endpoints.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return results;
    }
    async warmEndpoint(endpoint) {
        const startTime = Date.now();
        let attempt = 0;
        while (attempt <= this.config.retries) {
            try {
                const baseUrl = process.env.API_URL || 'http://localhost:3001';
                const fullUrl = `${baseUrl}${endpoint.url}`;
                const fetchOptions = {
                    method: endpoint.method,
                    headers: {
                        'User-Agent': 'CacheWarmingService/1.0',
                        'Cache-Control': 'no-cache',
                        ...endpoint.headers
                    },
                    signal: AbortSignal.timeout(this.config.timeout)
                };
                if (endpoint.body) {
                    fetchOptions.body = JSON.stringify(endpoint.body);
                }
                const response = await fetch(fullUrl, fetchOptions);
                const responseTime = Date.now() - startTime;
                if (response.ok) {
                    await response.text();
                    return {
                        endpoint: endpoint.url,
                        success: true,
                        responseTime,
                        timestamp: new Date()
                    };
                }
                else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
            catch (error) {
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
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
        return {
            endpoint: endpoint.url,
            success: false,
            responseTime: Date.now() - startTime,
            error: 'Max retries exceeded',
            timestamp: new Date()
        };
    }
    logWarmingResults(results) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        console.log(`Cache warming results: ${successful.length} successful, ${failed.length} failed`);
        if (failed.length > 0) {
            console.warn('Failed endpoints:');
            failed.forEach(result => {
                console.warn(`  ${result.endpoint}: ${result.error}`);
            });
        }
        this.warmingHistory.push(...results);
        if (this.warmingHistory.length > 1000) {
            this.warmingHistory = this.warmingHistory.slice(-1000);
        }
    }
    updateEndpointStats(results) {
        results.forEach(result => {
            const endpoint = this.config.endpoints.find(e => e.url === result.endpoint);
            if (endpoint) {
                endpoint.lastWarmed = result.timestamp;
                if (result.success) {
                    endpoint.successCount++;
                }
                else {
                    endpoint.failureCount++;
                }
            }
        });
    }
    async performCacheMaintenance() {
        console.log('Performing cache maintenance...');
        try {
            await this.clearStaleCache();
            await this.optimizeCacheStorage();
            await this.updateCacheStatistics();
            console.log('Cache maintenance completed');
        }
        catch (error) {
            console.error('Cache maintenance failed:', error);
        }
    }
    async clearStaleCache() {
        console.log('Clearing stale cache entries...');
    }
    async optimizeCacheStorage() {
        console.log('Optimizing cache storage...');
    }
    async updateCacheStatistics() {
        const stats = this.getCacheStatistics();
        console.log('Cache statistics updated:', stats);
    }
    getCacheStatistics() {
        const totalEndpoints = this.config.endpoints.length;
        const activeEndpoints = this.config.endpoints.filter(e => e.lastWarmed).length;
        const recentResults = this.warmingHistory.slice(-100);
        const successRate = recentResults.length > 0
            ? recentResults.filter(r => r.success).length / recentResults.length * 100
            : 0;
        const averageResponseTime = recentResults.length > 0
            ? recentResults.reduce((sum, r) => sum + r.responseTime, 0) / recentResults.length
            : 0;
        const lastWarmingTime = this.warmingHistory.length > 0
            ? this.warmingHistory[this.warmingHistory.length - 1]?.timestamp ?? null
            : null;
        return {
            totalEndpoints,
            activeEndpoints,
            successRate,
            averageResponseTime,
            lastWarmingTime
        };
    }
    getEndpointStats() {
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
    getWarmingHistory(limit = 50) {
        return this.warmingHistory.slice(-limit);
    }
    async manualWarmup(endpointUrls) {
        console.log('Performing manual cache warmup...');
        const endpointsToWarm = endpointUrls
            ? this.config.endpoints.filter(e => endpointUrls.includes(e.url))
            : this.config.endpoints.filter(e => e.priority === 'high');
        const results = await this.warmEndpoints(endpointsToWarm);
        this.logWarmingResults(results);
        this.updateEndpointStats(results);
        return results;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.isRunning) {
            console.log('Restarting cache warming service with new configuration...');
            this.stop();
            this.initializeScheduledJobs();
            this.start();
        }
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.cacheWarmingService = new CacheWarmingService();
exports.default = exports.cacheWarmingService;
//# sourceMappingURL=CacheWarmingService.js.map