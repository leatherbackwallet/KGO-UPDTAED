/**
 * Keep-Alive Utility
 * Prevents services from going to sleep due to inactivity
 */

import { Request, Response, NextFunction } from 'express';
import { connectToDatabase, isDatabaseConnected } from './database';

// Keep-alive configuration
const KEEP_ALIVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const HEALTH_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes

let keepAliveTimer: NodeJS.Timeout | null = null;
let healthCheckTimer: NodeJS.Timeout | null = null;

/**
 * Start keep-alive mechanism
 */
export function startKeepAlive(): void {
  console.log('🔄 Starting keep-alive mechanism...');
  
  // Keep-alive ping every 5 minutes
  keepAliveTimer = setInterval(async () => {
    try {
      // Ping database to keep connection alive
      if (isDatabaseConnected()) {
        console.log('💓 Keep-alive ping: Database connection active');
      } else {
        console.log('🔄 Keep-alive ping: Reconnecting to database...');
        await connectToDatabase();
      }
    } catch (error) {
      console.error('❌ Keep-alive ping failed:', error);
    }
  }, KEEP_ALIVE_INTERVAL);

  // Health check every 2 minutes
  healthCheckTimer = setInterval(async () => {
    try {
      const healthStatus = await performHealthCheck();
      console.log(`🏥 Health check: ${healthStatus.status}`);
    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  }, HEALTH_CHECK_INTERVAL);
}

/**
 * Stop keep-alive mechanism
 */
export function stopKeepAlive(): void {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
  
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
  
  console.log('🛑 Keep-alive mechanism stopped');
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  database: boolean;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
}> {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();
  
  // Check database connection
  const databaseConnected = isDatabaseConnected();
  
  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
  const usedMemory = memoryUsage.heapUsed;
  const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);
  
  const healthStatus = {
    status: databaseConnected && memoryPercentage < 90 ? 'healthy' : 'unhealthy' as 'healthy' | 'unhealthy',
    timestamp,
    database: databaseConnected,
    memory: {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: memoryPercentage
    },
    uptime: Math.round(uptime)
  };
  
  return healthStatus;
}

/**
 * Express middleware for health check endpoint
 */
export function healthCheckMiddleware(req: Request, res: Response, next: NextFunction): void {
  performHealthCheck()
    .then(health => {
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    })
    .catch(error => {
      console.error('Health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    });
}

/**
 * Express middleware for keep-alive endpoint
 */
export function keepAliveMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    message: 'Service is alive and running'
  });
}

// Auto-start keep-alive when module is imported
startKeepAlive();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, stopping keep-alive...');
  stopKeepAlive();
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, stopping keep-alive...');
  stopKeepAlive();
});
