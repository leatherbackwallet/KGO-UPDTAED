import React, { useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { 
  ErrorMessage, 
  RetryButton, 
  ToastContainer, 
  useToast 
} from '../components/ErrorRecovery';
import { ApiError, ErrorType } from '../services/types';

// Example component that can simulate different types of errors
const ErrorSimulator: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [errorType, setErrorType] = useState<'component' | 'api' | 'network'>('component');
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const toast = useToast();

  // Simulate different types of errors
  const simulateError = (type: 'component' | 'api' | 'network') => {
    setErrorType(type);
    
    switch (type) {
      case 'component':
        setShouldThrow(true);
        break;
        
      case 'api':
        const serverError: ApiError = {
          type: ErrorType.SERVER_ERROR,
          message: 'Internal server error occurred',
          retryable: true,
          timestamp: new Date(),
          context: {
            endpoint: '/api/products',
            statusCode: 500,
          },
        };
        setApiError(serverError);
        break;
        
      case 'network':
        const networkError: ApiError = {
          type: ErrorType.NETWORK_ERROR,
          message: 'Network connection failed',
          retryable: true,
          timestamp: new Date(),
          context: {
            endpoint: '/api/products',
            timeout: 5000,
          },
        };
        setApiError(networkError);
        break;
    }
  };

  // Reset all errors
  const resetErrors = () => {
    setShouldThrow(false);
    setApiError(null);
    setRetryCount(0);
    setIsRetrying(false);
  };

  // Simulate retry operation
  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success after 2 retries
    if (retryCount >= 1) {
      setApiError(null);
      setIsRetrying(false);
      toast.success('Success!', 'Operation completed successfully after retry');
    } else {
      setIsRetrying(false);
      toast.warning('Retry failed', 'Will try again automatically');
    }
  };

  // Simulate refresh page
  const handleRefresh = () => {
    toast.info('Refreshing...', 'Page will reload in a moment');
    setTimeout(() => {
      resetErrors();
      toast.success('Refreshed!', 'Page has been refreshed successfully');
    }, 1000);
  };

  // Component error simulation
  if (shouldThrow) {
    throw new Error('Simulated component error for testing error boundary');
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Error Recovery Components Demo
        </h2>
        
        <div className="space-y-6">
          {/* Error Simulation Controls */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Simulate Different Error Types
            </h3>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => simulateError('component')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Component Error
              </button>
              
              <button
                onClick={() => simulateError('api')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                API Error
              </button>
              
              <button
                onClick={() => simulateError('network')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Network Error
              </button>
              
              <button
                onClick={resetErrors}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* API Error Display */}
          {apiError && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                API Error Recovery
              </h3>
              
              {/* Different error message variants */}
              <div className="space-y-4">
                <ErrorMessage
                  error={apiError}
                  onRetry={handleRetry}
                  onRefresh={handleRefresh}
                  showRetry={true}
                  showRefresh={true}
                  variant="card"
                />
                
                <ErrorMessage
                  error={apiError}
                  onRetry={handleRetry}
                  variant="banner"
                  size="sm"
                />
                
                <ErrorMessage
                  error={apiError}
                  variant="inline"
                  size="sm"
                />
              </div>
              
              {/* Retry Button Examples */}
              <div className="flex flex-wrap gap-3">
                <RetryButton
                  onRetry={handleRetry}
                  isRetrying={isRetrying}
                  retryCount={retryCount}
                  maxRetries={3}
                  variant="primary"
                />
                
                <RetryButton
                  onRetry={handleRetry}
                  isRetrying={isRetrying}
                  retryCount={retryCount}
                  maxRetries={3}
                  variant="outline"
                  size="sm"
                />
                
                <RetryButton
                  onRetry={handleRetry}
                  isRetrying={isRetrying}
                  retryCount={retryCount}
                  maxRetries={3}
                  variant="secondary"
                  size="lg"
                />
              </div>
            </div>
          )}

          {/* Toast Notification Examples */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Toast Notifications
            </h3>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => toast.success('Success!', 'Operation completed successfully')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Success Toast
              </button>
              
              <button
                onClick={() => toast.error('Error!', 'Something went wrong')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Error Toast
              </button>
              
              <button
                onClick={() => toast.warning('Warning!', 'Please check your input')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Warning Toast
              </button>
              
              <button
                onClick={() => toast.info('Info', 'Here is some information')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Info Toast
              </button>
              
              <button
                onClick={() => toast.success('With Action', 'Click undo to reverse', {
                  action: {
                    label: 'Undo',
                    onClick: () => toast.info('Undone!', 'Action was reversed'),
                  },
                  duration: 10000,
                })}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Toast with Action
              </button>
              
              <button
                onClick={() => toast.clearAll()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear All Toasts
              </button>
            </div>
          </div>

          {/* Status Display */}
          {!apiError && !shouldThrow && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-800">
                  All systems operational. Try simulating different error types above.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        notifications={toast.notifications}
        onDismiss={toast.removeNotification}
        position="top-right"
      />
    </div>
  );
};

// Main example component wrapped with error boundary
const ErrorRecoveryExample: React.FC = () => {
  return (
    <ErrorBoundary
      showDetails={true}
      onError={(error, errorInfo) => {
        console.log('Error caught by boundary:', error, errorInfo);
      }}
    >
      <div className="min-h-screen bg-gray-50 py-8">
        <ErrorSimulator />
      </div>
    </ErrorBoundary>
  );
};

export default ErrorRecoveryExample;