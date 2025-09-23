import { ConnectionMonitor, ConnectionStateIndicator, RetryOperation } from '../ConnectionMonitor';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock performance.now
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now())
  }
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true
  },
  writable: true
});

// Mock window events
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

// Setup window mock if it doesn't exist
if (typeof window === 'undefined') {
  (global as any).window = {
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener
  };
} else {
  window.addEventListener = mockAddEventListener;
  window.removeEventListener = mockRemoveEventListener;
}

// Mock AbortSignal.timeout
Object.defineProperty(global, 'AbortSignal', {
  value: {
    timeout: jest.fn(() => ({
      aborted: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }))
  }
});

describe('ConnectionMonitor', () => {
  let monitor: ConnectionMonitor;
  let statusCallback: jest.Mock;
  let indicatorCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true
    });

    monitor = new ConnectionMonitor();
    statusCallback = jest.fn();
    indicatorCallback = jest.fn();
  });

  afterEach(() => {
    if (monitor) {
      monitor.destroy();
    }
  });

  describe('initialization', () => {
    it('should initialize with online status', () => {
      const status = monitor.getStatus();
      expect(status.online).toBe(true);
      expect(status.speed).toBe('medium');
    });

    it('should set up event listeners', () => {
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('network speed detection', () => {
    it('should detect fast connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      // Mock fast response time
      (performance.now as jest.Mock)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(50);

      await monitor.checkConnection();

      const status = monitor.getStatus();
      expect(status.speed).toBe('fast');
      expect(status.latency).toBe(50);
    });

    it('should detect slow connection and notify indicators', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      // Mock slow response time
      (performance.now as jest.Mock)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1000);

      const unsubscribe = monitor.onIndicatorChange(indicatorCallback);

      await monitor.checkConnection();

      const status = monitor.getStatus();
      expect(status.speed).toBe('slow');
      expect(status.latency).toBe(1000);
      
      expect(indicatorCallback).toHaveBeenCalledWith({
        type: 'slow',
        message: 'Slow connection detected. Loading may take longer than usual.',
        showProgress: true,
        estimatedTime: 2000
      });

      unsubscribe();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const unsubscribe = monitor.onIndicatorChange(indicatorCallback);

      await monitor.checkConnection();

      const status = monitor.getStatus();
      expect(status.online).toBe(false);
      expect(status.speed).toBe('slow');
      expect(status.latency).toBe(Infinity);

      expect(indicatorCallback).toHaveBeenCalledWith({
        type: 'offline',
        message: 'Connection lost. Attempting to reconnect...',
        showProgress: true
      });

      unsubscribe();
    });
  });

  describe('connection state management', () => {
    it('should handle online event', () => {
      const unsubscribe = monitor.onIndicatorChange(indicatorCallback);
      
      // Simulate online event
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      
      if (onlineHandler) {
        onlineHandler();
      }

      expect(indicatorCallback).toHaveBeenCalledWith({
        type: 'online',
        message: 'Connection restored'
      });

      unsubscribe();
    });

    it('should handle offline event', () => {
      const unsubscribe = monitor.onIndicatorChange(indicatorCallback);
      
      // Simulate offline event
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1];
      
      if (offlineHandler) {
        offlineHandler();
      }

      expect(indicatorCallback).toHaveBeenCalledWith({
        type: 'offline',
        message: 'You are currently offline. Some features may not be available.'
      });

      const status = monitor.getStatus();
      expect(status.online).toBe(false);

      unsubscribe();
    });
  });

  describe('retry operations', () => {
    it('should queue operations for retry', () => {
      const operation: RetryOperation = {
        id: 'test-op',
        operation: jest.fn().mockResolvedValue('success'),
        onSuccess: jest.fn(),
        onError: jest.fn()
      };

      monitor.queueForRetry(operation);
      
      // Verify operation is queued (internal state)
      expect(monitor['pendingRetries'].has('test-op')).toBe(true);
    });

    it('should cancel retry operations', () => {
      const operation: RetryOperation = {
        id: 'test-op',
        operation: jest.fn(),
      };

      monitor.queueForRetry(operation);
      monitor.cancelRetry('test-op');
      
      expect(monitor['pendingRetries'].has('test-op')).toBe(false);
    });

    it('should resume pending operations when connection is restored', async () => {
      const operation: RetryOperation = {
        id: 'test-op',
        operation: jest.fn().mockResolvedValue('success'),
        onSuccess: jest.fn(),
        onError: jest.fn()
      };

      monitor.queueForRetry(operation);

      // Simulate connection restoration
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      
      if (onlineHandler) {
        onlineHandler();
      }

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(operation.operation).toHaveBeenCalled();
      expect(operation.onSuccess).toHaveBeenCalledWith('success');
      expect(monitor['pendingRetries'].has('test-op')).toBe(false);
    });
  });

  describe('connection quality assessment', () => {
    it('should return excellent quality for fast connection', () => {
      monitor['status'] = {
        online: true,
        speed: 'fast',
        latency: 50,
        lastChecked: new Date()
      };

      expect(monitor.getConnectionQuality()).toBe('excellent');
    });

    it('should return good quality for medium connection', () => {
      monitor['status'] = {
        online: true,
        speed: 'medium',
        latency: 200,
        lastChecked: new Date()
      };

      expect(monitor.getConnectionQuality()).toBe('good');
    });

    it('should return poor quality for slow connection', () => {
      monitor['status'] = {
        online: true,
        speed: 'slow',
        latency: 800,
        lastChecked: new Date()
      };

      expect(monitor.getConnectionQuality()).toBe('poor');
    });

    it('should return poor quality when offline', () => {
      monitor['status'] = {
        online: false,
        speed: 'slow',
        latency: Infinity,
        lastChecked: new Date()
      };

      expect(monitor.getConnectionQuality()).toBe('poor');
    });
  });

  describe('estimated load time calculation', () => {
    it('should calculate faster load time for excellent connection', () => {
      monitor['status'] = {
        online: true,
        speed: 'fast',
        latency: 50,
        lastChecked: new Date()
      };

      const loadTime = monitor.getEstimatedLoadTime(1024); // 1KB
      expect(loadTime).toBe(0.5); // 1KB * 0.5 multiplier
    });

    it('should calculate normal load time for good connection', () => {
      monitor['status'] = {
        online: true,
        speed: 'medium',
        latency: 200,
        lastChecked: new Date()
      };

      const loadTime = monitor.getEstimatedLoadTime(1024); // 1KB
      expect(loadTime).toBe(1); // 1KB * 1 multiplier
    });

    it('should calculate slower load time for poor connection', () => {
      monitor['status'] = {
        online: true,
        speed: 'slow',
        latency: 800,
        lastChecked: new Date()
      };

      const loadTime = monitor.getEstimatedLoadTime(1024); // 1KB
      expect(loadTime).toBe(3); // 1KB * 3 multiplier
    });
  });

  describe('reconnection attempts', () => {
    it('should attempt reconnection with exponential backoff', () => {
      const unsubscribe = monitor.onIndicatorChange(indicatorCallback);
      
      // Simulate network failure
      monitor['startReconnectionAttempts']();

      expect(indicatorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'reconnecting',
          message: 'Reconnecting... (attempt 1/5)',
          showProgress: true
        })
      );

      unsubscribe();
    });

    it('should stop reconnection after max attempts', () => {
      const unsubscribe = monitor.onIndicatorChange(indicatorCallback);
      
      // Set max attempts reached
      monitor['reconnectAttempts'] = 5;
      monitor['startReconnectionAttempts']();

      expect(indicatorCallback).toHaveBeenCalledWith({
        type: 'offline',
        message: 'Unable to reconnect. Please check your internet connection.'
      });

      unsubscribe();
    });
  });

  describe('event listeners', () => {
    it('should notify status change listeners', () => {
      const unsubscribe = monitor.onStatusChange(statusCallback);
      
      monitor['updateStatus']({ online: false });

      expect(statusCallback).toHaveBeenCalledWith(
        expect.objectContaining({ online: false })
      );

      unsubscribe();
    });

    it('should notify speed change listeners', () => {
      const speedCallback = jest.fn();
      const unsubscribe = monitor.onSpeedChange(speedCallback);
      
      monitor['updateStatus']({ speed: 'fast' });

      expect(speedCallback).toHaveBeenCalledWith('fast');

      unsubscribe();
    });

    it('should handle listener errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      monitor.onStatusChange(errorCallback);
      monitor['updateStatus']({ online: false });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in connection status listener:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      monitor.destroy();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(monitor['listeners']).toHaveLength(0);
      expect(monitor['speedListeners']).toHaveLength(0);
      expect(monitor['indicatorListeners']).toHaveLength(0);
      expect(monitor['pendingRetries'].size).toBe(0);
    });
  });
});