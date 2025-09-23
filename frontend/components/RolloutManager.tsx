/**
 * Rollout Manager Component
 * Provides interface for managing feature flag rollouts and monitoring
 */

import React, { useState, useEffect } from 'react';
import { featureFlagService, FeatureFlag } from '../services/FeatureFlagService';

interface RolloutMetrics {
  flagName: string;
  enabled: boolean;
  rolloutPercentage: number;
  estimatedUsers: number;
  errorRate: number;
  performanceImpact: number;
  userFeedback: number;
}

interface RolloutManagerProps {
  onRollback?: (flagName: string) => void;
  onRolloutIncrease?: (flagName: string, newPercentage: number) => void;
}

export const RolloutManager: React.FC<RolloutManagerProps> = ({
  onRollback,
  onRolloutIncrease
}) => {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>({});
  const [metrics, setMetrics] = useState<Record<string, RolloutMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);

  useEffect(() => {
    loadFlags();
    loadMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadFlags = () => {
    const allFlags = featureFlagService.getAllFlags();
    const flagDetails: Record<string, FeatureFlag> = {};
    
    Object.keys(allFlags).forEach(flagName => {
      const flag = featureFlagService.getFlag(flagName);
      if (flag) {
        flagDetails[flagName] = flag;
      }
    });
    
    setFlags(flagDetails);
    setLoading(false);
  };

  const loadMetrics = async () => {
    try {
      // In a real implementation, this would fetch from monitoring service
      const mockMetrics: Record<string, RolloutMetrics> = {};
      
      Object.keys(flags).forEach(flagName => {
        const flagMetrics = featureFlagService.getFlagMetrics(flagName);
        mockMetrics[flagName] = {
          flagName,
          enabled: flagMetrics.enabled,
          rolloutPercentage: flagMetrics.rolloutPercentage,
          estimatedUsers: flagMetrics.estimatedUsers,
          errorRate: Math.random() * 5, // Mock error rate 0-5%
          performanceImpact: Math.random() * 10 - 5, // Mock performance impact -5% to +5%
          userFeedback: Math.random() * 5 // Mock user feedback score 0-5
        };
      });
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load rollout metrics:', error);
    }
  };

  const handleRolloutChange = (flagName: string, newPercentage: number) => {
    featureFlagService.updateFlag(flagName, { rolloutPercentage: newPercentage });
    loadFlags();
    
    if (onRolloutIncrease) {
      onRolloutIncrease(flagName, newPercentage);
    }
  };

  const handleRollback = (flagName: string) => {
    featureFlagService.updateFlag(flagName, { 
      enabled: false, 
      rolloutPercentage: 0 
    });
    loadFlags();
    
    if (onRollback) {
      onRollback(flagName);
    }
  };

  const handleToggleFlag = (flagName: string) => {
    const flag = flags[flagName];
    featureFlagService.updateFlag(flagName, { enabled: !flag.enabled });
    loadFlags();
  };

  const getRolloutStatus = (percentage: number): string => {
    if (percentage === 0) return 'Not Started';
    if (percentage < 25) return 'Initial Rollout';
    if (percentage < 50) return 'Partial Rollout';
    if (percentage < 100) return 'Major Rollout';
    return 'Full Rollout';
  };

  const getHealthStatus = (metric: RolloutMetrics): 'healthy' | 'warning' | 'critical' => {
    if (metric.errorRate > 3 || metric.performanceImpact < -3) return 'critical';
    if (metric.errorRate > 1 || metric.performanceImpact < -1) return 'warning';
    return 'healthy';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Reliability Features Rollout Manager
        </h1>
        <p className="text-gray-600">
          Monitor and control the gradual rollout of reliability improvements
        </p>
      </div>

      <div className="grid gap-6">
        {Object.entries(flags).map(([flagName, flag]) => {
          const metric = metrics[flagName];
          const healthStatus = metric ? getHealthStatus(metric) : 'healthy';
          
          return (
            <div
              key={flagName}
              className={`bg-white rounded-lg shadow-md border-l-4 ${
                healthStatus === 'critical' ? 'border-red-500' :
                healthStatus === 'warning' ? 'border-yellow-500' :
                'border-green-500'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {flag.metadata?.description || flagName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getRolloutStatus(flag.rolloutPercentage)} • {flag.rolloutPercentage}% of users
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={flag.enabled}
                        onChange={() => handleToggleFlag(flagName)}
                        className="mr-2"
                      />
                      <span className="text-sm">Enabled</span>
                    </label>
                    
                    <button
                      onClick={() => handleRollback(flagName)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      disabled={!flag.enabled}
                    >
                      Rollback
                    </button>
                  </div>
                </div>

                {metric && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Error Rate</div>
                      <div className={`text-lg font-semibold ${
                        metric.errorRate > 3 ? 'text-red-600' :
                        metric.errorRate > 1 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {metric.errorRate.toFixed(2)}%
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Performance Impact</div>
                      <div className={`text-lg font-semibold ${
                        metric.performanceImpact < -3 ? 'text-red-600' :
                        metric.performanceImpact < -1 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {metric.performanceImpact > 0 ? '+' : ''}{metric.performanceImpact.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Estimated Users</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {metric.estimatedUsers.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">User Feedback</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {metric.userFeedback.toFixed(1)}/5
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rollout Percentage
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={flag.rolloutPercentage}
                      onChange={(e) => handleRolloutChange(flagName, parseInt(e.target.value))}
                      className="w-full"
                      disabled={!flag.enabled}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {flag.rolloutPercentage}%
                    </div>
                    <div className="text-sm text-gray-500">
                      Current rollout
                    </div>
                  </div>
                </div>

                {healthStatus !== 'healthy' && (
                  <div className={`mt-4 p-3 rounded ${
                    healthStatus === 'critical' ? 'bg-red-50 text-red-800' :
                    'bg-yellow-50 text-yellow-800'
                  }`}>
                    <div className="font-medium">
                      {healthStatus === 'critical' ? '⚠️ Critical Issues Detected' : '⚠️ Performance Warning'}
                    </div>
                    <div className="text-sm mt-1">
                      {healthStatus === 'critical' 
                        ? 'Consider immediate rollback due to high error rates or performance degradation.'
                        : 'Monitor closely before increasing rollout percentage.'
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rollout Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Safe Rollout Process:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Start with 5% rollout for initial testing</li>
              <li>• Monitor for 24 hours before increasing</li>
              <li>• Increase by 25% increments if metrics are healthy</li>
              <li>• Full rollout only after 95% success rate</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Rollback Triggers:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Error rate &gt; 3%</li>
              <li>• Performance degradation &gt; 3%</li>
              <li>• User feedback score &lt; 2.0</li>
              <li>• Critical user reports</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolloutManager;