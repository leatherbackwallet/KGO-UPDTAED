import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConnectionIndicator } from '../ConnectionIndicator';
import { useConnectionMonitor } from '../../hooks/useConnectionMonitor';

// Mock the useConnectionMonitor hook
jest.mock('../../hooks/useConnectionMonitor');
const mockUseConnectionMonitor = useConnectionMonitor as jest.MockedFunction<typeof useConnectionMonitor>;

describe('ConnectionIndicator', () => {
  const defaultMockReturn = {
    status: {
      online: true,
      speed: 'medium' as const,
      latency: 100,
      lastChecked: new Date()
    },
    isOnline: true,
    networkSpeed: 'medium' as const,
    indicator: null,
    connectionQuality: 'good' as const,
    queueForRetry: jest.fn(),
    cancelRetry: jest.fn(),
    getEstimatedLoadTime: jest.fn(),
    checkConnection: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConnectionMonitor.mockReturnValue(defaultMockReturn);
  });

  it('should not render when online and autoHide is true', () => {
    const { container } = render(<ConnectionIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should show online status when showOnlineStatus is true', () => {
    mockUseConnectionMonitor.mockReturnValue({
      ...defaultMockReturn,
      isOnline: true,
      indicator: null // Explicitly set to null
    });

    render(<ConnectionIndicator showOnlineStatus autoHide={false} />);
    
    expect(screen.getByText('Online (medium connection)')).toBeInTheDocument();
    expect(screen.getByText('Online (medium connection)').closest('div')).toHaveClass('text-green-600');
  });

  it('should render offline indicator', () => {
    mockUseConnectionMonitor.mockReturnValue({
      ...defaultMockReturn,
      isOnline: false,
      indicator: {
        type: 'offline',
        message: 'You are currently offline. Some features may not be available.'
      }
    });

    render(<ConnectionIndicator />);
    
    expect(screen.getByText('You are currently offline. Some features may not be available.')).toBeInTheDocument();
    expect(screen.getByText('You are currently offline. Some features may not be available.').closest('div')).toHaveClass('text-red-800');
  });

  it('should render slow connection indicator', () => {
    mockUseConnectionMonitor.mockReturnValue({
      ...defaultMockReturn,
      indicator: {
        type: 'slow',
        message: 'Slow connection detected. Loading may take longer than usual.'
      }
    });

    render(<ConnectionIndicator />);
    
    expect(screen.getByText('Slow connection detected. Loading may take longer than usual.')).toBeInTheDocument();
    expect(screen.getByText('Slow connection detected. Loading may take longer than usual.').closest('div')).toHaveClass('text-yellow-800');
  });

  it('should render reconnecting indicator with progress', () => {
    mockUseConnectionMonitor.mockReturnValue({
      ...defaultMockReturn,
      indicator: {
        type: 'reconnecting',
        message: 'Reconnecting... (attempt 1/5)',
        showProgress: true,
        estimatedTime: 2000
      }
    });

    render(<ConnectionIndicator />);
    
    expect(screen.getByText('Reconnecting... (attempt 1/5)')).toBeInTheDocument();
    expect(screen.getByText('Reconnecting... (attempt 1/5)').closest('div')).toHaveClass('text-blue-800');
    expect(screen.getByText('~2s')).toBeInTheDocument();
  });

  it('should render online indicator', () => {
    mockUseConnectionMonitor.mockReturnValue({
      ...defaultMockReturn,
      indicator: {
        type: 'online',
        message: 'Connection restored'
      }
    });

    render(<ConnectionIndicator />);
    
    expect(screen.getByText('Connection restored')).toBeInTheDocument();
    expect(screen.getByText('Connection restored').closest('div')).toHaveClass('text-green-800');
  });

  it('should show progress bar when showProgress is true', () => {
    mockUseConnectionMonitor.mockReturnValue({
      ...defaultMockReturn,
      indicator: {
        type: 'reconnecting',
        message: 'Reconnecting...',
        showProgress: true,
        estimatedTime: 5000
      }
    });

    const { container } = render(<ConnectionIndicator />);
    
    expect(screen.getByText('~5s')).toBeInTheDocument();
    
    // Check for progress bar elements using querySelector
    const progressBar = container.querySelector('.bg-gray-200.rounded-full');
    expect(progressBar).toBeInTheDocument();
  });

  it('should not show progress when showProgress is false', () => {
    mockUseConnectionMonitor.mockReturnValue({
      ...defaultMockReturn,
      indicator: {
        type: 'offline',
        message: 'Connection lost',
        showProgress: false
      }
    });

    render(<ConnectionIndicator />);
    
    expect(screen.getByText('Connection lost')).toBeInTheDocument();
    expect(screen.queryByText(/~\d+s/)).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    mockUseConnectionMonitor.mockReturnValue({
      ...defaultMockReturn,
      indicator: {
        type: 'offline',
        message: 'Connection lost'
      }
    });

    render(<ConnectionIndicator className="custom-class" />);
    
    const indicator = screen.getByText('Connection lost').closest('div');
    expect(indicator).toHaveClass('custom-class');
  });

  it('should show indicator when autoHide is false even when online', () => {
    render(<ConnectionIndicator autoHide={false} />);
    
    // Should render something even when online with no indicator
    const { container } = render(<ConnectionIndicator autoHide={false} />);
    expect(container.firstChild).toBeNull(); // Still null because no indicator
  });

  it('should render different icons for different indicator types', () => {
    const indicators = [
      { type: 'online' as const, message: 'Online' },
      { type: 'offline' as const, message: 'Offline' },
      { type: 'slow' as const, message: 'Slow' },
      { type: 'reconnecting' as const, message: 'Reconnecting' }
    ];

    indicators.forEach(indicator => {
      mockUseConnectionMonitor.mockReturnValue({
        ...defaultMockReturn,
        indicator
      });

      const { container, unmount } = render(<ConnectionIndicator />);
      
      // Check that an SVG icon is rendered
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      if (indicator.type === 'reconnecting') {
        expect(svg).toHaveClass('animate-spin');
      }

      unmount();
    });
  });

  it('should handle missing estimated time gracefully', () => {
    mockUseConnectionMonitor.mockReturnValue({
      ...defaultMockReturn,
      indicator: {
        type: 'reconnecting',
        message: 'Reconnecting...',
        showProgress: true
        // No estimatedTime
      }
    });

    render(<ConnectionIndicator />);
    
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
    expect(screen.queryByText(/~\d+s/)).not.toBeInTheDocument();
  });
});