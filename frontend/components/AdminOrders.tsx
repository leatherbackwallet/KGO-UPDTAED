import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import AdminOrderStatusManager from './AdminOrderStatusManager';
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

interface SenderDetails {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
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
  senderDetails?: SenderDetails;
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
  requestedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Utility functions for CSV export
const generateOrdersCSV = (orders: Order[]): string => {
  const headers = [
    'Order ID',
    'Internal Order ID',
    'Customer First Name',
    'Customer Last Name',
    'Customer Email',
    'Customer Phone',
    'Recipient Name',
    'Recipient Phone',
    'Shipping Street',
    'Shipping House Number',
    'Shipping Postal Code',
    'Shipping City',
    'Shipping Country Code',
    'Special Instructions',
    'Total Price',
    'Order Status',
    'Payment Status',
    'Payment Method',
    'Payment Date',
    'Razorpay Order ID',
    'Razorpay Payment ID',
    'Items',
    'Requested Delivery Date',
    'Created At',
    'Updated At',
    'Failure Reason',
    'Last Status Update'
  ];

  const rows = orders.map(order => {
    const itemsSummary = order.orderItems?.map(item => {
      const productName = typeof item.productId?.name === 'string' ? item.productId.name : item.productId?.name?.en || 'Unknown Product';
      return `${productName} (Qty: ${item.quantity || 0}) x ₹${(item.price || 0).toFixed(2)}`;
    }).join('; ') || 'N/A';

    const lastStatusUpdate = order.statusHistory && order.statusHistory.length > 0
      ? `${order.statusHistory[order.statusHistory.length - 1].status} on ${new Date(order.statusHistory[order.statusHistory.length - 1].timestamp).toLocaleString()}`
      : 'N/A';

    return [
      order.orderId || 'N/A',
      order._id || 'N/A',
      order.userId?.firstName || 'N/A',
      order.userId?.lastName || 'N/A',
      order.userId?.email || 'N/A',
      order.userId?.phone || 'N/A',
      order.shippingDetails?.recipientName || 'N/A',
      order.shippingDetails?.recipientPhone || 'N/A',
      order.shippingDetails?.address?.streetName || 'N/A',
      order.shippingDetails?.address?.houseNumber || 'N/A',
      order.shippingDetails?.address?.postalCode || 'N/A',
      order.shippingDetails?.address?.city || 'N/A',
      order.shippingDetails?.address?.countryCode || 'N/A',
      order.shippingDetails?.specialInstructions || 'N/A',
      (order.totalPrice || 0).toFixed(2),
      order.orderStatus || 'N/A',
      order.paymentStatus || 'N/A',
      order.razorpayPaymentDetails?.method || 'N/A',
      order.paymentDate ? new Date(order.paymentDate).toLocaleDateString() : 'N/A',
      order.razorpayOrderId || 'N/A',
      order.razorpayPaymentId || 'N/A',
      itemsSummary,
      order.requestedDeliveryDate ? new Date(order.requestedDeliveryDate).toLocaleDateString() : 'N/A',
      order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A',
      order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A',
      order.failureReason || 'N/A',
      lastStatusUpdate
    ];
  });

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
    // Ensure orders is an array before processing
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      return;
    }
    
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
      // Ensure we always set an array, even if the response is not an array
      const ordersData = Array.isArray(response.data.data) ? response.data.data : [];
      setOrders(ordersData);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch orders');
      // Set empty array on error to prevent filter errors
      setOrders([]);
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
    <div className="min-h-screen bg-gray-100 font-sans antialiased text-gray-800">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - CRUD Operations & Filters */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Management</h3>
            
            <div className="space-y-3">
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Refreshing...
                  </div>
                ) : (
                  <>🔄 Refresh Orders</>
                )}
              </button>
              
              <button
                onClick={() => {
                  const csvContent = generateOrdersCSV(filteredOrders);
                  downloadCSV(csvContent, 'orders-export.csv');
                }}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center"
              >
                📊 Export Orders
              </button>
              
              <button
                onClick={() => {
                  alert('Bulk actions feature coming soon!');
                }}
                className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm flex items-center justify-center"
              >
                ⚡ Bulk Actions
              </button>
            </div>
          </div>
            
          {/* Order Statistics */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Statistics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Orders:</span>
                <span className="font-semibold text-gray-900">{Array.isArray(orders) ? orders.length : 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-yellow-600">
                  {Array.isArray(orders) ? orders.filter(o => o.orderStatus === 'pending').length : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Delivered:</span>
                <span className="font-semibold text-green-600">
                  {Array.isArray(orders) ? orders.filter(o => o.orderStatus === 'delivered').length : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cancelled:</span>
                <span className="font-semibold text-red-600">
                  {Array.isArray(orders) ? orders.filter(o => o.orderStatus === 'cancelled').length : 0}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                <span className="text-gray-600">Total Revenue:</span>
                <span className="font-bold text-green-700 text-lg">
                  ₹{Array.isArray(orders) ? orders.filter(o => o.paymentStatus === 'captured').reduce((sum, o) => sum + (o.totalPrice || 0), 0).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
            
          {/* Quick Filters */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Filters</h4>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setStatusFilter('pending');
                  setPaymentFilter('all');
                  setPaymentMethodFilter('all');
                  setSelectedOrder(null); 
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                  statusFilter === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>🟡 Pending Orders</span>
                <span className="text-xs font-semibold">{Array.isArray(orders) ? orders.filter(o => o.orderStatus === 'pending').length : 0}</span>
              </button>
              <button
                onClick={() => {
                  setStatusFilter('delivered');
                  setPaymentFilter('all');
                  setPaymentMethodFilter('all');
                  setSelectedOrder(null); 
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                  statusFilter === 'delivered' 
                    ? 'bg-green-100 text-green-800 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>✅ Delivered Orders</span>
                <span className="text-xs font-semibold">{Array.isArray(orders) ? orders.filter(o => o.orderStatus === 'delivered').length : 0}</span>
              </button>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setPaymentFilter('captured');
                  setPaymentMethodFilter('all');
                  setSelectedOrder(null); 
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                  paymentFilter === 'captured' 
                    ? 'bg-green-100 text-green-800 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>💳 Paid Orders</span>
                <span className="text-xs font-semibold">{Array.isArray(orders) ? orders.filter(o => o.paymentStatus === 'captured').length : 0}</span>
              </button>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setPaymentFilter('pending');
                  setPaymentMethodFilter('all');
                  setSelectedOrder(null); 
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                  paymentFilter === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>⏳ Pending Payments</span>
                <span className="text-xs font-semibold">{Array.isArray(orders) ? orders.filter(o => o.paymentStatus === 'pending').length : 0}</span>
              </button>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setPaymentFilter('all');
                  setPaymentMethodFilter('all');
                  setSearchTerm('');
                  setSelectedOrder(null); 
                }}
                className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <span>🔄 Clear All Filters & Search</span>
                <span className="text-xs text-gray-500">(Reset)</span>
              </button>
            </div>
          </div>
            
          {/* Selected Order Preview */}
          {selectedOrder && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Selected Order Preview</h4>
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-base font-medium text-blue-900">
                    Order #{selectedOrder.orderId || 'N/A'}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    {selectedOrder.shippingDetails?.recipientName || 'N/A'} • ₹{(selectedOrder.totalPrice || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Status: <span className="font-semibold">{(selectedOrder.orderStatus || 'unknown').replace(/_/g, ' ')}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage and track all customer orders within your dashboard.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">Total: <span className="font-bold text-gray-900">{orders.length}</span> orders</span>
                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || paymentMethodFilter !== 'all' ? (
                  <span className="ml-2 font-medium">Filtered: <span className="font-bold text-gray-900">{filteredOrders.length}</span> orders</span>
                ) : null}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters & Search</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Search */}
              <div className="col-span-full xl:col-span-2">
                <label htmlFor="order-search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Orders
                </label>
                <input
                  type="text"
                  id="order-search"
                  placeholder="Order ID, customer name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Order Status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                <label htmlFor="payment-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  id="payment-filter"
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                <label htmlFor="payment-method-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  id="payment-method-filter"
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="createdAt">Date</option>
                    <option value="totalPrice">Amount</option>
                    <option value="orderId">Order ID</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4" role="alert">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Actions
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Order ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                      Customer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex-1 min-w-[180px]">
                      Items
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Total
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Payment
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Order Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Delivery Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders?.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || paymentMethodFilter !== 'all'
                            ? 'Try adjusting your search or filter criteria.' 
                            : 'No orders have been placed yet.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders?.map((order) => (
                    <tr key={order._id} className={`hover:bg-gray-50 ${selectedOrder?._id === order._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                      {/* Actions Column */}
                      <td className="px-4 py-4 whitespace-nowrap align-top">
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
                            {selectedOrder?._id === order._id ? '✓ Selected' : 'Select'}
                          </button>
                        </div>
                      </td>
                      {/* Order ID Column */}
                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900 break-words">
                          #{order.orderId || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 break-words mt-1">
                          {order.razorpayOrderId ? `RZP: ${order.razorpayOrderId.slice(-8)}` : 'No Payment ID'}
                        </div>
                      </td>
                      {/* Customer Column */}
                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900 break-words">
                          {order.shippingDetails?.recipientName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap mt-1">
                          {order.shippingDetails?.recipientPhone || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400 whitespace-normal mt-1">
                          {order.userId?.email || 'N/A'}
                        </div>
                      </td>
                      {/* Items Column */}
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-1.5">
                          {order.orderItems?.slice(0, 2).map((item) => (
                            <div key={item._id} className="flex items-start space-x-2">
                              <div className="flex-shrink-0 h-8 w-8">
                                <ProductImage
                                  src={item.productId?.images?.[0]}
                                  alt={typeof item.productId?.name === 'string' ? item.productId.name : item.productId?.name?.en || 'Product'}
                                  productSlug={item.productId?.slug}
                                  size="thumb"
                                  className="h-8 w-8 rounded object-cover border border-gray-200"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 break-words">
                                  {typeof item.productId?.name === 'string' ? item.productId.name : item.productId?.name?.en || 'Unknown Product'}
                                </div>
                                <div className="text-xs text-gray-500 break-words">
                                  {item.quantity || 0} × ₹{(item.price || 0).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                          {order.orderItems && order.orderItems.length > 2 && (
                            <div className="text-xs text-gray-500 mt-1">
                              +{order.orderItems.length - 2} more items
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Total Column */}
                      <td className="px-4 py-4 text-sm font-bold text-gray-900 whitespace-nowrap align-top">
                        ₹{(order.totalPrice || 0).toFixed(2)}
                      </td>
                      {/* Payment Column */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus || 'unknown')}`}>
                            {order.paymentStatus || 'Unknown'}
                          </span>
                          {order.paymentDate && (
                            <div className="text-xs text-gray-500 mt-1 break-words">
                              {new Date(order.paymentDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Status Column */}
                      <td className="px-4 py-4 align-top">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus || 'unknown')}`}>
                          {(order.orderStatus || 'unknown').replace(/_/g, ' ')}
                        </span>
                      </td>
                      {/* Order Date Column */}
                      <td className="px-4 py-4 text-sm text-gray-500 break-words align-top">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      {/* Delivery Date Column */}
                      <td className="px-4 py-4 text-sm break-words align-top">
                        {order.requestedDeliveryDate ? (
                          <div>
                            <div className="font-medium text-blue-700">
                              {new Date(order.requestedDeliveryDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {(() => {
                                const deliveryDate = new Date(order.requestedDeliveryDate);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                deliveryDate.setHours(0, 0, 0, 0);
                                const diffTime = deliveryDate.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                if (diffDays < 0) {
                                  return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
                                } else if (diffDays === 0) {
                                  return 'Today';
                                } else if (diffDays === 1) {
                                  return 'Tomorrow';
                                } else {
                                  return `In ${diffDays} days`;
                                }
                              })()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
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
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-7xl w-full mx-auto max-h-[95vh] overflow-y-auto transform transition-all scale-100 opacity-100">
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Order #{selectedOrder.orderId || 'N/A'} Details
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Created: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
                  aria-label="Close Order Details"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Order Items & Totals */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
                    <div className="space-y-4">
                      {selectedOrder.orderItems?.map((item) => (
                        <div key={item._id} className="flex items-start space-x-4 p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                          <div className="flex-shrink-0 h-16 w-16">
                            <ProductImage
                              src={item.productId?.images?.[0]}
                              alt={typeof item.productId?.name === 'string' ? item.productId.name : item.productId?.name?.en || 'Product'}
                              productSlug={item.productId?.slug}
                              size="small"
                              className="h-16 w-16 rounded object-cover border border-gray-200"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-medium text-gray-900 truncate">
                              {typeof item.productId?.name === 'string' ? item.productId.name : item.productId?.name?.en || 'Unknown Product'}
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {typeof item.productId?.description === 'string' ? item.productId.description : item.productId?.description?.en || 'No description available'}
                            </p>
                            <div className="text-sm text-gray-700 mt-2 font-medium">
                              Qty: {item.quantity || 0} × ₹{(item.price || 0).toFixed(2)} = <span className="font-semibold">₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-semibold text-gray-900">Total Amount:</span>
                        <span className="text-2xl font-bold text-blue-600">₹{(selectedOrder.totalPrice || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Customer, Payment, Shipping, Status */}
                <div className="space-y-6">
                  {/* Order Summary / Quick Info */}
                  <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3">Order Summary</h4>
                    <div className="space-y-1 text-sm">
                      <p className="flex justify-between items-center">
                        <span className="text-blue-700">Status:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.orderStatus || 'unknown')}`}>
                          {(selectedOrder.orderStatus || 'unknown').replace(/_/g, ' ')}
                        </span>
                      </p>
                      <p className="flex justify-between items-center">
                        <span className="text-blue-700">Payment:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedOrder.paymentStatus || 'unknown')}`}>
                          {selectedOrder.paymentStatus || 'Unknown'}
                        </span>
                      </p>
                      {selectedOrder.requestedDeliveryDate && (
                        <p className="flex justify-between items-center pt-1 border-t border-blue-200">
                          <span className="text-blue-700">Delivery Date:</span>
                          <span className="font-medium text-blue-900">
                            {new Date(selectedOrder.requestedDeliveryDate).toLocaleDateString()}
                          </span>
                        </p>
                      )}
                      <p className="flex justify-between items-center">
                        <span className="text-blue-700">Customer:</span>
                        <span className="font-medium text-blue-900">{selectedOrder.shippingDetails?.recipientName || 'N/A'}</span>
                      </p>
                      <p className="flex justify-between items-center">
                        <span className="text-blue-700">Phone:</span>
                        <span className="font-medium text-blue-900">{selectedOrder.shippingDetails?.recipientPhone || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Sender Information */}
                  {selectedOrder.senderDetails && (
                    <div className="bg-white p-5 rounded-lg border border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Sender Information</h4>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p>
                          <span className="font-medium">Name:</span>
                          <span className="ml-2 text-gray-900">{selectedOrder.senderDetails.senderName || 'N/A'}</span>
                        </p>
                        <p>
                          <span className="font-medium">Email:</span>
                          <span className="ml-2 text-gray-900">{selectedOrder.senderDetails.senderEmail || 'N/A'}</span>
                        </p>
                        <p>
                          <span className="font-medium">Phone:</span>
                          <span className="ml-2 text-gray-900">{selectedOrder.senderDetails.senderPhone || 'N/A'}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Customer Information */}
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Name:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.shippingDetails?.recipientName || 'N/A'}</span>
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.shippingDetails?.recipientPhone || 'N/A'}</span>
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.userId?.email || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Shipping Information */}
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Recipient:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.shippingDetails?.recipientName || 'N/A'}</span>
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.shippingDetails?.recipientPhone || 'N/A'}</span>
                      </p>
                      <div>
                        <span className="font-medium">Address:</span>
                        <div className="ml-2 text-gray-900 leading-relaxed">
                          {selectedOrder.shippingDetails?.address?.houseNumber || ''} {selectedOrder.shippingDetails?.address?.streetName || 'N/A'}
                          <br />
                          {selectedOrder.shippingDetails?.address?.city || 'N/A'}, {selectedOrder.shippingDetails?.address?.postalCode || 'N/A'}
                          <br />
                          {selectedOrder.shippingDetails?.address?.countryCode || 'N/A'}
                        </div>
                      </div>
                      {selectedOrder.requestedDeliveryDate && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="font-medium">Preferred Delivery Date:</span>
                          <div className="ml-2 mt-1">
                            <div className="text-gray-900 font-semibold">
                              {new Date(selectedOrder.requestedDeliveryDate).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {(() => {
                                const deliveryDate = new Date(selectedOrder.requestedDeliveryDate);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                deliveryDate.setHours(0, 0, 0, 0);
                                const diffTime = deliveryDate.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                if (diffDays < 0) {
                                  return `⚠️ Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
                                } else if (diffDays === 0) {
                                  return '📅 Today';
                                } else if (diffDays === 1) {
                                  return '📅 Tomorrow';
                                } else {
                                  return `📅 In ${diffDays} days`;
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedOrder.shippingDetails?.specialInstructions && (
                        <div>
                          <span className="font-medium">Special Instructions:</span>
                          <div className="ml-2 text-gray-900 italic">{selectedOrder.shippingDetails.specialInstructions}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h4>
                    <div className="space-y-3 text-sm text-gray-700">
                      <p className="flex justify-between items-center">
                        <span className="font-medium">Status:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedOrder.paymentStatus || 'unknown')}`}>
                          {selectedOrder.paymentStatus || 'Unknown'}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">Method:</span>
                        <span className="ml-2 text-gray-900 capitalize">{selectedOrder.razorpayPaymentDetails?.method || 'N/A'}</span>
                      </p>
                      {selectedOrder.paymentDate && (
                        <p>
                          <span className="font-medium">Date:</span>
                          <span className="ml-2 text-gray-900">{new Date(selectedOrder.paymentDate).toLocaleString()}</span>
                        </p>
                      )}
                      {selectedOrder.razorpayPaymentId && (
                        <div>
                          <span className="font-medium">Payment ID:</span>
                          <div className="text-gray-900 font-mono text-xs break-all mt-1">{selectedOrder.razorpayPaymentId}</div>
                        </div>
                      )}
                      {selectedOrder.razorpayOrderId && (
                        <div>
                          <span className="font-medium">Razorpay Order ID:</span>
                          <div className="text-gray-900 font-mono text-xs break-all mt-1">{selectedOrder.razorpayOrderId}</div>
                        </div>
                      )}
                      
                      {/* Additional Payment Details (Card, Bank, etc.) */}
                      {selectedOrder.razorpayPaymentDetails?.card && (
                        <div className="border-t pt-3 mt-3">
                          <h5 className="font-medium text-gray-700 mb-2">Card Details</h5>
                          <p>
                            <span className="font-medium">Name:</span>
                            <span className="ml-2 text-gray-900">{selectedOrder.razorpayPaymentDetails.card.name || 'N/A'}</span>
                          </p>
                          <p>
                            <span className="font-medium">Last 4 Digits:</span>
                            <span className="ml-2 text-gray-900">{selectedOrder.razorpayPaymentDetails.card.last4 || 'N/A'}</span>
                          </p>
                          <p>
                            <span className="font-medium">Network:</span>
                            <span className="ml-2 text-gray-900">{selectedOrder.razorpayPaymentDetails.card.network || 'N/A'}</span>
                          </p>
                          <p>
                            <span className="font-medium">Type:</span>
                            <span className="ml-2 text-gray-900">{selectedOrder.razorpayPaymentDetails.card.type || 'N/A'}</span>
                          </p>
                        </div>
                      )}
                      
                      {selectedOrder.razorpayPaymentDetails?.bank && (
                        <div className="border-t pt-3 mt-3">
                          <span className="font-medium">Bank:</span>
                          <span className="ml-2 text-gray-900">{selectedOrder.razorpayPaymentDetails.bank}</span>
                        </div>
                      )}
                      
                      {selectedOrder.razorpayPaymentDetails?.wallet && (
                        <div className="border-t pt-3 mt-3">
                          <span className="font-medium">Wallet:</span>
                          <span className="ml-2 text-gray-900">{selectedOrder.razorpayPaymentDetails.wallet}</span>
                        </div>
                      )}
                      
                      {selectedOrder.razorpayPaymentDetails?.vpa && (
                        <div className="border-t pt-3 mt-3">
                          <span className="font-medium">UPI VPA:</span>
                          <span className="ml-2 text-gray-900">{selectedOrder.razorpayPaymentDetails.vpa}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Order Status Management */}
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Update Order Status</h4>
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
    </div>
  );
};

export default AdminOrders; 