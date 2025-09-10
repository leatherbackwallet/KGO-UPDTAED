import { CircuitBreaker } from '../CircuitBreaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(3, 1000); // 3 failures, 1 second timeout
  });

  it('should start in CLOSED state', () => {
    const state = circuitBreaker.getState();
    expect(state.state).toBe('CLOSED');
    expect(state.failureCount).toBe(0);
  });

  it('should execute operation successfully when CLOSED', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    
    const result = await circuitBreaker.execute(mockOperation);
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should open circuit after threshold failures', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Service error'));

    // Fail 3 times to reach threshold
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(mockOperation);
      } catch (error) {
        // Expected to fail
      }
    }

    const state = circuitBreaker.getState();
    expect(state.state).toBe('OPEN');
    expect(state.failureCount).toBe(3);
  });

  it('should reject immediately when OPEN', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Service error'));

    // Fail 3 times to open circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(mockOperation);
      } catch (error) {
        // Expected to fail
      }
    }

    // Now circuit should be open and reject immediately
    await expect(
      circuitBreaker.execute(jest.fn().mockResolvedValue('success'))
    ).rejects.toThrow('Circuit breaker is OPEN');
  });

  it('should reset failure count on success', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('Service error'))
      .mockRejectedValueOnce(new Error('Service error'))
      .mockResolvedValue('success');

    // Fail twice
    for (let i = 0; i < 2; i++) {
      try {
        await circuitBreaker.execute(mockOperation);
      } catch (error) {
        // Expected to fail
      }
    }

    // Then succeed
    const result = await circuitBreaker.execute(mockOperation);
    
    expect(result).toBe('success');
    
    const state = circuitBreaker.getState();
    expect(state.state).toBe('CLOSED');
    expect(state.failureCount).toBe(0);
  });

  it('should allow manual reset', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Service error'));

    // Fail 3 times to open circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(mockOperation);
      } catch (error) {
        // Expected to fail
      }
    }

    expect(circuitBreaker.getState().state).toBe('OPEN');

    // Reset manually
    circuitBreaker.reset();

    const state = circuitBreaker.getState();
    expect(state.state).toBe('CLOSED');
    expect(state.failureCount).toBe(0);
  });
});