/**
 * usePerformanceMonitor - Hook for monitoring React component performance
 */

import { useEffect, useRef, useCallback } from 'react';

export interface PerformanceMetrics {
  renderTime: number;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  componentName: string;
}

export interface PerformanceMonitorOptions {
  componentName: string;
  enabled?: boolean;
  logThreshold?: number; // Log renders that take longer than this (ms)
  sampleRate?: number; // Only monitor every nth render (1 = all renders)
}

export function usePerformanceMonitor(options: PerformanceMonitorOptions) {
  const {
    componentName,
    enabled = process.env.NODE_ENV === 'development',
    logThreshold = 16, // 16ms = 60fps threshold
    sampleRate = 1
  } = options;

  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    componentName
  });

  const renderStartRef = useRef<number>(0);
  const shouldSampleRef = useRef<number>(0);

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    if (!enabled) return;
    
    shouldSampleRef.current++;
    if (shouldSampleRef.current % sampleRate !== 0) return;
    
    renderStartRef.current = performance.now();
  }, [enabled, sampleRate]);

  // End performance measurement
  const endMeasurement = useCallback(() => {
    if (!enabled || renderStartRef.current === 0) return;
    
    const renderTime = performance.now() - renderStartRef.current;
    const metrics = metricsRef.current;
    
    metrics.renderCount++;
    metrics.lastRenderTime = renderTime;
    metrics.renderTime += renderTime;
    metrics.averageRenderTime = metrics.renderTime / metrics.renderCount;
    
    // Log slow renders
    if (renderTime > logThreshold) {
      console.warn(
        `🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms ` +
        `(avg: ${metrics.averageRenderTime.toFixed(2)}ms, count: ${metrics.renderCount})`
      );
    }
    
    renderStartRef.current = 0;
  }, [enabled, logThreshold, componentName]);

  // Get current metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderTime: 0,
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      componentName
    };
  }, [componentName]);

  // Log performance summary
  const logSummary = useCallback(() => {
    if (!enabled) return;
    
    const metrics = metricsRef.current;
    if (metrics.renderCount === 0) return;
    
    console.log(
      `📊 Performance Summary for ${componentName}:\n` +
      `  Renders: ${metrics.renderCount}\n` +
      `  Total Time: ${metrics.renderTime.toFixed(2)}ms\n` +
      `  Average Time: ${metrics.averageRenderTime.toFixed(2)}ms\n` +
      `  Last Render: ${metrics.lastRenderTime.toFixed(2)}ms`
    );
  }, [enabled, componentName]);

  // Measure render performance
  useEffect(() => {
    startMeasurement();
    return () => {
      endMeasurement();
    };
  });

  return {
    getMetrics,
    resetMetrics,
    logSummary,
    startMeasurement,
    endMeasurement
  };
}

// Hook for monitoring list rendering performance
export function useListPerformanceMonitor(
  itemCount: number,
  componentName: string = 'List'
) {
  const performanceMonitor = usePerformanceMonitor({
    componentName: `${componentName}(${itemCount} items)`,
    logThreshold: itemCount > 100 ? 32 : 16 // Higher threshold for large lists
  });

  const prevItemCountRef = useRef(itemCount);

  useEffect(() => {
    if (prevItemCountRef.current !== itemCount) {
      console.log(`📋 ${componentName} item count changed: ${prevItemCountRef.current} → ${itemCount}`);
      prevItemCountRef.current = itemCount;
    }
  }, [itemCount, componentName]);

  return performanceMonitor;
}

// Hook for monitoring expensive computations
export function useComputationMonitor(
  computation: () => any,
  dependencies: React.DependencyList,
  computationName: string = 'Computation'
) {
  const computationTimeRef = useRef<number>(0);
  const computationCountRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    computation();
    const end = performance.now();
    
    computationTimeRef.current = end - start;
    computationCountRef.current++;
    
    if (computationTimeRef.current > 5) { // Log computations > 5ms
      console.warn(
        `🧮 Expensive computation detected in ${computationName}: ` +
        `${computationTimeRef.current.toFixed(2)}ms ` +
        `(count: ${computationCountRef.current})`
      );
    }
  }, dependencies);

  return {
    lastComputationTime: computationTimeRef.current,
    computationCount: computationCountRef.current
  };
}

// Performance monitoring context for global metrics
export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: Array<(metrics: Map<string, PerformanceMetrics>) => void> = [];

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  updateMetrics(componentName: string, metrics: PerformanceMetrics) {
    this.metrics.set(componentName, metrics);
    this.notifyObservers();
  }

  getMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  subscribe(observer: (metrics: Map<string, PerformanceMetrics>) => void) {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private notifyObservers() {
    this.observers.forEach(observer => observer(this.metrics));
  }

  logAllMetrics() {
    console.group('🎯 Global Performance Metrics');
    this.metrics.forEach((metrics, componentName) => {
      console.log(
        `${componentName}: ${metrics.renderCount} renders, ` +
        `avg ${metrics.averageRenderTime.toFixed(2)}ms`
      );
    });
    console.groupEnd();
  }

  reset() {
    this.metrics.clear();
    this.notifyObservers();
  }
}

export const performanceTracker = PerformanceTracker.getInstance();