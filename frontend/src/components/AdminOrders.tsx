import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AdminOrderStatusManager from './AdminOrderStatusManager';
import { getMultilingualText } from '../utils/api';

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
  createdAt: string;
  updatedAt: string;
}

const AdminOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
        <div className="text-sm text-gray-600">
          Total Orders: {orders.length}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders?.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{order.orderId || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.shippingDetails?.recipientName || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.shippingDetails?.recipientPhone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {order.orderItems?.map((item) => (
                        <div key={item._id} className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-8 w-8">
                            <img
                              className="h-8 w-8 rounded object-cover"
                              src={item.productId?.images?.[0] || '/images/products/placeholder.svg'}
                              alt={getMultilingualText(item.productId?.name) || 'Product'}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {getMultilingualText(item.productId?.name) || 'Unknown Product'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Qty: {item.quantity || 0} × ₹{(item.price || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{(order.totalPrice || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus || 'unknown')}`}>
                      {(order.orderStatus || 'unknown').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && selectedOrder.orderItems && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Order #{selectedOrder.orderId || 'N/A'} Details
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Items */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.orderItems?.map((item) => (
                    <div key={item._id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0 h-12 w-12">
                        <img
                          className="h-12 w-12 rounded object-cover"
                          src={item.productId?.images?.[0] || '/images/products/placeholder.svg'}
                          alt={getMultilingualText(item.productId?.name) || 'Product'}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {getMultilingualText(item.productId?.name) || 'Unknown Product'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Qty: {item.quantity || 0} × ₹{(item.price || 0).toFixed(2)} = ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    Total: ₹{(selectedOrder.totalPrice || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Recipient Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Recipient Information</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>{selectedOrder.shippingDetails?.recipientName || 'N/A'}</strong></p>
                  <p>{selectedOrder.shippingDetails?.recipientPhone || 'N/A'}</p>
                  <p>
                    {selectedOrder.shippingDetails?.address?.streetName || 'N/A'} {selectedOrder.shippingDetails?.address?.houseNumber || ''}
                  </p>
                  <p>
                    {selectedOrder.shippingDetails?.address?.postalCode || 'N/A'} {selectedOrder.shippingDetails?.address?.city || 'N/A'}
                  </p>
                  {selectedOrder.shippingDetails?.specialInstructions && (
                    <p className="mt-2 text-gray-500">
                      <strong>Instructions:</strong> {selectedOrder.shippingDetails.specialInstructions}
                    </p>
                  )}
                </div>
                
                <div className="mt-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Order Status</h4>
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
  );
};

export default AdminOrders; 