import React from 'react';
import { useConnectionMonitor } from '../hooks/useConnectionMonitor';

interface ConnectionIndicatorProps {
  className?: string;
  showOnlineStatus?: boolean;
  autoHide?: boolean;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  className = '',
  showOnlineStatus = false,
  autoHide = true
}) => {
  const { indicator, isOnline, networkSpeed } = useConnectionMonitor();

  // Don't show anything if online and autoHide is enabled
  if (autoHide && isOnline && !indicator) {
    return null;
  }

  // Show online status if requested
  if (showOnlineStatus && isOnline && !indicator) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 text-sm ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Online ({networkSpeed} connection)</span>
      </div>
    );
  }

  if (!indicator) return null;

  const getIndicatorStyles = () => {
    switch (indicator.type) {
      case 'online':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'offline':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'slow':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'reconnecting':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (indicator.type) {
      case 'online':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'offline':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
        );
      case 'slow':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'reconnecting':
        return (
          <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-md border ${getIndicatorStyles()} ${className}`}>
      {getIcon()}
      <span className="text-sm font-medium">{indicator.message}</span>
      
      {indicator.showProgress && indicator.estimatedTime && (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-current h-1.5 rounded-full transition-all duration-300"
              style={{ width: '60%' }}
            ></div>
          </div>
          <span className="text-xs opacity-75">
            ~{Math.round(indicator.estimatedTime / 1000)}s
          </span>
        </div>
      )}
    </div>
  );
};

export default ConnectionIndicator;