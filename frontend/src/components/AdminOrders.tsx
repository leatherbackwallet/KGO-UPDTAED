import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import RecipientAddresses from './RecipientAddresses';
import AdminOrderStatusManager from './AdminOrderStatusManager';

interface RecipientAddress {
  name: string;
  phone: string;
  address: {
    streetName: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    countryCode: string;
  };
  additionalInstructions?: string;
  isDefault: boolean;
}

interface Order {
  _id: string;
  userId?: { firstName: string; lastName: string; email: string };
  orderItems?: { productId: { name: { en: string; de: string }; images?: string[] }; quantity: number; price: number }[];
  totalPrice: number;
  shippingDetails?: {
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
  };
  orderStatus: string;
  statusHistory?: {
    status: string;
    timestamp: Date;
    notes?: string;
    updatedBy?: string;
  }[];
  createdAt: string;
}

export default function AdminOrders() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    if (token && user?.roleName === 'admin') {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [token, user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get<Order[]>('/orders', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setOrders(res.data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (updatedOrder: Order) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === updatedOrder._id ? updatedOrder : order
      )
    );
    setShowStatusModal(false);
    setSelectedOrder(null);
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleRecipientSelect = (address: RecipientAddress) => {
    if (selectedOrder) {
      // Update the order with new recipient information
      updateOrderRecipient(selectedOrder._id, address);
    }
  };

  const updateOrderRecipient = async (orderId: string, recipientAddress: RecipientAddress) => {
    try {
      await api.put(`/orders/${orderId}/recipient`, {
        recipientAddress: {
          name: recipientAddress.name,
          phone: recipientAddress.phone,
          address: recipientAddress.address,
          additionalInstructions: recipientAddress.additionalInstructions
        }
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      fetchOrders();
      setShowRecipientModal(false);
      setSelectedOrder(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating recipient');
    }
  };

  const openRecipientModal = (order: Order) => {
    setSelectedOrder(order);
    setShowRecipientModal(true);
  };

  if (!token || user?.roleName !== 'admin') {
    return <div className="text-red-600">Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Order Management</h2>
        <div className="text-gray-600">Loading orders...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Order Management</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">No orders found</div>
          <div className="text-sm text-gray-400">Orders will appear here when customers place them</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Order ID</th>
                <th className="p-2 text-left">Customer</th>
                <th className="p-2 text-left">Products</th>
                <th className="p-2 text-left">Total</th>
                <th className="p-2 text-left">🎁 Recipient</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} className="border-t hover:bg-gray-50">
                  <td className="p-2 font-mono text-sm">#{order._id.slice(-6)}</td>
                  <td className="p-2">
                    <div className="font-medium">
                      {order.userId ? `${order.userId.firstName} ${order.userId.lastName}` : 'Guest User'}
                    </div>
                    <div className="text-xs text-gray-500">{order.userId?.email || 'N/A'}</div>
                  </td>
                  <td className="p-2">
                    <div className="space-y-2">
                      {order.orderItems?.map((item, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          {/* Product Thumbnail */}
                          <div className="flex-shrink-0">
                            {item.productId?.images && item.productId.images.length > 0 ? (
                              <img 
                                src={`http://localhost:5001/images/${item.productId.images[0]}`}
                                alt={item.productId.name?.en || 'Product'}
                                className="w-10 h-10 object-cover rounded border border-gray-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/images/products/placeholder.svg';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded border border-gray-200 flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">{item.productId?.name?.en || 'Unknown Product'}</span>
                              <span className="text-gray-500"> x {item.quantity}</span>
                            </div>
                            <div className="text-xs text-blue-600 font-medium">
                              €{(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )) || <div className="text-gray-500 text-sm">No products</div>}
                    </div>
                  </td>
                  <td className="p-2">
                    <span className="font-bold text-lg text-green-600">
                      €{(order.totalPrice || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="p-2">
                    {order.shippingDetails ? (
                      <div className="space-y-1">
                        <div className="font-medium text-blue-600">
                          📞 {order.shippingDetails.recipientName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {order.shippingDetails.recipientPhone}
                        </div>
                        <div className="text-sm text-gray-700">
                          📍 {order.shippingDetails.address.streetName} {order.shippingDetails.address.houseNumber}
                        </div>
                        <div className="text-sm text-gray-700">
                          {order.shippingDetails.address.postalCode} {order.shippingDetails.address.city}
                        </div>
                        {order.shippingDetails.specialInstructions && (
                          <div className="text-sm text-gray-600 italic">
                            📝 {order.shippingDetails.specialInstructions}
                          </div>
                        )}
                        <button
                          onClick={() => openRecipientModal(order)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Change Recipient
                        </button>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">
                        No recipient info
                        <button
                          onClick={() => openRecipientModal(order)}
                          className="block text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                        >
                          Add Recipient
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.orderStatus === 'payment_done' ? 'bg-green-100 text-green-800' :
                      order.orderStatus === 'order_received' ? 'bg-blue-100 text-blue-800' :
                      order.orderStatus === 'collecting_items' ? 'bg-purple-100 text-purple-800' :
                      order.orderStatus === 'packing' ? 'bg-orange-100 text-orange-800' :
                      order.orderStatus === 'en_route' ? 'bg-indigo-100 text-indigo-800' :
                      order.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                      order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.orderStatus === 'payment_done' ? 'Payment Done' :
                       order.orderStatus === 'order_received' ? 'Order Received' :
                       order.orderStatus === 'collecting_items' ? 'Collecting Items' :
                       order.orderStatus === 'packing' ? 'Packing' :
                       order.orderStatus === 'en_route' ? 'En Route' :
                       order.orderStatus === 'delivered' ? 'Delivered' :
                       order.orderStatus === 'cancelled' ? 'Cancelled' :
                       order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => openStatusModal(order)}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      Manage Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recipient Selection Modal */}
      {showRecipientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Manage Recipient for Order #{selectedOrder?._id.slice(-6)}
              </h3>
              <button
                onClick={() => {
                  setShowRecipientModal(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Current Recipient:</h4>
              {selectedOrder?.shippingDetails ? (
                <div className="text-sm text-blue-800">
                  <div><strong>{selectedOrder.shippingDetails.recipientName}</strong></div>
                  <div>📞 {selectedOrder.shippingDetails.recipientPhone}</div>
                  <div>📍 {selectedOrder.shippingDetails.address.streetName} {selectedOrder.shippingDetails.address.houseNumber}</div>
                  <div>{selectedOrder.shippingDetails.address.postalCode} {selectedOrder.shippingDetails.address.city}</div>
                  {selectedOrder.shippingDetails.specialInstructions && (
                    <div className="italic">📝 {selectedOrder.shippingDetails.specialInstructions}</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-blue-800">No recipient information available</div>
              )}
            </div>

            <RecipientAddresses
              onAddressSelect={handleRecipientSelect}
              selectedAddress={null}
              showAddButton={true}
              className=""
            />
          </div>
        </div>
      )}

      {/* Status Management Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Manage Status for Order #{selectedOrder._id.slice(-6)}
              </h3>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Manager */}
              <div>
                <AdminOrderStatusManager
                  orderId={selectedOrder._id}
                  currentStatus={selectedOrder.orderStatus}
                  statusHistory={selectedOrder.statusHistory || []}
                  onStatusUpdate={handleStatusUpdate}
                  className=""
                />
              </div>
              
              {/* Order Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">📋 Order Details</h4>
                <div className="space-y-3">
                  {/* Customer Info */}
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <span className="ml-2 font-medium">
                        {selectedOrder.userId?.firstName} {selectedOrder.userId?.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2">{selectedOrder.userId?.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <span className="ml-2 font-medium">€{selectedOrder.totalPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2">
                        {new Date(selectedOrder.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Products */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">📦 Products ({selectedOrder.orderItems?.length || 0})</h5>
                    <div className="space-y-2">
                      {selectedOrder.orderItems?.map((item, i) => (
                        <div key={i} className="flex items-center space-x-2 p-2 bg-white rounded border">
                          {/* Product Thumbnail */}
                          <div className="flex-shrink-0">
                            {item.productId?.images && item.productId.images.length > 0 ? (
                              <img 
                                src={`http://localhost:5001/images/${item.productId.images[0]}`}
                                alt={item.productId.name?.en || 'Product'}
                                className="w-12 h-12 object-cover rounded border border-gray-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/images/products/placeholder.svg';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded border border-gray-200 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {item.productId?.name?.en || 'Unknown Product'}
                            </div>
                            <div className="text-xs text-gray-600">
                              Qty: {item.quantity} × €{item.price.toFixed(2)} = €{(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 