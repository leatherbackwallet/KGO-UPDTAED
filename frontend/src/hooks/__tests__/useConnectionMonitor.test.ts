import { renderHook, act } from '@testing-library/react';
import { useConnectionMonitor } from '../useConnectionMonitor';
import { ConnectionMonitor } from '../../services/ConnectionMonitor';

// Mock the ConnectionMonitor
jest.mock('../../services/ConnectionMonitor');
const MockConnectionMonitor = ConnectionMonitor as jest.MockedClass<typeof ConnectionMonitor>;

describe('useConnectionMonitor', () => {
  let mockMonitor: jest.Mocked<ConnectionMonitor>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockMonitor = {
      getStatus: jest.fn().mockReturnValue({
        online: true,
        speed: 'medium',
        latency: 100,
        lastChecked: new Date()
      }),
      onStatusChange: jest.fn().mockReturnValue(() => {}),
      onIndicatorChange: jest.fn().mockReturnValue(() => {}),
      queueForRetry: jest.fn(),
      cancelRetry: jest.fn(),
      getConnectionQuality: jest.fn().mockReturnValue('good'),
      getEstimatedLoadTime: jest.fn().mockReturnValue(1000),
      checkConnection: jest.fn().mockResolvedValue({
        online: true,
        speed: 'medium',
        latency: 100,
        lastChecked: new Date()
      }),
      destroy: jest.fn()
    } as any;

    MockConnectionMonitor.mockImplementation(() => mockMonitor);
  });

  it('should initialize with default status', () => {
    const { result } = renderHook(() => useConnectionMonitor());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.networkSpeed).toBe('medium');
    expect(result.current.connectionQuality).toBe('good');
    expect(result.current.indicator).toBeNull();
  });

  it('should create ConnectionMonitor instance on mount', () => {
    renderHook(() => useConnectionMonitor());

    expect(MockConnectionMonitor).toHaveBeenCalledTimes(1);
    expect(mockMonitor.onStatusChange).toHaveBeenCalled();
    expect(mockMonitor.onIndicatorChange).toHaveBeenCalled();
  });

  it('should update status when ConnectionMonitor notifies changes', () => {
    const { result } = renderHook(() => useConnectionMonitor());

    // Get the status change callback
    const statusCallback = mockMonitor.onStatusChange.mock.calls[0][0];

    act(() => {
      statusCallback({
        online: false,
        speed: 'slow',
        latency: Infinity,
        lastChecked: new Date()
      });
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.networkSpeed).toBe('slow');
  });

  it('should update indicator when ConnectionMonitor notifies changes', () => {
    const { result } = renderHook(() => useConnectionMonitor());

    // Get the indicator change callback
    const indicatorCallback = mockMonitor.onIndicatorChange.mock.calls[0][0];

    act(() => {
      indicatorCallback({
        type: 'offline',
        message: 'Connection lost'
      });
    });

    expect(result.current.indicator).toEqual({
      type: 'offline',
      message: 'Connection lost'
    });
  });

  it('should auto-hide online indicators after 3 seconds', () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useConnectionMonitor());

    // Get the indicator change callback
    const indicatorCallback = mockMonitor.onIndicatorChange.mock.calls[0][0];

    act(() => {
      indicatorCallback({
        type: 'online',
        message: 'Connection restored'
      });
    });

    expect(result.current.indicator).toEqual({
      type: 'online',
      message: 'Connection restored'
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.indicator).toBeNull();

    jest.useRealTimers();
  });

  it('should not auto-hide non-online indicators', () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useConnectionMonitor());

    // Get the indicator change callback
    const indicatorCallback = mockMonitor.onIndicatorChange.mock.calls[0][0];

    act(() => {
      indicatorCallback({
        type: 'offline',
        message: 'Connection lost'
      });
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.indicator).toEqual({
      type: 'offline',
      message: 'Connection lost'
    });

    jest.useRealTimers();
  });

  it('should provide queueForRetry function', () => {
    const { result } = renderHook(() => useConnectionMonitor());

    const operation = {
      id: 'test-op',
      operation: jest.fn()
    };

    act(() => {
      result.current.queueForRetry(operation);
    });

    expect(mockMonitor.queueForRetry).toHaveBeenCalledWith(operation);
  });

  it('should provide cancelRetry function', () => {
    const { result } = renderHook(() => useConnectionMonitor());

    act(() => {
      result.current.cancelRetry('test-op');
    });

    expect(mockMonitor.cancelRetry).toHaveBeenCalledWith('test-op');
  });

  it('should provide getEstimatedLoadTime function', () => {
    const { result } = renderHook(() => useConnectionMonitor());

    const loadTime = result.current.getEstimatedLoadTime(1024);

    expect(mockMonitor.getEstimatedLoadTime).toHaveBeenCalledWith(1024);
    expect(loadTime).toBe(1000);
  });

  it('should provide checkConnection function', async () => {
    const { result } = renderHook(() => useConnectionMonitor());

    const status = await result.current.checkConnection();

    expect(mockMonitor.checkConnection).toHaveBeenCalled();
    expect(status).toEqual({
      online: true,
      speed: 'medium',
      latency: 100,
      lastChecked: expect.any(Date)
    });
  });

  it('should handle missing monitor gracefully', async () => {
    const { result } = renderHook(() => useConnectionMonitor());

    // Simulate destroyed monitor
    mockMonitor.getEstimatedLoadTime.mockReturnValue(undefined as any);
    mockMonitor.checkConnection.mockResolvedValue(undefined as any);

    const loadTime = result.current.getEstimatedLoadTime(1024);
    expect(loadTime).toBe(1024); // Falls back to dataSize

    const status = await result.current.checkConnection();
    expect(status).toEqual(result.current.status); // Falls back to current status
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useConnectionMonitor());

    const unsubscribeStatus = jest.fn();
    const unsubscribeIndicator = jest.fn();
    
    mockMonitor.onStatusChange.mockReturnValue(unsubscribeStatus);
    mockMonitor.onIndicatorChange.mockReturnValue(unsubscribeIndicator);

    unmount();

    expect(mockMonitor.destroy).toHaveBeenCalled();
  });
});