import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Health check endpoint for App Engine frontend
 * Returns 200 if service is healthy
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Basic health check - service is running
    return res.status(200).json({
      status: 'healthy',
      service: 'frontend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '3.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Frontend health check error:', error);
    return res.status(503).json({
      status: 'unhealthy',
      service: 'frontend',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
}
