import { RetryOptions, RetryState, ErrorType } from './types';

export class RetryManager {
  private retryStates = new Map<string, RetryState>();

  async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions,
    operationId?: string
  ): Promise<T> {
    const id = operationId || this.generateOperationId();
    let attempt = 0;
    let lastError: Error;

    // Initialize retry state
    this.retryStates.set(id, {
      attempt: 0,
      nextRetryAt: null,
      lastError: null,
      isRetrying: false
    });

    while (attempt <= options.maxRetries) {
      try {
        // Update retry state
        this.updateRetryState(id, {
          attempt,
          nextRetryAt: null,
          lastError: null,
          isRetrying: attempt > 0
        });

        const result = await operation();
        
        // Success - clear retry state
        this.retryStates.delete(id);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Check if we should retry this error
        if (!options.retryCondition(lastError) || attempt >= options.maxRetries) {
          this.retryStates.delete(id);
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          options.baseDelay * Math.pow(options.backoffFactor, attempt),
          options.maxDelay
        );

        const nextRetryAt = new Date(Date.now() + delay);
        
        // Update retry state
        this.updateRetryState(id, {
          attempt: attempt + 1,
          nextRetryAt,
          lastError,
          isRetrying: true
        });

        // Call retry callback if provided
        if (options.onRetry) {
          options.onRetry(attempt + 1, lastError);
        }

        // Wait before retrying
        await this.delay(delay);
        attempt++;
      }
    }

    // Max retries exceeded
    this.retryStates.delete(id);
    throw lastError!;
  }

  getRetryState(operationId: string): RetryState | null {
    return this.retryStates.get(operationId) || null;
  }

  cancelRetries(operationId: string): void {
    this.retryStates.delete(operationId);
  }

  private updateRetryState(id: string, state: RetryState): void {
    this.retryStates.set(id, state);
  }

  private generateOperationId(): string {
    return `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Default retry condition - retry on network errors, timeouts, and 5xx server errors
  static defaultRetryCondition = (error: any): boolean => {
    // Network errors (no response)
    if (!error.response) {
      return true;
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return true;
    }

    // Server errors (5xx)
    if (error.response?.status >= 500) {
      return true;
    }

    // Rate limiting (429)
    if (error.response?.status === 429) {
      return true;
    }

    return false;
  };
}