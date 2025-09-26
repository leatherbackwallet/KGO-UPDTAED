import { ConnectionStatus, NetworkSpeed } from './types';

export interface ConnectionStateIndicator {
  type: 'online' | 'offline' | 'slow' | 'reconnecting';
  message: string;
  showProgress?: boolean;
  estimatedTime?: number;
}

export interface RetryOperation {
  id: string;
  operation: () => Promise<any>;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  maxRetries?: number;
  currentRetry?: number;
}

export class ConnectionMonitor {
  private status: ConnectionStatus;
  private listeners: Array<(status: ConnectionStatus) => void> = [];
  private speedListeners: Array<(speed: NetworkSpeed) => void> = [];
  private indicatorListeners: Array<(indicator: ConnectionStateIndicator) => void> = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private pendingRetries: Map<string, RetryOperation> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second

  constructor() {
    this.status = {
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      speed: 'medium',
      latency: 0,
      lastChecked: new Date()
    };

    this.initializeListeners();
    this.startPeriodicChecks();
  }

  private initializeListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for connection changes (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', this.handleConnectionChange.bind(this));
    }
  }

  private handleOnline(): void {
    this.reconnectAttempts = 0;
    this.updateStatus({ online: true });
    this.checkNetworkSpeed();
    
    // Notify about connection restoration
    this.notifyIndicatorListeners({
      type: 'online',
      message: 'Connection restored'
    });

    // Resume pending operations
    this.resumePendingOperations();
  }

  private handleOffline(): void {
    this.updateStatus({ 
      online: false, 
      speed: 'slow',
      latency: Infinity 
    });

    // Notify about offline state
    this.notifyIndicatorListeners({
      type: 'offline',
      message: 'You are currently offline. Some features may not be available.'
    });

    // Start reconnection attempts
    this.startReconnectionAttempts();
  }

  private handleConnectionChange(): void {
    this.checkNetworkSpeed();
  }

  private async checkNetworkSpeed(): Promise<void> {
    if (!this.status.online) return;

    try {
      const startTime = performance.now();
      
      // Use a small image or API endpoint to test speed
      // Try warmup endpoint first for cold starts, then health
      const warmupUrl = `${process.env.NEXT_PUBLIC_API_URL}/warmup?t=${Date.now()}`;
      const testUrl = `${process.env.NEXT_PUBLIC_API_URL}/health?t=${Date.now()}`;
      const response = await fetch(testUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const endTime = performance.now();
      const latency = endTime - startTime;

      let speed: NetworkSpeed;
      let indicator: ConnectionStateIndicator | null = null;

      if (latency < 100) {
        speed = 'fast';
      } else if (latency < 500) {
        speed = 'medium';
      } else {
        speed = 'slow';
        indicator = {
          type: 'slow',
          message: 'Slow connection detected. Loading may take longer than usual.',
          showProgress: true,
          estimatedTime: Math.round(latency * 2) // Estimate based on current latency
        };
      }

      this.updateStatus({
        online: response.ok,
        speed,
        latency
      });

      // Notify about slow connection if needed
      if (indicator) {
        this.notifyIndicatorListeners(indicator);
      }
    } catch (error) {
      // Network test failed, assume connection issues
      this.updateStatus({
        online: false,
        speed: 'slow',
        latency: Infinity
      });

      this.notifyIndicatorListeners({
        type: 'offline',
        message: 'Connection lost. Attempting to reconnect...',
        showProgress: true
      });

      this.startReconnectionAttempts();
    }
  }

  private updateStatus(updates: Partial<ConnectionStatus>): void {
    const previousSpeed = this.status.speed;
    
    this.status = {
      ...this.status,
      ...updates,
      lastChecked: new Date()
    };

    // Notify status listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Error in connection status listener:', error);
      }
    });

    // Notify speed listeners if speed changed
    if (updates.speed && updates.speed !== previousSpeed) {
      this.speedListeners.forEach(listener => {
        try {
          listener(updates.speed!);
        } catch (error) {
          console.error('Error in network speed listener:', error);
        }
      });
    }
  }

  private startPeriodicChecks(): void {
    // Check network status every 30 seconds
    this.checkInterval = setInterval(() => {
      if (this.status.online) {
        this.checkNetworkSpeed();
      }
    }, 30000);
  }

  private startReconnectionAttempts(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.notifyIndicatorListeners({
        type: 'offline',
        message: 'Unable to reconnect. Please check your internet connection.'
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);

    this.notifyIndicatorListeners({
      type: 'reconnecting',
      message: `Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      showProgress: true,
      estimatedTime: delay
    });

    setTimeout(async () => {
      try {
        await this.checkNetworkSpeed();
        if (this.status.online) {
          this.reconnectAttempts = 0;
          this.notifyIndicatorListeners({
            type: 'online',
            message: 'Connection restored'
          });
          this.resumePendingOperations();
        } else {
          this.startReconnectionAttempts();
        }
      } catch (error) {
        this.startReconnectionAttempts();
      }
    }, delay);
  }

  private resumePendingOperations(): void {
    const operations = Array.from(this.pendingRetries.values());
    this.pendingRetries.clear();

    operations.forEach(async (operation) => {
      try {
        const result = await operation.operation();
        operation.onSuccess?.(result);
      } catch (error) {
        operation.onError?.(error as Error);
      }
    });
  }

  private notifyIndicatorListeners(indicator: ConnectionStateIndicator): void {
    this.indicatorListeners.forEach(listener => {
      try {
        listener(indicator);
      } catch (error) {
        console.error('Error in connection indicator listener:', error);
      }
    });
  }

  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  isOnline(): boolean {
    return this.status.online;
  }

  getNetworkInfo(): { speed: NetworkSpeed; latency: number } {
    return {
      speed: this.status.speed,
      latency: this.status.latency
    };
  }

  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  onSpeedChange(callback: (speed: NetworkSpeed) => void): () => void {
    this.speedListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.speedListeners.indexOf(callback);
      if (index > -1) {
        this.speedListeners.splice(index, 1);
      }
    };
  }

  onIndicatorChange(callback: (indicator: ConnectionStateIndicator) => void): () => void {
    this.indicatorListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.indicatorListeners.indexOf(callback);
      if (index > -1) {
        this.indicatorListeners.splice(index, 1);
      }
    };
  }

  // Queue operation for retry when connection is restored
  queueForRetry(operation: RetryOperation): void {
    this.pendingRetries.set(operation.id, operation);
  }

  // Remove operation from retry queue
  cancelRetry(operationId: string): void {
    this.pendingRetries.delete(operationId);
  }

  // Get current connection quality for adaptive loading
  getConnectionQuality(): 'poor' | 'good' | 'excellent' {
    if (!this.status.online) return 'poor';
    
    switch (this.status.speed) {
      case 'fast':
        return 'excellent';
      case 'medium':
        return 'good';
      case 'slow':
      default:
        return 'poor';
    }
  }

  // Get estimated loading time based on connection quality
  getEstimatedLoadTime(dataSize: number): number {
    const quality = this.getConnectionQuality();
    const baseTime = dataSize / 1024; // Base time in ms per KB
    
    switch (quality) {
      case 'excellent':
        return baseTime * 0.5;
      case 'good':
        return baseTime * 1;
      case 'poor':
      default:
        return baseTime * 3;
    }
  }

  // Manual network check
  async checkConnection(): Promise<ConnectionStatus> {
    await this.checkNetworkSpeed();
    return this.getStatus();
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }

    this.listeners = [];
    this.speedListeners = [];
    this.indicatorListeners = [];
    this.pendingRetries.clear();
  }
}