/**
 * Monitoring Service
 * Provides real-time monitoring capabilities and alert management
 */

import { errorTracker, ErrorType, ErrorSeverity, TrackedError } from './ErrorTracker';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: 'error_rate' | 'response_time' | 'cache_hit_rate' | 'error_count' | 'network_latency';
  threshold: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  timeWindow: number; // minutes
  enabled: boolean;
  triggered: boolean;
  lastTriggered?: Date;
  triggerCount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MonitoringMetrics {
  timestamp: Date;
  errorRate: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorCount: number;
  networkLatency: number;
  activeUsers: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface AlertNotification {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

class MonitoringService {
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, AlertNotification> = new Map();
  private metricsHistory: MonitoringMetrics[] = [];
  private subscribers: Set<(metrics: MonitoringMetrics) => void> = new Set();
  private alertSubscribers: Set<(alert: AlertNotification) => void> = new Set();
  private monitoringInterval?: NodeJS.Timeout;
  private maxHistorySize = 1000;

  constructor() {
    this.initializeDefaultRules();
    this.loadPersistedData();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds 10% over 5 minutes',
        condition: 'error_rate',
        threshold: 0.1,
        operator: 'greater_than',
        timeWindow: 5,
        enabled: true,
        triggered: false,
        triggerCount: 0,
        severity: 'high'
      },
      {
        id: 'slow_response_time',
        name: 'Slow API Response',
        description: 'Average response time exceeds 2 seconds',
        condition: 'response_time',
        threshold: 2000,
        operator: 'greater_than',
        timeWindow: 5,
        enabled: true,
        triggered: false,
        triggerCount: 0,
        severity: 'medium'
      },
      {
        id: 'low_cache_hit_rate',
        name: 'Low Cache Hit Rate',
        description: 'Cache hit rate below 50%',
        condition: 'cache_hit_rate',
        threshold: 0.5,
        operator: 'less_than',
        timeWindow: 10,
        enabled: true,
        triggered: false,
        triggerCount: 0,
        severity: 'medium'
      },
      {
        id: 'high_network_latency',
        name: 'High Network Latency',
        description: 'Network latency exceeds 1 second',
        condition: 'network_latency',
        threshold: 1000,
        operator: 'greater_than',
        timeWindow: 5,
        enabled: true,
        triggered: false,
        triggerCount: 0,
        severity: 'medium'
      },
      {
        id: 'critical_error_count',
        name: 'Critical Error Count',
        description: 'More than 50 errors in 5 minutes',
        condition: 'error_count',
        threshold: 50,
        operator: 'greater_than',
        timeWindow: 5,
        enabled: true,
        triggered: false,
        triggerCount: 0,
        severity: 'critical'
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    // Collect initial metrics
    this.collectMetrics();
  }

  /**
   * Stop real-time monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Collect current metrics
   */
  private collectMetrics(): void {
    const performanceStats = errorTracker.getPerformanceStats();
    const errorStats = errorTracker.getErrorStats();
    
    const metrics: MonitoringMetrics = {
      timestamp: new Date(),
      errorRate: performanceStats.errorRate,
      averageResponseTime: performanceStats.averageApiResponseTime,
      cacheHitRate: performanceStats.overallCacheHitRate,
      errorCount: errorStats.totalErrors,
      networkLatency: performanceStats.averageNetworkLatency,
      activeUsers: this.getActiveUserCount(),
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage()
    };

    // Add to history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }

    // Check alert conditions
    this.checkAlertConditions(metrics);

    // Notify subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error notifying metrics subscriber:', error);
      }
    });

    // Persist data
    this.persistData();
  }

  /**
   * Check alert conditions against current metrics
   */
  private checkAlertConditions(metrics: MonitoringMetrics): void {
    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      let currentValue = 0;
      switch (rule.condition) {
        case 'error_rate':
          currentValue = metrics.errorRate;
          break;
        case 'response_time':
          currentValue = metrics.averageResponseTime;
          break;
        case 'cache_hit_rate':
          currentValue = metrics.cacheHitRate;
          break;
        case 'error_count':
          currentValue = metrics.errorCount;
          break;
        case 'network_latency':
          currentValue = metrics.networkLatency;
          break;
      }

      const shouldTrigger = this.evaluateCondition(currentValue, rule.threshold, rule.operator);

      if (shouldTrigger && !rule.triggered) {
        this.triggerAlert(rule, currentValue, metrics.timestamp);
      } else if (!shouldTrigger && rule.triggered) {
        this.resolveAlert(rule.id);
      }
    });
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return Math.abs(value - threshold) < 0.001;
      default:
        return false;
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule, currentValue: number, timestamp: Date): void {
    const alert: AlertNotification = {
      id: `${rule.id}_${timestamp.getTime()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      message: `${rule.description} - Current value: ${this.formatValue(currentValue, rule.condition)}`,
      severity: rule.severity,
      timestamp,
      acknowledged: false
    };

    // Update rule state
    rule.triggered = true;
    rule.lastTriggered = timestamp;
    rule.triggerCount++;

    // Store alert
    this.activeAlerts.set(alert.id, alert);

    // Notify subscribers
    this.alertSubscribers.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error notifying alert subscriber:', error);
      }
    });

    // Log alert
    console.warn(`Alert triggered: ${rule.name}`, alert);

    // Track as error for monitoring
    errorTracker.trackError({
      type: ErrorType.UNKNOWN_ERROR,
      severity: this.mapAlertSeverityToErrorSeverity(rule.severity),
      message: `Alert: ${rule.name}`,
      context: {
        metadata: {
          alertId: alert.id,
          ruleId: rule.id,
          currentValue,
          threshold: rule.threshold,
          condition: rule.condition
        }
      }
    });
  }

  /**
   * Resolve an alert
   */
  private resolveAlert(ruleId: string): void {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return;

    rule.triggered = false;

    // Find and resolve active alerts for this rule
    this.activeAlerts.forEach(alert => {
      if (alert.ruleId === ruleId && !alert.resolvedAt) {
        alert.resolvedAt = new Date();
      }
    });
  }

  /**
   * Format value for display
   */
  private formatValue(value: number, condition: string): string {
    switch (condition) {
      case 'error_rate':
      case 'cache_hit_rate':
        return `${(value * 100).toFixed(1)}%`;
      case 'response_time':
      case 'network_latency':
        return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`;
      default:
        return value.toString();
    }
  }

  /**
   * Map alert severity to error severity
   */
  private mapAlertSeverityToErrorSeverity(alertSeverity: string): ErrorSeverity {
    switch (alertSeverity) {
      case 'critical':
        return ErrorSeverity.CRITICAL;
      case 'high':
        return ErrorSeverity.HIGH;
      case 'medium':
        return ErrorSeverity.MEDIUM;
      case 'low':
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Get active user count (placeholder implementation)
   */
  private getActiveUserCount(): number {
    // This would typically come from analytics or session tracking
    return Math.floor(Math.random() * 100) + 10;
  }

  /**
   * Get memory usage (placeholder implementation)
   */
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory;
      return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }
    return Math.random() * 50 + 25; // Mock value
  }

  /**
   * Get CPU usage (placeholder implementation)
   */
  private getCpuUsage(): number {
    // This would typically come from performance monitoring
    return Math.random() * 30 + 10; // Mock value
  }

  /**
   * Subscribe to metrics updates
   */
  subscribeToMetrics(callback: (metrics: MonitoringMetrics) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Subscribe to alert notifications
   */
  subscribeToAlerts(callback: (alert: AlertNotification) => void): () => void {
    this.alertSubscribers.add(callback);
    return () => this.alertSubscribers.delete(callback);
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): MonitoringMetrics | null {
    return this.metricsHistory.length > 0 
      ? this.metricsHistory[this.metricsHistory.length - 1] 
      : null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit?: number): MonitoringMetrics[] {
    const history = [...this.metricsHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get alert rules
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): AlertNotification[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => !alert.resolvedAt)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get all alerts (including resolved)
   */
  getAllAlerts(): AlertNotification[] {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.persistData();
    }
  }

  /**
   * Add or update alert rule
   */
  setAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.persistData();
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    this.persistData();
  }

  /**
   * Enable/disable alert rule
   */
  toggleAlertRule(ruleId: string, enabled: boolean): void {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      if (!enabled && rule.triggered) {
        this.resolveAlert(ruleId);
      }
      this.persistData();
    }
  }

  /**
   * Clear old metrics and alerts
   */
  cleanup(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    // Clean metrics history
    this.metricsHistory = this.metricsHistory.filter(
      metrics => metrics.timestamp > cutoffTime
    );

    // Clean resolved alerts
    const alertsToRemove: string[] = [];
    this.activeAlerts.forEach((alert, id) => {
      if (alert.resolvedAt && alert.resolvedAt < cutoffTime) {
        alertsToRemove.push(id);
      }
    });

    alertsToRemove.forEach(id => this.activeAlerts.delete(id));
    this.persistData();
  }

  /**
   * Export monitoring data
   */
  exportData(): {
    metrics: MonitoringMetrics[];
    alerts: AlertNotification[];
    rules: AlertRule[];
    exportedAt: Date;
  } {
    return {
      metrics: this.getMetricsHistory(),
      alerts: this.getAllAlerts(),
      rules: this.getAlertRules(),
      exportedAt: new Date()
    };
  }

  /**
   * Persist data to localStorage
   */
  private persistData(): void {
    try {
      const data = {
        alertRules: Array.from(this.alertRules.entries()),
        activeAlerts: Array.from(this.activeAlerts.entries()),
        metricsHistory: this.metricsHistory.slice(-100) // Keep last 100 metrics
      };

      localStorage.setItem('monitoring_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist monitoring data:', error);
    }
  }

  /**
   * Load persisted data from localStorage
   */
  private loadPersistedData(): void {
    try {
      const data = localStorage.getItem('monitoring_data');
      if (data) {
        const parsed = JSON.parse(data);

        // Restore alert rules (merge with defaults)
        if (parsed.alertRules) {
          parsed.alertRules.forEach(([id, rule]: [string, AlertRule]) => {
            this.alertRules.set(id, {
              ...rule,
              lastTriggered: rule.lastTriggered ? new Date(rule.lastTriggered) : undefined
            });
          });
        }

        // Restore active alerts
        if (parsed.activeAlerts) {
          parsed.activeAlerts.forEach(([id, alert]: [string, AlertNotification]) => {
            this.activeAlerts.set(id, {
              ...alert,
              timestamp: new Date(alert.timestamp),
              resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined
            });
          });
        }

        // Restore metrics history
        if (parsed.metricsHistory) {
          this.metricsHistory = parsed.metricsHistory.map((metrics: any) => ({
            ...metrics,
            timestamp: new Date(metrics.timestamp)
          }));
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted monitoring data:', error);
    }
  }

  /**
   * Destroy the service and clean up resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.subscribers.clear();
    this.alertSubscribers.clear();
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();
export default monitoringService;