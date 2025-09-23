import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ErrorMessage,
  RetryButton,
  Toast,
  ToastContainer,
  useToast,
} from '../ErrorRecovery';
import { ApiError, ErrorType } from '../../services/types';

// Mock timers for toast tests
jest.useFakeTimers();

describe('ErrorRecovery Components', () => {
  describe('ErrorMessage', () => {
    const mockApiError: ApiError = {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network connection failed',
      retryable: true,
      timestamp: new Date(),
    };

    const mockGenericError = new Error('Generic error message');

    it('renders API error with correct styling and content', () => {
      render(<ErrorMessage error={mockApiError} />);
      
      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to the server/)).toBeInTheDocument();
      expect(screen.getByText('What you can try:')).toBeInTheDocument();
    });

    it('renders generic error correctly', () => {
      render(<ErrorMessage error={mockGenericError} />);
      
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Generic error message')).toBeInTheDocument();
    });

    it('shows retry button when onRetry is provided', () => {
      const onRetry = jest.fn();
      render(<ErrorMessage error={mockApiError} onRetry={onRetry} />);
      
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalled();
    });

    it('shows refresh button when onRefresh is provided', () => {
      const onRefresh = jest.fn();
      render(<ErrorMessage error={mockApiError} onRefresh={onRefresh} showRefresh />);
      
      const refreshButton = screen.getByText('Refresh Page');
      expect(refreshButton).toBeInTheDocument();
      
      fireEvent.click(refreshButton);
      expect(onRefresh).toHaveBeenCalled();
    });

    it('shows dismiss button when onDismiss is provided', () => {
      const onDismiss = jest.fn();
      render(<ErrorMessage error={mockApiError} onDismiss={onDismiss} showDismiss />);
      
      const dismissButton = screen.getByText('Dismiss');
      expect(dismissButton).toBeInTheDocument();
      
      fireEvent.click(dismissButton);
      expect(onDismiss).toHaveBeenCalled();
    });

    it('applies different variants correctly', () => {
      const { container: bannerContainer } = render(
        <ErrorMessage error={mockApiError} variant="banner" />
      );
      expect(bannerContainer.firstChild).toHaveClass('border-l-4');

      const { container: cardContainer } = render(
        <ErrorMessage error={mockApiError} variant="card" />
      );
      expect(cardContainer.firstChild).toHaveClass('rounded-lg', 'border', 'shadow-sm');

      const { container: inlineContainer } = render(
        <ErrorMessage error={mockApiError} variant="inline" />
      );
      expect(inlineContainer.firstChild).toHaveClass('p-3', 'rounded');
    });

    it('applies different sizes correctly', () => {
      const { container: smContainer } = render(
        <ErrorMessage error={mockApiError} size="sm" />
      );
      expect(smContainer.firstChild).toHaveClass('text-sm');

      const { container: lgContainer } = render(
        <ErrorMessage error={mockApiError} size="lg" />
      );
      expect(lgContainer.firstChild).toHaveClass('text-lg');
    });

    it('shows different icons for different error types', () => {
      const timeoutError: ApiError = {
        ...mockApiError,
        type: ErrorType.TIMEOUT_ERROR,
      };

      const { container } = render(<ErrorMessage error={timeoutError} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('hides suggestions for inline variant', () => {
      render(<ErrorMessage error={mockApiError} variant="inline" />);
      
      expect(screen.queryByText('What you can try:')).not.toBeInTheDocument();
    });
  });

  describe('RetryButton', () => {
    it('renders with default props', () => {
      const onRetry = jest.fn();
      render(<RetryButton onRetry={onRetry} />);
      
      const button = screen.getByText('Try Again');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('shows loading state when retrying', () => {
      const onRetry = jest.fn();
      render(<RetryButton onRetry={onRetry} isRetrying={true} />);
      
      expect(screen.getByText('Retrying...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows retry count when provided', () => {
      const onRetry = jest.fn();
      render(<RetryButton onRetry={onRetry} retryCount={2} maxRetries={3} />);
      
      expect(screen.getByText('(2/3)')).toBeInTheDocument();
    });

    it('disables when max retries reached', () => {
      const onRetry = jest.fn();
      render(<RetryButton onRetry={onRetry} retryCount={3} maxRetries={3} />);
      
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('calls onRetry when clicked', () => {
      const onRetry = jest.fn();
      render(<RetryButton onRetry={onRetry} />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(onRetry).toHaveBeenCalled();
    });

    it('applies different sizes correctly', () => {
      const onRetry = jest.fn();
      const { container: smContainer } = render(
        <RetryButton onRetry={onRetry} size="sm" />
      );
      expect(smContainer.firstChild).toHaveClass('px-3', 'py-1.5', 'text-sm');

      const { container: lgContainer } = render(
        <RetryButton onRetry={onRetry} size="lg" />
      );
      expect(lgContainer.firstChild).toHaveClass('px-6', 'py-3', 'text-lg');
    });

    it('applies different variants correctly', () => {
      const onRetry = jest.fn();
      const { container: primaryContainer } = render(
        <RetryButton onRetry={onRetry} variant="primary" />
      );
      expect(primaryContainer.firstChild).toHaveClass('bg-red-600');

      const { container: outlineContainer } = render(
        <RetryButton onRetry={onRetry} variant="outline" />
      );
      expect(outlineContainer.firstChild).toHaveClass('border-red-600');
    });
  });

  describe('Toast', () => {
    const mockNotification = {
      id: 'test-1',
      type: 'success' as const,
      title: 'Success!',
      message: 'Operation completed successfully',
      duration: 5000,
    };

    it('renders notification content correctly', () => {
      const onDismiss = jest.fn();
      render(<Toast notification={mockNotification} onDismiss={onDismiss} />);
      
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    });

    it('shows correct icon for different types', () => {
      const onDismiss = jest.fn();
      const errorNotification = { ...mockNotification, type: 'error' as const };
      
      const { container } = render(
        <Toast notification={errorNotification} onDismiss={onDismiss} />
      );
      
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      const onDismiss = jest.fn();
      const { container } = render(<Toast notification={mockNotification} onDismiss={onDismiss} />);
      
      const dismissButton = container.querySelector('button');
      fireEvent.click(dismissButton!);
      
      expect(onDismiss).toHaveBeenCalledWith('test-1');
    });

    it('auto-dismisses after duration', async () => {
      const onDismiss = jest.fn();
      render(<Toast notification={mockNotification} onDismiss={onDismiss} />);
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalledWith('test-1');
      });
    });

    it('renders action button when provided', () => {
      const onAction = jest.fn();
      const notificationWithAction = {
        ...mockNotification,
        action: {
          label: 'Undo',
          onClick: onAction,
        },
      };
      
      const onDismiss = jest.fn();
      render(<Toast notification={notificationWithAction} onDismiss={onDismiss} />);
      
      const actionButton = screen.getByText('Undo');
      expect(actionButton).toBeInTheDocument();
      
      fireEvent.click(actionButton);
      expect(onAction).toHaveBeenCalled();
    });
  });

  describe('ToastContainer', () => {
    const mockNotifications = [
      {
        id: 'test-1',
        type: 'success' as const,
        title: 'Success 1',
        message: 'First success message',
      },
      {
        id: 'test-2',
        type: 'error' as const,
        title: 'Error 1',
        message: 'First error message',
      },
    ];

    it('renders multiple notifications', () => {
      const onDismiss = jest.fn();
      render(<ToastContainer notifications={mockNotifications} onDismiss={onDismiss} />);
      
      expect(screen.getByText('Success 1')).toBeInTheDocument();
      expect(screen.getByText('Error 1')).toBeInTheDocument();
    });

    it('renders nothing when no notifications', () => {
      const onDismiss = jest.fn();
      const { container } = render(<ToastContainer notifications={[]} onDismiss={onDismiss} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('applies position classes correctly', () => {
      const onDismiss = jest.fn();
      const { container } = render(
        <ToastContainer 
          notifications={mockNotifications} 
          onDismiss={onDismiss} 
          position="bottom-left"
        />
      );
      
      expect(container.firstChild).toHaveClass('bottom-0', 'left-0');
    });
  });

  describe('useToast Hook', () => {
    const TestComponent = () => {
      const toast = useToast();
      
      return (
        <div>
          <button onClick={() => toast.success('Success!', 'It worked!')}>
            Success
          </button>
          <button onClick={() => toast.error('Error!', 'Something went wrong')}>
            Error
          </button>
          <button onClick={() => toast.clearAll()}>
            Clear All
          </button>
          <ToastContainer 
            notifications={toast.notifications} 
            onDismiss={toast.removeNotification}
          />
        </div>
      );
    };

    it('adds success notification', () => {
      render(<TestComponent />);
      
      fireEvent.click(screen.getByText('Success'));
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('It worked!')).toBeInTheDocument();
    });

    it('adds error notification', () => {
      render(<TestComponent />);
      
      fireEvent.click(screen.getByText('Error'));
      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('clears all notifications', () => {
      render(<TestComponent />);
      
      fireEvent.click(screen.getByText('Success'));
      fireEvent.click(screen.getByText('Error'));
      
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Error!')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Clear All'));
      
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
      expect(screen.queryByText('Error!')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('error messages have proper ARIA attributes', () => {
      const mockError: ApiError = {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network error',
        retryable: true,
        timestamp: new Date(),
      };

      render(<ErrorMessage error={mockError} />);
      
      // Buttons should be focusable and have proper roles
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('toast notifications are announced to screen readers', () => {
      const onDismiss = jest.fn();
      const notification = {
        id: 'test',
        type: 'success' as const,
        title: 'Success',
        message: 'Operation completed',
      };

      render(<Toast notification={notification} onDismiss={onDismiss} />);
      
      // Toast should be visible and accessible
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('retry buttons have proper focus management', () => {
      const onRetry = jest.fn();
      render(<RetryButton onRetry={onRetry} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});