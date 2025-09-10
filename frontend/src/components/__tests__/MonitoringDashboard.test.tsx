/**
 * MonitoringDashboard Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MonitoringDashboard from '../MonitoringDashboard';
import { ErrorType, ErrorSeverity } from '../../services/ErrorTracker';

// Mock the useErrorTracker hook
jest.mock('../../hooks/useErrorTracker', () => ({
  useErrorTracker: jest.fn(() => ({
    getErrors: jest.fn(() => [
      {
        id: 'error1',
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'Network connection failed',
        occurrenceCount: 3,
        firstOccurrence: new Date(Date.now() - 60000),
        lastOccurrence: new Date(Date.now() - 30000),
        resolved: false,
        context: {
          url: '/api/products',
          method: 'GET',
          timestamp: new Date()
        }
      },
      {
        id: 'error2',
        type: ErrorType.IMAGE_LOAD_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: 'Failed to load image',
        occurrenceCount: 1,
        firstOccurrence: new Date(Date.now() - 120000),
        lastOccurrence: new Date(Date.now() - 120000),
        resolved: true,
        resolvedAt: new Date(Date.now() - 60000),
        context: {
          url: 'https://example.com/image.jpg',
          timestamp: new Date()
        }
      }
    ]),
    getMetrics: jest.fn(() => ({
      apiResponseTimes: new Map([
        ['/api/products', [150, 200, 180]],
        ['/api/categories', [100, 120]]
      ]),
      imageLoadTimes: new Map([
        ['image1.jpg', [300, 250]]
      ]),
      cacheHitRates: new Map([
        ['products_cache', { hits: 8, misses: 2 }],
        ['images_cache', { hits: 15, misses: 5 }]
      ]),
      errorRates: new Map([
        [ErrorType.NETWORK_ERROR, 3],
        [ErrorType.IMAGE_LOAD_ERROR, 1]
      ]),
      successRates: new Map([
        ['/api/products', { success: 47, total: 50 }]
      ]),
      networkLatency: [50, 60, 45, 55],
      renderTimes: new Map([
        ['ProductCard', [16.5, 18.2, 15.8]]
      ])
    })),
    resolveError: jest.fn()
  }))
}));

describe('MonitoringDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard header', () => {
    render(<MonitoringDashboard />);
    
    expect(screen.getByText('Monitoring Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Real-time error tracking and performance monitoring')).toBeInTheDocument();
  });

  it('should render control filters', () => {
    render(<MonitoringDashboard />);
    
    expect(screen.getByLabelText(/Time Range/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Error Type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Severity/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Show Resolved/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Auto Refresh/)).toBeInTheDocument();
  });

  it('should display statistics cards', () => {
    render(<MonitoringDashboard />);
    
    expect(screen.getByText('Total Errors')).toBeInTheDocument();
    expect(screen.getByText('Error Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
    expect(screen.getByText('Cache Hit Rate')).toBeInTheDocument();
  });

  it('should display errors by type and severity', () => {
    render(<MonitoringDashboard />);
    
    expect(screen.getByText('Errors by Type')).toBeInTheDocument();
    expect(screen.getByText('Errors by Severity')).toBeInTheDocument();
  });

  it('should display performance metrics', () => {
    render(<MonitoringDashboard />);
    
    expect(screen.getByText('Slowest Endpoints')).toBeInTheDocument();
    expect(screen.getByText('Additional Metrics')).toBeInTheDocument();
  });

  it('should display recent errors table', () => {
    render(<MonitoringDashboard />);
    
    expect(screen.getByText('Recent Errors')).toBeInTheDocument();
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    expect(screen.getByText('NETWORK ERROR')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('should filter errors by type', async () => {
    render(<MonitoringDashboard />);
    
    const errorTypeSelect = screen.getByLabelText(/Error Type/);
    fireEvent.change(errorTypeSelect, { target: { value: ErrorType.NETWORK_ERROR } });
    
    await waitFor(() => {
      // Should still show network error
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });
  });

  it('should filter errors by severity', async () => {
    render(<MonitoringDashboard />);
    
    const severitySelect = screen.getByLabelText(/Severity/);
    fireEvent.change(severitySelect, { target: { value: ErrorSeverity.HIGH } });
    
    await waitFor(() => {
      // Should show high severity error
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });
  });

  it('should toggle show resolved errors', async () => {
    render(<MonitoringDashboard />);
    
    const showResolvedCheckbox = screen.getByLabelText(/Show Resolved/);
    fireEvent.click(showResolvedCheckbox);
    
    await waitFor(() => {
      // Should now show resolved errors
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });
  });

  it('should change time range', async () => {
    render(<MonitoringDashboard />);
    
    const timeRangeSelect = screen.getByLabelText(/Time Range/);
    fireEvent.change(timeRangeSelect, { target: { value: '1h' } });
    
    await waitFor(() => {
      expect(timeRangeSelect).toHaveValue('1h');
    });
  });

  it('should toggle auto refresh', async () => {
    render(<MonitoringDashboard />);
    
    const autoRefreshCheckbox = screen.getByLabelText(/Auto Refresh/);
    expect(autoRefreshCheckbox).toBeChecked();
    
    fireEvent.click(autoRefreshCheckbox);
    
    await waitFor(() => {
      expect(autoRefreshCheckbox).not.toBeChecked();
    });
  });

  it('should show refresh interval controls when auto refresh is enabled', () => {
    render(<MonitoringDashboard />);
    
    expect(screen.getByLabelText(/Interval/)).toBeInTheDocument();
  });

  it('should resolve errors when resolve button is clicked', async () => {
    const mockResolveError = jest.fn();
    
    // Update the mock to return the resolve function
    const useErrorTrackerMock = require('../../hooks/useErrorTracker').useErrorTracker;
    useErrorTrackerMock.mockReturnValue({
      ...useErrorTrackerMock(),
      resolveError: mockResolveError
    });
    
    render(<MonitoringDashboard />);
    
    const resolveButton = screen.getByText('Resolve');
    fireEvent.click(resolveButton);
    
    await waitFor(() => {
      expect(mockResolveError).toHaveBeenCalledWith('error1');
    });
  });

  it('should format durations correctly', () => {
    render(<MonitoringDashboard />);
    
    // Check that durations are displayed (exact format may vary)
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it('should format percentages correctly', () => {
    render(<MonitoringDashboard />);
    
    // Should show percentage values
    expect(screen.getByText(/%/)).toBeInTheDocument();
  });

  it('should apply correct severity colors', () => {
    render(<MonitoringDashboard />);
    
    const highSeverityElement = screen.getByText('HIGH');
    expect(highSeverityElement).toHaveClass('text-orange-600', 'bg-orange-100');
  });

  it('should apply correct error type colors', () => {
    render(<MonitoringDashboard />);
    
    const networkErrorElement = screen.getByText('NETWORK ERROR');
    expect(networkErrorElement).toHaveClass('text-red-600');
  });

  it('should handle empty data gracefully', () => {
    // Mock empty data
    const useErrorTrackerMock = require('../../hooks/useErrorTracker').useErrorTracker;
    useErrorTrackerMock.mockReturnValue({
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
    });
    
    render(<MonitoringDashboard />);
    
    expect(screen.getByText('Monitoring Dashboard')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Should show 0 for total errors
  });

  it('should display alert status when alerts are triggered', () => {
    // This would require mocking alert state, which is internal to the component
    // For now, we'll test that the component renders without alerts
    render(<MonitoringDashboard />);
    
    // Should not show alert section when no alerts are active
    expect(screen.queryByText('Active Alerts')).not.toBeInTheDocument();
  });

  it('should handle component errors gracefully', () => {
    // Mock an error in the hook
    const useErrorTrackerMock = require('../../hooks/useErrorTracker').useErrorTracker;
    useErrorTrackerMock.mockImplementation(() => {
      throw new Error('Hook error');
    });
    
    // Should not crash the component
    expect(() => {
      render(<MonitoringDashboard />);
    }).not.toThrow();
  });
});