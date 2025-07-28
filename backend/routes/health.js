/**
 * Health Check Routes
 * Provides system health monitoring and status endpoints
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getCacheStats } = require('../middleware/cache');

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Detailed health check with database status
router.get('/detailed', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const cacheStats = getCacheStats();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        connectionState: mongoose.connection.readyState
      },
      cache: cacheStats,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      version: process.version
    };

    res.json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database connectivity test
router.get('/db', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'database_disconnected',
        message: 'Database is not connected'
      });
    }

    // Test database connection with a simple query
    await mongoose.connection.db.admin().ping();
    
    res.json({
      status: 'database_healthy',
      message: 'Database connection is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(503).json({
      status: 'database_unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Cache status
router.get('/cache', (req, res) => {
  const cacheStats = getCacheStats();
  res.json({
    status: 'cache_healthy',
    stats: cacheStats,
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 