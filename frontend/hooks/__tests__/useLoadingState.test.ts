import { renderHook, act, waitFor } from '@testing-library/react';
import { useLoadingState, useMultipleLoadingStates } from '../useLoadingState';

// Mock timers
jest.useFakeTimers();

describe('useLoadingState', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Basic functionality', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useLoadingState());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.message).toBe('Loading...');
      expect(result.current.error).toBe(null);
    });

    it('initializes with custom options', () => {
      const { result } = renderHook(() =>
        useLoadingState({
          initialMessage: 'Custom loading...',
          estimatedDuration: 5000,
        })
      );

      expect(result.current.message).toBe('Custom loading...');
      expect(result.current.estimatedTime).toBe(5000);
    });

    it('starts loading correctly', () => {
      const { result } = renderHook(() => useLoadingState());

      act(() => {
        result.current.startLoading();
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.progress).toBe(0);
      expect(result.current.loadingState.startTime).toBeInstanceOf(Date);
    });

    it('completes loading correctly', () => {
      const onComplete = jest.fn();
      const { result } = renderHook(() =>
        useLoadingState({ onComplete })
      );

      act(() => {
        result.current.startLoading();
      });

      act(() => {
        result.current.completeLoading();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.progress).toBe(100);
      expect(result.current.message).toBe('Complete');
      expect(onComplete).toHaveBeenCalled();
    });

    it('handles errors correctly', () => {
      const onError = jest.fn();
      const { result } = renderHook(() =>
        useLoadingState({ onError })
      );

      const testError = new Error('Test error');

      act(() => {
        result.current.startLoading();
      });

      act(() => {
        result.current.setError(testError);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(testError);
      expect(result.current.message).toBe('Test error');
      expect(onError).toHaveBeenCalledWith(testError);
    });

    it('resets loading state correctly', () => {
      const { result } = renderHook(() => useLoadingState());

      act(() => {
        result.current.startLoading();
      });

      act(() => {
        result.current.updateProgress(50, 'Half way...');
      });

      act(() => {
        result.current.resetLoading();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.message).toBe('Loading...');
      expect(result.current.error).toBe(null);
    });
  });

  describe('Progress management', () => {
    it('updates progress manually', () => {
      const { result } = renderHook(() => useLoadingState());

      act(() => {
        result.current.updateProgress(75, 'Almost done...');
      });

      expect(result.current.progress).toBe(75);
      expect(result.current.message).toBe('Almost done...');
    });

    it('clamps progress to valid range', () => {
      const { result } = renderHook(() => useLoadingState());

      act(() => {
        result.current.updateProgress(-10);
      });
      expect(result.current.progress).toBe(0);

      act(() => {
        result.current.updateProgress(150);
      });
      expect(result.current.progress).toBe(100);
    });

    it('updates message independently', () => {
      const { result } = renderHook(() => useLoadingState());

      act(() => {
        result.current.updateMessage('New message');
      });

      expect(result.current.message).toBe('New message');
      expect(result.current.progress).toBe(0); // Should not change
    });
  });

  describe('Progress simulation', () => {
    it('simulates smooth progress with estimated duration', async () => {
      const { result } = renderHook(() => useLoadingState());

      act(() => {
        result.current.startLoading({ estimatedDuration: 1000 });
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.progress).toBe(0);

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(500); // Half the duration
      });

      // Progress should be around 50% (but not exactly due to the 95% cap)
      expect(result.current.progress).toBeGreaterThan(40);
      expect(result.current.progress).toBeLessThan(60);

      act(() => {
        jest.advanceTimersByTime(500); // Complete the duration
      });

      // Should be close to 95% (the cap for smooth progress)
      expect(result.current.progress).toBeGreaterThan(90);
      expect(result.current.progress).toBeLessThanOrEqual(95);
    });

    it('simulates progress steps', async () => {
      const progressSteps = [
        { progress: 25, message: 'Step 1', duration: 100 },
        { progress: 50, message: 'Step 2', duration: 100 },
        { progress: 75, message: 'Step 3', duration: 100 },
        { progress: 100, message: 'Complete', duration: 100 },
      ];

      const { result } = renderHook(() => useLoadingState());

      act(() => {
        result.current.startLoading({ progressSteps });
      });

      expect(result.current.progress).toBe(25);
      expect(result.current.message).toBe('Step 1');

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.progress).toBe(50);
      expect(result.current.message).toBe('Step 2');

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.progress).toBe(75);
      expect(result.current.message).toBe('Step 3');

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.progress).toBe(100);
      expect(result.current.message).toBe('Complete');
    });
  });

  describe('Elapsed time tracking', () => {
    it('tracks elapsed time during loading', async () => {
      const { result } = renderHook(() => useLoadingState());

      act(() => {
        result.current.startLoading();
      });

      expect(result.current.elapsedTime).toBe(0);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.elapsedTime).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Cleanup', () => {
    it('cleans up timers on unmount', () => {
      const { result, unmount } = renderHook(() => useLoadingState());

      act(() => {
        result.current.startLoading({ estimatedDuration: 5000 });
      });

      // Should have active timers
      expect(jest.getTimerCount()).toBeGreaterThan(0);

      unmount();

      // Timers should be cleaned up
      expect(jest.getTimerCount()).toBe(0);
    });

    it('cleans up timers when completing loading', () => {
      const { result } = renderHook(() => useLoadingState());

      act(() => {
        result.current.startLoading({ estimatedDuration: 5000 });
      });

      expect(jest.getTimerCount()).toBeGreaterThan(0);

      act(() => {
        result.current.completeLoading();
      });

      // Progress timers should be cleaned up
      expect(jest.getTimerCount()).toBeLessThanOrEqual(1); // Only elapsed time timer might remain
    });

    it('cleans up timers when setting error', () => {
      const { result } = renderHook(() => useLoadingState());

      act(() => {
        result.current.startLoading({ estimatedDuration: 5000 });
      });

      expect(jest.getTimerCount()).toBeGreaterThan(0);

      act(() => {
        result.current.setError(new Error('Test error'));
      });

      // Progress timers should be cleaned up
      expect(jest.getTimerCount()).toBeLessThanOrEqual(1); // Only elapsed time timer might remain
    });
  });
});

describe('useMultipleLoadingStates', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('manages multiple loading states', () => {
    const { result } = renderHook(() => useMultipleLoadingStates());

    expect(result.current.loadingStates).toEqual({});
    expect(result.current.isAnyLoading()).toBe(false);
    expect(result.current.getOverallProgress()).toBe(0);
  });

  it('creates and tracks loading states', () => {
    const { result } = renderHook(() => useMultipleLoadingStates());

    let loadingHook1: any;
    let loadingHook2: any;

    act(() => {
      loadingHook1 = result.current.createLoadingState('task1', {
        initialMessage: 'Task 1',
      });
      loadingHook2 = result.current.createLoadingState('task2', {
        initialMessage: 'Task 2',
      });
    });

    expect(result.current.getLoadingState('task1')).toBeDefined();
    expect(result.current.getLoadingState('task2')).toBeDefined();
  });

  it('calculates overall progress correctly', () => {
    const { result } = renderHook(() => useMultipleLoadingStates());

    let loadingHook1: any;
    let loadingHook2: any;

    act(() => {
      loadingHook1 = result.current.createLoadingState('task1');
      loadingHook2 = result.current.createLoadingState('task2');
    });

    act(() => {
      loadingHook1.updateProgress(50);
      loadingHook2.updateProgress(100);
    });

    expect(result.current.getOverallProgress()).toBe(75); // (50 + 100) / 2
  });

  it('detects when any loading state is active', () => {
    const { result } = renderHook(() => useMultipleLoadingStates());

    let loadingHook1: any;
    let loadingHook2: any;

    act(() => {
      loadingHook1 = result.current.createLoadingState('task1');
      loadingHook2 = result.current.createLoadingState('task2');
    });

    expect(result.current.isAnyLoading()).toBe(false);

    act(() => {
      loadingHook1.startLoading();
    });

    expect(result.current.isAnyLoading()).toBe(true);

    act(() => {
      loadingHook1.completeLoading();
    });

    expect(result.current.isAnyLoading()).toBe(false);
  });
});