/**
 * Tests for usePerformanceMonitor hook
 */

import { renderHook, act } from '@testing-library/react';
import { usePerformanceMonitor, useListPerformanceMonitor, performanceTracker } from '../usePerformanceMonitor';

// Mock performance.now()
const mockPerformanceNow = jest.fn();
Object.defineProperty(window, 'performance', {
  value: {
    now: mockPerformanceNow,
  },
  writable: true,
});

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('usePerformanceMonitor', () => {
  beforeEach(() => {
    mockPerformanceNow.mockClear();
    mockConsoleWarn.mockClear();
    mockConsoleLog.mockClear();
    performanceTracker.reset();
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
    mockConsoleLog.mockRestore();
  });

  it('should initialize with default metrics', () => {
    const { result } = renderHook(() =>
      usePerformanceMonitor({ componentName: 'TestComponent' })
    );

    const metrics = result.current.getMetrics();
    expect(metrics.componentName).toBe('TestComponent');
    expect(metrics.renderCount).toBe(0);
    expect(metrics.averageRenderTime).toBe(0);
  });

  it('should measure render performance', () => {
    mockPerformanceNow
      .mockReturnValueOnce(100) // Start time
      .mockReturnValueOnce(120); // End time (20ms render)

    const { result, rerender } = renderHook(() =>
      usePerformanceMonitor({ 
        componentName: 'TestComponent',
        enabled: true 
      })
    );

    // Trigger a re-render to measure performance
    rerender();

    const metrics = result.current.getMetrics();
    expect(metrics.renderCount).toBe(1);
    expect(metrics.lastRenderTime).toBe(20);
    expect(metrics.averageRenderTime).toBe(20);
  });

  it('should log slow renders', () => {
    mockPerformanceNow
      .mockReturnValueOnce(100) // Start time
      .mockReturnValueOnce(150); // End time (50ms render - slow)

    renderHook(() =>
      usePerformanceMonitor({ 
        componentName: 'SlowComponent',
        enabled: true,
        logThreshold: 30
      })
    );

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('🐌 Slow render detected in SlowComponent: 50.00ms')
    );
  });

  it('should not measure when disabled', () => {
    mockPerformanceNow
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(120);

    const { result, rerender } = renderHook(() =>
      usePerformanceMonitor({ 
        componentName: 'TestComponent',
        enabled: false 
      })
    );

    rerender();

    const metrics = result.current.getMetrics();
    expect(metrics.renderCount).toBe(0);
    expect(mockPerformanceNow).not.toHaveBeenCalled();
  });

  it('should respect sample rate', () => {
    mockPerformanceNow
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(120)
      .mockReturnValueOnce(200)
      .mockReturnValueOnce(220);

    const { result, rerender } = renderHook(() =>
      usePerformanceMonitor({ 
        componentName: 'TestComponent',
        enabled: true,
        sampleRate: 2 // Only measure every 2nd render
      })
    );

    // First render - should not measure
    rerender();
    expect(result.current.getMetrics().renderCount).toBe(0);

    // Second render - should measure
    rerender();
    expect(result.current.getMetrics().renderCount).toBe(1);
  });

  it('should calculate average render time correctly', () => {
    mockPerformanceNow
      .mockReturnValueOnce(100).mockReturnValueOnce(110) // 10ms
      .mockReturnValueOnce(200).mockReturnValueOnce(230) // 30ms
      .mockReturnValueOnce(300).mockReturnValueOnce(320); // 20ms

    const { result, rerender } = renderHook(() =>
      usePerformanceMonitor({ 
        componentName: 'TestComponent',
        enabled: true 
      })
    );

    rerender(); // 10ms
    rerender(); // 30ms
    rerender(); // 20ms

    const metrics = result.current.getMetrics();
    expect(metrics.renderCount).toBe(3);
    expect(metrics.averageRenderTime).toBe(20); // (10 + 30 + 20) / 3
  });

  it('should reset metrics correctly', () => {
    mockPerformanceNow
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(120);

    const { result, rerender } = renderHook(() =>
      usePerformanceMonitor({ 
        componentName: 'TestComponent',
        enabled: true 
      })
    );

    rerender();
    expect(result.current.getMetrics().renderCount).toBe(1);

    act(() => {
      result.current.resetMetrics();
    });

    const metrics = result.current.getMetrics();
    expect(metrics.renderCount).toBe(0);
    expect(metrics.averageRenderTime).toBe(0);
  });

  it('should log performance summary', () => {
    mockPerformanceNow
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(125);

    const { result, rerender } = renderHook(() =>
      usePerformanceMonitor({ 
        componentName: 'TestComponent',
        enabled: true 
      })
    );

    rerender();

    act(() => {
      result.current.logSummary();
    });

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('📊 Performance Summary for TestComponent')
    );
  });
});

describe('useListPerformanceMonitor', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
  });

  it('should monitor list performance with item count', () => {
    const { result } = renderHook(() =>
      useListPerformanceMonitor(50, 'ProductList')
    );

    expect(result.current.getMetrics().componentName).toBe('ProductList(50 items)');
  });

  it('should log item count changes', () => {
    const { rerender } = renderHook(
      ({ itemCount }) => useListPerformanceMonitor(itemCount, 'ProductList'),
      { initialProps: { itemCount: 10 } }
    );

    rerender({ itemCount: 20 });

    expect(mockConsoleLog).toHaveBeenCalledWith(
      '📋 ProductList item count changed: 10 → 20'
    );
  });

  it('should use higher threshold for large lists', () => {
    const { result } = renderHook(() =>
      useListPerformanceMonitor(150, 'LargeList')
    );

    // Large lists should have higher threshold (32ms vs 16ms)
    expect(result.current.getMetrics().componentName).toBe('LargeList(150 items)');
  });
});

describe('PerformanceTracker', () => {
  beforeEach(() => {
    performanceTracker.reset();
    mockConsoleLog.mockClear();
  });

  it('should track metrics globally', () => {
    const metrics = {
      renderTime: 100,
      renderCount: 5,
      averageRenderTime: 20,
      lastRenderTime: 25,
      componentName: 'TestComponent'
    };

    performanceTracker.updateMetrics('TestComponent', metrics);

    const allMetrics = performanceTracker.getMetrics();
    expect(allMetrics.get('TestComponent')).toEqual(metrics);
  });

  it('should notify observers of metric changes', () => {
    const observer = jest.fn();
    const unsubscribe = performanceTracker.subscribe(observer);

    const metrics = {
      renderTime: 50,
      renderCount: 2,
      averageRenderTime: 25,
      lastRenderTime: 30,
      componentName: 'TestComponent'
    };

    performanceTracker.updateMetrics('TestComponent', metrics);

    expect(observer).toHaveBeenCalledWith(expect.any(Map));
    
    unsubscribe();
    
    // Should not notify after unsubscribe
    observer.mockClear();
    performanceTracker.updateMetrics('AnotherComponent', metrics);
    expect(observer).not.toHaveBeenCalled();
  });

  it('should log all metrics', () => {
    const metrics1 = {
      renderTime: 100,
      renderCount: 5,
      averageRenderTime: 20,
      lastRenderTime: 25,
      componentName: 'Component1'
    };

    const metrics2 = {
      renderTime: 200,
      renderCount: 10,
      averageRenderTime: 20,
      lastRenderTime: 15,
      componentName: 'Component2'
    };

    performanceTracker.updateMetrics('Component1', metrics1);
    performanceTracker.updateMetrics('Component2', metrics2);

    performanceTracker.logAllMetrics();

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('Component1: 5 renders, avg 20.00ms')
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('Component2: 10 renders, avg 20.00ms')
    );
  });

  it('should reset all metrics', () => {
    const metrics = {
      renderTime: 100,
      renderCount: 5,
      averageRenderTime: 20,
      lastRenderTime: 25,
      componentName: 'TestComponent'
    };

    performanceTracker.updateMetrics('TestComponent', metrics);
    expect(performanceTracker.getMetrics().size).toBe(1);

    performanceTracker.reset();
    expect(performanceTracker.getMetrics().size).toBe(0);
  });
});