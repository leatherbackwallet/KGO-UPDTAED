import { useState, useEffect, useCallback, useRef } from 'react';

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
  estimatedTime?: number;
  error?: Error | null;
  startTime?: Date;
  elapsedTime?: number;
}

export interface LoadingOptions {
  initialMessage?: string;
  estimatedDuration?: number;
  progressSteps?: Array<{ progress: number; message: string; duration?: number }>;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export const useLoadingState = (options: LoadingOptions = {}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    message: options.initialMessage || 'Loading...',
    estimatedTime: options.estimatedDuration,
    error: null,
  });

  const progressTimer = useRef<NodeJS.Timeout | null>(null);
  const stepTimer = useRef<NodeJS.Timeout | null>(null);
  const currentStepIndex = useRef(0);

  // Start loading with optional progress simulation
  const startLoading = useCallback((customOptions?: Partial<LoadingOptions>) => {
    const mergedOptions = { ...options, ...customOptions };
    
    setLoadingState({
      isLoading: true,
      progress: 0,
      message: mergedOptions.initialMessage || 'Loading...',
      estimatedTime: mergedOptions.estimatedDuration,
      error: null,
      startTime: new Date(),
      elapsedTime: 0,
    });

    currentStepIndex.current = 0;

    // If we have progress steps, simulate progress
    if (mergedOptions.progressSteps && mergedOptions.progressSteps.length > 0) {
      simulateProgressSteps(mergedOptions.progressSteps);
    } else if (mergedOptions.estimatedDuration) {
      // Simulate smooth progress based on estimated duration
      simulateSmoothProgress(mergedOptions.estimatedDuration);
    }

    // Track elapsed time
    const startTime = Date.now();
    const elapsedTimer = setInterval(() => {
      setLoadingState(prev => ({
        ...prev,
        elapsedTime: Date.now() - startTime,
      }));
    }, 100);

    return () => clearInterval(elapsedTimer);
  }, [options]);

  // Update progress manually
  const updateProgress = useCallback((progress: number, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      message: message || prev.message,
    }));
  }, []);

  // Update message
  const updateMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message,
    }));
  }, []);

  // Complete loading
  const completeLoading = useCallback(() => {
    if (progressTimer.current) {
      clearTimeout(progressTimer.current);
      progressTimer.current = null;
    }
    if (stepTimer.current) {
      clearTimeout(stepTimer.current);
      stepTimer.current = null;
    }

    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      progress: 100,
      message: 'Complete',
    }));

    options.onComplete?.();
  }, [options]);

  // Set error state
  const setError = useCallback((error: Error) => {
    if (progressTimer.current) {
      clearTimeout(progressTimer.current);
      progressTimer.current = null;
    }
    if (stepTimer.current) {
      clearTimeout(stepTimer.current);
      stepTimer.current = null;
    }

    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      error,
      message: error.message || 'An error occurred',
    }));

    options.onError?.(error);
  }, [options]);

  // Simulate progress steps
  const simulateProgressSteps = useCallback((steps: Array<{ progress: number; message: string; duration?: number }>) => {
    const executeStep = (stepIndex: number) => {
      if (stepIndex >= steps.length) {
        return;
      }

      const step = steps[stepIndex];
      updateProgress(step.progress, step.message);

      const duration = step.duration || 1000;
      stepTimer.current = setTimeout(() => {
        executeStep(stepIndex + 1);
      }, duration);
    };

    executeStep(0);
  }, [updateProgress]);

  // Simulate smooth progress
  const simulateSmoothProgress = useCallback((duration: number) => {
    const startTime = Date.now();
    const updateInterval = 50; // Update every 50ms

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(95, (elapsed / duration) * 100); // Stop at 95% to wait for actual completion

      setLoadingState(prev => ({
        ...prev,
        progress,
        estimatedTime: Math.max(0, (duration - elapsed) / 1000),
      }));

      if (progress < 95) {
        progressTimer.current = setTimeout(updateProgress, updateInterval);
      }
    };

    updateProgress();
  }, []);

  // Reset loading state
  const resetLoading = useCallback(() => {
    if (progressTimer.current) {
      clearTimeout(progressTimer.current);
      progressTimer.current = null;
    }
    if (stepTimer.current) {
      clearTimeout(stepTimer.current);
      stepTimer.current = null;
    }

    setLoadingState({
      isLoading: false,
      progress: 0,
      message: options.initialMessage || 'Loading...',
      estimatedTime: options.estimatedDuration,
      error: null,
    });
  }, [options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressTimer.current) {
        clearTimeout(progressTimer.current);
      }
      if (stepTimer.current) {
        clearTimeout(stepTimer.current);
      }
    };
  }, []);

  return {
    loadingState,
    startLoading,
    updateProgress,
    updateMessage,
    completeLoading,
    setError,
    resetLoading,
    isLoading: loadingState.isLoading,
    progress: loadingState.progress,
    message: loadingState.message,
    estimatedTime: loadingState.estimatedTime,
    error: loadingState.error,
    elapsedTime: loadingState.elapsedTime,
  };
};

// Hook for managing multiple loading states
export const useMultipleLoadingStates = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});

  const createLoadingState = useCallback((key: string, options: LoadingOptions = {}) => {
    const loadingHook = useLoadingState(options);
    
    setLoadingStates(prev => ({
      ...prev,
      [key]: loadingHook.loadingState,
    }));

    return loadingHook;
  }, []);

  const getLoadingState = useCallback((key: string) => {
    return loadingStates[key];
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state.isLoading);
  }, [loadingStates]);

  const getOverallProgress = useCallback(() => {
    const states = Object.values(loadingStates);
    if (states.length === 0) return 0;
    
    const totalProgress = states.reduce((sum, state) => sum + state.progress, 0);
    return totalProgress / states.length;
  }, [loadingStates]);

  return {
    loadingStates,
    createLoadingState,
    getLoadingState,
    isAnyLoading,
    getOverallProgress,
  };
};