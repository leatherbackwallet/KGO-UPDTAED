/**
 * Request Logging Middleware
 * Logs all incoming requests and responses for debugging and monitoring
 */

import { Request, Response, NextFunction } from 'express';

interface LoggedRequest extends Request {
  body?: any;
}

interface LoggedResponse extends Response {
  json: (data: any) => Response;
}

// Request logging middleware
export const logger = (req: LoggedRequest, res: LoggedResponse, next: NextFunction): void => {
  const start = Date.now();
  const { method, url, ip, headers } = req;
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${method} ${url} - IP: ${ip}`);
  
  // Log request body for non-GET requests (excluding sensitive data)
  if (method !== 'GET' && req.body) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
    console.log(`Request Body:`, sanitizedBody);
  }
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data: any): Response {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Log response
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${statusCode} (${duration}ms)`);
    
    // Log error responses
    if (statusCode >= 400) {
      console.error(`Error Response:`, data);
    }
    
    // Call original json method
    return originalJson.call(this, data);
  };
  
  next();
};

// Error logging middleware
export const errorLogger = (err: Error, req: LoggedRequest, res: Response, next: NextFunction): void => {
  const { method, url, ip } = req;
  
  console.error(`[${new Date().toISOString()}] ERROR ${method} ${url} - IP: ${ip}`);
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    name: err.name
  });
  
  next(err);
};
