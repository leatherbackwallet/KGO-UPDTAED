"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const keepAlive_1 = require("../utils/keepAlive");
const router = express_1.default.Router();
/**
 * Health check endpoint for App Engine
 * Returns 200 if service is healthy, 503 if not
 */
router.get('/health', (req, res) => {
    try {
        // Check database connection
        const dbStatus = mongoose_1.default.connection.readyState;
        const dbStatusText = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        }[dbStatus] || 'unknown';
        // Service is healthy if database is connected
        if (dbStatus === 1) {
            return res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: dbStatusText,
                memory: process.memoryUsage(),
                version: process.env.npm_package_version || '3.0.0'
            });
        }
        else {
            return res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                database: dbStatusText,
                reason: 'Database not connected'
            });
        }
    }
    catch (error) {
        console.error('Health check error:', error);
        return res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});
/**
 * Readiness check endpoint
 * More strict than health - checks if service is ready to handle requests
 */
router.get('/ready', (req, res) => {
    try {
        const dbStatus = mongoose_1.default.connection.readyState;
        // Service is ready only if database is connected and stable
        if (dbStatus === 1) {
            return res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString()
            });
        }
        else {
            return res.status(503).json({
                status: 'not ready',
                timestamp: new Date().toISOString(),
                reason: 'Database not ready'
            });
        }
    }
    catch (error) {
        console.error('Readiness check error:', error);
        return res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
            error: 'Readiness check failed'
        });
    }
});
/**
 * Enhanced health check with detailed monitoring
 */
router.get('/health-status', keepAlive_1.healthCheckMiddleware);
/**
 * Keep-alive endpoint to prevent service sleep
 */
router.get('/keep-alive', keepAlive_1.keepAliveMiddleware);
// Debug endpoint to check file system
router.get('/debug-files', (req, res) => {
    try {
        const cwd = process.cwd();
        const productsPath = path_1.default.join(cwd, 'Products');
        const productsFile = path_1.default.join(productsPath, 'keralagiftsonline.products.json');
        const categoriesFile = path_1.default.join(productsPath, 'keralagiftsonline.categories.json');
        const occasionsFile = path_1.default.join(productsPath, 'keralagiftsonline.occasions.json');
        // Check if files exist and get their stats
        const files = {
            cwd,
            productsPath,
            productsFile,
            categoriesFile,
            occasionsFile,
            productsExists: fs_1.default.existsSync(productsFile),
            categoriesExists: fs_1.default.existsSync(categoriesFile),
            occasionsExists: fs_1.default.existsSync(occasionsFile),
            productsDirExists: fs_1.default.existsSync(productsPath),
            productsDirContents: fs_1.default.existsSync(productsPath) ? fs_1.default.readdirSync(productsPath) : [],
            // Get file stats if they exist
            productsFileStats: fs_1.default.existsSync(productsFile) ? fs_1.default.statSync(productsFile) : null,
            categoriesFileStats: fs_1.default.existsSync(categoriesFile) ? fs_1.default.statSync(categoriesFile) : null,
            occasionsFileStats: fs_1.default.existsSync(occasionsFile) ? fs_1.default.statSync(occasionsFile) : null,
            // Check parent directories
            appDirContents: fs_1.default.existsSync('/app') ? fs_1.default.readdirSync('/app') : [],
            workingDirContents: fs_1.default.readdirSync(cwd)
        };
        res.status(200).json(files);
    }
    catch (error) {
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});
exports.default = router;
