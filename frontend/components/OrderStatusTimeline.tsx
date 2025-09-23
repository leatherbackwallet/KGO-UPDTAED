/**
 * Order Status Timeline Component
 * Displays the complete order fulfillment timeline with visual indicators
 */

import React from 'react';

interface StatusHistory {
  status: string;
  timestamp: Date;
  notes?: string;
  updatedBy?: string;
}

interface OrderStatusTimelineProps {
  currentStatus: string;
  statusHistory: StatusHistory[];
  className?: string;
}

const STATUS_CONFIG = {
  payment_done: {
    label: 'Payment Done',
    icon: '💳',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  order_received: {
    label: 'Order Received',
    icon: '📋',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  collecting_items: {
    label: 'Collecting Items',
    icon: '🛍️',
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  packing: {
    label: 'Packing',
    icon: '📦',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  en_route: {
    label: 'En Route',
    icon: '🚚',
    color: 'bg-indigo-500',
    textColor: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  delivered: {
    label: 'Product Delivered',
    icon: '✅',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  cancelled: {
    label: 'Cancelled',
    icon: '❌',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
};

const STATUS_ORDER = [
  'payment_done',
  'order_received', 
  'collecting_items',
  'packing',
  'en_route',
  'delivered'
];

export default function OrderStatusTimeline({ currentStatus, statusHistory, className = '' }: OrderStatusTimelineProps) {
  const getStatusIndex = (status: string) => {
    return STATUS_ORDER.indexOf(status);
  };

  const currentIndex = getStatusIndex(currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusHistoryEntry = (status: string) => {
    return statusHistory.find(entry => entry.status === status);
  };

  return (
    <div className={`${className}`}>
      <h4 className="font-medium text-gray-900 mb-4">📊 Order Status Timeline</h4>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-4">
          {STATUS_ORDER.map((status, index) => {
            const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
            const isCompleted = index <= currentIndex;
            const isCurrent = status === currentStatus;
            const historyEntry = getStatusHistoryEntry(status);
            
            return (
              <div key={status} className="relative flex items-start">
                {/* Status indicator */}
                <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white text-lg ${
                  isCompleted ? config.color : 'bg-gray-300'
                } ${isCurrent ? 'ring-4 ring-blue-200' : ''}`}>
                  {config.icon}
                </div>
                
                {/* Status content */}
                <div className={`ml-4 flex-1 p-3 rounded-lg border ${
                  isCompleted ? `${config.bgColor} ${config.borderColor}` : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className={`font-medium ${isCompleted ? config.textColor : 'text-gray-500'}`}>
                        {config.label}
                      </h5>
                      {historyEntry && (
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(historyEntry.timestamp)}
                        </p>
                      )}
                      {historyEntry?.notes && (
                        <p className="text-sm text-gray-600 mt-1 italic">
                          📝 {historyEntry.notes}
                        </p>
                      )}
                    </div>
                    {isCurrent && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        Current
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Cancelled status (if applicable) */}
          {isCancelled && (
            <div className="relative flex items-start">
              <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white text-lg bg-red-500 ring-4 ring-red-200">
                ❌
              </div>
              <div className="ml-4 flex-1 p-3 rounded-lg border bg-red-50 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-red-700">Cancelled</h5>
                    {getStatusHistoryEntry('cancelled') && (
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(getStatusHistoryEntry('cancelled')!.timestamp)}
                      </p>
                    )}
                    {getStatusHistoryEntry('cancelled')?.notes && (
                      <p className="text-sm text-gray-600 mt-1 italic">
                        📝 {getStatusHistoryEntry('cancelled')!.notes}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Cancelled
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Status summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-2">📈 Status Summary</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Current Status:</span>
            <span className="ml-2 font-medium text-gray-900">
              {STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG]?.label || 'Unknown'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Progress:</span>
            <span className="ml-2 font-medium text-gray-900">
              {isCancelled ? 'Cancelled' : `${Math.round(((currentIndex + 1) / STATUS_ORDER.length) * 100)}% Complete`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 