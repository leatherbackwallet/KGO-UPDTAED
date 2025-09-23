/**
 * Admin Order Status Manager Component
 * Allows admins to update order status and add notes to the timeline
 */

import React, { useState } from 'react';
import api from '../utils/api';

interface StatusHistory {
  status: string;
  timestamp: Date;
  notes?: string;
  updatedBy?: string;
}

interface AdminOrderStatusManagerProps {
  orderId: string;
  currentStatus: string;
  statusHistory: StatusHistory[];
  onStatusUpdate: (updatedOrder: any) => void;
  className?: string;
}

const STATUS_OPTIONS = [
  { value: 'payment_done', label: 'Payment Done', icon: '💳' },
  { value: 'order_received', label: 'Order Received', icon: '📋' },
  { value: 'collecting_items', label: 'Collecting Items', icon: '🛍️' },
  { value: 'packing', label: 'Packing', icon: '📦' },
  { value: 'en_route', label: 'En Route', icon: '🚚' },
  { value: 'delivered', label: 'Product Delivered', icon: '✅' },
  { value: 'cancelled', label: 'Cancelled', icon: '❌' }
];

export default function AdminOrderStatusManager({ 
  orderId, 
  currentStatus, 
  statusHistory, 
  onStatusUpdate,
  className = '' 
}: AdminOrderStatusManagerProps) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/orders/${orderId}/status`, {
        status: newStatus,
        notes: notes.trim() || undefined
      });

      if (response.data.success) {
        setSuccess('Order status updated successfully!');
        setNotes('');
        onStatusUpdate(response.data.data.order);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`${className}`}>
      <h4 className="font-medium text-gray-900 mb-4">🔧 Admin Status Management</h4>
      
      {/* Status Update Form */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Order Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this status change..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || newStatus === currentStatus}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Status'}
          </button>
        </form>
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}
      </div>

      {/* Status History */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-3">📋 Status History</h5>
        <div className="space-y-2">
          {statusHistory.length > 0 ? (
            statusHistory
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((entry, index) => (
                <div key={index} className="flex items-start space-x-3 p-2 bg-white rounded border">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">
                        {STATUS_OPTIONS.find(opt => opt.value === entry.status)?.icon || '📊'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {STATUS_OPTIONS.find(opt => opt.value === entry.status)?.label || entry.status}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(entry.timestamp)}
                      </p>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-gray-600 mt-1 italic">
                        📝 {entry.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
          ) : (
            <p className="text-gray-500 text-sm">No status history available</p>
          )}
        </div>
      </div>
    </div>
  );
} 