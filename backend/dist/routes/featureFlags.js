"use strict";
/**
 * Feature Flags API Routes
 * Manages feature flag configuration and rollout control
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const router = express_1.default.Router();
// In-memory storage for feature flags (in production, use database)
let featureFlags = {
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
        },
        'cod-payment': {
            name: 'cod-payment',
            enabled: true,
            rolloutPercentage: 100,
            conditions: {
                environment: ['development']
            },
            metadata: {
                description: 'Cash on Delivery payment option (Development Only)',
                owner: 'payment-team',
                createdAt: new Date(),
                lastModified: new Date()
            }
        }
    },
    defaultEnabled: false,
    environment: process.env.NODE_ENV || 'development'
};
// Rollout metrics storage (in production, use monitoring service)
let rolloutMetrics = {};
/**
 * GET /api/feature-flags
 * Get all feature flags configuration
 */
router.get('/', (req, res) => {
    try {
        res.json(featureFlags);
    }
    catch (error) {
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
router.get('/:flagName', (req, res) => {
    try {
        const { flagName } = req.params;
        const flag = featureFlags.flags[flagName];
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
    }
    catch (error) {
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
router.put('/:flagName', auth_1.auth, (0, role_1.requireRole)('admin'), (req, res) => {
    try {
        const { flagName } = req.params;
        const updates = req.body;
        if (!featureFlags.flags[flagName]) {
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
        featureFlags.flags[flagName] = {
            ...featureFlags.flags[flagName],
            ...updates,
            metadata: {
                ...featureFlags.flags[flagName].metadata,
                lastModified: new Date()
            }
        };
        // Log the change
        console.log(`Feature flag ${flagName} updated by ${req.user.email}:`, updates);
        res.json({
            success: true,
            flag: featureFlags.flags[flagName],
            message: 'Feature flag updated successfully'
        });
    }
    catch (error) {
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
router.post('/:flagName/rollback', auth_1.auth, (0, role_1.requireRole)('admin'), (req, res) => {
    try {
        const { flagName } = req.params;
        const { reason } = req.body;
        if (!featureFlags.flags[flagName]) {
            res.status(404).json({
                success: false,
                message: 'Feature flag not found'
            });
            return;
        }
        // Perform rollback
        featureFlags.flags[flagName] = {
            ...featureFlags.flags[flagName],
            enabled: false,
            rolloutPercentage: 0,
            metadata: {
                ...featureFlags.flags[flagName].metadata,
                lastModified: new Date(),
                rollbackReason: reason || 'Emergency rollback'
            }
        };
        // Log the rollback
        console.log(`ROLLBACK: Feature flag ${flagName} rolled back by ${req.user.email}. Reason: ${reason}`);
        res.json({
            success: true,
            flag: featureFlags.flags[flagName],
            message: 'Feature flag rolled back successfully'
        });
    }
    catch (error) {
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
router.get('/:flagName/metrics', auth_1.auth, (0, role_1.requireRole)('admin'), (req, res) => {
    try {
        const { flagName } = req.params;
        if (!featureFlags.flags[flagName]) {
            res.status(404).json({
                success: false,
                message: 'Feature flag not found'
            });
            return;
        }
        // Get metrics (in production, fetch from monitoring service)
        const metrics = rolloutMetrics[flagName] || {
            flagName,
            enabled: featureFlags.flags[flagName].enabled,
            rolloutPercentage: featureFlags.flags[flagName].rolloutPercentage,
            estimatedUsers: Math.floor((featureFlags.flags[flagName].rolloutPercentage / 100) * 1000),
            errorRate: Math.random() * 5, // Mock data
            performanceImpact: Math.random() * 10 - 5,
            userFeedback: Math.random() * 5,
            lastUpdated: new Date()
        };
        res.json({
            success: true,
            metrics
        });
    }
    catch (error) {
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
router.post('/:flagName/metrics', (req, res) => {
    try {
        const { flagName } = req.params;
        const metrics = req.body;
        if (!featureFlags.flags[flagName]) {
            res.status(404).json({
                success: false,
                message: 'Feature flag not found'
            });
            return;
        }
        rolloutMetrics[flagName] = {
            ...metrics,
            flagName,
            lastUpdated: new Date()
        };
        res.json({
            success: true,
            message: 'Metrics updated successfully'
        });
    }
    catch (error) {
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
router.get('/health/check', (req, res) => {
    try {
        const totalFlags = Object.keys(featureFlags.flags).length;
        const enabledFlags = Object.values(featureFlags.flags).filter((flag) => flag.enabled).length;
        const rollingOutFlags = Object.values(featureFlags.flags).filter((flag) => flag.enabled && flag.rolloutPercentage > 0 && flag.rolloutPercentage < 100).length;
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
    }
    catch (error) {
        console.error('Error checking feature flag health:', error);
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            message: 'Feature flag system health check failed'
        });
    }
});
exports.default = router;
