import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import RecipientAddresses from '../components/RecipientAddresses';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import api from '../utils/api';

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
  orderItems?: { 
    productId: { 
      _id: string;
      name: { en: string; de: string }; 
      price: number;
      images?: string[];
      description?: { en: string; de: string };
      categories?: { name: { en: string; de: string } }[];
    }; 
    quantity: number; 
    price: number 
  }[];
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

export default function Orders() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRecipientModal, setShowRecipientModal] = useState(false);

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get<Order[]>('/orders/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        {error && <div className="text-red-600 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
        
        {loading ? (
          <div className="text-gray-600">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-4">Start shopping to see your orders here</p>
            <a href="/products" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Browse Products
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order._id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order._id.slice(-6)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Products */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">📦 Products</h4>
                    <div className="space-y-4">
                      {order.orderItems?.map((item, i) => (
                        <div key={i} className="flex items-start space-x-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            {item.productId?.images && item.productId.images.length > 0 ? (
                              <img 
                                src={`http://localhost:5001/images/${item.productId.images[0]}`}
                                alt={item.productId.name?.en || 'Product'}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/images/products/placeholder.svg';
                                }}
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900 text-lg">
                                  {item.productId?.name?.en || 'Unknown Product'}
                                </h5>
                                {item.productId?.categories && item.productId.categories.length > 0 && (
                                  <p className="text-sm text-gray-500 mb-1">
                                    📂 {item.productId.categories[0].name?.en || 'Uncategorized'}
                                  </p>
                                )}
                                {item.productId?.description && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {item.productId.description.en || item.productId.description.de || 'No description available'}
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span className="flex items-center">
                                    <span className="font-medium">Quantity:</span>
                                    <span className="ml-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                      {item.quantity}
                                    </span>
                                  </span>
                                  <span className="flex items-center">
                                    <span className="font-medium">Unit Price:</span>
                                    <span className="ml-1">€{item.price.toFixed(2)}</span>
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  €{(item.price * item.quantity).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.quantity > 1 ? `${item.quantity} × €${item.price.toFixed(2)}` : ''}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Order Summary */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="font-semibold text-blue-900 mb-3">📋 Order Summary</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Items ({order.orderItems?.length || 0}):</span>
                          <span className="font-medium">€{(order.orderItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping:</span>
                          <span className="font-medium">€0.00</span>
                        </div>
                        <div className="border-t border-blue-200 pt-2 flex justify-between items-center">
                          <span className="text-lg font-bold text-blue-900">Total:</span>
                          <span className="text-xl font-bold text-green-600">
                            €{(order.totalPrice || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recipient Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">🎁 Gift Recipient</h4>
                    {order.shippingDetails ? (
                      <div className="space-y-2">
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
                          className="text-sm text-blue-600 hover:text-blue-800 underline mt-2"
                        >
                          Change Recipient
                        </button>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">
                        No recipient information
                        <button
                          onClick={() => openRecipientModal(order)}
                          className="block text-sm text-blue-600 hover:text-blue-800 underline mt-1"
                        >
                          Add Recipient
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="mt-6">
                  <OrderStatusTimeline
                    currentStatus={order.orderStatus}
                    statusHistory={order.statusHistory || []}
                    className=""
                  />
                </div>
              </div>
            ))}
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
      </main>
    </>
  );
}
