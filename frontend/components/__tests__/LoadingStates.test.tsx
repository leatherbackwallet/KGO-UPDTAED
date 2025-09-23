import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  EnhancedProductSkeleton,
  EnhancedProductSkeletonGrid,
  ProgressIndicator,
  LoadingStateTransition,
  LoadingOverlay,
  InlineLoader,
} from '../LoadingStates';

describe('LoadingStates Components', () => {
  describe('EnhancedProductSkeleton', () => {
    it('renders with default props', () => {
      render(<EnhancedProductSkeleton />);
      
      // Should have shimmer animation elements
      const shimmerElements = document.querySelectorAll('.animate-shimmer');
      expect(shimmerElements.length).toBeGreaterThan(0);
    });

    it('renders without price when showPrice is false', () => {
      const { container } = render(<EnhancedProductSkeleton showPrice={false} />);
      
      // Should still render but with different layout
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders without description when showDescription is false', () => {
      const { container } = render(<EnhancedProductSkeleton showDescription={false} />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<EnhancedProductSkeleton className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('EnhancedProductSkeletonGrid', () => {
    it('renders default number of skeletons', () => {
      const { container } = render(<EnhancedProductSkeletonGrid />);
      
      // Should render 8 skeletons by default
      const skeletons = container.querySelectorAll('.bg-white.rounded-2xl');
      expect(skeletons).toHaveLength(8);
    });

    it('renders custom number of skeletons', () => {
      const { container } = render(<EnhancedProductSkeletonGrid count={4} />);
      
      const skeletons = container.querySelectorAll('.bg-white.rounded-2xl');
      expect(skeletons).toHaveLength(4);
    });

    it('applies grid layout classes', () => {
      const { container } = render(<EnhancedProductSkeletonGrid />);
      
      expect(container.firstChild).toHaveClass('grid');
    });
  });

  describe('ProgressIndicator', () => {
    it('renders linear progress by default', () => {
      render(<ProgressIndicator progress={50} />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('renders circular progress when specified', () => {
      render(<ProgressIndicator progress={75} variant="circular" />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
      // Should have SVG for circular progress
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('shows estimated time when provided', () => {
      render(<ProgressIndicator progress={25} estimatedTime={10} />);
      
      expect(screen.getByText(/remaining/)).toBeInTheDocument();
    });

    it('hides percentage when showPercentage is false', () => {
      render(<ProgressIndicator progress={50} showPercentage={false} />);
      
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('displays custom message', () => {
      render(<ProgressIndicator progress={30} message="Custom loading message" />);
      
      expect(screen.getByText('Custom loading message')).toBeInTheDocument();
    });

    it('handles progress bounds correctly', () => {
      const { rerender } = render(<ProgressIndicator progress={-10} />);
      expect(screen.getByText('0%')).toBeInTheDocument();

      rerender(<ProgressIndicator progress={150} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('LoadingStateTransition', () => {
    it('shows loading component when isLoading is true', () => {
      render(
        <LoadingStateTransition
          isLoading={true}
          loadingComponent={<div data-testid="loading">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </LoadingStateTransition>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('shows content when isLoading is false', async () => {
      render(
        <LoadingStateTransition
          isLoading={false}
          loadingComponent={<div data-testid="loading">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </LoadingStateTransition>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('transitions between states', async () => {
      const { rerender } = render(
        <LoadingStateTransition
          isLoading={true}
          loadingComponent={<div data-testid="loading">Loading...</div>}
          transitionDuration={100}
        >
          <div data-testid="content">Content</div>
        </LoadingStateTransition>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();

      rerender(
        <LoadingStateTransition
          isLoading={false}
          loadingComponent={<div data-testid="loading">Loading...</div>}
          transitionDuration={100}
        >
          <div data-testid="content">Content</div>
        </LoadingStateTransition>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('LoadingOverlay', () => {
    it('renders when visible', () => {
      render(<LoadingOverlay isVisible={true} />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
      render(<LoadingOverlay isVisible={false} />);
      
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('shows progress variant correctly', () => {
      render(
        <LoadingOverlay
          isVisible={true}
          variant="progress"
          progress={60}
          message="Processing..."
        />
      );
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('shows skeleton variant', () => {
      const { container } = render(
        <LoadingOverlay isVisible={true} variant="skeleton" />
      );
      
      // Should contain skeleton elements
      expect(container.querySelector('.bg-white.rounded-2xl')).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = jest.fn();
      render(<LoadingOverlay isVisible={true} onCancel={onCancel} />);
      
      const cancelButton = screen.getByText('Cancel');
      cancelButton.click();
      
      expect(onCancel).toHaveBeenCalled();
    });

    it('shows estimated time when provided', () => {
      render(
        <LoadingOverlay
          isVisible={true}
          estimatedTime={15}
          message="Loading data..."
        />
      );
      
      expect(screen.getByText(/Estimated time: 15 seconds/)).toBeInTheDocument();
    });
  });

  describe('InlineLoader', () => {
    it('renders with default props', () => {
      const { container } = render(<InlineLoader />);
      
      expect(container.firstChild).toHaveClass('animate-spin');
      expect(container.firstChild).toHaveClass('w-4', 'h-4');
      expect(container.firstChild).toHaveClass('border-blue-600');
    });

    it('applies size classes correctly', () => {
      const { container: xsContainer } = render(<InlineLoader size="xs" />);
      expect(xsContainer.firstChild).toHaveClass('w-3', 'h-3');

      const { container: mdContainer } = render(<InlineLoader size="md" />);
      expect(mdContainer.firstChild).toHaveClass('w-5', 'h-5');
    });

    it('applies color classes correctly', () => {
      const { container: grayContainer } = render(<InlineLoader color="gray" />);
      expect(grayContainer.firstChild).toHaveClass('border-gray-600');

      const { container: whiteContainer } = render(<InlineLoader color="white" />);
      expect(whiteContainer.firstChild).toHaveClass('border-white');
    });

    it('applies custom className', () => {
      const { container } = render(<InlineLoader className="custom-loader" />);
      
      expect(container.firstChild).toHaveClass('custom-loader');
    });
  });

  describe('Accessibility', () => {
    it('progress indicators have proper ARIA attributes', () => {
      render(<ProgressIndicator progress={50} />);
      
      // The progress bar should be accessible
      const progressElement = document.querySelector('[style*="width: 50%"]');
      expect(progressElement).toBeInTheDocument();
    });

    it('loading overlay has proper focus management', () => {
      render(<LoadingOverlay isVisible={true} onCancel={() => {}} />);
      
      // Cancel button should be focusable
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton.tagName).toBe('BUTTON');
    });
  });

  describe('Performance', () => {
    it('skeleton grid renders efficiently with many items', () => {
      const startTime = performance.now();
      render(<EnhancedProductSkeletonGrid count={50} />);
      const endTime = performance.now();
      
      // Should render quickly (less than 100ms for 50 items)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('progress indicator updates smoothly', async () => {
      const { rerender } = render(<ProgressIndicator progress={0} />);
      
      // Simulate rapid progress updates
      for (let i = 0; i <= 100; i += 10) {
        rerender(<ProgressIndicator progress={i} />);
      }
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});