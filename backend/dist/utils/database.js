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
// Monitor connection status
setInterval(() => {
    if (mongoose_1.default.connection.readyState === 1) {
        console.log(`📊 DB Status: Connected (${mongoose_1.default.connection.readyState})`);
    }
    else {
        console.log(`⚠️ DB Status: Disconnected (${mongoose_1.default.connection.readyState})`);
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
