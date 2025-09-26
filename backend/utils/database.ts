/**
 * Database Connection Utility
 * Handles MongoDB connection for serverless environments
 */

import mongoose from 'mongoose';

let isConnected = false;

/**
 * Connect to MongoDB with proper error handling for serverless
 */
export async function connectToDatabase(): Promise<void> {
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

    await mongoose.connect(process.env.MONGODB_URI, {
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
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Get database connection status
 */
export function getConnectionStatus(): string {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
}

/**
 * Disconnect from MongoDB (for cleanup)
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  }
}

// Handle connection events with better monitoring
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
  console.log(`📊 Connection state: ${mongoose.connection.readyState}`);
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
  isConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose reconnected to MongoDB');
  isConnected = true;
});

// Enhanced connection monitoring with detailed metrics
setInterval(() => {
  const connectionState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  if (connectionState === 1) {
    const stats = {
      readyState: states[connectionState],
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      collections: Object.keys(mongoose.connection.collections).length,
      models: Object.keys(mongoose.connection.models).length
    };
    
    console.log(`📊 DB Status: Connected - ${JSON.stringify(stats)}`);
  } else {
    console.log(`⚠️ DB Status: ${states[connectionState]} (${connectionState})`);
  }
}, 60000); // Check every minute

// Enhanced connection pool monitoring with detailed metrics
setInterval(() => {
  if (mongoose.connection.readyState === 1) {
    const poolStats = {
      totalConnections: (mongoose.connection.db as any)?.serverConfig?.pool?.totalConnectionCount || 0,
      availableConnections: (mongoose.connection.db as any)?.serverConfig?.pool?.availableConnectionCount || 0,
      checkedOutConnections: (mongoose.connection.db as any)?.serverConfig?.pool?.checkedOutConnectionCount || 0,
      waitQueueSize: (mongoose.connection.db as any)?.serverConfig?.pool?.waitQueueSize || 0,
      maxPoolSize: 100,
      minPoolSize: 10,
      utilization: 0
    };
    
    // Calculate pool utilization percentage
    if (poolStats.totalConnections > 0) {
      poolStats.utilization = Math.round((poolStats.checkedOutConnections / poolStats.totalConnections) * 100);
    }
    
    console.log(`🔗 MongoDB Pool Stats: ${JSON.stringify(poolStats)}`);
    
    // Enhanced alerting with different severity levels
    if (poolStats.waitQueueSize > 20) {
      console.error(`🚨 CRITICAL: Very high wait queue size: ${poolStats.waitQueueSize} connections waiting`);
    } else if (poolStats.waitQueueSize > 10) {
      console.warn(`⚠️ WARNING: High wait queue size: ${poolStats.waitQueueSize} connections waiting`);
    }
    
    if (poolStats.utilization > 90) {
      console.error(`🚨 CRITICAL: Very high connection usage: ${poolStats.utilization}% (${poolStats.checkedOutConnections}/${poolStats.totalConnections})`);
    } else if (poolStats.utilization > 75) {
      console.warn(`⚠️ WARNING: High connection usage: ${poolStats.utilization}% (${poolStats.checkedOutConnections}/${poolStats.totalConnections})`);
    } else if (poolStats.utilization > 0) {
      console.log(`📊 INFO: Connection usage: ${poolStats.utilization}% (${poolStats.checkedOutConnections}/${poolStats.totalConnections})`);
    }
    
    // Log connection efficiency metrics
    if (poolStats.availableConnections === 0 && poolStats.waitQueueSize > 0) {
      console.warn(`⚠️ PERFORMANCE: No available connections, ${poolStats.waitQueueSize} requests queued`);
    }
  }
}, 30000); // Check every 30 seconds

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});
