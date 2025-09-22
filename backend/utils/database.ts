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
      maxPoolSize: 50, // Increased from 10 to 50 for better concurrency
      minPoolSize: 5, // Maintain minimum connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 10000, // Increased timeout for better reliability
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      w: 'majority', // Write concern for better reliability
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

// Monitor connection status
setInterval(() => {
  if (mongoose.connection.readyState === 1) {
    console.log(`📊 DB Status: Connected (${mongoose.connection.readyState})`);
  } else {
    console.log(`⚠️ DB Status: Disconnected (${mongoose.connection.readyState})`);
  }
}, 60000); // Check every minute

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});
