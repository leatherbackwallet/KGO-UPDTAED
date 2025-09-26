import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import AdminOrderStatusManager from './AdminOrderStatusManager';
import { getMultilingualText } from '../utils/api';
import { ProductImage } from './ProgressiveImage';

interface ShippingDetails {
  recipientName: string;
  recipientPhone: string;
  address: {
    streetName: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    countryCode: string;
  };
  specialInstructions?: string;
}

interface OrderItem {
  _id: string;
  productId: {
    _id: string;
    name: { en: string; de: string };
    description?: { en: string; de: string };
    categories?: { name: { en: string; de: string } }[];
    images: string[];
    slug: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderId: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  orderItems: OrderItem[];
  totalPrice: number;
  orderStatus: string;
  shippingDetails: ShippingDetails;
  statusHistory?: Array<{
    status: string;
    timestamp: Date;
    notes?: string;
    updatedBy?: string;
  }>;
  // Payment information
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus?: string;
  paymentDate?: string;
  paymentVerifiedAt?: string;
  razorpayPaymentDetails?: {
    id?: string;
    amount?: number;
    currency?: string;
    status?: string;
    method?: string;
    description?: string;
    bank?: string;
    wallet?: string;
    card_id?: string;
    card?: {
      id?: string;
      entity?: string;
      name?: string;
      last4?: string;
      network?: string;
      type?: string;
      issuer?: string;
      international?: boolean;
      emi?: boolean;
      sub_type?: string;
      token_iin?: string;
    };
    vpa?: string;
    email?: string;
    contact?: string;
    notes?: any;
    fee?: number;
    tax?: number;
    error_code?: string;
    error_description?: string;
    error_source?: string;
    error_step?: string;
    error_reason?: string;
    acquirer_data?: any;
    created_at?: number;
  };
  razorpayOrderDetails?: {
    id?: string;
    entity?: string;
    amount?: number;
    amount_paid?: number;
    amount_due?: number;
    currency?: string;
    receipt?: string;
    status?: string;
    attempts?: number;
    notes?: any;
    created_at?: number;
  };
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Utility functions for CSV export
const generateOrdersCSV = (orders: Order[]): string => {
  const headers = [
    'Order ID',
    'Customer Name',
    'Customer Email',
    'Customer Phone',
    'Total Price',
    'Order Status',
    'Payment Status',
    'Payment Method',
    'Created Date',
    'Items Count'
  ];

  const rows = orders.map(order => [
    order.orderId || 'N/A',
    order.shippingDetails?.recipientName || 'N/A',
    order.userId?.email || 'N/A',
    order.shippingDetails?.recipientPhone || 'N/A',
    (order.totalPrice || 0).toFixed(2),
    order.orderStatus || 'N/A',
    order.paymentStatus || 'N/A',
    order.razorpayPaymentDetails?.method || 'N/A',
    order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
    order.orderItems?.length || 0
  ]);

  return [headers, ...rows].map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n');
};

const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const AdminOrders: React.FC = () => {
  const { user, tokens } = useAuth();
  const { markAllAsRead } = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchOrders();
    // Mark all notifications as read when admin visits orders tab
    markAllAsRead();
  }, [markAllAsRead]);

  // Filter and sort orders
  useEffect(() => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingDetails?.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingDetails?.recipientPhone?.includes(searchTerm) ||
        order.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === paymentFilter);
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(order => 
        order.razorpayPaymentDetails?.method === paymentMethodFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'totalPrice':
          aValue = a.totalPrice || 0;
          bValue = b.totalPrice || 0;
          break;
        case 'orderId':
          aValue = a.orderId || '';
          bValue = b.orderId || '';
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, paymentFilter, paymentMethodFilter, sortBy, sortOrder]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      console.log('Orders response:', response.data);
      setOrders(response.data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (updatedOrder: any) => {
    try {
      fetchOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.error?.message || 'Failed to update order status');
    }
  };

  const handlePrintReceipt = (orderId: string) => {
    console.log('Print receipt requested for order:', orderId);
    // Open print dialog for the current page
    // The receipt content will be styled for print
    window.print();
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status || typeof status !== 'string') {
      console.warn('getStatusColor received invalid status:', status, typeof status);
      return 'bg-gray-100 text-gray-800';
    }
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_done':
        return 'bg-green-100 text-green-800';
      case 'order_received':
        return 'bg-blue-100 text-blue-800';
      case 'collecting_items':
        return 'bg-yellow-100 text-yellow-800';
      case 'packing':
        return 'bg-purple-100 text-purple-800';
      case 'en_route':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string | null | undefined) => {
    if (!status || typeof status !== 'string') {
      console.warn('getPaymentStatusColor received invalid status:', status, typeof status);
      return 'bg-gray-100 text-gray-800';
    }
    switch (status.toLowerCase()) {
      case 'captured':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Left Sidebar - CRUD Operations */}
      <div className="w-72 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Management</h3>
          
          <div className="space-y-3">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Refreshing...
                </div>
              ) : (
                '🔄 Refresh Orders'
              )}
            </button>
            
            <button
              onClick={() => {
                // Export orders functionality
                const csvContent = generateOrdersCSV(filteredOrders);
                downloadCSV(csvContent, 'orders-export.csv');
              }}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              📊 Export Orders
            </button>
            
            <button
              onClick={() => {
                // Bulk actions functionality
                alert('Bulk actions feature coming soon!');
              }}
              className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              ⚡ Bulk Actions
            </button>
          </div>
          
          {/* Order Statistics */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Order Statistics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Orders:</span>
                <span className="font-medium text-gray-900">{orders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending:</span>
                <span className="font-medium text-yellow-600">
                  {orders.filter(o => o.orderStatus === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivered:</span>
                <span className="font-medium text-green-600">
                  {orders.filter(o => o.orderStatus === 'delivered').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cancelled:</span>
                <span className="font-medium text-red-600">
                  {orders.filter(o => o.orderStatus === 'cancelled').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue:</span>
                <span className="font-medium text-green-600">
                  ₹{orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Selected Order Actions */}
          {selectedOrder && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Order Actions</h4>
              <div className="space-y-2">
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <div className="text-sm font-medium text-blue-900">
                    Order #{selectedOrder.orderId || 'N/A'}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    {selectedOrder.shippingDetails?.recipientName || 'N/A'} • ₹{(selectedOrder.totalPrice || 0).toFixed(2)}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    // View Details action - already handled by selectedOrder state
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  👁️ View Details
                </button>
                
                <button
                  onClick={() => handlePrintReceipt(selectedOrder._id)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  🖨️ Print Receipt
                </button>
                
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  ✕ Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Quick Filters */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Filters</h4>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setStatusFilter('pending');
                  setPaymentFilter('all');
                  setPaymentMethodFilter('all');
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  statusFilter === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🟡 Pending Orders
              </button>
              <button
                onClick={() => {
                  setStatusFilter('delivered');
                  setPaymentFilter('all');
                  setPaymentMethodFilter('all');
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  statusFilter === 'delivered' 
                    ? 'bg-green-100 text-green-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ✅ Delivered Orders
              </button>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setPaymentFilter('captured');
                  setPaymentMethodFilter('all');
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  paymentFilter === 'captured' 
                    ? 'bg-green-100 text-green-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                💳 Paid Orders
              </button>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setPaymentFilter('all');
                  setPaymentMethodFilter('all');
                  setSearchTerm('');
                }}
                className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                🔄 Clear All Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage and track all customer orders
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </div>
        </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Orders
            </label>
            <input
              type="text"
              placeholder="Search by order ID, name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="payment_done">Payment Done</option>
              <option value="order_received">Order Received</option>
              <option value="collecting_items">Collecting Items</option>
              <option value="packing">Packing</option>
              <option value="en_route">En Route</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payments</option>
              <option value="captured">Captured</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Methods</option>
              <option value="card">Card</option>
              <option value="netbanking">Net Banking</option>
              <option value="wallet">Wallet</option>
              <option value="upi">UPI</option>
              <option value="emi">EMI</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt">Date</option>
                <option value="totalPrice">Amount</option>
                <option value="orderId">Order ID</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Actions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Payment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || paymentMethodFilter !== 'all'
                          ? 'Try adjusting your search or filter criteria.' 
                          : 'No orders have been placed yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders?.map((order) => (
                <tr key={order._id} className={`hover:bg-gray-50 ${selectedOrder?._id === order._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                  {/* Actions Column - First Column */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          selectedOrder?._id === order._id
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {selectedOrder?._id === order._id ? '✓' : 'Select'}
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(order._id)}
                        className="px-2 py-1 rounded text-xs font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                        title="Print Receipt"
                      >
                        🖨️
                      </button>
                    </div>
                  </td>
                  {/* Order Column */}
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      #{order.orderId || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {order.razorpayOrderId ? `RZP: ${order.razorpayOrderId.slice(-8)}` : 'No Payment ID'}
                    </div>
                  </td>
                  {/* Customer Column */}
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 truncate">
                      {order.shippingDetails?.recipientName || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {order.shippingDetails?.recipientPhone || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {order.userId?.email || 'N/A'}
                    </div>
                  </td>
                  {/* Items Column */}
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {order.orderItems?.slice(0, 2).map((item) => (
                        <div key={item._id} className="flex items-center space-x-2">
                          <div className="flex-shrink-0 h-6 w-6">
                            <ProductImage
                              src={item.productId?.images?.[0]}
                              alt={getMultilingualText(item.productId?.name) || 'Product'}
                              productSlug={item.productId?.slug}
                              size="thumb"
                              className="h-6 w-6 rounded object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">
                              {getMultilingualText(item.productId?.name) || 'Unknown Product'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.quantity || 0} × ₹{(item.price || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                      {order.orderItems?.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{order.orderItems.length - 2} more
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Total Column */}
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    ₹{(order.totalPrice || 0).toFixed(2)}
                  </td>
                  {/* Payment Column */}
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus || 'unknown')}`}>
                        {order.paymentStatus || 'Unknown'}
                      </span>
                      {order.paymentDate && (
                        <div className="text-xs text-gray-500">
                          {new Date(order.paymentDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Status Column */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus || 'unknown')}`}>
                      {(order.orderStatus || 'unknown').replace('_', ' ')}
                    </span>
                  </td>
                  {/* Date Column */}
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && selectedOrder.orderItems && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Order #{selectedOrder.orderId || 'N/A'} Details
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Created: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Items */}
              <div className="lg:col-span-2">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.orderItems?.map((item) => (
                    <div key={item._id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0 h-16 w-16">
                        <ProductImage
                          src={item.productId?.images?.[0]}
                          alt={getMultilingualText(item.productId?.name) || 'Product'}
                          productSlug={item.productId?.slug}
                          size="small"
                          className="h-16 w-16 rounded object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {getMultilingualText(item.productId?.name) || 'Unknown Product'}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {getMultilingualText(item.productId?.description) || 'No description available'}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          Quantity: {item.quantity || 0} × ₹{(item.price || 0).toFixed(2)} = ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-xl font-bold text-gray-900">₹{(selectedOrder.totalPrice || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Customer & Payment Information */}
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Name:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.shippingDetails?.recipientName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Phone:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.shippingDetails?.recipientPhone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.userId?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    {/* Payment Status */}
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Payment Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedOrder.paymentStatus || 'unknown')}`}>
                        {selectedOrder.paymentStatus || 'Unknown'}
                      </span>
                    </div>
                    
                    {/* Razorpay Order Information */}
                    {selectedOrder.razorpayOrderId && (
                      <div className="border-t pt-3">
                        <h5 className="font-medium text-gray-700 mb-2">Razorpay Order Details</h5>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Order ID:</span>
                            <div className="text-gray-600 font-mono break-all">{selectedOrder.razorpayOrderId}</div>
                          </div>
                          {selectedOrder.razorpayOrderDetails?.status && (
                            <div>
                              <span className="font-medium text-gray-600">Order Status:</span>
                              <span className="ml-2 text-gray-600">{selectedOrder.razorpayOrderDetails.status}</span>
                            </div>
                          )}
                          {selectedOrder.razorpayOrderDetails?.amount && (
                            <div>
                              <span className="font-medium text-gray-600">Order Amount:</span>
                              <span className="ml-2 text-gray-600">₹{(selectedOrder.razorpayOrderDetails.amount / 100).toFixed(2)}</span>
                            </div>
                          )}
                          {selectedOrder.razorpayOrderDetails?.amount_paid && (
                            <div>
                              <span className="font-medium text-gray-600">Amount Paid:</span>
                              <span className="ml-2 text-gray-600">₹{(selectedOrder.razorpayOrderDetails.amount_paid / 100).toFixed(2)}</span>
                            </div>
                          )}
                          {selectedOrder.razorpayOrderDetails?.attempts && (
                            <div>
                              <span className="font-medium text-gray-600">Payment Attempts:</span>
                              <span className="ml-2 text-gray-600">{selectedOrder.razorpayOrderDetails.attempts}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Razorpay Payment Information */}
                    {selectedOrder.razorpayPaymentId && (
                      <div className="border-t pt-3">
                        <h5 className="font-medium text-gray-700 mb-2">Razorpay Payment Details</h5>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Payment ID:</span>
                            <div className="text-gray-600 font-mono break-all">{selectedOrder.razorpayPaymentId}</div>
                          </div>
                          
                          {selectedOrder.razorpayPaymentDetails?.method && (
                            <div>
                              <span className="font-medium text-gray-600">Payment Method:</span>
                              <span className="ml-2 text-gray-600 capitalize">{selectedOrder.razorpayPaymentDetails.method}</span>
                            </div>
                          )}
                          
                          {selectedOrder.razorpayPaymentDetails?.card && (
                            <div>
                              <span className="font-medium text-gray-600">Card Details:</span>
                              <div className="ml-2 text-gray-600">
                                {selectedOrder.razorpayPaymentDetails.card.name} •••• {selectedOrder.razorpayPaymentDetails.card.last4}
                                <br />
                                <span className="text-xs text-gray-500">
                                  {selectedOrder.razorpayPaymentDetails.card.network} {selectedOrder.razorpayPaymentDetails.card.type}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {selectedOrder.razorpayPaymentDetails?.bank && (
                            <div>
                              <span className="font-medium text-gray-600">Bank:</span>
                              <span className="ml-2 text-gray-600">{selectedOrder.razorpayPaymentDetails.bank}</span>
                            </div>
                          )}
                          
                          {selectedOrder.razorpayPaymentDetails?.wallet && (
                            <div>
                              <span className="font-medium text-gray-600">Wallet:</span>
                              <span className="ml-2 text-gray-600">{selectedOrder.razorpayPaymentDetails.wallet}</span>
                            </div>
                          )}
                          
                          {selectedOrder.razorpayPaymentDetails?.vpa && (
                            <div>
                              <span className="font-medium text-gray-600">UPI VPA:</span>
                              <span className="ml-2 text-gray-600">{selectedOrder.razorpayPaymentDetails.vpa}</span>
                            </div>
                          )}
                          
                          {selectedOrder.razorpayPaymentDetails?.contact && (
                            <div>
                              <span className="font-medium text-gray-600">Contact:</span>
                              <span className="ml-2 text-gray-600">{selectedOrder.razorpayPaymentDetails.contact}</span>
                            </div>
                          )}
                          
                          {selectedOrder.razorpayPaymentDetails?.email && (
                            <div>
                              <span className="font-medium text-gray-600">Email:</span>
                              <span className="ml-2 text-gray-600">{selectedOrder.razorpayPaymentDetails.email}</span>
                            </div>
                          )}
                          
                          {selectedOrder.razorpayPaymentDetails?.fee && (
                            <div>
                              <span className="font-medium text-gray-600">Gateway Fee:</span>
                              <span className="ml-2 text-gray-600">₹{(selectedOrder.razorpayPaymentDetails.fee / 100).toFixed(2)}</span>
                            </div>
                          )}
                          
                          {selectedOrder.razorpayPaymentDetails?.tax && (
                            <div>
                              <span className="font-medium text-gray-600">Tax:</span>
                              <span className="ml-2 text-gray-600">₹{(selectedOrder.razorpayPaymentDetails.tax / 100).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Payment Timestamps */}
                    <div className="border-t pt-3">
                      <h5 className="font-medium text-gray-700 mb-2">Payment Timeline</h5>
                      <div className="space-y-2 text-sm">
                        {selectedOrder.paymentDate && (
                          <div>
                            <span className="font-medium text-gray-600">Payment Date:</span>
                            <div className="text-gray-600">{new Date(selectedOrder.paymentDate).toLocaleString()}</div>
                          </div>
                        )}
                        {selectedOrder.paymentVerifiedAt && (
                          <div>
                            <span className="font-medium text-gray-600">Verified At:</span>
                            <div className="text-gray-600">{new Date(selectedOrder.paymentVerifiedAt).toLocaleString()}</div>
                          </div>
                        )}
                        {selectedOrder.razorpayPaymentDetails?.created_at && (
                          <div>
                            <span className="font-medium text-gray-600">Razorpay Created:</span>
                            <div className="text-gray-600">{new Date(selectedOrder.razorpayPaymentDetails.created_at * 1000).toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Error Information */}
                    {selectedOrder.failureReason && (
                      <div className="border-t pt-3">
                        <h5 className="font-medium text-red-700 mb-2">Failure Information</h5>
                        <div className="text-sm text-red-600">{selectedOrder.failureReason}</div>
                        {selectedOrder.razorpayPaymentDetails?.error_code && (
                          <div className="mt-2">
                            <span className="font-medium text-red-600">Error Code:</span>
                            <span className="ml-2 text-red-600">{selectedOrder.razorpayPaymentDetails.error_code}</span>
                          </div>
                        )}
                        {selectedOrder.razorpayPaymentDetails?.error_description && (
                          <div>
                            <span className="font-medium text-red-600">Error Description:</span>
                            <div className="text-red-600">{selectedOrder.razorpayPaymentDetails.error_description}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Recipient:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.shippingDetails?.recipientName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Phone:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.shippingDetails?.recipientPhone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Address:</span>
                        <div className="ml-2 text-gray-900">
                          {selectedOrder.shippingDetails?.address?.streetName || 'N/A'} {selectedOrder.shippingDetails?.address?.houseNumber || ''}
                          <br />
                          {selectedOrder.shippingDetails?.address?.postalCode || 'N/A'} {selectedOrder.shippingDetails?.address?.city || 'N/A'}
                        </div>
                      </div>
                      {selectedOrder.shippingDetails?.specialInstructions && (
                        <div>
                          <span className="font-medium text-gray-700">Special Instructions:</span>
                          <div className="ml-2 text-gray-900">{selectedOrder.shippingDetails.specialInstructions}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Status Management */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Status Management</h4>
                  <AdminOrderStatusManager
                    orderId={selectedOrder._id}
                    currentStatus={selectedOrder.orderStatus || 'unknown'}
                    statusHistory={selectedOrder.statusHistory || []}
                    onStatusUpdate={handleStatusUpdate}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminOrders; 