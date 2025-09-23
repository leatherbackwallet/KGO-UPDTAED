import React, { useState, useEffect } from 'react';
import { ApiError, ErrorType } from '../services/types';
import { InlineLoader } from './LoadingStates';

// Error message component with recovery actions
export const ErrorMessage: React.FC<{
  error: ApiError | Error;
  onRetry?: () => void;
  onRefresh?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  showRefresh?: boolean;
  showDismiss?: boolean;
  retryLabel?: string;
  refreshLabel?: string;
  dismissLabel?: string;
  className?: string;
  variant?: 'banner' | 'card' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}> = ({
  error,
  onRetry,
  onRefresh,
  onDismiss,
  showRetry = true,
  showRefresh = false,
  showDismiss = false,
  retryLabel = 'Try Again',
  refreshLabel = 'Refresh Page',
  dismissLabel = 'Dismiss',
  className = '',
  variant = 'card',
  size = 'md',
}) => {
  const isApiError = (err: any): err is ApiError => {
    return err && typeof err === 'object' && 'type' in err;
  };

  const getErrorIcon = () => {
    if (isApiError(error)) {
      switch (error.type) {
        case ErrorType.NETWORK_ERROR:
          return (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          );
        case ErrorType.TIMEOUT_ERROR:
          return (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case ErrorType.SERVER_ERROR:
          return (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          );
        default:
          return (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          );
      }
    }

    return (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    );
  };

  const getErrorTitle = () => {
    if (isApiError(error)) {
      switch (error.type) {
        case ErrorType.NETWORK_ERROR:
          return 'Connection Problem';
        case ErrorType.TIMEOUT_ERROR:
          return 'Request Timeout';
        case ErrorType.SERVER_ERROR:
          return 'Server Error';
        case ErrorType.PARSE_ERROR:
          return 'Data Error';
        case ErrorType.CACHE_ERROR:
          return 'Cache Error';
        case ErrorType.IMAGE_LOAD_ERROR:
          return 'Image Load Error';
        default:
          return 'Error';
      }
    }
    return 'Error';
  };

  const getErrorMessage = () => {
    if (isApiError(error)) {
      switch (error.type) {
        case ErrorType.NETWORK_ERROR:
          return 'Unable to connect to the server. Please check your internet connection and try again.';
        case ErrorType.TIMEOUT_ERROR:
          return 'The request is taking longer than expected. Please try again.';
        case ErrorType.SERVER_ERROR:
          return 'The server encountered an error. Please try again in a moment.';
        case ErrorType.PARSE_ERROR:
          return 'There was a problem processing the data. Please try again.';
        case ErrorType.CACHE_ERROR:
          return 'There was a problem with cached data. Please refresh the page.';
        case ErrorType.IMAGE_LOAD_ERROR:
          return 'Unable to load images. Please check your connection and try again.';
        default:
          return error.message || 'An unexpected error occurred.';
      }
    }
    return error.message || 'An unexpected error occurred.';
  };

  const getSuggestions = () => {
    if (isApiError(error)) {
      switch (error.type) {
        case ErrorType.NETWORK_ERROR:
          return [
            'Check your internet connection',
            'Try refreshing the page',
            'Wait a moment and try again',
          ];
        case ErrorType.TIMEOUT_ERROR:
          return [
            'Check your internet speed',
            'Try again with a better connection',
            'Wait a moment and retry',
          ];
        case ErrorType.SERVER_ERROR:
          return [
            'Wait a few minutes and try again',
            'Refresh the page',
            'Contact support if the problem persists',
          ];
        default:
          return ['Try refreshing the page', 'Contact support if the problem continues'];
      }
    }
    return ['Try refreshing the page'];
  };

  const baseClasses = {
    banner: 'border-l-4 p-4',
    card: 'rounded-lg border p-6 shadow-sm',
    inline: 'p-3 rounded',
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const colorClasses = isApiError(error) && error.type === ErrorType.NETWORK_ERROR
    ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
    : 'bg-red-50 border-red-400 text-red-800';

  return (
    <div className={`${baseClasses[variant]} ${colorClasses} ${sizeClasses[size]} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="font-medium mb-1">
            {getErrorTitle()}
          </h3>
          
          <p className="mb-3">
            {getErrorMessage()}
          </p>

          {variant !== 'inline' && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">What you can try:</p>
              <ul className="text-sm space-y-1">
                {getSuggestions().map((suggestion, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1 h-1 bg-current rounded-full mr-2"></span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {showRetry && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                {retryLabel}
              </button>
            )}
            
            {showRefresh && onRefresh && (
              <button
                onClick={onRefresh}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                {refreshLabel}
              </button>
            )}
            
            {showDismiss && onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                {dismissLabel}
              </button>
            )}
          </div>
        </div>

        {showDismiss && onDismiss && variant === 'banner' && (
          <div className="flex-shrink-0 ml-4">
            <button
              onClick={onDismiss}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Retry button with visual feedback
export const RetryButton: React.FC<{
  onRetry: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}> = ({
  onRetry,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  disabled = false,
  label = 'Try Again',
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-transparent',
    outline: 'bg-transparent hover:bg-red-50 text-red-600 border-red-600',
  };

  const isDisabled = disabled || isRetrying || retryCount >= maxRetries;

  return (
    <button
      onClick={onRetry}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md transform hover:-translate-y-0.5'}
        ${className}
      `}
    >
      {isRetrying && (
        <InlineLoader size="sm" color={variant === 'outline' ? 'blue' : 'white'} className="mr-2" />
      )}
      
      {isRetrying ? 'Retrying...' : label}
      
      {retryCount > 0 && maxRetries > 1 && (
        <span className="ml-2 text-xs opacity-75">
          ({retryCount}/{maxRetries})
        </span>
      )}
    </button>
  );
};

// Toast notification system
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

export const Toast: React.FC<{
  notification: ToastNotification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
      notification.onDismiss?.();
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      className={`
        max-w-sm w-full bg-white shadow-lg rounded-lg border pointer-events-auto transition-all duration-300 transform
        ${getBgColor()}
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {notification.title}
            </p>
            {notification.message && (
              <p className="mt-1 text-sm text-gray-500">
                {notification.message}
              </p>
            )}
            
            {notification.action && (
              <div className="mt-3">
                <button
                  onClick={notification.action.onClick}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {notification.action.label}
                </button>
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast container
export const ToastContainer: React.FC<{
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}> = ({
  notifications,
  onDismiss,
  position = 'top-right',
  className = '',
}) => {
  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
  };

  if (notifications.length === 0) return null;

  return (
    <div
      className={`
        fixed z-50 p-6 space-y-4 pointer-events-none
        ${positionClasses[position]}
        ${className}
      `}
    >
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

// Hook for managing toast notifications
export const useToast = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (notification: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: ToastNotification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Convenience methods
  const success = (title: string, message?: string, options?: Partial<ToastNotification>) => {
    return addNotification({ ...options, type: 'success', title, message });
  };

  const error = (title: string, message?: string, options?: Partial<ToastNotification>) => {
    return addNotification({ ...options, type: 'error', title, message });
  };

  const warning = (title: string, message?: string, options?: Partial<ToastNotification>) => {
    return addNotification({ ...options, type: 'warning', title, message });
  };

  const info = (title: string, message?: string, options?: Partial<ToastNotification>) => {
    return addNotification({ ...options, type: 'info', title, message });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  };
};