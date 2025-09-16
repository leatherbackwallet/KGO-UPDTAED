/**
 * Production Monitoring Service
 * Handles alerts, performance benchmarks, and SLA monitoring for reliability features
 */

import { EventEmitter } from 'events';

export interface MonitoringMetrics {
  timestamp: Date;
  errorRate: number;
  performanceImpact: number;
  loadingFailureRate: number;
  cacheHitRate: number;
  averageResponseTime: number;
  userFeedbackScore: number;
  activeUsers: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: keyof MonitoringMetrics;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownPeriod: number; // minutes
  lastTriggered?: Date;
}

export interface SLATarget {
  name: string;
  metric: keyof MonitoringMetrics;
  target: number;
  period: 'hour' | 'day' | 'week' | 'month';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
}

export interface PerformanceBenchmark {
  name: string;
  baseline: number;
  current: number;
  threshold: number;
  trend: 'improving' | 'stable' | 'degrading';
  lastUpdated: Date;
}

class ProductionMonitoringService extends EventEmitter {
  private metrics: MonitoringMetrics[] = [];
  private alertRules: AlertRule[] = [];
  private slaTargets: SLATarget[] = [];
  private benchmarks: Map<string, PerformanceBenchmark> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout | undefined;

  constructor() {
    super();
    this.initializeDefaultAlertRules();
    this.initializeDefaultSLATargets();
    this.initializeDefaultBenchmarks();
  }

  private initializeDefaultAlertRules(): void {
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

  private initializeDefaultSLATargets(): void {
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

  private initializeDefaultBenchmarks(): void {
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

  public startMonitoring(intervalMs: number = 30000): void {
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

  public stopMonitoring(): void {
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

  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.gatherCurrentMetrics();
      this.metrics.push(metrics);

      // Keep only last 1000 metrics (about 8 hours at 30s intervals)
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      // Check alert rules
      this.checkAlertRules(metrics);

      // Update benchmarks
      this.updateBenchmarks(metrics);

      // Check SLA compliance
      this.checkSLACompliance();

      this.emit('metrics-collected', metrics);
    } catch (error) {
      console.error('Error collecting metrics:', error);
      this.emit('metrics-error', error);
    }
  }

  private async gatherCurrentMetrics(): Promise<MonitoringMetrics> {
    // In production, these would be gathered from actual monitoring systems
    // For now, we'll simulate with some realistic values and trends
    
    const now = new Date();
    const recentMetrics = this.metrics.slice(-10); // Last 10 data points
    
    // Calculate trends based on recent data
    const avgErrorRate = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length
      : 1;
    
    const avgResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / recentMetrics.length
      : 800;

    // Simulate realistic metrics with some variation
    const metrics: MonitoringMetrics = {
      timestamp: now,
      errorRate: Math.max(0, avgErrorRate + (Math.random() - 0.5) * 2), // ±1% variation
      performanceImpact: (Math.random() - 0.5) * 10, // -5% to +5%
      loadingFailureRate: Math.max(0, Math.random() * 3), // 0-3%
      cacheHitRate: Math.max(0, Math.min(100, 85 + (Math.random() - 0.5) * 20)), // 75-95%
      averageResponseTime: Math.max(100, avgResponseTime + (Math.random() - 0.5) * 400), // ±200ms
      userFeedbackScore: Math.max(1, Math.min(5, 3.5 + (Math.random() - 0.5) * 2)), // 2.5-4.5
      activeUsers: Math.floor(Math.random() * 1000) + 500, // 500-1500 users
      memoryUsage: Math.max(0, Math.min(100, 60 + (Math.random() - 0.5) * 40)), // 40-80%
      cpuUsage: Math.max(0, Math.min(100, 45 + (Math.random() - 0.5) * 30)) // 30-60%
    };

    return metrics;
  }

  private checkAlertRules(metrics: MonitoringMetrics): void {
    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      // Check cooldown period
      if (rule.lastTriggered) {
        const cooldownMs = rule.cooldownPeriod * 60 * 1000;
        if (Date.now() - rule.lastTriggered.getTime() < cooldownMs) {
          return;
        }
      }

      const metricValue = metrics[rule.metric] as number;
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

  private triggerAlert(rule: AlertRule, value: number, metrics: MonitoringMetrics): void {
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

  private async sendAlert(alert: any): Promise<void> {
    try {
      // Send to webhook if configured
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

      // Log to monitoring system
      console.log('Alert sent:', JSON.stringify(alert, null, 2));
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  private getAlertColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return '#ff9500';
      case 'low': return 'good';
      default: return '#cccccc';
    }
  }

  private updateBenchmarks(metrics: MonitoringMetrics): void {
    // Update Page Load Time benchmark (simulated)
    this.updateBenchmark('Page Load Time', metrics.averageResponseTime * 1.5);
    
    // Update API Response Time benchmark
    this.updateBenchmark('API Response Time', metrics.averageResponseTime);
    
    // Update Cache Hit Rate benchmark
    this.updateBenchmark('Cache Hit Rate', metrics.cacheHitRate);
    
    // Update Error Recovery Rate benchmark (simulated)
    this.updateBenchmark('Error Recovery Rate', 100 - metrics.loadingFailureRate);
  }

  private updateBenchmark(name: string, currentValue: number): void {
    const benchmark = this.benchmarks.get(name);
    if (!benchmark) return;

    const previousValue = benchmark.current;
    benchmark.current = currentValue;
    benchmark.lastUpdated = new Date();

    // Determine trend
    const changePercent = ((currentValue - benchmark.baseline) / benchmark.baseline) * 100;
    
    if (Math.abs(changePercent) < benchmark.threshold) {
      benchmark.trend = 'stable';
    } else if (changePercent > 0) {
      // For metrics where higher is better (cache hit rate, error recovery rate)
      benchmark.trend = name.includes('Rate') ? 'improving' : 'degrading';
    } else {
      // For metrics where lower is better (response time, load time)
      benchmark.trend = name.includes('Time') ? 'improving' : 'degrading';
    }

    this.benchmarks.set(name, benchmark);
  }

  private checkSLACompliance(): void {
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

  private calculateSLACompliance(sla: SLATarget): {
    isViolated: boolean;
    currentValue: number;
    targetValue: number;
    compliancePercentage: number;
  } {
    // Get metrics for the specified period
    const periodMetrics = this.getMetricsForPeriod(sla.period);
    
    if (periodMetrics.length === 0) {
      return {
        isViolated: false,
        currentValue: 0,
        targetValue: sla.target,
        compliancePercentage: 100
      };
    }

    // Calculate average for the period
    const currentValue = periodMetrics.reduce((sum, m) => sum + (m[sla.metric] as number), 0) / periodMetrics.length;
    
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

  private getMetricsForPeriod(period: string): MonitoringMetrics[] {
    const now = new Date();
    let cutoffTime: Date;

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

  // Public API methods
  public getMetrics(limit: number = 100): MonitoringMetrics[] {
    return this.metrics.slice(-limit);
  }

  public getCurrentMetrics(): MonitoringMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] ?? null : null;
  }

  public getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  public updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) return false;

    const currentRule = this.alertRules[ruleIndex];
    if (currentRule) {
      // Ensure all required properties are present for exact optional property types
      const updatedRule: AlertRule = {
        id: currentRule.id,
        name: currentRule.name,
        metric: currentRule.metric,
        threshold: currentRule.threshold,
        operator: currentRule.operator,
        severity: currentRule.severity,
        enabled: currentRule.enabled,
        cooldownPeriod: currentRule.cooldownPeriod,
        ...updates
      };
      
      // Only include lastTriggered if it exists
      if (currentRule.lastTriggered !== undefined) {
        updatedRule.lastTriggered = currentRule.lastTriggered;
      }
      this.alertRules[ruleIndex] = updatedRule;
    }
    return true;
  }

  public getSLATargets(): SLATarget[] {
    return [...this.slaTargets];
  }

  public getSLACompliance(): Array<{
    sla: SLATarget;
    compliance: {
      isViolated: boolean;
      currentValue: number;
      targetValue: number;
      compliancePercentage: number;
    };
  }> {
    return this.slaTargets.map((sla: SLATarget) => ({
      sla,
      compliance: this.calculateSLACompliance(sla)
    }));
  }

  public getBenchmarks(): PerformanceBenchmark[] {
    return Array.from(this.benchmarks.values());
  }

  public getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: MonitoringMetrics | null;
  } {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) {
      return { status: 'warning', issues: ['No metrics available'], metrics: null };
    }

    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check critical thresholds
    if (currentMetrics.errorRate > 5) {
      issues.push('Critical error rate');
      status = 'critical';
    }
    if (currentMetrics.loadingFailureRate > 10) {
      issues.push('Critical loading failure rate');
      status = 'critical';
    }

    // Check warning thresholds
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

export const productionMonitoringService = new ProductionMonitoringService();
export default productionMonitoringService;