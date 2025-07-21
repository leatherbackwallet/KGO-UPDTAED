/**
 * ReturnsDashboard Component - Admin returns management interface
 * Handles RMA workflows, status updates, and return request processing
 */

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface ReturnItem {
  _id: string;
  returnId: string;
  orderId: {
    _id: string;
    orderId: string;
    totalPrice: number;
    orderStatus: string;
  };
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  orderItems: Array<{
    productId: {
      _id: string;
      name: string;
      images: string[];
    };
    quantity: number;
  }>;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'shipped_by_customer' | 'received_at_hub' | 'completed';
  resolution?: 'refund' | 'replacement';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReturnsData {
  returns: ReturnItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const ReturnsDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'requested', label: 'Requested' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'shipped_by_customer', label: 'Shipped by Customer' },
    { value: 'received_at_hub', label: 'Received at Hub' },
    { value: 'completed', label: 'Completed' }
  ];

  const resolutionOptions = [
    { value: 'refund', label: 'Refund' },
    { value: 'replacement', label: 'Replacement' }
  ];

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (selectedStatus) {
        params.append('status', selectedStatus);
      }

      const response = await api.get(`/returns?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data: ReturnsData = response.data as any;
      
      setReturns(data.returns || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err: any) {
      console.error('Error fetching returns:', err);
      // Don't show error for empty data, just set empty array
      setReturns([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && (user?.roleName === 'admin' || user?.roleName === 'support_agent')) {
      fetchReturns();
    } else {
      setLoading(false);
    }
  }, [token, user, currentPage, selectedStatus]);

  const handleStatusUpdate = async (returnId: string, status: string, resolution?: string, notes?: string) => {
    try {
      setUpdatingStatus(true);
      await api.put(`/returns/${returnId}/status`, {
        status,
        resolution,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReturns();
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update return status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'shipped_by_customer': return 'bg-purple-100 text-purple-800';
      case 'received_at_hub': return 'bg-indigo-100 text-indigo-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!token || (user?.roleName !== 'admin' && user?.roleName !== 'support_agent')) {
    return <div className="text-red-600">Access denied. Admin or Support privileges required.</div>;
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Returns Management</h2>
        <div className="text-gray-600">Loading returns...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Returns Management</h2>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      
      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {returns.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">No returns found</div>
          <div className="text-sm text-gray-400">Returns will appear here when customers request them</div>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((returnItem) => (
            <div key={returnItem._id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">Return #{returnItem.returnId}</h3>
                  <p className="text-sm text-gray-600">
                    Order: {returnItem.orderId?.orderId || 'N/A'} | 
                    Customer: {returnItem.userId?.firstName} {returnItem.userId?.lastName}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(returnItem.status)}`}>
                  {returnItem.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium mb-2">Items</h4>
                  <ul className="space-y-1">
                    {returnItem.orderItems.map((item, index) => (
                      <li key={index} className="text-sm">
                        {item.productId?.name} x {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Details</h4>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Reason:</strong> {returnItem.reason}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Created:</strong> {formatDate(returnItem.createdAt)}
                  </p>
                  {returnItem.notes && (
                    <p className="text-sm text-gray-600">
                      <strong>Notes:</strong> {returnItem.notes}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedReturn(returnItem);
                    setShowModal(true);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Update Return Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  defaultValue={selectedReturn.status}
                  id="status-select"
                >
                  {statusOptions.slice(1).map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Resolution (Optional)</label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  id="resolution-select"
                >
                  <option value="">No resolution</option>
                  {resolutionOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  id="notes-input"
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const status = (document.getElementById('status-select') as HTMLSelectElement).value;
                  const resolution = (document.getElementById('resolution-select') as HTMLSelectElement).value;
                  const notes = (document.getElementById('notes-input') as HTMLTextAreaElement).value;
                  handleStatusUpdate(selectedReturn._id, status, resolution || undefined, notes || undefined);
                }}
                disabled={updatingStatus}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsDashboard; 