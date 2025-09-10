/**
 * React hook for integrating with the Error Tracker service
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { errorTracker, ErrorType, ErrorSeverity, TrackedError, PerformanceMetrics } from '../services/ErrorTracker';

export interface UseErrorTrackerReturn {
  trackError: (error: {
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    stack?: string;
    component?: string;
    action?: string;
    metadata?: Record<string, any>;
  }) => string;
  trackApiCall: (endpoint: string, responseTime: number, success: boolean) => void;
  trackImageLoad: (imageUrl: string, loadTime: number, success: boolean) => void;
  trackCacheAccess: (cacheKey: string, hit: boolean) => void;
  trackRenderTime: (component: string, renderTime: number) => void;
  getErrors: (filters?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    resolved?: boolean;
    since?: Date;
  }) => TrackedError[];
  getMetrics: () => PerformanceMetrics;
  resolveError: (errorId: string) => void;
}

export const useErrorTracker = (componentName?: string): UseErrorTrackerReturn => {
  const componentRef = useRef(componentName);
  const renderStartTime = useRef<number>();

  // Track component render time
  useEffect(() => {
    if (componentRef.current) {
      renderStartTime.current = performance.now();
      
      return () => {
        if (renderStartTime.current) {
          const renderTime = performance.now() - renderStartTime.current;
          errorTracker.trackRenderTime(componentRef.current!, renderTime);
        }
      };
    }
  });

  const trackError = useCallback((error: {
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    stack?: string;
    component?: string;
    action?: string;
    metadata?: Record<string, any>;
  }) => {
    return errorTracker.trackError({
      ...error,
      context: {
        component: error.component || componentRef.current,
        action: error.action,
        metadata: error.metadata
      }
    });
  }, []);

  const trackApiCall = useCallback((endpoint: string, responseTime: number, success: boolean) => {
    errorTracker.trackApiPerformance(endpoint, responseTime, success);
  }, []);

  const trackImageLoad = useCallback((imageUrl: string, loadTime: number, success: boolean) => {
    errorTracker.trackImagePerformance(imageUrl, loadTime, success);
  }, []);

  const trackCacheAccess = useCallback((cacheKey: string, hit: boolean) => {
    errorTracker.trackCachePerformance(cacheKey, hit);
  }, []);

  const trackRenderTime = useCallback((component: string, renderTime: number) => {
    errorTracker.trackRenderTime(component, renderTime);
  }, []);

  const getErrors = useCallback((filters?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    resolved?: boolean;
    since?: Date;
  }) => {
    return errorTracker.getErrors(filters);
  }, []);

  const getMetrics = useCallback(() => {
    return errorTracker.getMetrics();
  }, []);

  const resolveError = useCallback((errorId: string) => {
    errorTracker.resolveError(errorId);
  }, []);

  return {
    trackError,
    trackApiCall,
    trackImageLoad,
    trackCacheAccess,
    trackRenderTime,
    getErrors,
    getMetrics,
    resolveError
  };
};

/**
 * Higher-order component for automatic error tracking
 */
export function withErrorTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const WithErrorTrackingComponent = (props: P) => {
    const { trackError } = useErrorTracker(componentName);

    useEffect(() => {
      const handleError = (error: Error) => {
        trackError({
          type: ErrorType.COMPONENT_ERROR,
          severity: ErrorSeverity.MEDIUM,
          message: error.message,
          stack: error.stack,
          action: 'Component Error'
        });
      };

      // This would be used with an error boundary
      return () => {};
    }, [trackError]);

    return React.createElement(WrappedComponent, props);
  };

  WithErrorTrackingComponent.displayName = `withErrorTracking(${componentName})`;
  return WithErrorTrackingComponent;
}

export default useErrorTracker;