import { CircuitBreakerState } from './types';

export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: Date | null = null;
  private nextAttemptTime: Date | null = null;
  
  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000, // 1 minute
    private monitoringPeriod: number = 120000 // 2 minutes
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === 'HALF_OPEN') {
      // Failed during half-open, go back to open
      this.state = 'OPEN';
      this.nextAttemptTime = new Date(Date.now() + this.recoveryTimeout);
    } else if (this.failureCount >= this.failureThreshold) {
      // Too many failures, open the circuit
      this.state = 'OPEN';
      this.nextAttemptTime = new Date(Date.now() + this.recoveryTimeout);
    }
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime !== null && new Date() >= this.nextAttemptTime;
  }

  getState(): CircuitBreakerState {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  // Force open the circuit (useful for maintenance)
  forceOpen(): void {
    this.state = 'OPEN';
    this.nextAttemptTime = new Date(Date.now() + this.recoveryTimeout);
  }
}