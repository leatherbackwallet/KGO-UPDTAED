/**
 * Feature Flags API Routes
 * Manages feature flag configuration and rollout control
 */

import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = express.Router();

// In-memory storage for feature flags (in production, use database)
let featureFlags: any = {
  flags: {
    'enhanced-retry-logic': {
      name: 'enhanced-retry-logic',
      enabled: false,
      rolloutPercentage: 0,
      conditions: {
        environment: ['development', 'staging']
      },
      metadata: {
        description: 'Enhanced API retry logic with exponential backoff',
        owner: 'reliability-team',
        createdAt: new Date(),
        lastModified: new Date()
      }
    },
    'advanced-caching': {
      name: 'advanced-caching',
      enabled: false,
      rolloutPercentage: 0,
      conditions: {
        environment: ['development', 'staging']
      },
      metadata: {
        description: 'Multi-level caching with intelligent invalidation',
        owner: 'reliability-team',
        createdAt: new Date(),
        lastModified: new Date()
      }
    },
    'robust-image-loading': {
      name: 'robust-image-loading',
      enabled: false,
      rolloutPercentage: 0,
      conditions: {
        environment: ['development', 'staging']
      },
      metadata: {
        description: 'Enhanced image loading with fallback chains',
        owner: 'reliability-team',
        createdAt: new Date(),
        lastModified: new Date()
      }
    },
    'connection-monitoring': {
      name: 'connection-monitoring',
      enabled: false,
      rolloutPercentage: 0,
      conditions: {
        environment: ['development', 'staging']
      },
      metadata: {
        description: 'Real-time connection status monitoring',
        owner: 'reliability-team',
        createdAt: new Date(),
        lastModified: new Date()
      }
    },
    'performance-monitoring': {
      name: 'performance-monitoring',
      enabled: false,
      rolloutPercentage: 0,
      conditions: {
        environment: ['development', 'staging']
      },
      metadata: {
        description: 'Comprehensive performance metrics collection',
        owner: 'reliability-team',
        createdAt: new Date(),
        lastModified: new Date()
      }
    },
    'error-recovery-ui': {
      name: 'error-recovery-ui',
      enabled: false,
      rolloutPercentage: 0,
      conditions: {
        environment: ['development', 'staging']
      },
      metadata: {
        description: 'Enhanced error recovery user interface',
        owner: 'reliability-team',
        createdAt: new Date(),
        lastModified: new Date()
      }
    }
  },
  defaultEnabled: false,
  environment: process.env.NODE_ENV || 'development'
};

// Rollout metrics storage (in production, use monitoring service)
let rolloutMetrics: any = {};

/**
 * GET /api/feature-flags
 * Get all feature flags configuration
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    res.json(featureFlags);
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch feature flags' 
    });
  }
});

/**
 * GET /api/feature-flags/:flagName
 * Get specific feature flag
 */
router.get('/:flagName', (req: Request, res: Response): void => {
  try {
    const { flagName } = req.params;
    const flag = featureFlags.flags[flagName as string];
    
    if (!flag) {
      res.status(404).json({
        success: false,
        message: 'Feature flag not found'
      });
      return;
    }
    
    res.json({
      success: true,
      flag
    });
  } catch (error) {
    console.error('Error fetching feature flag:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch feature flag' 
    });
  }
});

/**
 * PUT /api/feature-flags/:flagName
 * Update feature flag configuration (admin only)
 */
router.put('/:flagName', auth, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const { flagName } = req.params;
    const updates = req.body;
    
    if (!featureFlags.flags[flagName as string]) {
      res.status(404).json({
        success: false,
        message: 'Feature flag not found'
      });
      return;
    }
    
    // Validate rollout percentage
    if (updates.rolloutPercentage !== undefined) {
      if (updates.rolloutPercentage < 0 || updates.rolloutPercentage > 100) {
        res.status(400).json({
          success: false,
          message: 'Rollout percentage must be between 0 and 100'
        });
        return;
      }
    }
    
    // Update flag
    featureFlags.flags[flagName as string] = {
      ...featureFlags.flags[flagName as string],
      ...updates,
      metadata: {
        ...featureFlags.flags[flagName as string].metadata,
        lastModified: new Date()
      }
    };
    
    // Log the change
    console.log(`Feature flag ${flagName} updated by ${(req as any).user.email}:`, updates);
    
    res.json({
      success: true,
      flag: featureFlags.flags[flagName as string],
      message: 'Feature flag updated successfully'
    });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update feature flag' 
    });
  }
});

/**
 * POST /api/feature-flags/:flagName/rollback
 * Emergency rollback of feature flag (admin only)
 */
router.post('/:flagName/rollback', auth, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const { flagName } = req.params;
    const { reason } = req.body;
    
    if (!featureFlags.flags[flagName as string]) {
      res.status(404).json({
        success: false,
        message: 'Feature flag not found'
      });
      return;
    }
    
    // Perform rollback
    featureFlags.flags[flagName as string] = {
      ...featureFlags.flags[flagName as string],
      enabled: false,
      rolloutPercentage: 0,
      metadata: {
        ...featureFlags.flags[flagName as string].metadata,
        lastModified: new Date(),
        rollbackReason: reason || 'Emergency rollback'
      }
    };
    
    // Log the rollback
    console.log(`ROLLBACK: Feature flag ${flagName} rolled back by ${(req as any).user.email}. Reason: ${reason}`);
    
    res.json({
      success: true,
      flag: featureFlags.flags[flagName as string],
      message: 'Feature flag rolled back successfully'
    });
  } catch (error) {
    console.error('Error rolling back feature flag:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to rollback feature flag' 
    });
  }
});

/**
 * GET /api/feature-flags/:flagName/metrics
 * Get rollout metrics for a feature flag
 */
router.get('/:flagName/metrics', auth, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const { flagName } = req.params;
    
    if (!featureFlags.flags[flagName as string]) {
      res.status(404).json({
        success: false,
        message: 'Feature flag not found'
      });
      return;
    }
    
    // Get metrics (in production, fetch from monitoring service)
    const metrics = rolloutMetrics[flagName as string] || {
      flagName,
      enabled: featureFlags.flags[flagName as string].enabled,
      rolloutPercentage: featureFlags.flags[flagName as string].rolloutPercentage,
      estimatedUsers: Math.floor((featureFlags.flags[flagName as string].rolloutPercentage / 100) * 1000),
      errorRate: Math.random() * 5, // Mock data
      performanceImpact: Math.random() * 10 - 5,
      userFeedback: Math.random() * 5,
      lastUpdated: new Date()
    };
    
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error fetching feature flag metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch feature flag metrics' 
    });
  }
});

/**
 * POST /api/feature-flags/:flagName/metrics
 * Update rollout metrics (for monitoring services)
 */
router.post('/:flagName/metrics', (req: Request, res: Response): void => {
  try {
    const { flagName } = req.params;
    const metrics = req.body;
    
    if (!featureFlags.flags[flagName as string]) {
      res.status(404).json({
        success: false,
        message: 'Feature flag not found'
      });
      return;
    }
    
    rolloutMetrics[flagName as string] = {
      ...metrics,
      flagName,
      lastUpdated: new Date()
    };
    
    res.json({
      success: true,
      message: 'Metrics updated successfully'
    });
  } catch (error) {
    console.error('Error updating feature flag metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update feature flag metrics' 
    });
  }
});

/**
 * GET /api/feature-flags/health/check
 * Health check for feature flag system
 */
router.get('/health/check', (req: Request, res: Response): void => {
  try {
    const totalFlags = Object.keys(featureFlags.flags).length;
    const enabledFlags = Object.values(featureFlags.flags).filter((flag: any) => flag.enabled).length;
    const rollingOutFlags = Object.values(featureFlags.flags).filter(
      (flag: any) => flag.enabled && flag.rolloutPercentage > 0 && flag.rolloutPercentage < 100
    ).length;
    
    res.json({
      success: true,
      status: 'healthy',
      stats: {
        totalFlags,
        enabledFlags,
        rollingOutFlags,
        environment: featureFlags.environment
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error checking feature flag health:', error);
    res.status(500).json({ 
      success: false, 
      status: 'unhealthy',
      message: 'Feature flag system health check failed' 
    });
  }
});

export default router;
