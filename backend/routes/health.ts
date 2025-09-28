import express from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { healthCheckMiddleware, keepAliveMiddleware } from '../utils/keepAlive';

const router = express.Router();

/**
 * Health check endpoint for App Engine
 * Returns 200 if service is healthy, 503 if not
 */
router.get('/health', (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState;
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
    } else {
      return res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: dbStatusText,
        reason: 'Database not connected'
      });
    }
  } catch (error) {
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
    const dbStatus = mongoose.connection.readyState;
    
    // Service is ready only if database is connected and stable
    if (dbStatus === 1) {
      return res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not ready'
      });
    }
  } catch (error) {
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
router.get('/health-status', healthCheckMiddleware);

/**
 * Keep-alive endpoint to prevent service sleep
 */
router.get('/keep-alive', keepAliveMiddleware);

// Debug endpoint to check file system
router.get('/debug-files', (req, res) => {
  try {
    const cwd = process.cwd();
    const productsPath = path.join(cwd, 'Products');
    const productsFile = path.join(productsPath, 'keralagiftsonline.products.json');
    const categoriesFile = path.join(productsPath, 'keralagiftsonline.categories.json');
    const occasionsFile = path.join(productsPath, 'keralagiftsonline.occasions.json');

    // Check if files exist and get their stats
    const files = {
      cwd,
      productsPath,
      productsFile,
      categoriesFile,
      occasionsFile,
      productsExists: fs.existsSync(productsFile),
      categoriesExists: fs.existsSync(categoriesFile),
      occasionsExists: fs.existsSync(occasionsFile),
      productsDirExists: fs.existsSync(productsPath),
      productsDirContents: fs.existsSync(productsPath) ? fs.readdirSync(productsPath) : [],
      // Get file stats if they exist
      productsFileStats: fs.existsSync(productsFile) ? fs.statSync(productsFile) : null,
      categoriesFileStats: fs.existsSync(categoriesFile) ? fs.statSync(categoriesFile) : null,
      occasionsFileStats: fs.existsSync(occasionsFile) ? fs.statSync(occasionsFile) : null,
      // Check parent directories
      appDirContents: fs.existsSync('/app') ? fs.readdirSync('/app') : [],
      workingDirContents: fs.readdirSync(cwd)
    };

    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;