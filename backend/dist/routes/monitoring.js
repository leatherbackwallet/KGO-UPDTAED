"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const router = express_1.default.Router();
let productionMonitoringService;
let cacheWarmingService;
try {
    productionMonitoringService = require('../services/ProductionMonitoringService').productionMonitoringService;
    cacheWarmingService = require('../services/CacheWarmingService').cacheWarmingService;
}
catch (error) {
    console.warn('Monitoring services not available:', error.message);
}
router.get('/health', (req, res) => {
    try {
        if (!productionMonitoringService) {
            res.status(503).json({
                success: false,
                message: 'Monitoring service not available'
            });
            return;
        }
        const healthStatus = productionMonitoringService.getHealthStatus();
        res.json({
            success: true,
            health: healthStatus,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Error getting health status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get health status'
        });
    }
});
router.get('/metrics', auth_1.auth, (0, role_1.requireRole)('admin'), (req, res) => {
    try {
        if (!productionMonitoringService) {
            res.status(503).json({
                success: false,
                message: 'Monitoring service not available'
            });
            return;
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
    }
    catch (error) {
        console.error('Error getting metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get metrics'
        });
    }
});
router.get('/alerts', auth_1.auth, (0, role_1.requireRole)('admin'), (req, res) => {
    try {
        if (!productionMonitoringService) {
            res.status(503).json({
                success: false,
                message: 'Monitoring service not available'
            });
            return;
        }
        const alertRules = productionMonitoringService.getAlertRules();
        res.json({
            success: true,
            alertRules,
            count: alertRules.length
        });
    }
    catch (error) {
        console.error('Error getting alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get alerts'
        });
    }
});
router.put('/alerts/:ruleId', auth_1.auth, (0, role_1.requireRole)('admin'), (req, res) => {
    try {
        if (!productionMonitoringService) {
            res.status(503).json({
                success: false,
                message: 'Monitoring service not available'
            });
            return;
        }
        const { ruleId } = req.params;
        const updates = req.body;
        const success = productionMonitoringService.updateAlertRule(ruleId, updates);
        if (success) {
            res.json({
                success: true,
                message: 'Alert rule updated successfully'
            });
        }
        else {
            res.status(404).json({
                success: false,
                message: 'Alert rule not found'
            });
        }
    }
    catch (error) {
        console.error('Error updating alert rule:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update alert rule'
        });
    }
});
router.get('/sla', auth_1.auth, (0, role_1.requireRole)('admin'), (req, res) => {
    try {
        if (!productionMonitoringService) {
            res.status(503).json({
                success: false,
                message: 'Monitoring service not available'
            });
            return;
        }
        const slaTargets = productionMonitoringService.getSLATargets();
        const slaCompliance = productionMonitoringService.getSLACompliance();
        res.json({
            success: true,
            targets: slaTargets,
            compliance: slaCompliance
        });
    }
    catch (error) {
        console.error('Error getting SLA status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get SLA status'
        });
    }
});
router.get('/benchmarks', auth_1.auth, (0, role_1.requireRole)('admin'), (req, res) => {
    try {
        if (!productionMonitoringService) {
            res.status(503).json({
                success: false,
                message: 'Monitoring service not available'
            });
            return;
        }
        const benchmarks = productionMonitoringService.getBenchmarks();
        res.json({
            success: true,
            benchmarks
        });
    }
    catch (error) {
        console.error('Error getting benchmarks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get benchmarks'
        });
    }
});
router.get('/cache', auth_1.auth, (0, role_1.requireRole)('admin'), (req, res) => {
    try {
        if (!cacheWarmingService) {
            res.status(503).json({
                success: false,
                message: 'Cache warming service not available'
            });
            return;
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
    }
    catch (error) {
        console.error('Error getting cache statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cache statistics'
        });
    }
});
router.post('/cache/warmup', auth_1.auth, (0, role_1.requireRole)('admin'), async (req, res) => {
    try {
        if (!cacheWarmingService) {
            res.status(503).json({
                success: false,
                message: 'Cache warming service not available'
            });
            return;
        }
        const { endpoints } = req.body;
        const results = await cacheWarmingService.manualWarmup(endpoints);
        const successCount = results.filter((r) => r.success).length;
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
    }
    catch (error) {
        console.error('Error performing manual cache warmup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform manual cache warmup'
        });
    }
});
router.get('/dashboard', auth_1.auth, (0, role_1.requireRole)('admin'), (req, res) => {
    try {
        if (!productionMonitoringService) {
            res.status(503).json({
                success: false,
                message: 'Monitoring service not available'
            });
            return;
        }
        const healthStatus = productionMonitoringService.getHealthStatus();
        const currentMetrics = productionMonitoringService.getCurrentMetrics();
        const recentMetrics = productionMonitoringService.getMetrics(24);
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
                    activeAlerts: alertRules.filter((rule) => rule.lastTriggered &&
                        Date.now() - rule.lastTriggered.getTime() < 60 * 60 * 1000)
                },
                sla: slaCompliance,
                benchmarks,
                cache: cacheStats
            },
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard data'
        });
    }
});
router.post('/start', auth_1.auth, (0, role_1.requireRole)('admin'), (req, res) => {
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
    }
    catch (error) {
        console.error('Error starting monitoring services:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start monitoring services'
        });
    }
});
router.post('/stop', auth_1.auth, (0, role_1.requireRole)('admin'), (req, res) => {
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
    }
    catch (error) {
        console.error('Error stopping monitoring services:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to stop monitoring services'
        });
    }
});
router.get('/logs', auth_1.auth, (0, role_1.requireRole)('admin'), (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const severity = req.query.severity || 'INFO';
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
    }
    catch (error) {
        console.error('Error getting logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get logs'
        });
    }
});
router.post('/test-alert', auth_1.auth, (0, role_1.requireRole)('admin'), (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            res.status(403).json({
                success: false,
                message: 'Test alerts not allowed in production'
            });
            return;
        }
        const { severity, message } = req.body;
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
    }
    catch (error) {
        console.error('Error triggering test alert:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger test alert'
        });
    }
});
exports.default = router;
//# sourceMappingURL=monitoring.js.map