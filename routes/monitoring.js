/**
 * Monitoring API Routes
 * Provides endpoints for production monitoring, alerts, and performance metrics
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Import monitoring services (these would be properly imported in TypeScript)
let productionMonitoringService;
let cacheWarmingService;

try {
  productionMonitoringService = require('../services/ProductionMonitoringService').productionMonitoringService;
  cacheWarmingService = require('../services/CacheWarmingService').cacheWarmingService;
} catch (error) {
  console.warn('Monitoring services not available:', error.message);
}

/**
 * GET /api/monitoring/health
 * Get overall system health status
 */
router.get('/health', (req, res) => {
  try {
    if (!productionMonitoringService) {
      return res.status(503).json({
        success: false,
        message: 'Monitoring service not available'
      });
    }

    const healthStatus = productionMonitoringService.getHealthStatus();
    
    res.json({
      success: true,
      health: healthStatus,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health status'
    });
  }
});

/**
 * GET /api/monitoring/metrics
 * Get current and historical metrics
 */
router.get('/metrics', auth, role(['admin']), (req, res) => {
  try {
    if (!productionMonitoringService) {
      return res.status(503).json({
        success: false,
        message: 'Monitoring service not available'
      });
    }

    const limit = parseInt(req.query.limit) || 100;
    const metrics = productionMonitoringService.getMetrics(limit);
    const currentMetrics = productionMonitoringService.getCurrentMetrics();
    
    res.json({
      success: true,
      current: currentMetrics,
      history: metrics,
      count: metrics.length
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get metrics'
    });
  }
});

/**
 * GET /api/monitoring/alerts
 * Get alert rules and recent alerts
 */
router.get('/alerts', auth, role(['admin']), (req, res) => {
  try {
    if (!productionMonitoringService) {
      return res.status(503).json({
        success: false,
        message: 'Monitoring service not available'
      });
    }

    const alertRules = productionMonitoringService.getAlertRules();
    
    res.json({
      success: true,
      alertRules,
      count: alertRules.length
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts'
    });
  }
});

/**
 * PUT /api/monitoring/alerts/:ruleId
 * Update alert rule configuration
 */
router.put('/alerts/:ruleId', auth, role(['admin']), (req, res) => {
  try {
    if (!productionMonitoringService) {
      return res.status(503).json({
        success: false,
        message: 'Monitoring service not available'
      });
    }

    const { ruleId } = req.params;
    const updates = req.body;
    
    const success = productionMonitoringService.updateAlertRule(ruleId, updates);
    
    if (success) {
      res.json({
        success: true,
        message: 'Alert rule updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Alert rule not found'
      });
    }
  } catch (error) {
    console.error('Error updating alert rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert rule'
    });
  }
});

/**
 * GET /api/monitoring/sla
 * Get SLA targets and compliance status
 */
router.get('/sla', auth, role(['admin']), (req, res) => {
  try {
    if (!productionMonitoringService) {
      return res.status(503).json({
        success: false,
        message: 'Monitoring service not available'
      });
    }

    const slaTargets = productionMonitoringService.getSLATargets();
    const slaCompliance = productionMonitoringService.getSLACompliance();
    
    res.json({
      success: true,
      targets: slaTargets,
      compliance: slaCompliance
    });
  } catch (error) {
    console.error('Error getting SLA status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SLA status'
    });
  }
});

/**
 * GET /api/monitoring/benchmarks
 * Get performance benchmarks
 */
router.get('/benchmarks', auth, role(['admin']), (req, res) => {
  try {
    if (!productionMonitoringService) {
      return res.status(503).json({
        success: false,
        message: 'Monitoring service not available'
      });
    }

    const benchmarks = productionMonitoringService.getBenchmarks();
    
    res.json({
      success: true,
      benchmarks
    });
  } catch (error) {
    console.error('Error getting benchmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get benchmarks'
    });
  }
});

/**
 * GET /api/monitoring/cache
 * Get cache warming statistics
 */
router.get('/cache', auth, role(['admin']), (req, res) => {
  try {
    if (!cacheWarmingService) {
      return res.status(503).json({
        success: false,
        message: 'Cache warming service not available'
      });
    }

    const statistics = cacheWarmingService.getCacheStatistics();
    const endpointStats = cacheWarmingService.getEndpointStats();
    const history = cacheWarmingService.getWarmingHistory(50);
    
    res.json({
      success: true,
      statistics,
      endpoints: endpointStats,
      history
    });
  } catch (error) {
    console.error('Error getting cache statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics'
    });
  }
});

/**
 * POST /api/monitoring/cache/warmup
 * Trigger manual cache warmup
 */
router.post('/cache/warmup', auth, role(['admin']), async (req, res) => {
  try {
    if (!cacheWarmingService) {
      return res.status(503).json({
        success: false,
        message: 'Cache warming service not available'
      });
    }

    const { endpoints } = req.body;
    const results = await cacheWarmingService.manualWarmup(endpoints);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    res.json({
      success: true,
      message: 'Manual cache warmup completed',
      results: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        details: results
      }
    });
  } catch (error) {
    console.error('Error performing manual cache warmup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform manual cache warmup'
    });
  }
});

/**
 * GET /api/monitoring/dashboard
 * Get comprehensive dashboard data
 */
router.get('/dashboard', auth, role(['admin']), (req, res) => {
  try {
    if (!productionMonitoringService) {
      return res.status(503).json({
        success: false,
        message: 'Monitoring service not available'
      });
    }

    const healthStatus = productionMonitoringService.getHealthStatus();
    const currentMetrics = productionMonitoringService.getCurrentMetrics();
    const recentMetrics = productionMonitoringService.getMetrics(24); // Last 24 data points
    const alertRules = productionMonitoringService.getAlertRules();
    const slaCompliance = productionMonitoringService.getSLACompliance();
    const benchmarks = productionMonitoringService.getBenchmarks();
    
    let cacheStats = null;
    if (cacheWarmingService) {
      cacheStats = cacheWarmingService.getCacheStatistics();
    }
    
    res.json({
      success: true,
      dashboard: {
        health: healthStatus,
        metrics: {
          current: currentMetrics,
          recent: recentMetrics
        },
        alerts: {
          rules: alertRules,
          activeAlerts: alertRules.filter(rule => rule.lastTriggered && 
            Date.now() - rule.lastTriggered.getTime() < 60 * 60 * 1000) // Last hour
        },
        sla: slaCompliance,
        benchmarks,
        cache: cacheStats
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
});

/**
 * POST /api/monitoring/start
 * Start monitoring services
 */
router.post('/start', auth, role(['admin']), (req, res) => {
  try {
    if (productionMonitoringService) {
      productionMonitoringService.startMonitoring();
    }
    
    if (cacheWarmingService) {
      cacheWarmingService.start();
    }
    
    res.json({
      success: true,
      message: 'Monitoring services started'
    });
  } catch (error) {
    console.error('Error starting monitoring services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start monitoring services'
    });
  }
});

/**
 * POST /api/monitoring/stop
 * Stop monitoring services
 */
router.post('/stop', auth, role(['admin']), (req, res) => {
  try {
    if (productionMonitoringService) {
      productionMonitoringService.stopMonitoring();
    }
    
    if (cacheWarmingService) {
      cacheWarmingService.stop();
    }
    
    res.json({
      success: true,
      message: 'Monitoring services stopped'
    });
  } catch (error) {
    console.error('Error stopping monitoring services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop monitoring services'
    });
  }
});

/**
 * GET /api/monitoring/logs
 * Get recent application logs (if available)
 */
router.get('/logs', auth, role(['admin']), (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const severity = req.query.severity || 'INFO';
    
    // In a real implementation, this would fetch from your logging system
    // For now, return a mock response
    const mockLogs = Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60000),
      level: ['INFO', 'WARN', 'ERROR'][Math.floor(Math.random() * 3)],
      message: `Sample log message ${i + 1}`,
      service: 'reliability-monitoring',
      metadata: {
        requestId: `req-${Date.now()}-${i}`,
        userId: 'system'
      }
    }));
    
    res.json({
      success: true,
      logs: mockLogs,
      count: mockLogs.length,
      filters: {
        limit,
        severity
      }
    });
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get logs'
    });
  }
});

/**
 * POST /api/monitoring/test-alert
 * Test alert system (development/staging only)
 */
router.post('/test-alert', auth, role(['admin']), (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Test alerts not allowed in production'
      });
    }
    
    const { severity, message } = req.body;
    
    // Simulate an alert
    const testAlert = {
      id: `test-alert-${Date.now()}`,
      severity: severity || 'medium',
      message: message || 'Test alert from monitoring API',
      timestamp: new Date(),
      test: true
    };
    
    console.log('🧪 TEST ALERT:', testAlert);
    
    res.json({
      success: true,
      message: 'Test alert triggered',
      alert: testAlert
    });
  } catch (error) {
    console.error('Error triggering test alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger test alert'
    });
  }
});

module.exports = router;