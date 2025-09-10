import { useState, useEffect, useRef } from 'react';
import { ConnectionMonitor, ConnectionStateIndicator, RetryOperation } from '../services/ConnectionMonitor';
import { ConnectionStatus, NetworkSpeed } from '../services/types';

export interface UseConnectionMonitorReturn {
  status: ConnectionStatus;
  isOnline: boolean;
  networkSpeed: NetworkSpeed;
  indicator: ConnectionStateIndicator | null;
  connectionQuality: 'poor' | 'good' | 'excellent';
  queueForRetry: (operation: RetryOperation) => void;
  cancelRetry: (operationId: string) => void;
  getEstimatedLoadTime: (dataSize: number) => number;
  checkConnection: () => Promise<ConnectionStatus>;
}

export function useConnectionMonitor(): UseConnectionMonitorReturn {
  const monitorRef = useRef<ConnectionMonitor | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    speed: 'medium',
    latency: 0,
    lastChecked: new Date()
  });
  const [indicator, setIndicator] = useState<ConnectionStateIndicator | null>(null);

  useEffect(() => {
    // Initialize connection monitor
    monitorRef.current = new ConnectionMonitor();

    // Subscribe to status changes
    const unsubscribeStatus = monitorRef.current.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Subscribe to indicator changes
    const unsubscribeIndicator = monitorRef.current.onIndicatorChange((newIndicator) => {
      setIndicator(newIndicator);
      
      // Auto-hide success indicators after 3 seconds
      if (newIndicator.type === 'online') {
        setTimeout(() => {
          setIndicator(null);
        }, 3000);
      }
    });

    // Get initial status
    setStatus(monitorRef.current.getStatus());

    return () => {
      unsubscribeStatus();
      unsubscribeIndicator();
      monitorRef.current?.destroy();
    };
  }, []);

  const queueForRetry = (operation: RetryOperation) => {
    monitorRef.current?.queueForRetry(operation);
  };

  const cancelRetry = (operationId: string) => {
    monitorRef.current?.cancelRetry(operationId);
  };

  const getEstimatedLoadTime = (dataSize: number): number => {
    return monitorRef.current?.getEstimatedLoadTime(dataSize) || dataSize;
  };

  const checkConnection = async (): Promise<ConnectionStatus> => {
    if (monitorRef.current) {
      const result = await monitorRef.current.checkConnection();
      return result || status;
    }
    return status;
  };

  return {
    status,
    isOnline: status.online,
    networkSpeed: status.speed,
    indicator,
    connectionQuality: monitorRef.current?.getConnectionQuality() || 'good',
    queueForRetry,
    cancelRetry,
    getEstimatedLoadTime,
    checkConnection
  };
}