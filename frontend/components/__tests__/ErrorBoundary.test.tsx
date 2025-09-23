import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from '../ErrorBoundary';

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; message?: string }> = ({ 
  shouldThrow = false, 
  message = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders error UI when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
    });

    it('calls onError callback when error occurs', () => {
      const onError = jest.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} message="Custom error" />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Custom error' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it('renders custom fallback when provided', () => {
      const customFallback = <div>Custom error UI</div>;
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Error recovery', () => {
    it('resets error state when Try Again is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const tryAgainButtons = screen.getAllByText('Try Again');
      fireEvent.click(tryAgainButtons[0]);

      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('refreshes page when Refresh Page is clicked', () => {
      // Mock window.location.reload
      const mockReload = jest.fn();
      delete (window as any).location;
      (window as any).location = { reload: mockReload };

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const refreshButton = screen.getByText('Refresh Page');
      fireEvent.click(refreshButton);

      expect(mockReload).toHaveBeenCalled();
    });

    it('copies error details when Report Error is clicked', async () => {
      // Mock clipboard API
      const mockWriteText = jest.fn();
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      });

      // Mock alert
      window.alert = jest.fn();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Test error for reporting" />
        </ErrorBoundary>
      );

      const reportButton = screen.getByText('Report Error');
      fireEvent.click(reportButton);

      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('Test error for reporting')
      );
      expect(window.alert).toHaveBeenCalledWith(
        'Error details copied to clipboard. Please share this with our support team.'
      );
    });
  });

  describe('Technical details', () => {
    it('shows technical details when showDetails is true', () => {
      render(
        <ErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} message="Detailed error" />
        </ErrorBoundary>
      );

      const detailsElement = screen.getByText('Technical Details');
      expect(detailsElement).toBeInTheDocument();

      // Click to expand details
      fireEvent.click(detailsElement);

      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getAllByText('Detailed error')[0]).toBeInTheDocument();
    });

    it('hides technical details by default', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Technical Details')).not.toBeInTheDocument();
    });
  });

  describe('Reset behavior', () => {
    it('resets on props change when resetOnPropsChange is true', () => {
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange={true} resetKeys={['key1']}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Change resetKeys to trigger reset
      rerender(
        <ErrorBoundary resetOnPropsChange={true} resetKeys={['key2']}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('does not reset on props change when resetOnPropsChange is false', () => {
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange={false} resetKeys={['key1']}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Change resetKeys but should not reset
      rerender(
        <ErrorBoundary resetOnPropsChange={false} resetKeys={['key2']}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const TestComponent = () => <div>Test component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Test component')).toBeInTheDocument();
  });

  it('catches errors in wrapped component', () => {
    const ErrorComponent = () => {
      throw new Error('HOC test error');
    };
    const WrappedComponent = withErrorBoundary(ErrorComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('passes through props to wrapped component', () => {
    const TestComponent: React.FC<{ message: string }> = ({ message }) => (
      <div>{message}</div>
    );
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent message="Hello from HOC" />);

    expect(screen.getByText('Hello from HOC')).toBeInTheDocument();
  });

  it('applies error boundary props', () => {
    const onError = jest.fn();
    const TestComponent = () => {
      throw new Error('HOC error with callback');
    };
    const WrappedComponent = withErrorBoundary(TestComponent, { onError });

    render(<WrappedComponent />);

    expect(onError).toHaveBeenCalled();
  });
});

describe('useErrorHandler Hook', () => {
  const TestComponent: React.FC<{ shouldError?: boolean }> = ({ shouldError = false }) => {
    const { captureError, resetError } = useErrorHandler();

    const handleError = () => {
      captureError(new Error('Hook test error'));
    };

    if (shouldError) {
      handleError();
    }

    return (
      <div>
        <button onClick={handleError}>Trigger Error</button>
        <button onClick={resetError}>Reset Error</button>
        <div>Hook component</div>
      </div>
    );
  };

  it('captures and throws errors to error boundary', () => {
    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Hook component')).toBeInTheDocument();

    const triggerButton = screen.getByText('Trigger Error');
    fireEvent.click(triggerButton);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('resets error state', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <TestComponent shouldError={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Reset the error boundary first
    const tryAgainButtons = screen.getAllByText('Try Again');
    fireEvent.click(tryAgainButtons[0]);

    // Re-render without error
    rerender(
      <ErrorBoundary>
        <TestComponent shouldError={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Hook component')).toBeInTheDocument();
  });
});

describe('Error logging', () => {
  it('logs errors to console', () => {
    const consoleSpy = jest.spyOn(console, 'log');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} message="Logged error" />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error report:',
      expect.objectContaining({
        message: 'Logged error',
        timestamp: expect.any(String),
        userAgent: expect.any(String),
        url: expect.any(String),
      })
    );

    consoleSpy.mockRestore();
  });
});

describe('Accessibility', () => {
  it('error UI is accessible', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check for proper heading structure
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();

    // Check for focusable buttons
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
    });
  });

  it('technical details are properly structured', () => {
    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const detailsElement = screen.getByText('Technical Details');
    expect(detailsElement.closest('details')).toBeInTheDocument();
  });
});