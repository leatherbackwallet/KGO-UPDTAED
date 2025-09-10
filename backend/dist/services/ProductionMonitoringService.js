"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productionMonitoringService = void 0;
const events_1 = require("events");
class ProductionMonitoringService extends events_1.EventEmitter {
    constructor() {
        super();
        this.metrics = [];
        this.alertRules = [];
        this.slaTargets = [];
        this.benchmarks = new Map();
        this.isMonitoring = false;
        this.initializeDefaultAlertRules();
        this.initializeDefaultSLATargets();
        this.initializeDefaultBenchmarks();
    }
    initializeDefaultAlertRules() {
        this.alertRules = [
            {
                id: 'high-error-rate',
                name: 'High Error Rate',
                metric: 'errorRate',
                threshold: 3,
                operator: 'gt',
                severity: 'critical',
                enabled: true,
                cooldownPeriod: 5
            },
            {
                id: 'performance-degradation',
                name: 'Performance Degradation',
                metric: 'performanceImpact',
                threshold: -3,
                operator: 'lt',
                severity: 'high',
                enabled: true,
                cooldownPeriod: 10
            },
            {
                id: 'loading-failures',
                name: 'High Loading Failure Rate',
                metric: 'loadingFailureRate',
                threshold: 5,
                operator: 'gt',
                severity: 'high',
                enabled: true,
                cooldownPeriod: 5
            },
            {
                id: 'low-cache-hit-rate',
                name: 'Low Cache Hit Rate',
                metric: 'cacheHitRate',
                threshold: 70,
                operator: 'lt',
                severity: 'medium',
                enabled: true,
                cooldownPeriod: 15
            },
            {
                id: 'slow-response-time',
                name: 'Slow Response Time',
                metric: 'averageResponseTime',
                threshold: 2000,
                operator: 'gt',
                severity: 'medium',
                enabled: true,
                cooldownPeriod: 10
            },
            {
                id: 'low-user-feedback',
                name: 'Low User Feedback Score',
                metric: 'userFeedbackScore',
                threshold: 2.0,
                operator: 'lt',
                severity: 'high',
                enabled: true,
                cooldownPeriod: 30
            },
            {
                id: 'high-memory-usage',
                name: 'High Memory Usage',
                metric: 'memoryUsage',
                threshold: 85,
                operator: 'gt',
                severity: 'medium',
                enabled: true,
                cooldownPeriod: 10
            },
            {
                id: 'high-cpu-usage',
                name: 'High CPU Usage',
                metric: 'cpuUsage',
                threshold: 80,
                operator: 'gt',
                severity: 'medium',
                enabled: true,
                cooldownPeriod: 10
            }
        ];
    }
    initializeDefaultSLATargets() {
        this.slaTargets = [
            {
                name: 'Error Rate SLA',
                metric: 'errorRate',
                target: 1,
                period: 'day',
                operator: 'lt'
            },
            {
                name: 'Response Time SLA',
                metric: 'averageResponseTime',
                target: 1500,
                period: 'day',
                operator: 'lt'
            },
            {
                name: 'Cache Hit Rate SLA',
                metric: 'cacheHitRate',
                target: 80,
                period: 'day',
                operator: 'gt'
            },
            {
                name: 'Loading Success Rate SLA',
                metric: 'loadingFailureRate',
                target: 2,
                period: 'day',
                operator: 'lt'
            },
            {
                name: 'User Satisfaction SLA',
                metric: 'userFeedbackScore',
                target: 3.5,
                period: 'week',
                operator: 'gt'
            }
        ];
    }
    initializeDefaultBenchmarks() {
        const benchmarks = [
            { name: 'Page Load Time', baseline: 2500, threshold: 10 },
            { name: 'API Response Time', baseline: 800, threshold: 15 },
            { name: 'Image Load Time', baseline: 1200, threshold: 20 },
            { name: 'Cache Hit Rate', baseline: 85, threshold: 5 },
            { name: 'Error Recovery Rate', baseline: 95, threshold: 5 }
        ];
        benchmarks.forEach(benchmark => {
            this.benchmarks.set(benchmark.name, {
                ...benchmark,
                current: benchmark.baseline,
                trend: 'stable',
                lastUpdated: new Date()
            });
        });
    }
    startMonitoring(intervalMs = 30000) {
        if (this.isMonitoring) {
            console.warn('Monitoring is already running');
            return;
        }
        this.isMonitoring = true;
        console.log('Starting production monitoring...');
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, intervalMs);
        this.emit('monitoring-started');
    }
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        console.log('Production monitoring stopped');
        this.emit('monitoring-stopped');
    }
    async collectMetrics() {
        try {
            const metrics = await this.gatherCurrentMetrics();
            this.metrics.push(metrics);
            if (this.metrics.length > 1000) {
                this.metrics = this.metrics.slice(-1000);
            }
            this.checkAlertRules(metrics);
            this.updateBenchmarks(metrics);
            this.checkSLACompliance();
            this.emit('metrics-collected', metrics);
        }
        catch (error) {
            console.error('Error collecting metrics:', error);
            this.emit('metrics-error', error);
        }
    }
    async gatherCurrentMetrics() {
        const now = new Date();
        const recentMetrics = this.metrics.slice(-10);
        const avgErrorRate = recentMetrics.length > 0
            ? recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length
            : 1;
        const avgResponseTime = recentMetrics.length > 0
            ? recentMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / recentMetrics.length
            : 800;
        const metrics = {
            timestamp: now,
            errorRate: Math.max(0, avgErrorRate + (Math.random() - 0.5) * 2),
            performanceImpact: (Math.random() - 0.5) * 10,
            loadingFailureRate: Math.max(0, Math.random() * 3),
            cacheHitRate: Math.max(0, Math.min(100, 85 + (Math.random() - 0.5) * 20)),
            averageResponseTime: Math.max(100, avgResponseTime + (Math.random() - 0.5) * 400),
            userFeedbackScore: Math.max(1, Math.min(5, 3.5 + (Math.random() - 0.5) * 2)),
            activeUsers: Math.floor(Math.random() * 1000) + 500,
            memoryUsage: Math.max(0, Math.min(100, 60 + (Math.random() - 0.5) * 40)),
            cpuUsage: Math.max(0, Math.min(100, 45 + (Math.random() - 0.5) * 30))
        };
        return metrics;
    }
    checkAlertRules(metrics) {
        this.alertRules.forEach(rule => {
            if (!rule.enabled)
                return;
            if (rule.lastTriggered) {
                const cooldownMs = rule.cooldownPeriod * 60 * 1000;
                if (Date.now() - rule.lastTriggered.getTime() < cooldownMs) {
                    return;
                }
            }
            const metricValue = metrics[rule.metric];
            let shouldTrigger = false;
            switch (rule.operator) {
                case 'gt':
                    shouldTrigger = metricValue > rule.threshold;
                    break;
                case 'lt':
                    shouldTrigger = metricValue < rule.threshold;
                    break;
                case 'gte':
                    shouldTrigger = metricValue >= rule.threshold;
                    break;
                case 'lte':
                    shouldTrigger = metricValue <= rule.threshold;
                    break;
                case 'eq':
                    shouldTrigger = metricValue === rule.threshold;
                    break;
            }
            if (shouldTrigger) {
                rule.lastTriggered = new Date();
                this.triggerAlert(rule, metricValue, metrics);
            }
        });
    }
    triggerAlert(rule, value, metrics) {
        const alert = {
            id: `alert-${Date.now()}`,
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            metric: rule.metric,
            value,
            threshold: rule.threshold,
            timestamp: new Date(),
            metrics
        };
        console.log(`🚨 ALERT [${rule.severity.toUpperCase()}]: ${rule.name} - ${rule.metric}: ${value} (threshold: ${rule.threshold})`);
        this.emit('alert-triggered', alert);
        this.sendAlert(alert);
    }
    async sendAlert(alert) {
        try {
            if (process.env.WEBHOOK_URL) {
                const webhookPayload = {
                    text: `🚨 ${alert.severity.toUpperCase()} Alert: ${alert.ruleName}`,
                    attachments: [{
                            color: this.getAlertColor(alert.severity),
                            fields: [
                                { title: 'Metric', value: alert.metric, short: true },
                                { title: 'Value', value: alert.value.toFixed(2), short: true },
                                { title: 'Threshold', value: alert.threshold.toString(), short: true },
                                { title: 'Time', value: alert.timestamp.toISOString(), short: true }
                            ]
                        }]
                };
                await fetch(process.env.WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(webhookPayload)
                });
            }
            console.log('Alert sent:', JSON.stringify(alert, null, 2));
        }
        catch (error) {
            console.error('Failed to send alert:', error);
        }
    }
    getAlertColor(severity) {
        switch (severity) {
            case 'critical': return 'danger';
            case 'high': return 'warning';
            case 'medium': return '#ff9500';
            case 'low': return 'good';
            default: return '#cccccc';
        }
    }
    updateBenchmarks(metrics) {
        this.updateBenchmark('Page Load Time', metrics.averageResponseTime * 1.5);
        this.updateBenchmark('API Response Time', metrics.averageResponseTime);
        this.updateBenchmark('Cache Hit Rate', metrics.cacheHitRate);
        this.updateBenchmark('Error Recovery Rate', 100 - metrics.loadingFailureRate);
    }
    updateBenchmark(name, currentValue) {
        const benchmark = this.benchmarks.get(name);
        if (!benchmark)
            return;
        const previousValue = benchmark.current;
        benchmark.current = currentValue;
        benchmark.lastUpdated = new Date();
        const changePercent = ((currentValue - benchmark.baseline) / benchmark.baseline) * 100;
        if (Math.abs(changePercent) < benchmark.threshold) {
            benchmark.trend = 'stable';
        }
        else if (changePercent > 0) {
            benchmark.trend = name.includes('Rate') ? 'improving' : 'degrading';
        }
        else {
            benchmark.trend = name.includes('Time') ? 'improving' : 'degrading';
        }
        this.benchmarks.set(name, benchmark);
    }
    checkSLACompliance() {
        this.slaTargets.forEach(sla => {
            const compliance = this.calculateSLACompliance(sla);
            if (compliance.isViolated) {
                console.warn(`⚠️ SLA Violation: ${sla.name} - Current: ${compliance.currentValue.toFixed(2)}, Target: ${sla.target}`);
                this.emit('sla-violation', {
                    sla,
                    compliance,
                    timestamp: new Date()
                });
            }
        });
    }
    calculateSLACompliance(sla) {
        const periodMetrics = this.getMetricsForPeriod(sla.period);
        if (periodMetrics.length === 0) {
            return {
                isViolated: false,
                currentValue: 0,
                targetValue: sla.target,
                compliancePercentage: 100
            };
        }
        const currentValue = periodMetrics.reduce((sum, m) => sum + m[sla.metric], 0) / periodMetrics.length;
        let isViolated = false;
        switch (sla.operator) {
            case 'gt':
                isViolated = currentValue <= sla.target;
                break;
            case 'lt':
                isViolated = currentValue >= sla.target;
                break;
            case 'gte':
                isViolated = currentValue < sla.target;
                break;
            case 'lte':
                isViolated = currentValue > sla.target;
                break;
            case 'eq':
                isViolated = currentValue !== sla.target;
                break;
        }
        const compliancePercentage = isViolated ?
            Math.max(0, 100 - Math.abs((currentValue - sla.target) / sla.target * 100)) :
            100;
        return {
            isViolated,
            currentValue,
            targetValue: sla.target,
            compliancePercentage
        };
    }
    getMetricsForPeriod(period) {
        const now = new Date();
        let cutoffTime;
        switch (period) {
            case 'hour':
                cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case 'day':
                cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        return this.metrics.filter(m => m.timestamp >= cutoffTime);
    }
    getMetrics(limit = 100) {
        return this.metrics.slice(-limit);
    }
    getCurrentMetrics() {
        return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
    }
    getAlertRules() {
        return [...this.alertRules];
    }
    updateAlertRule(ruleId, updates) {
        const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId);
        if (ruleIndex === -1)
            return false;
        this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
        return true;
    }
    getSLATargets() {
        return [...this.slaTargets];
    }
    getSLACompliance() {
        return this.slaTargets.map(sla => ({
            sla,
            compliance: this.calculateSLACompliance(sla)
        }));
    }
    getBenchmarks() {
        return Array.from(this.benchmarks.values());
    }
    getHealthStatus() {
        const currentMetrics = this.getCurrentMetrics();
        if (!currentMetrics) {
            return { status: 'warning', issues: ['No metrics available'], metrics: null };
        }
        const issues = [];
        let status = 'healthy';
        if (currentMetrics.errorRate > 5) {
            issues.push('Critical error rate');
            status = 'critical';
        }
        if (currentMetrics.loadingFailureRate > 10) {
            issues.push('Critical loading failure rate');
            status = 'critical';
        }
        if (currentMetrics.errorRate > 2 && status !== 'critical') {
            issues.push('High error rate');
            status = 'warning';
        }
        if (currentMetrics.averageResponseTime > 2000 && status !== 'critical') {
            issues.push('Slow response time');
            status = 'warning';
        }
        if (currentMetrics.cacheHitRate < 70 && status !== 'critical') {
            issues.push('Low cache hit rate');
            status = 'warning';
        }
        return { status, issues, metrics: currentMetrics };
    }
}
exports.productionMonitoringService = new ProductionMonitoringService();
exports.default = exports.productionMonitoringService;
//# sourceMappingURL=ProductionMonitoringService.js.map