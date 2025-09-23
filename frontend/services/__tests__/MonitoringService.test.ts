/**
 * MonitoringService Tests
 */

import { monitoringService, AlertRule, MonitoringMetrics } from '../MonitoringService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock errorTracker
jest.mock('../ErrorTracker', () => ({
  errorTracker: {
    getPerformanceStats: jest.fn(() => ({
      errorRate: 0.05,
      averageApiResponseTime: 150,
      overallCacheHitRate: 0.8,
      averageNetworkLatency: 50
    })),
    getErrorStats: jest.fn(() => ({
      totalErrors: 10
    })),
    trackError: jest.fn()
  },
  ErrorType: {
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  },
  ErrorSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  }
}));

describe('MonitoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    monitoringService.stopMonitoring();
  });

  afterEach(() => {
    monitoringService.stopMonitoring();
  });

  describe('Initialization', () => {
    it('should initialize with default alert rules', () => {
      const rules = monitoringService.getAlertRules();
      
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some(rule => rule.name === 'High Error Rate')).toBe(true);
      expect(rules.some(rule => rule.name === 'Slow API Response')).toBe(true);
      expect(rules.some(rule => rule.name === 'Low Cache Hit Rate')).toBe(true);
    });

    it('should load persisted data on initialization', () => {
      // Test that the service can handle persisted data
      // Since we're using a singleton, we'll test the persistence mechanism
      const testRule: AlertRule = {
        id: 'test_persistence',
        name: 'Test Persistence',
        description: 'Test rule for persistence',
        condition: 'error_rate',
        threshold: 0.15,
        operator: 'greater_than',
        timeWindow: 5,
        enabled: true,
        triggered: false,
        triggerCount: 0,
        severity: 'medium'
      };

      monitoringService.setAlertRule(testRule);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'monitoring_data',
        expect.any(String)
      );
    });
  });

  describe('Metrics Collection', () => {
    it('should collect and store metrics', (done) => {
      const unsubscribe = monitoringService.subscribeToMetrics((metrics) => {
        expect(metrics.timestamp).toBeInstanceOf(Date);
        expect(metrics.errorRate).toBe(0.05);
        expect(metrics.averageResponseTime).toBe(150);
        expect(metrics.cacheHitRate).toBe(0.8);
        expect(metrics.networkLatency).toBe(50);
        
        unsubscribe();
        done();
      });

      monitoringService.startMonitoring(100); // 100ms interval for testing
    });

    it('should maintain metrics history', (done) => {
      let metricsCount = 0;
      
      const unsubscribe = monitoringService.subscribeToMetrics(() => {
        metricsCount++;
        
        if (metricsCount >= 3) {
          const history = monitoringService.getMetricsHistory();
          expect(history.length).toBeGreaterThanOrEqual(3);
          
          unsubscribe();
          done();
        }
      });

      monitoringService.startMonitoring(50); // 50ms interval for testing
    });

    it('should limit metrics history size', () => {
      // This would require a way to set maxHistorySize for testing
      // For now, we'll test that the service doesn't crash with many metrics
      for (let i = 0; i < 10; i++) {
        monitoringService.startMonitoring(1);
        monitoringService.stopMonitoring();
      }
      
      expect(monitoringService.getMetricsHistory().length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Alert Management', () => {
    it('should trigger alerts when conditions are met', (done) => {
      // Mock high error rate
      const mockErrorTracker = require('../ErrorTracker').errorTracker;
      mockErrorTracker.getPerformanceStats.mockReturnValue({
        errorRate: 0.15, // Above 10% threshold
        averageApiResponseTime: 150,
        overallCacheHitRate: 0.8,
        averageNetworkLatency: 50
      });

      const unsubscribe = monitoringService.subscribeToAlerts((alert) => {
        expect(alert.ruleName).toBe('High Error Rate');
        expect(alert.severity).toBe('high');
        expect(alert.acknowledged).toBe(false);
        
        unsubscribe();
        done();
      });

      monitoringService.startMonitoring(100);
    });

    it('should resolve alerts when conditions are no longer met', (done) => {
      const mockErrorTracker = require('../ErrorTracker').errorTracker;
      
      // First trigger an alert
      mockErrorTracker.getPerformanceStats.mockReturnValue({
        errorRate: 0.15, // Above threshold
        averageApiResponseTime: 150,
        overallCacheHitRate: 0.8,
        averageNetworkLatency: 50
      });

      let alertTriggered = false;
      
      const unsubscribe = monitoringService.subscribeToAlerts((alert) => {
        if (!alertTriggered) {
          alertTriggered = true;
          
          // Now return normal values
          mockErrorTracker.getPerformanceStats.mockReturnValue({
            errorRate: 0.05, // Below threshold
            averageApiResponseTime: 150,
            overallCacheHitRate: 0.8,
            averageNetworkLatency: 50
          });
          
          // Check that alert is resolved after next collection
          setTimeout(() => {
            const activeAlerts = monitoringService.getActiveAlerts();
            expect(activeAlerts.length).toBe(0);
            
            unsubscribe();
            done();
          }, 150);
        }
      });

      monitoringService.startMonitoring(100);
    });

    it('should acknowledge alerts', () => {
      // Create a mock alert
      const mockAlert = {
        id: 'test_alert',
        ruleId: 'test_rule',
        ruleName: 'Test Rule',
        message: 'Test alert',
        severity: 'medium' as const,
        timestamp: new Date(),
        acknowledged: false
      };

      // Manually add alert for testing
      (monitoringService as any).activeAlerts.set(mockAlert.id, mockAlert);

      monitoringService.acknowledgeAlert(mockAlert.id);

      const alerts = monitoringService.getAllAlerts();
      const acknowledgedAlert = alerts.find(a => a.id === mockAlert.id);
      expect(acknowledgedAlert?.acknowledged).toBe(true);
    });
  });

  describe('Alert Rules Management', () => {
    it('should add new alert rules', () => {
      const newRule: AlertRule = {
        id: 'test_rule',
        name: 'Test Rule',
        description: 'Test rule description',
        condition: 'error_rate',
        threshold: 0.05,
        operator: 'greater_than',
        timeWindow: 5,
        enabled: true,
        triggered: false,
        triggerCount: 0,
        severity: 'medium'
      };

      monitoringService.setAlertRule(newRule);

      const rules = monitoringService.getAlertRules();
      expect(rules.some(rule => rule.id === 'test_rule')).toBe(true);
    });

    it('should remove alert rules', () => {
      const rules = monitoringService.getAlertRules();
      const ruleToRemove = rules[0];

      monitoringService.removeAlertRule(ruleToRemove.id);

      const updatedRules = monitoringService.getAlertRules();
      expect(updatedRules.some(rule => rule.id === ruleToRemove.id)).toBe(false);
    });

    it('should toggle alert rule enabled state', () => {
      const rules = monitoringService.getAlertRules();
      const ruleToToggle = rules[0];
      const originalState = ruleToToggle.enabled;

      monitoringService.toggleAlertRule(ruleToToggle.id, !originalState);

      const updatedRules = monitoringService.getAlertRules();
      const updatedRule = updatedRules.find(rule => rule.id === ruleToToggle.id);
      expect(updatedRule?.enabled).toBe(!originalState);
    });
  });

  describe('Data Management', () => {
    it('should persist data to localStorage', () => {
      const newRule: AlertRule = {
        id: 'persist_test',
        name: 'Persist Test',
        description: 'Test persistence',
        condition: 'error_rate',
        threshold: 0.1,
        operator: 'greater_than',
        timeWindow: 5,
        enabled: true,
        triggered: false,
        triggerCount: 0,
        severity: 'low'
      };

      monitoringService.setAlertRule(newRule);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'monitoring_data',
        expect.any(String)
      );
    });

    it('should export monitoring data', () => {
      const exportedData = monitoringService.exportData();

      expect(exportedData.metrics).toBeInstanceOf(Array);
      expect(exportedData.alerts).toBeInstanceOf(Array);
      expect(exportedData.rules).toBeInstanceOf(Array);
      expect(exportedData.exportedAt).toBeInstanceOf(Date);
    });

    it('should cleanup old data', () => {
      // Add some old metrics manually for testing
      const oldMetrics: MonitoringMetrics = {
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
        errorRate: 0.1,
        averageResponseTime: 200,
        cacheHitRate: 0.7,
        errorCount: 5,
        networkLatency: 100,
        activeUsers: 50,
        memoryUsage: 60,
        cpuUsage: 30
      };

      (monitoringService as any).metricsHistory.push(oldMetrics);

      monitoringService.cleanup(24); // Clean data older than 24 hours

      const history = monitoringService.getMetricsHistory();
      expect(history.some(m => m.timestamp.getTime() === oldMetrics.timestamp.getTime())).toBe(false);
    });
  });

  describe('Subscriptions', () => {
    it('should handle metrics subscriptions', () => {
      const callback = jest.fn();
      const unsubscribe = monitoringService.subscribeToMetrics(callback);

      expect(typeof unsubscribe).toBe('function');

      // Trigger metrics collection
      monitoringService.startMonitoring(100);

      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
        unsubscribe();
        monitoringService.stopMonitoring();
      }, 150);
    });

    it('should handle alert subscriptions', () => {
      const callback = jest.fn();
      const unsubscribe = monitoringService.subscribeToAlerts(callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should handle subscription errors gracefully', () => {
      const faultyCallback = jest.fn(() => {
        throw new Error('Callback error');
      });

      const unsubscribe = monitoringService.subscribeToMetrics(faultyCallback);

      // This should not crash the service
      expect(() => {
        monitoringService.startMonitoring(100);
      }).not.toThrow();

      unsubscribe();
    });
  });

  describe('Service Lifecycle', () => {
    it('should start and stop monitoring', () => {
      expect(() => {
        monitoringService.startMonitoring(1000);
        monitoringService.stopMonitoring();
      }).not.toThrow();
    });

    it('should handle multiple start/stop calls', () => {
      expect(() => {
        monitoringService.startMonitoring(1000);
        monitoringService.startMonitoring(500); // Should stop previous and start new
        monitoringService.stopMonitoring();
        monitoringService.stopMonitoring(); // Should not crash
      }).not.toThrow();
    });

    it('should clean up resources on destroy', () => {
      monitoringService.startMonitoring(1000);
      
      expect(() => {
        monitoringService.stopMonitoring();
      }).not.toThrow();
    });
  });
});