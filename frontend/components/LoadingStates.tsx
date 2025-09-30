import React, { useState, useEffect } from 'react';

// Enhanced Product Skeleton with more realistic layout
export const EnhancedProductSkeleton: React.FC<{ 
  showPrice?: boolean;
  showDescription?: boolean;
  className?: string;
}> = ({ 
  showPrice = true, 
  showDescription = true,
  className = ""
}) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {/* Image skeleton with shimmer effect */}
      <div className="relative w-full h-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        {/* Category badge */}
        <div className="w-20 h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded-full"></div>
        
        {/* Product title */}
        <div className="space-y-2">
          <div className="w-4/5 h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded"></div>
          <div className="w-3/5 h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded"></div>
        </div>
        
        {/* Description */}
        {showDescription && (
          <div className="space-y-2">
            <div className="w-full h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded"></div>
            <div className="w-4/5 h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded"></div>
          </div>
        )}
        
        {/* Price and rating */}
        <div className="flex items-center justify-between pt-2">
          {showPrice && (
            <div className="w-24 h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded"></div>
          )}
          <div className="w-20 h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded"></div>
        </div>
        
        {/* Action button */}
        <div className="w-full h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded-lg mt-4"></div>
      </div>
    </div>
  );
};

// Grid of enhanced skeletons
export const EnhancedProductSkeletonGrid: React.FC<{ 
  count?: number;
  columns?: 'auto' | 1 | 2 | 3 | 4;
  className?: string;
}> = ({ 
  count = 8, 
  columns = 'auto',
  className = ""
}) => {
  const gridClass = columns === 'auto' 
    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
    : `grid-cols-${columns}`;

  return (
    <div className={`grid ${gridClass} gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          className="animate-pulse"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <EnhancedProductSkeleton />
        </div>
      ))}
    </div>
  );
};

// Progress indicator with estimated completion time
export const ProgressIndicator: React.FC<{
  progress: number; // 0-100
  estimatedTime?: number; // in seconds
  message?: string;
  showPercentage?: boolean;
  variant?: 'linear' | 'circular';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({
  progress,
  estimatedTime,
  message = "Loading...",
  showPercentage = true,
  variant = 'linear',
  size = 'md',
  className = ""
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(estimatedTime || null);

  useEffect(() => {
    if (!estimatedTime || progress >= 100) return;

    const remaining = Math.max(0, estimatedTime * (100 - progress) / 100);
    setTimeRemaining(remaining);

    const interval = setInterval(() => {
      setTimeRemaining(prev => prev ? Math.max(0, prev - 0.1) : null);
    }, 100);

    return () => clearInterval(interval);
  }, [progress, estimatedTime]);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const circularSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  if (variant === 'circular') {
    const circumference = 2 * Math.PI * 16; // radius = 16
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className={`flex flex-col items-center space-y-2 ${className}`}>
        <div className={`relative ${circularSizeClasses[size]}`}>
          <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-200"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-blue-600 transition-all duration-300 ease-out"
            />
          </svg>
          {showPercentage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700">
                {Math.round(Math.min(100, Math.max(0, progress)))}%
              </span>
            </div>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">{message}</p>
          {timeRemaining !== null && timeRemaining > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              ~{Math.ceil(timeRemaining)}s remaining
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">{message}</span>
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">
            {Math.round(Math.min(100, Math.max(0, progress)))}%
          </span>
        )}
      </div>
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      
      {timeRemaining !== null && timeRemaining > 0 && (
        <p className="text-xs text-gray-500 text-center">
          Estimated time remaining: {Math.ceil(timeRemaining)} seconds
        </p>
      )}
    </div>
  );
};

// Loading state with smooth transitions
export const LoadingStateTransition: React.FC<{
  isLoading: boolean;
  loadingComponent: React.ReactNode;
  children: React.ReactNode;
  transitionDuration?: number; // in ms
  className?: string;
}> = ({
  isLoading,
  loadingComponent,
  children,
  transitionDuration = 300,
  className = ""
}) => {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [showContent, setShowContent] = useState(!isLoading);

  useEffect(() => {
    if (isLoading) {
      setShowContent(false);
      setTimeout(() => setShowLoading(true), 50);
    } else {
      setShowLoading(false);
      setTimeout(() => setShowContent(true), transitionDuration);
    }
  }, [isLoading, transitionDuration]);

  return (
    <div className={`relative ${className}`}>
      {/* Loading state */}
      <div
        className={`transition-opacity duration-${transitionDuration} ${
          showLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {loadingComponent}
      </div>
      
      {/* Content state */}
      <div
        className={`transition-opacity duration-${transitionDuration} ${
          showContent ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

// Comprehensive loading overlay
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  message?: string;
  progress?: number;
  estimatedTime?: number;
  onCancel?: () => void;
  variant?: 'spinner' | 'progress' | 'skeleton';
  backdrop?: boolean;
  className?: string;
}> = ({
  isVisible,
  message = "Loading...",
  progress,
  estimatedTime,
  onCancel,
  variant = 'spinner',
  backdrop = true,
  className = ""
}) => {
  if (!isVisible) return null;

  const renderLoadingContent = () => {
    switch (variant) {
      case 'progress':
        return (
          <ProgressIndicator
            progress={progress || 0}
            estimatedTime={estimatedTime}
            message={message}
            variant="circular"
            size="lg"
          />
        );
      
      case 'skeleton':
        return (
          <div className="w-full max-w-md">
            <EnhancedProductSkeleton />
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">{message}</p>
            {estimatedTime && (
              <p className="text-sm text-gray-500">
                Estimated time: {Math.ceil(estimatedTime)} seconds
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        backdrop ? 'bg-black bg-opacity-50' : ''
      } ${className}`}
    >
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full">
        {renderLoadingContent()}
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

// Inline loading state for buttons and small components
export const InlineLoader: React.FC<{
  size?: 'xs' | 'sm' | 'md';
  color?: 'blue' | 'gray' | 'white';
  className?: string;
}> = ({ 
  size = 'sm', 
  color = 'blue',
  className = "" 
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    white: 'border-white'
  };

  return (
    <div
      className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  );
};