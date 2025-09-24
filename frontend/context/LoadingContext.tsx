/**
 * Global Loading State Manager
 * Prevents multiple loading indicators from conflicting and causing flashing
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingState {
  [key: string]: {
    isLoading: boolean;
    message?: string;
    priority: number; // Higher priority takes precedence
    timestamp: number;
  };
}

interface LoadingContextType {
  isGlobalLoading: boolean;
  getCurrentLoadingMessage: () => string | undefined;
  setLoading: (key: string, isLoading: boolean, message?: string, priority?: number) => void;
  clearLoading: (key: string) => void;
  clearAllLoading: () => void;
  getLoadingState: (key: string) => boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Debounced state update to prevent rapid flashing
  const updateLoadingStatesDebounced = useCallback((newStates: LoadingState, delay: number = 100) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      setLoadingStates(newStates);
    }, delay);

    setDebounceTimer(timer);
  }, [debounceTimer]);

  const setLoading = useCallback((
    key: string, 
    isLoading: boolean, 
    message?: string, 
    priority: number = 1
  ) => {
    setLoadingStates(prev => {
      const newStates = { ...prev };
      
      if (isLoading) {
        newStates[key] = {
          isLoading: true,
          message,
          priority,
          timestamp: Date.now()
        };
      } else {
        delete newStates[key];
      }
      
      return newStates;
    });
  }, []);

  const clearLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[key];
      return newStates;
    });
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  const getLoadingState = useCallback((key: string) => {
    return loadingStates[key]?.isLoading || false;
  }, [loadingStates]);

  // Check if any loading state is active
  const isGlobalLoading = Object.values(loadingStates).some(state => state.isLoading);

  // Get the message from the highest priority loading state
  const getCurrentLoadingMessage = useCallback(() => {
    const activeStates = Object.values(loadingStates).filter(state => state.isLoading);
    
    if (activeStates.length === 0) return undefined;
    
    // Sort by priority (highest first), then by timestamp (newest first)
    const sortedStates = activeStates.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.timestamp - a.timestamp;
    });
    
    return sortedStates[0].message;
  }, [loadingStates]);

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const value: LoadingContextType = {
    isGlobalLoading,
    getCurrentLoadingMessage,
    setLoading,
    clearLoading,
    clearAllLoading,
    getLoadingState
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useGlobalLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a LoadingProvider');
  }
  return context;
};

// Hook for managing individual loading states with automatic cleanup
export const useLoadingState = (key: string) => {
  const { setLoading, clearLoading, getLoadingState } = useGlobalLoading();

  const startLoading = useCallback((message?: string, priority?: number) => {
    setLoading(key, true, message, priority);
  }, [key, setLoading]);

  const stopLoading = useCallback(() => {
    setLoading(key, false);
  }, [key, setLoading]);

  const isLoading = getLoadingState(key);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearLoading(key);
    };
  }, [key, clearLoading]);

  return {
    isLoading,
    startLoading,
    stopLoading
  };
};
