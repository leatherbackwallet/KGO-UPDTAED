/**
 * React Hook for Feature Flag Usage
 * Provides reactive feature flag state management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { featureFlagService, FeatureFlag } from '../services/FeatureFlagService';

export interface UseFeatureFlagReturn {
  isEnabled: boolean;
  flag: FeatureFlag | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useFeatureFlag(flagName: string): UseFeatureFlagReturn {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      
      const flagEnabled = featureFlagService.isEnabled(flagName);
      const flagData = featureFlagService.getFlag(flagName);
      
      setIsEnabled(flagEnabled);
      setFlag(flagData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check feature flag'));
      setIsEnabled(false);
      setFlag(null);
    } finally {
      setLoading(false);
    }
  }, [flagName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    isEnabled,
    flag,
    loading,
    error,
    refresh
  };
}

export function useFeatureFlags(flagNames: string[]): Record<string, UseFeatureFlagReturn> {
  const [flags, setFlags] = useState<Record<string, UseFeatureFlagReturn>>({});

  useEffect(() => {
    const flagResults: Record<string, UseFeatureFlagReturn> = {};
    
    flagNames.forEach(flagName => {
      try {
        const isEnabled = featureFlagService.isEnabled(flagName);
        const flag = featureFlagService.getFlag(flagName);
        
        flagResults[flagName] = {
          isEnabled,
          flag,
          loading: false,
          error: null,
          refresh: () => {
            // Individual refresh would be handled by the single hook
          }
        };
      } catch (err) {
        flagResults[flagName] = {
          isEnabled: false,
          flag: null,
          loading: false,
          error: err instanceof Error ? err : new Error('Failed to check feature flag'),
          refresh: () => {}
        };
      }
    });

    setFlags(flagResults);
  }, [flagNames]);

  return flags;
}

// Higher-order component for feature flag wrapping
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flagName: string,
  fallback?: React.ComponentType<P>
) {
  return function FeatureFlagWrapper(props: P) {
    const { isEnabled, loading } = useFeatureFlag(flagName);

    if (loading) {
      return null; // Or a loading component
    }

    if (!isEnabled) {
      return fallback ? React.createElement(fallback, props) : null;
    }

    return React.createElement(Component, props);
  };
}