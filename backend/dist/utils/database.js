"use strict";
/**
 * Database Connection Utility
 * Handles MongoDB connection for serverless environments
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.isDatabaseConnected = isDatabaseConnected;
exports.getConnectionStatus = getConnectionStatus;
exports.disconnectFromDatabase = disconnectFromDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
let isConnected = false;
/**
 * Connect to MongoDB with proper error handling for serverless
 */
async function connectToDatabase() {
    if (isConnected) {
        console.log('MongoDB already connected');
        return;
    }
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is required');
        }
        // Validate Atlas connection
        if (!process.env.MONGODB_URI.includes('mongodb+srv://') ||
            !process.env.MONGODB_URI.includes('mongodb.net') ||
            process.env.MONGODB_URI.includes('localhost') ||
            process.env.MONGODB_URI.includes('127.0.0.1')) {
            throw new Error('MongoDB Atlas must be used. Local MongoDB is not allowed.');
        }
        await mongoose_1.default.connect(process.env.MONGODB_URI, {
            maxPoolSize: 50, // Optimized for App Engine
            minPoolSize: 5, // Always maintain minimum connections
            maxIdleTimeMS: 300000, // 5 minutes - keep connections alive longer
            serverSelectionTimeoutMS: 45000, // Longer timeout for cold starts
            socketTimeoutMS: 120000, // 2 minutes for slow operations
            connectTimeoutMS: 45000, // Connection timeout for cold starts
            bufferCommands: false,
            retryWrites: true,
            w: 'majority',
            maxConnecting: 5, // Limit concurrent connection attempts
            heartbeatFrequencyMS: 30000, // Less frequent heartbeats to reduce overhead
            compressors: ['zstd', 'zlib', 'snappy'], // Enable compression
            readPreference: 'primary', // Always read from primary
            readConcern: { level: 'majority' }, // Ensure read consistency
        });
        isConnected = true;
        console.log('✅ MongoDB connected successfully');
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}
/**
 * Check if database is connected
 */
function isDatabaseConnected() {
    return isConnected && mongoose_1.default.connection.readyState === 1;
}
/**
 * Get database connection status
 */
function getConnectionStatus() {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    return states[mongoose_1.default.connection.readyState] || 'unknown';
}
/**
 * Disconnect from MongoDB (for cleanup)
 */
async function disconnectFromDatabase() {
    if (isConnected) {
        await mongoose_1.default.disconnect();
        isConnected = false;
        console.log('MongoDB disconnected');
    }
}
// Handle connection events with better monitoring
mongoose_1.default.connection.on('connected', () => {
    console.log('✅ Mongoose connected to MongoDB');
    console.log(`📊 Connection state: ${mongoose_1.default.connection.readyState}`);
    isConnected = true;
});
mongoose_1.default.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
    isConnected = false;
});
mongoose_1.default.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose disconnected from MongoDB');
    isConnected = false;
});
mongoose_1.default.connection.on('reconnected', () => {
    console.log('🔄 Mongoose reconnected to MongoDB');
    isConnected = true;
});
// Enhanced connection monitoring with detailed metrics
// OPTIMIZED: Reduced frequency and removed collection enumeration to prevent blocking
setInterval(() => {
    const connectionState = mongoose_1.default.connection.readyState;
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    if (connectionState === 1) {
        // OPTIMIZED: Removed collection enumeration to prevent database blocking
        // Only log essential connection info without querying collections
        const stats = {
            readyState: states[connectionState],
            host: mongoose_1.default.connection.host,
            port: mongoose_1.default.connection.port,
            name: mongoose_1.default.connection.name,
            // Removed collections count to prevent blocking
            models: Object.keys(mongoose_1.default.connection.models).length
        };
        console.log(`📊 DB Status: Connected - ${JSON.stringify(stats)}`);
    }
    else {
        console.log(`⚠️ DB Status: ${states[connectionState]} (${connectionState})`);
    }
}, 300000); // OPTIMIZED: Check every 5 minutes instead of every minute to reduce overhead
// Enhanced connection pool monitoring with detailed metrics
// OPTIMIZED: Reduced frequency and only log warnings/errors to prevent log spam
setInterval(() => {
    if (mongoose_1.default.connection.readyState === 1) {
        const poolStats = {
            totalConnections: mongoose_1.default.connection.db?.serverConfig?.pool?.totalConnectionCount || 0,
            availableConnections: mongoose_1.default.connection.db?.serverConfig?.pool?.availableConnectionCount || 0,
            checkedOutConnections: mongoose_1.default.connection.db?.serverConfig?.pool?.checkedOutConnectionCount || 0,
            waitQueueSize: mongoose_1.default.connection.db?.serverConfig?.pool?.waitQueueSize || 0,
            maxPoolSize: 100,
            minPoolSize: 10,
            utilization: 0
        };
        // Calculate pool utilization percentage
        if (poolStats.totalConnections > 0) {
            poolStats.utilization = Math.round((poolStats.checkedOutConnections / poolStats.totalConnections) * 100);
        }
        // OPTIMIZED: Only log when there are issues, not on every check
        // Enhanced alerting with different severity levels
        if (poolStats.waitQueueSize > 20) {
            console.error(`🚨 CRITICAL: Very high wait queue size: ${poolStats.waitQueueSize} connections waiting`);
        }
        else if (poolStats.waitQueueSize > 10) {
            console.warn(`⚠️ WARNING: High wait queue size: ${poolStats.waitQueueSize} connections waiting`);
        }
        if (poolStats.utilization > 90) {
            console.error(`🚨 CRITICAL: Very high connection usage: ${poolStats.utilization}% (${poolStats.checkedOutConnections}/${poolStats.totalConnections})`);
        }
        else if (poolStats.utilization > 75) {
            console.warn(`⚠️ WARNING: High connection usage: ${poolStats.utilization}% (${poolStats.checkedOutConnections}/${poolStats.totalConnections})`);
        }
        // Removed normal info logging to reduce overhead
        // Log connection efficiency metrics
        if (poolStats.availableConnections === 0 && poolStats.waitQueueSize > 0) {
            console.warn(`⚠️ PERFORMANCE: No available connections, ${poolStats.waitQueueSize} requests queued`);
        }
    }
}, 120000); // OPTIMIZED: Check every 2 minutes instead of every 30 seconds to reduce overhead
// Graceful shutdown
process.on('SIGINT', async () => {
    await disconnectFromDatabase();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await disconnectFromDatabase();
    process.exit(0);
});
