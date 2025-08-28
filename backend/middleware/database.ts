/**
 * Database Connection Middleware
 * Ensures MongoDB connection before processing requests
 */

import { Request, Response, NextFunction } from 'express';
import { connectToDatabase, isDatabaseConnected } from '../utils/database';

/**
 * Middleware to ensure database connection
 */
export async function ensureDatabaseConnection(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    // Check if already connected
    if (isDatabaseConnected()) {
      return next();
    }

    // Connect to database
    await connectToDatabase();
    next();
  } catch (error) {
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
export async function optionalDatabaseConnection(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    if (!isDatabaseConnected()) {
      await connectToDatabase();
    }
  } catch (error) {
    console.warn('Optional database connection failed:', error);
    // Continue without database connection
  }
  next();
}
