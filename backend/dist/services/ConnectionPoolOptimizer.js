"use strict";
/**
 * Connection Pool Optimizer
 * Prevents timeouts by optimizing database connections and request handling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionPoolOptimizer = exports.ConnectionPoolOptimizer = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
class ConnectionPoolOptimizer {
    constructor(config) {
        this.isOptimized = false;
        this.config = {
            maxPoolSize: 100,
            minPoolSize: 10,
            maxIdleTimeMS: 300000, // 5 minutes
            serverSelectionTimeoutMS: 45000, // 45 seconds
            socketTimeoutMS: 120000, // 2 minutes
            connectTimeoutMS: 45000, // 45 seconds
            maxConnecting: 5,
            heartbeatFrequencyMS: 30000, // 30 seconds
            ...config
        };
    }
    /**
     * Optimize MongoDB connection pool
     */
    async optimizeConnectionPool() {
        if (this.isOptimized) {
            console.log('📊 Connection pool already optimized');
            return;
        }
        try {
            console.log('🔧 Optimizing MongoDB connection pool...');
            // Get current connection
            const currentConnection = mongoose_1.default.connection;
            // Apply optimized configuration
            await mongoose_1.default.connect(process.env.MONGODB_URI, {
                maxPoolSize: this.config.maxPoolSize,
                minPoolSize: this.config.minPoolSize,
                maxIdleTimeMS: this.config.maxIdleTimeMS,
                serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS,
                socketTimeoutMS: this.config.socketTimeoutMS,
                connectTimeoutMS: this.config.connectTimeoutMS,
                bufferCommands: false,
                retryWrites: true,
                w: 'majority',
                maxConnecting: this.config.maxConnecting,
                heartbeatFrequencyMS: this.config.heartbeatFrequencyMS,
                compressors: ['zstd', 'zlib', 'snappy'],
                readPreference: 'primary',
                readConcern: { level: 'majority' }
            });
            this.isOptimized = true;
            console.log('✅ Connection pool optimized successfully');
            // Start monitoring
            this.startMonitoring();
        }
        catch (error) {
            console.error('❌ Failed to optimize connection pool:', error);
            throw error;
        }
    }
    /**
     * Start monitoring connection pool health
     */
    startMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.monitoringInterval = setInterval(() => {
            this.logPoolStats();
        }, 30000); // Every 30 seconds
        console.log('📊 Connection pool monitoring started');
    }
    /**
     * Get current pool statistics
     */
    getPoolStats() {
        const connection = mongoose_1.default.connection;
        const db = connection.db;
        if (!db) {
            return {
                totalConnections: 0,
                availableConnections: 0,
                checkedOutConnections: 0,
                waitQueueSize: 0,
                maxPoolSize: this.config.maxPoolSize,
                minPoolSize: this.config.minPoolSize,
                utilization: 0
            };
        }
        // Get connection pool stats from MongoDB driver
        const serverConfig = db.serverConfig;
        const pool = serverConfig?.pool;
        const totalConnections = pool?.totalConnectionCount || 0;
        const availableConnections = pool?.availableConnectionCount || 0;
        const checkedOutConnections = pool?.checkedOutConnectionCount || 0;
        const waitQueueSize = pool?.waitQueueSize || 0;
        const utilization = totalConnections > 0
            ? Math.round((checkedOutConnections / totalConnections) * 100)
            : 0;
        return {
            totalConnections,
            availableConnections,
            checkedOutConnections,
            waitQueueSize,
            maxPoolSize: this.config.maxPoolSize,
            minPoolSize: this.config.minPoolSize,
            utilization
        };
    }
    /**
     * Log pool statistics with alert levels
     */
    logPoolStats() {
        const stats = this.getPoolStats();
        const alertLevel = this.getAlertLevel(stats);
        const logMessage = {
            timestamp: new Date().toISOString(),
            ...stats,
            alertLevel
        };
        switch (alertLevel) {
            case 'INFO':
                console.log('📊 MongoDB Pool Stats:', logMessage);
                break;
            case 'WARNING':
                console.warn('⚠️ MongoDB Pool Warning:', logMessage);
                break;
            case 'CRITICAL':
                console.error('🚨 MongoDB Pool Critical:', logMessage);
                break;
        }
    }
    /**
     * Determine alert level based on pool stats
     */
    getAlertLevel(stats) {
        if (stats.utilization > 90 || stats.waitQueueSize > 20) {
            return 'CRITICAL';
        }
        else if (stats.utilization > 75 || stats.waitQueueSize > 10) {
            return 'WARNING';
        }
        else {
            return 'INFO';
        }
    }
    /**
     * Optimize pool configuration based on current load
     */
    async optimizeForLoad(currentLoad) {
        if (currentLoad > 0.8) {
            // High load - increase pool size
            this.config.maxPoolSize = Math.min(150, this.config.maxPoolSize + 20);
            this.config.minPoolSize = Math.min(20, this.config.minPoolSize + 5);
            console.log('📈 Optimizing for high load - increasing pool size');
        }
        else if (currentLoad < 0.3) {
            // Low load - decrease pool size to save resources
            this.config.maxPoolSize = Math.max(50, this.config.maxPoolSize - 10);
            this.config.minPoolSize = Math.max(5, this.config.minPoolSize - 2);
            console.log('📉 Optimizing for low load - decreasing pool size');
        }
    }
    /**
     * Handle connection errors gracefully
     */
    handleConnectionError(error) {
        console.error('🔌 Connection error detected:', error.message);
        // Reset connection if needed
        if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
            console.log('🔄 Attempting to reset connection...');
            this.resetConnection();
        }
    }
    /**
     * Reset connection pool
     */
    async resetConnection() {
        try {
            await mongoose_1.default.disconnect();
            await this.optimizeConnectionPool();
            console.log('✅ Connection pool reset successfully');
        }
        catch (error) {
            console.error('❌ Failed to reset connection pool:', error);
        }
    }
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
            console.log('📊 Connection pool monitoring stopped');
        }
    }
    /**
     * Get optimization recommendations
     */
    getOptimizationRecommendations() {
        const stats = this.getPoolStats();
        const recommendations = [];
        if (stats.utilization > 80) {
            recommendations.push('Consider increasing maxPoolSize - high utilization detected');
        }
        if (stats.waitQueueSize > 10) {
            recommendations.push('Consider increasing minPoolSize - wait queue is building up');
        }
        if (stats.availableConnections < 5) {
            recommendations.push('Consider increasing minPoolSize - low available connections');
        }
        if (recommendations.length === 0) {
            recommendations.push('Connection pool is well optimized');
        }
        return recommendations;
    }
}
exports.ConnectionPoolOptimizer = ConnectionPoolOptimizer;
// Export singleton instance
exports.connectionPoolOptimizer = new ConnectionPoolOptimizer();
