/**
 * ReturnsDashboard Component - Admin returns management interface
 * Handles RMA workflows, status updates, and return request processing
 */

import React, { useState, useEffect } from 'react';
import api from '../utils/api';

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
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (selectedStatus) {
        params.append('status', selectedStatus);
      }

      const response = await api.get(`/returns?${params}`);
      const data: ReturnsData = response.data as any;
      
      setReturns(data.returns);
      setTotalPages(data.pagination.pages);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [selectedStatus, currentPage]);

  const handleStatusUpdate = async (returnId: string, status: string, resolution?: string, notes?: string) => {
    try {
      setUpdatingStatus(true);
      await api.put(`/returns/${returnId}/status`, {
        status,
        resolution,
        notes
      });
      
      // Refresh the returns list
      await fetchReturns();
      setShowModal(false);
      setSelectedReturn(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      requested: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      shipped_by_customer: 'bg-purple-100 text-purple-800',
      received_at_hub: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

  if (loading && returns.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Returns Management</h2>
        <div className="flex space-x-4">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {returns.map((returnItem) => (
            <li key={returnItem._id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Return ID: {returnItem.returnId}
                      </p>
                      <p className="text-sm text-gray-500">
                        Order: {returnItem.orderId.orderId} • Customer: {returnItem.userId.firstName} {returnItem.userId.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Reason: {returnItem.reason}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(returnItem.status)}`}>
                    {returnItem.status.replace('_', ' ').toUpperCase()}
                  </span>
                  
                  <button
                    onClick={() => {
                      setSelectedReturn(returnItem);
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Return Details Modal */}
      {showModal && selectedReturn && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Return Details - {selectedReturn.returnId}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Order Information</h4>
                  <p className="text-sm text-gray-600">Order ID: {selectedReturn.orderId.orderId}</p>
                  <p className="text-sm text-gray-600">Total: ${selectedReturn.orderId.totalPrice}</p>
                  <p className="text-sm text-gray-600">Status: {selectedReturn.orderId.orderStatus}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Customer Information</h4>
                  <p className="text-sm text-gray-600">
                    {selectedReturn.userId.firstName} {selectedReturn.userId.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedReturn.userId.email}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Return Items</h4>
                  <div className="space-y-2">
                    {selectedReturn.orderItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <img 
                          src={item.productId.images[0] || '/images/placeholder.svg'} 
                          alt={item.productId.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                        <span className="text-sm text-gray-600">
                          {item.productId.name} (Qty: {item.quantity})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Return Details</h4>
                  <p className="text-sm text-gray-600">Reason: {selectedReturn.reason}</p>
                  <p className="text-sm text-gray-600">Status: {selectedReturn.status}</p>
                  {selectedReturn.resolution && (
                    <p className="text-sm text-gray-600">Resolution: {selectedReturn.resolution}</p>
                  )}
                  {selectedReturn.notes && (
                    <p className="text-sm text-gray-600">Notes: {selectedReturn.notes}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    Created: {formatDate(selectedReturn.createdAt)}
                  </p>
                </div>

                {/* Status Update Form */}
                {selectedReturn.status !== 'completed' && selectedReturn.status !== 'rejected' && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Update Status</h4>
                    <div className="space-y-2">
                      <select
                        id="newStatus"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {statusOptions.slice(1).map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      
                      {selectedReturn.status === 'received_at_hub' && (
                        <select
                          id="resolution"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Resolution</option>
                          {resolutionOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      <textarea
                        id="notes"
                        placeholder="Add notes (optional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const newStatus = (document.getElementById('newStatus') as HTMLSelectElement).value;
                            const resolution = (document.getElementById('resolution') as HTMLSelectElement)?.value;
                            const notes = (document.getElementById('notes') as HTMLTextAreaElement).value;
                            
                            handleStatusUpdate(selectedReturn._id, newStatus, resolution || undefined, notes || undefined);
                          }}
                          disabled={updatingStatus}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updatingStatus ? 'Updating...' : 'Update Status'}
                        </button>
                        <button
                          onClick={() => {
                            setShowModal(false);
                            setSelectedReturn(null);
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsDashboard; 