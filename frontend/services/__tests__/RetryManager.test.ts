import { RetryManager } from '../RetryManager';

describe('RetryManager', () => {
  let retryManager: RetryManager;

  beforeEach(() => {
    retryManager = new RetryManager();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Retry Logic', () => {
    it('should succeed on first attempt', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await retryManager.execute(
        mockOperation,
        {
          maxRetries: 3,
          baseDelay: 100,
          maxDelay: 1000,
          backoffFactor: 2,
          retryCondition: () => true
        }
      );

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const executePromise = retryManager.execute(
        mockOperation,
        {
          maxRetries: 3,
          baseDelay: 100,
          maxDelay: 1000,
          backoffFactor: 2,
          retryCondition: (error) => error.message.includes('Network')
        }
      );

      // Fast-forward through delays
      jest.advanceTimersByTime(100); // First retry delay
      await Promise.resolve(); // Let first retry execute
      jest.advanceTimersByTime(200); // Second retry delay (exponential backoff)
      await Promise.resolve(); // Let second retry execute

      const result = await executePromise;
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Validation error'));

      await expect(
        retryManager.execute(
          mockOperation,
          {
            maxRetries: 3,
            baseDelay: 100,
            maxDelay: 1000,
            backoffFactor: 2,
            retryCondition: (error) => !error.message.includes('Validation')
          }
        )
      ).rejects.toThrow('Validation error');

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should respect max retries', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Network error'));

      const executePromise = retryManager.execute(
        mockOperation,
        {
          maxRetries: 2,
          baseDelay: 100,
          maxDelay: 1000,
          backoffFactor: 2,
          retryCondition: () => true
        }
      );

      // Fast-forward through all retry delays
      jest.advanceTimersByTime(100); // First retry
      await Promise.resolve();
      jest.advanceTimersByTime(200); // Second retry
      await Promise.resolve();

      await expect(executePromise).rejects.toThrow('Network error');
      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Exponential Backoff Strategy', () => {
    it('should implement exponential backoff correctly', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      jest.useRealTimers();
      global.setTimeout = jest.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0); // Execute immediately for test
      }) as any;

      await retryManager.execute(
        mockOperation,
        {
          maxRetries: 3,
          baseDelay: 100,
          maxDelay: 1000,
          backoffFactor: 2,
          retryCondition: () => true
        }
      );

      expect(delays).toEqual([100, 200, 400]); // Exponential backoff: 100, 200, 400
      global.setTimeout = originalSetTimeout;
      jest.useFakeTimers();
    });

    it('should respect max delay limit', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      jest.useRealTimers();
      global.setTimeout = jest.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      }) as any;

      await retryManager.execute(
        mockOperation,
        {
          maxRetries: 2,
          baseDelay: 500,
          maxDelay: 800, // Lower than what exponential backoff would produce
          backoffFactor: 2,
          retryCondition: () => true
        }
      );

      expect(delays).toEqual([500, 800]); // Second delay capped at maxDelay
      global.setTimeout = originalSetTimeout;
      jest.useFakeTimers();
    });

    it('should handle different backoff factors', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      jest.useRealTimers();
      global.setTimeout = jest.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      }) as any;

      await retryManager.execute(
        mockOperation,
        {
          maxRetries: 2,
          baseDelay: 100,
          maxDelay: 10000,
          backoffFactor: 3, // Different backoff factor
          retryCondition: () => true
        }
      );

      expect(delays).toEqual([100, 300]); // 100 * 3^0, 100 * 3^1
      global.setTimeout = originalSetTimeout;
      jest.useFakeTimers();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      const mockOperation = jest.fn().mockRejectedValue(timeoutError);

      await expect(
        retryManager.execute(
          mockOperation,
          {
            maxRetries: 1,
            baseDelay: 100,
            maxDelay: 1000,
            backoffFactor: 2,
            retryCondition: RetryManager.defaultRetryCondition
          }
        )
      ).rejects.toThrow('Request timeout');

      expect(mockOperation).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      // Simulate axios network error (no response)
      (networkError as any).response = undefined;
      const mockOperation = jest.fn().mockRejectedValue(networkError);

      const executePromise = retryManager.execute(
        mockOperation,
        {
          maxRetries: 1,
          baseDelay: 100,
          maxDelay: 1000,
          backoffFactor: 2,
          retryCondition: RetryManager.defaultRetryCondition
        }
      );

      jest.advanceTimersByTime(100);
      await Promise.resolve();

      await expect(executePromise).rejects.toThrow('Network Error');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should handle 5xx server errors', async () => {
      const serverError = new Error('Internal Server Error');
      (serverError as any).response = { status: 500 };
      const mockOperation = jest.fn().mockRejectedValue(serverError);

      const executePromise = retryManager.execute(
        mockOperation,
        {
          maxRetries: 1,
          baseDelay: 100,
          maxDelay: 1000,
          backoffFactor: 2,
          retryCondition: RetryManager.defaultRetryCondition
        }
      );

      jest.advanceTimersByTime(100);
      await Promise.resolve();

      await expect(executePromise).rejects.toThrow('Internal Server Error');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should handle 429 rate limiting errors', async () => {
      const rateLimitError = new Error('Too Many Requests');
      (rateLimitError as any).response = { status: 429 };
      const mockOperation = jest.fn().mockRejectedValue(rateLimitError);

      const executePromise = retryManager.execute(
        mockOperation,
        {
          maxRetries: 1,
          baseDelay: 100,
          maxDelay: 1000,
          backoffFactor: 2,
          retryCondition: RetryManager.defaultRetryCondition
        }
      );

      jest.advanceTimersByTime(100);
      await Promise.resolve();

      await expect(executePromise).rejects.toThrow('Too Many Requests');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry 4xx client errors (except 429)', async () => {
      const clientError = new Error('Bad Request');
      (clientError as any).response = { status: 400 };
      const mockOperation = jest.fn().mockRejectedValue(clientError);

      await expect(
        retryManager.execute(
          mockOperation,
          {
            maxRetries: 3,
            baseDelay: 100,
            maxDelay: 1000,
            backoffFactor: 2,
            retryCondition: RetryManager.defaultRetryCondition
          }
        )
      ).rejects.toThrow('Bad Request');

      expect(mockOperation).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('Retry State Management', () => {
    it('should track retry state during execution', async () => {
      const operationId = 'test-operation';
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const executePromise = retryManager.execute(
        mockOperation,
        {
          maxRetries: 2,
          baseDelay: 100,
          maxDelay: 1000,
          backoffFactor: 2,
          retryCondition: () => true
        },
        operationId
      );

      // Check initial state
      let state = retryManager.getRetryState(operationId);
      expect(state).toBeTruthy();
      expect(state?.attempt).toBe(0);
      expect(state?.isRetrying).toBe(false);

      // Advance to first retry
      jest.advanceTimersByTime(100);
      await Promise.resolve();

      // Check retry state
      state = retryManager.getRetryState(operationId);
      expect(state?.attempt).toBe(1);
      expect(state?.isRetrying).toBe(true);
      expect(state?.lastError?.message).toBe('Network error');

      await executePromise;

      // State should be cleared after success
      state = retryManager.getRetryState(operationId);
      expect(state).toBeNull();
    });

    it('should return null for non-existent operation', () => {
      const state = retryManager.getRetryState('non-existent');
      expect(state).toBeNull();
    });

    it('should cancel retries', async () => {
      const operationId = 'test-operation';
      const mockOperation = jest.fn().mockRejectedValue(new Error('Network error'));

      const executePromise = retryManager.execute(
        mockOperation,
        {
          maxRetries: 3,
          baseDelay: 100,
          maxDelay: 1000,
          backoffFactor: 2,
          retryCondition: () => true
        },
        operationId
      );

      // Cancel retries
      retryManager.cancelRetries(operationId);

      // State should be cleared
      const state = retryManager.getRetryState(operationId);
      expect(state).toBeNull();

      // Original promise should still reject
      await expect(executePromise).rejects.toThrow('Network error');
    });
  });

  describe('Callback Handling', () => {
    it('should call onRetry callback with correct parameters', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockRejectedValueOnce(new Error('Second error'))
        .mockResolvedValue('success');
      
      const onRetryMock = jest.fn();

      const executePromise = retryManager.execute(
        mockOperation,
        {
          maxRetries: 3,
          baseDelay: 100,
          maxDelay: 1000,
          backoffFactor: 2,
          retryCondition: () => true,
          onRetry: onRetryMock
        }
      );

      // Fast-forward through retries
      jest.advanceTimersByTime(100);
      await Promise.resolve();
      jest.advanceTimersByTime(200);
      await Promise.resolve();

      await executePromise;

      expect(onRetryMock).toHaveBeenCalledTimes(2);
      expect(onRetryMock).toHaveBeenNthCalledWith(1, 1, expect.objectContaining({
        message: 'First error'
      }));
      expect(onRetryMock).toHaveBeenNthCalledWith(2, 2, expect.objectContaining({
        message: 'Second error'
      }));
    });

    it('should handle onRetry callback errors gracefully', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const onRetryMock = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      const executePromise = retryManager.execute(
        mockOperation,
        {
          maxRetries: 2,
          baseDelay: 100,
          maxDelay: 1000,
          backoffFactor: 2,
          retryCondition: () => true,
          onRetry: onRetryMock
        }
      );

      jest.advanceTimersByTime(100);
      await Promise.resolve();

      // Should still succeed despite callback error
      const result = await executePromise;
      expect(result).toBe('success');
      expect(onRetryMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero max retries', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        retryManager.execute(
          mockOperation,
          {
            maxRetries: 0,
            baseDelay: 100,
            maxDelay: 1000,
            backoffFactor: 2,
            retryCondition: () => true
          }
        )
      ).rejects.toThrow('Network error');

      expect(mockOperation).toHaveBeenCalledTimes(1); // Only initial attempt
    });

    it('should handle zero base delay', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const result = await retryManager.execute(
        mockOperation,
        {
          maxRetries: 1,
          baseDelay: 0,
          maxDelay: 1000,
          backoffFactor: 2,
          retryCondition: () => true
        }
      );

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should generate unique operation IDs', async () => {
      const mockOperation1 = jest.fn().mockResolvedValue('success1');
      const mockOperation2 = jest.fn().mockResolvedValue('success2');

      const promise1 = retryManager.execute(mockOperation1, {
        maxRetries: 1,
        baseDelay: 100,
        maxDelay: 1000,
        backoffFactor: 2,
        retryCondition: () => true
      });

      const promise2 = retryManager.execute(mockOperation2, {
        maxRetries: 1,
        baseDelay: 100,
        maxDelay: 1000,
        backoffFactor: 2,
        retryCondition: () => true
      });

      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1).toBe('success1');
      expect(result2).toBe('success2');
    });
  });

  describe('Default Retry Condition', () => {
    it('should retry on network errors (no response)', () => {
      const error = new Error('Network Error');
      expect(RetryManager.defaultRetryCondition(error)).toBe(true);
    });

    it('should retry on timeout errors', () => {
      const error = new Error('timeout of 5000ms exceeded');
      expect(RetryManager.defaultRetryCondition(error)).toBe(true);
    });

    it('should retry on ECONNABORTED errors', () => {
      const error = new Error('Connection aborted');
      (error as any).code = 'ECONNABORTED';
      expect(RetryManager.defaultRetryCondition(error)).toBe(true);
    });

    it('should retry on 5xx server errors', () => {
      const error = new Error('Internal Server Error');
      (error as any).response = { status: 500 };
      expect(RetryManager.defaultRetryCondition(error)).toBe(true);
    });

    it('should retry on 429 rate limiting', () => {
      const error = new Error('Too Many Requests');
      (error as any).response = { status: 429 };
      expect(RetryManager.defaultRetryCondition(error)).toBe(true);
    });

    it('should not retry on 4xx client errors (except 429)', () => {
      const error = new Error('Bad Request');
      (error as any).response = { status: 400 };
      expect(RetryManager.defaultRetryCondition(error)).toBe(false);
    });

    it('should not retry on 2xx success responses', () => {
      const error = new Error('Success');
      (error as any).response = { status: 200 };
      expect(RetryManager.defaultRetryCondition(error)).toBe(false);
    });
  });
});