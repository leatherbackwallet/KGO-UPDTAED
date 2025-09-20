"use strict";
/**
 * Database Connection Middleware
 * Ensures MongoDB connection before processing requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDatabaseConnection = ensureDatabaseConnection;
exports.optionalDatabaseConnection = optionalDatabaseConnection;
const database_1 = require("../utils/database");
/**
 * Middleware to ensure database connection
 */
async function ensureDatabaseConnection(req, res, next) {
    try {
        // Check if already connected
        if ((0, database_1.isDatabaseConnected)()) {
            return next();
        }
        // Connect to database
        await (0, database_1.connectToDatabase)();
        next();
    }
    catch (error) {
        console.error('Database connection failed:', error);
        res.status(503).json({
            success: false,
            error: {
                message: 'Database connection failed',
                code: 'DATABASE_ERROR'
            }
        });
    }
}
/**
 * Optional database connection middleware
 * Continues even if connection fails (for health checks)
 */
async function optionalDatabaseConnection(req, res, next) {
    try {
        if (!(0, database_1.isDatabaseConnected)()) {
            await (0, database_1.connectToDatabase)();
        }
    }
    catch (error) {
        console.warn('Optional database connection failed:', error);
        // Continue without database connection
    }
    next();
}
