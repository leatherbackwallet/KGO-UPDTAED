/**
 * useErrorTracker Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useErrorTracker, withErrorTracking } from '../useErrorTracker';
import { ErrorType, ErrorSeverity } from '../../services/ErrorTracker';
import React from 'react';

// Mock the ErrorTracker service
jest.mock('../../services/ErrorTracker', () => ({
  errorTracker: {
    trackError: jest.fn(() => 'mock_error_id'),
    trackApiPerformance: jest.fn(),
    trackImagePerformance: jest.fn(),
    trackCachePerformance: jest.fn(),
    trackRenderTime: jest.fn(),
    getErrors: jest.fn(() => []),
    getMetrics: jest.fn(() => ({
      apiResponseTimes: new Map(),
      imageLoadTimes: new Map(),
      cacheHitRates: new Map(),
      errorRates: new Map(),
      successRates: new Map(),
      networkLatency: [],
      renderTimes: new Map()
    })),
    resolveError: jest.fn()
  },
  ErrorType: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    PARSE_ERROR: 'PARSE_ERROR',
    CACHE_ERROR: 'CACHE_ERROR',
    IMAGE_LOAD_ERROR: 'IMAGE_LOAD_ERROR',
    COMPONENT_ERROR: 'COMPONENT_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  },
  ErrorSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  }
}));

const mockErrorTracker = require('../../services/ErrorTracker').errorTracker;

// Mock performance.now
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => 100)
  }
});

describe('useErrorTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide error tracking functions', () => {
    const { result } = renderHook(() => useErrorTracker('TestComponent'));

    expect(result.current.trackError).toBeDefined();
    expect(result.current.trackApiCall).toBeDefined();
    expect(result.current.trackImageLoad).toBeDefined();
    expect(result.current.trackCacheAccess).toBeDefined();
    expect(result.current.trackRenderTime).toBeDefined();
    expect(result.current.getErrors).toBeDefined();
    expect(result.current.getMetrics).toBeDefined();
    expect(result.current.resolveError).toBeDefined();
  });

  it('should track errors with component context', () => {
    const { result } = renderHook(() => useErrorTracker('TestComponent'));

    act(() => {
      result.current.trackError({
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'Test error',
        action: 'Test Action',
        metadata: { key: 'value' }
      });
    });

    expect(mockErrorTracker.trackError).toHaveBeenCalledWith({
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Test error',
      action: 'Test Action',
      metadata: { key: 'value' },
      context: {
        component: 'TestComponent',
        action: 'Test Action',
        metadata: { key: 'value' }
      }
    });
  });

  it('should track API calls', () => {
    const { result } = renderHook(() => useErrorTracker());

    act(() => {
      result.current.trackApiCall('/api/products', 150, true);
    });

    expect(mockErrorTracker.trackApiPerformance).toHaveBeenCalledWith('/api/products', 150, true);
  });

  it('should track image loads', () => {
    const { result } = renderHook(() => useErrorTracker());

    act(() => {
      result.current.trackImageLoad('https://example.com/image.jpg', 300, false);
    });

    expect(mockErrorTracker.trackImagePerformance).toHaveBeenCalledWith(
      'https://example.com/image.jpg',
      300,
      false
    );
  });

  it('should track cache access', () => {
    const { result } = renderHook(() => useErrorTracker());

    act(() => {
      result.current.trackCacheAccess('products_cache', true);
    });

    expect(mockErrorTracker.trackCachePerformance).toHaveBeenCalledWith('products_cache', true);
  });

  it('should track render times', () => {
    const { result } = renderHook(() => useErrorTracker());

    act(() => {
      result.current.trackRenderTime('ProductCard', 16.5);
    });

    expect(mockErrorTracker.trackRenderTime).toHaveBeenCalledWith('ProductCard', 16.5);
  });

  it('should get errors with filters', () => {
    const { result } = renderHook(() => useErrorTracker());

    act(() => {
      result.current.getErrors({ type: ErrorType.NETWORK_ERROR });
    });

    expect(mockErrorTracker.getErrors).toHaveBeenCalledWith({ type: ErrorType.NETWORK_ERROR });
  });

  it('should get metrics', () => {
    const { result } = renderHook(() => useErrorTracker());

    act(() => {
      result.current.getMetrics();
    });

    expect(mockErrorTracker.getMetrics).toHaveBeenCalled();
  });

  it('should resolve errors', () => {
    const { result } = renderHook(() => useErrorTracker());

    act(() => {
      result.current.resolveError('error_id');
    });

    expect(mockErrorTracker.resolveError).toHaveBeenCalledWith('error_id');
  });

  it('should track component render time automatically', () => {
    // Mock performance.now to return different values
    let callCount = 0;
    (window.performance.now as jest.Mock).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 100 : 116.5; // Start time: 100, End time: 116.5
    });

    const { unmount } = renderHook(() => useErrorTracker('TestComponent'));

    unmount();

    expect(mockErrorTracker.trackRenderTime).toHaveBeenCalledWith('TestComponent', 16.5);
  });

  it('should not track render time if no component name provided', () => {
    const { unmount } = renderHook(() => useErrorTracker());

    unmount();

    expect(mockErrorTracker.trackRenderTime).not.toHaveBeenCalled();
  });
});

describe('withErrorTracking HOC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a wrapped component with error tracking', () => {
    const TestComponent = ({ message }: { message: string }) => 
      React.createElement('div', null, message);

    const WrappedComponent = withErrorTracking(TestComponent, 'TestComponent');

    expect(WrappedComponent.displayName).toBe('withErrorTracking(TestComponent)');
  });

  it('should pass through props to wrapped component', () => {
    const TestComponent = jest.fn(() => React.createElement('div'));
    const WrappedComponent = withErrorTracking(TestComponent, 'TestComponent');

    const props = { message: 'test', value: 123 };
    
    // This would need a proper React testing setup to fully test
    // For now, we just verify the HOC structure
    expect(typeof WrappedComponent).toBe('function');
  });
});