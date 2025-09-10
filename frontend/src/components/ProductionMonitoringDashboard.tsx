/**
 * Production Monitoring Dashboard
 * Comprehensive dashboard for monitoring reliability features in production
 */

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface MonitoringMetrics {
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

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  operator: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  lastTriggered?: Date;
}

interface SLACompliance {
  sla: {
    name: string;
    target: number;
    period: string;
  };
  compliance: {
    isViolated: boolean;
    currentValue: number;
    compliancePercentage: number;
  };
}

interface PerformanceBenchmark {
  name: string;
  baseline: number;
  current: number;
  threshold: number;
  trend: 'improving' | 'stable' | 'degrading';
  lastUpdated: Date;
}

interface CacheStatistics {
  totalEndpoints: number;
  activeEndpoints: number;
  successRate: number;
  averageResponseTime: number;
  lastWarmingTime: Date | null;
}

interface DashboardData {
  health: {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: MonitoringMetrics | null;
  };
  metrics: {
    current: MonitoringMetrics | null;
    recent: MonitoringMetrics[];
  };
  alerts: {
    rules: AlertRule[];
    activeAlerts: AlertRule[];
  };
  sla: SLACompliance[];
  benchmarks: PerformanceBenchmark[];
  cache: CacheStatistics | null;
}

export const ProductionMonitoringDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/monitoring/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setDashboardData(data.dashboard);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerCacheWarmup = async () => {
    try {
      const response = await fetch('/api/monitoring/cache/warmup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        alert(`Cache warmup completed: ${data.results.successful}/${data.results.total} endpoints successful`);
        loadDashboardData(); // Refresh data
      } else {
        alert(`Cache warmup failed: ${data.message}`);
      }
    } catch (err) {
      alert(`Cache warmup error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'improving': return '📈';
      case 'degrading': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const formatMetricsForChart = (metrics: MonitoringMetrics[]) => {
    return metrics.map(m => ({
      time: new Date(m.timestamp).toLocaleTimeString(),
      errorRate: m.errorRate,
      responseTime: m.averageResponseTime,
      cacheHitRate: m.cacheHitRate,
      loadingFailureRate: m.loadingFailureRate
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Dashboard Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">No dashboard data available</div>
      </div>
    );
  }

  const chartData = formatMetricsForChart(dashboardData.metrics.recent);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Monitoring</h1>
          <p className="text-gray-600">Real-time monitoring of reliability features</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Auto-refresh</span>
          </label>
          
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            className="text-sm border rounded px-2 py-1"
            disabled={!autoRefresh}
          >
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
            <option value={300000}>5m</option>
          </select>
          
          <button
            onClick={loadDashboardData}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dashboardData.health.status)}`}>
              {dashboardData.health.status.toUpperCase()}
            </span>
          </div>
          
          {dashboardData.health.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Active Issues:</h4>
              {dashboardData.health.issues.map((issue, index) => (
                <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {issue}
                </div>
              ))}
            </div>
          )}
          
          {dashboardData.health.issues.length === 0 && (
            <div className="text-green-600 text-sm">✅ All systems operational</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Metrics</h3>
          {dashboardData.metrics.current && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Error Rate:</span>
                <span className={`text-sm font-medium ${
                  dashboardData.metrics.current.errorRate > 3 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {dashboardData.metrics.current.errorRate.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Response Time:</span>
                <span className="text-sm font-medium">
                  {dashboardData.metrics.current.averageResponseTime.toFixed(0)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cache Hit Rate:</span>
                <span className="text-sm font-medium text-blue-600">
                  {dashboardData.metrics.current.cacheHitRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Users:</span>
                <span className="text-sm font-medium">
                  {dashboardData.metrics.current.activeUsers}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cache Status</h3>
            <button
              onClick={triggerCacheWarmup}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Warm Cache
            </button>
          </div>
          
          {dashboardData.cache && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Success Rate:</span>
                <span className="text-sm font-medium text-green-600">
                  {dashboardData.cache.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Endpoints:</span>
                <span className="text-sm font-medium">
                  {dashboardData.cache.activeEndpoints}/{dashboardData.cache.totalEndpoints}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Response:</span>
                <span className="text-sm font-medium">
                  {dashboardData.cache.averageResponseTime.toFixed(0)}ms
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Last warmed: {dashboardData.cache.lastWarmingTime 
                  ? new Date(dashboardData.cache.lastWarmingTime).toLocaleString()
                  : 'Never'
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Rate & Response Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="errorRate" 
                stroke="#ef4444" 
                name="Error Rate (%)" 
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="responseTime" 
                stroke="#3b82f6" 
                name="Response Time (ms)" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cache Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="cacheHitRate" 
                stroke="#10b981" 
                name="Cache Hit Rate (%)" 
              />
              <Line 
                type="monotone" 
                dataKey="loadingFailureRate" 
                stroke="#f59e0b" 
                name="Loading Failure Rate (%)" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts and SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
          
          {dashboardData.alerts.activeAlerts.length === 0 ? (
            <div className="text-green-600 text-sm">✅ No active alerts</div>
          ) : (
            <div className="space-y-3">
              {dashboardData.alerts.activeAlerts.map(alert => (
                <div key={alert.id} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{alert.name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {alert.metric} {alert.operator} {alert.threshold}
                  </div>
                  {alert.lastTriggered && (
                    <div className="text-xs text-gray-500 mt-1">
                      Last triggered: {new Date(alert.lastTriggered).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA Compliance</h3>
          
          <div className="space-y-3">
            {dashboardData.sla.map((slaItem, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{slaItem.sla.name}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    slaItem.compliance.isViolated ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'
                  }`}>
                    {slaItem.compliance.compliancePercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Current: {slaItem.compliance.currentValue.toFixed(2)} | 
                  Target: {slaItem.sla.target} | 
                  Period: {slaItem.sla.period}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Benchmarks */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Benchmarks</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData.benchmarks.map((benchmark, index) => (
            <div key={index} className="border rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{benchmark.name}</span>
                <span className="text-lg">{getTrendIcon(benchmark.trend)}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Baseline:</span>
                  <span>{benchmark.baseline.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current:</span>
                  <span className={`font-medium ${
                    benchmark.trend === 'improving' ? 'text-green-600' :
                    benchmark.trend === 'degrading' ? 'text-red-600' :
                    'text-gray-900'
                  }`}>
                    {benchmark.current.toFixed(0)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Updated: {new Date(benchmark.lastUpdated).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductionMonitoringDashboard;