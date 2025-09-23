/**
 * Monitoring Dashboard Component
 * Provides comprehensive error tracking, performance monitoring, and debugging interface
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useErrorTracker } from '../hooks/useErrorTracker';
import { ErrorType, ErrorSeverity, TrackedError } from '../services/ErrorTracker';

interface DashboardStats {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  resolvedErrors: number;
  unresolvedErrors: number;
  averageResolutionTime: number;
  averageApiResponseTime: number;
  averageImageLoadTime: number;
  overallCacheHitRate: number;
  averageNetworkLatency: number;
  slowestEndpoints: Array<{ endpoint: string; averageTime: number }>;
  errorRate: number;
}

interface AlertRule {
  id: string;
  name: string;
  condition: 'error_rate' | 'response_time' | 'cache_hit_rate' | 'error_count';
  threshold: number;
  operator: 'greater_than' | 'less_than';
  enabled: boolean;
  triggered: boolean;
  lastTriggered?: Date;
}

const MonitoringDashboard: React.FC = () => {
  const { getErrors, getMetrics, resolveError } = useErrorTracker('MonitoringDashboard');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedErrorType, setSelectedErrorType] = useState<ErrorType | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<ErrorSeverity | 'all'>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: '1',
      name: 'High Error Rate',
      condition: 'error_rate',
      threshold: 0.1, // 10%
      operator: 'greater_than',
      enabled: true,
      triggered: false
    },
    {
      id: '2',
      name: 'Slow API Response',
      condition: 'response_time',
      threshold: 2000, // 2 seconds
      operator: 'greater_than',
      enabled: true,
      triggered: false
    },
    {
      id: '3',
      name: 'Low Cache Hit Rate',
      condition: 'cache_hit_rate',
      threshold: 0.5, // 50%
      operator: 'less_than',
      enabled: true,
      triggered: false
    }
  ]);

  // Get filtered errors based on current filters
  const filteredErrors = useMemo(() => {
    const now = new Date();
    const timeRanges = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const since = new Date(now.getTime() - timeRanges[selectedTimeRange]);

    return getErrors({
      type: selectedErrorType !== 'all' ? selectedErrorType : undefined,
      severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
      resolved: showResolved ? undefined : false,
      since
    });
  }, [getErrors, selectedTimeRange, selectedErrorType, selectedSeverity, showResolved]);

  // Calculate dashboard statistics
  const stats = useMemo((): DashboardStats => {
    const metrics = getMetrics();
    
    // Calculate error statistics
    const errorsByType = {} as Record<ErrorType, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;
    let resolvedCount = 0;
    let totalResolutionTime = 0;

    filteredErrors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + error.occurrenceCount;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + error.occurrenceCount;
      
      if (error.resolved && error.resolvedAt) {
        resolvedCount++;
        totalResolutionTime += error.resolvedAt.getTime() - error.firstOccurrence.getTime();
      }
    });

    // Calculate performance statistics
    let totalApiTime = 0;
    let totalApiRequests = 0;
    metrics.apiResponseTimes.forEach(times => {
      totalApiTime += times.reduce((sum, time) => sum + time, 0);
      totalApiRequests += times.length;
    });

    let totalImageTime = 0;
    let totalImageRequests = 0;
    metrics.imageLoadTimes.forEach(times => {
      totalImageTime += times.reduce((sum, time) => sum + time, 0);
      totalImageRequests += times.length;
    });

    let totalHits = 0;
    let totalCacheRequests = 0;
    metrics.cacheHitRates.forEach(rates => {
      totalHits += rates.hits;
      totalCacheRequests += rates.hits + rates.misses;
    });

    const slowestEndpoints = Array.from(metrics.apiResponseTimes.entries())
      .map(([endpoint, times]) => ({
        endpoint,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    const totalErrors = filteredErrors.reduce((sum, e) => sum + e.occurrenceCount, 0);
    const totalSuccessfulRequests = Array.from(metrics.successRates.values())
      .reduce((sum, rates) => sum + rates.success, 0);

    return {
      totalErrors,
      errorsByType,
      errorsBySeverity,
      resolvedErrors: resolvedCount,
      unresolvedErrors: filteredErrors.length - resolvedCount,
      averageResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0,
      averageApiResponseTime: totalApiRequests > 0 ? totalApiTime / totalApiRequests : 0,
      averageImageLoadTime: totalImageRequests > 0 ? totalImageTime / totalImageRequests : 0,
      overallCacheHitRate: totalCacheRequests > 0 ? totalHits / totalCacheRequests : 0,
      averageNetworkLatency: metrics.networkLatency.length > 0 
        ? metrics.networkLatency.reduce((sum, lat) => sum + lat, 0) / metrics.networkLatency.length 
        : 0,
      slowestEndpoints,
      errorRate: (totalErrors + totalSuccessfulRequests) > 0 
        ? totalErrors / (totalErrors + totalSuccessfulRequests) 
        : 0
    };
  }, [filteredErrors, getMetrics]);

  // Check alert conditions
  useEffect(() => {
    const checkAlerts = () => {
      const updatedRules = alertRules.map(rule => {
        if (!rule.enabled) return rule;

        let shouldTrigger = false;
        let currentValue = 0;

        switch (rule.condition) {
          case 'error_rate':
            currentValue = stats.errorRate;
            break;
          case 'response_time':
            currentValue = stats.averageApiResponseTime;
            break;
          case 'cache_hit_rate':
            currentValue = stats.overallCacheHitRate;
            break;
          case 'error_count':
            currentValue = stats.totalErrors;
            break;
        }

        if (rule.operator === 'greater_than') {
          shouldTrigger = currentValue > rule.threshold;
        } else {
          shouldTrigger = currentValue < rule.threshold;
        }

        if (shouldTrigger && !rule.triggered) {
          // Alert triggered
          console.warn(`Alert triggered: ${rule.name} - Current value: ${currentValue}, Threshold: ${rule.threshold}`);
          return {
            ...rule,
            triggered: true,
            lastTriggered: new Date()
          };
        } else if (!shouldTrigger && rule.triggered) {
          // Alert resolved
          return {
            ...rule,
            triggered: false
          };
        }

        return rule;
      });

      setAlertRules(updatedRules);
    };

    checkAlerts();
  }, [stats, alertRules]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Force re-render to refresh data
      setSelectedTimeRange(prev => prev);
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getSeverityColor = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.CRITICAL: return 'text-red-600 bg-red-100';
      case ErrorSeverity.HIGH: return 'text-orange-600 bg-orange-100';
      case ErrorSeverity.MEDIUM: return 'text-yellow-600 bg-yellow-100';
      case ErrorSeverity.LOW: return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getErrorTypeColor = (type: ErrorType): string => {
    switch (type) {
      case ErrorType.NETWORK_ERROR: return 'text-red-600';
      case ErrorType.TIMEOUT_ERROR: return 'text-orange-600';
      case ErrorType.SERVER_ERROR: return 'text-purple-600';
      case ErrorType.IMAGE_LOAD_ERROR: return 'text-blue-600';
      case ErrorType.CACHE_ERROR: return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Monitoring Dashboard</h1>
          <p className="text-gray-600">Real-time error tracking and performance monitoring</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Time Range */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Time Range:</label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {/* Error Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Error Type:</label>
              <select
                value={selectedErrorType}
                onChange={(e) => setSelectedErrorType(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Types</option>
                {Object.values(ErrorType).map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Severity:</label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Severities</option>
                {Object.values(ErrorSeverity).map(severity => (
                  <option key={severity} value={severity}>{severity}</option>
                ))}
              </select>
            </div>

            {/* Show Resolved */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Show Resolved</span>
            </label>

            {/* Auto Refresh */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Auto Refresh</span>
            </label>

            {autoRefresh && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Interval:</label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                  <option value={60}>1m</option>
                  <option value={300}>5m</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Alert Status */}
        {alertRules.some(rule => rule.triggered) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Active Alerts</h3>
            <div className="space-y-2">
              {alertRules.filter(rule => rule.triggered).map(rule => (
                <div key={rule.id} className="flex items-center justify-between bg-red-100 rounded-md p-2">
                  <span className="text-red-800 font-medium">{rule.name}</span>
                  <span className="text-red-600 text-sm">
                    Triggered {rule.lastTriggered ? formatDuration(Date.now() - rule.lastTriggered.getTime()) : ''} ago
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Errors</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalErrors}</p>
            <p className="text-sm text-gray-600 mt-1">
              {stats.unresolvedErrors} unresolved
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Error Rate</h3>
            <p className="text-3xl font-bold text-gray-900">{formatPercentage(stats.errorRate)}</p>
            <p className="text-sm text-gray-600 mt-1">
              of total requests
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Response Time</h3>
            <p className="text-3xl font-bold text-gray-900">{formatDuration(stats.averageApiResponseTime)}</p>
            <p className="text-sm text-gray-600 mt-1">
              API responses
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Cache Hit Rate</h3>
            <p className="text-3xl font-bold text-gray-900">{formatPercentage(stats.overallCacheHitRate)}</p>
            <p className="text-sm text-gray-600 mt-1">
              cache efficiency
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Errors by Type */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Errors by Type</h3>
            <div className="space-y-3">
              {Object.entries(stats.errorsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${getErrorTypeColor(type as ErrorType)}`}>
                    {type.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Errors by Severity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Errors by Severity</h3>
            <div className="space-y-3">
              {Object.entries(stats.errorsBySeverity).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${getSeverityColor(severity as ErrorSeverity)}`}>
                    {severity}
                  </span>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Slowest Endpoints */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Slowest Endpoints</h3>
            <div className="space-y-3">
              {stats.slowestEndpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                    {endpoint.endpoint}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDuration(endpoint.averageTime)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Avg Image Load Time</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDuration(stats.averageImageLoadTime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Avg Network Latency</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDuration(stats.averageNetworkLatency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Avg Resolution Time</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDuration(stats.averageResolutionTime)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Errors */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Errors</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Occurred
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredErrors.slice(0, 10).map((error) => (
                  <tr key={error.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {error.message}
                      </div>
                      {error.context.url && (
                        <div className="text-xs text-gray-500 max-w-xs truncate">
                          {error.context.url}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${getErrorTypeColor(error.type)}`}>
                        {error.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(error.severity)}`}>
                        {error.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {error.occurrenceCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(Date.now() - error.lastOccurrence.getTime())} ago
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        error.resolved 
                          ? 'text-green-800 bg-green-100' 
                          : 'text-red-800 bg-red-100'
                      }`}>
                        {error.resolved ? 'Resolved' : 'Open'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!error.resolved && (
                        <button
                          onClick={() => resolveError(error.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;