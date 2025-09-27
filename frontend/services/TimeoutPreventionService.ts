/**
 * Timeout Prevention Service
 * Comprehensive strategy to prevent timeouts and improve system reliability
 */

export interface TimeoutConfig {
  baseTimeout: number;
  maxTimeout: number;
  retryAttempts: number;
  backoffMultiplier: number;
  circuitBreakerThreshold: number;
}

export interface RequestQueue {
  id: string;
  request: () => Promise<any>;
  priority: number;
  timestamp: number;
  retries: number;
}

export class TimeoutPreventionService {
  private config: TimeoutConfig;
  private requestQueue: RequestQueue[] = [];
  private circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private isProcessing = false;

  constructor(config?: Partial<TimeoutConfig>) {
    this.config = {
      baseTimeout: 30000, // 30 seconds base
      maxTimeout: 60000, // 60 seconds maximum
      retryAttempts: 3,
      backoffMultiplier: 2,
      circuitBreakerThreshold: 5,
      ...config
    };
  }

  /**
   * Adaptive timeout based on request type and system load
   */
  private getAdaptiveTimeout(requestType: string, systemLoad: number = 0): number {
    const baseTimeout = this.config.baseTimeout;
    
    // Adjust timeout based on request type
    const typeMultipliers: { [key: string]: number } = {
      'products': 1.2,      // Product queries need more time
      'orders': 1.5,        // Order processing is complex
      'auth': 1.0,          // Auth should be fast
      'health': 0.5,        // Health checks should be quick
      'upload': 2.0,        // File uploads need more time
      'default': 1.0
    };

    const multiplier = typeMultipliers[requestType] || typeMultipliers['default'];
    const loadAdjustment = 1 + (systemLoad * 0.1); // 10% increase per load unit
    
    const adaptiveTimeout = Math.min(
      baseTimeout * multiplier * loadAdjustment,
      this.config.maxTimeout
    );

    return Math.round(adaptiveTimeout);
  }

  /**
   * Circuit breaker pattern to prevent cascade failures
   */
  private checkCircuitBreaker(): boolean {
    const now = Date.now();
    const timeSinceLastFailure = now - this.lastFailureTime;

    switch (this.circuitBreakerState) {
      case 'CLOSED':
        if (this.failureCount >= this.config.circuitBreakerThreshold) {
          this.circuitBreakerState = 'OPEN';
          this.lastFailureTime = now;
          console.warn('🚨 Circuit breaker OPEN - too many failures');
          return false;
        }
        return true;

      case 'OPEN':
        // Wait 30 seconds before trying again
        if (timeSinceLastFailure > 30000) {
          this.circuitBreakerState = 'HALF_OPEN';
          console.log('🔄 Circuit breaker HALF_OPEN - testing recovery');
          return true;
        }
        return false;

      case 'HALF_OPEN':
        return true;

      default:
        return true;
    }
  }

  /**
   * Update circuit breaker state based on request result
   */
  private updateCircuitBreaker(success: boolean): void {
    if (success) {
      this.failureCount = 0;
      this.circuitBreakerState = 'CLOSED';
      console.log('✅ Circuit breaker CLOSED - system recovered');
    } else {
      this.failureCount++;
      this.lastFailureTime = Date.now();
    }
  }

  /**
   * Exponential backoff retry strategy
   */
  private getRetryDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    return Math.min(
      baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1),
      10000 // Max 10 seconds
    );
  }

  /**
   * Request queuing to prevent overwhelming the system
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      // Sort by priority (higher number = higher priority)
      this.requestQueue.sort((a, b) => b.priority - a.priority);
      
      const request = this.requestQueue.shift();
      if (!request) break;

      try {
        await this.executeRequest(request);
      } catch (error) {
        console.error(`❌ Queue request failed:`, error);
      }

      // Small delay between requests to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  /**
   * Execute a single request with timeout prevention
   */
  private async executeRequest(request: RequestQueue): Promise<any> {
    const { id, request: requestFn, retries } = request;
    
    if (!this.checkCircuitBreaker()) {
      throw new Error('Circuit breaker is OPEN - request blocked');
    }

    const startTime = Date.now();
    const timeout = this.getAdaptiveTimeout('default');

    try {
      const result = await Promise.race([
        requestFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
      ]);

      const duration = Date.now() - startTime;
      console.log(`✅ Request ${id} completed in ${duration}ms`);
      
      this.updateCircuitBreaker(true);
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.warn(`❌ Request ${id} failed after ${duration}ms:`, error);

      this.updateCircuitBreaker(false);

      // Retry logic
      if (retries < this.config.retryAttempts) {
        const delay = this.getRetryDelay(retries + 1);
        console.log(`🔄 Retrying request ${id} in ${delay}ms (attempt ${retries + 1})`);
        
        setTimeout(() => {
          this.requestQueue.push({
            ...request,
            retries: retries + 1
          });
          this.processQueue();
        }, delay);
      } else {
        throw error;
      }
    }
  }

  /**
   * Add request to queue with priority
   */
  public async queueRequest<T>(
    requestFn: () => Promise<T>,
    priority: number = 1,
    requestId?: string
  ): Promise<T> {
    const id = requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request: RequestQueue = {
      id,
      request: requestFn,
      priority,
      timestamp: Date.now(),
      retries: 0
    };

    this.requestQueue.push(request);
    
    // Start processing if not already running
    this.processQueue();

    // Wait for completion
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        const completedRequest = this.requestQueue.find(r => r.id === id);
        if (!completedRequest) {
          // Request completed, resolve with result
          resolve(undefined as T);
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      checkCompletion();
    });
  }

  /**
   * Get system health status
   */
  public getHealthStatus(): {
    circuitBreakerState: string;
    failureCount: number;
    queueLength: number;
    isProcessing: boolean;
  } {
    return {
      circuitBreakerState: this.circuitBreakerState,
      failureCount: this.failureCount,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Reset circuit breaker (for testing or manual recovery)
   */
  public resetCircuitBreaker(): void {
    this.circuitBreakerState = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    console.log('🔄 Circuit breaker manually reset');
  }
}

// Export singleton instance
export const timeoutPreventionService = new TimeoutPreventionService();
