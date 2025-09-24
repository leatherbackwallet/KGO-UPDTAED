import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import api from '../utils/api';
import { getMultilingualText } from '../utils/api';

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
  status: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  recipientAddress: RecipientAddress;
  statusHistory?: Array<{
    status: string;
    timestamp: Date;
    notes?: string;
    updatedBy?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const OrdersPage: React.FC = () => {
  const { user, tokens } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/my');
      setOrders(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (orderId: string) => {
    try {
      setDownloading(orderId);
      const config: any = { 
        responseType: 'blob',
        headers: {}
      };
      
      // Add authorization header if user is authenticated
      if (tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
      
      const response = await api.get(`/orders/${orderId}/receipt`, config);

      console.log('Download response:', {
        status: response.status,
        headers: response.headers,
        dataType: typeof response.data,
        dataSize: response.data?.size || response.data?.length || 'unknown'
      });

      // Create blob link to download file
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/pdf' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Determine file extension based on content type
      const contentType = response.headers['content-type'] || '';
      const isPDF = contentType.includes('application/pdf');
      const fileExtension = isPDF ? 'pdf' : 'txt';
      
      link.setAttribute('download', `receipt-${orderId}.${fileExtension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading receipt:', err);
      setError('Failed to download receipt');
    } finally {
      setDownloading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your orders</h2>
          <a href="/login" className="text-blue-600 hover:text-blue-800">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-2">Track your orders and view order history</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
              <a href="/items" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Start Shopping
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Order Header */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="px-6 py-4">
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item._id} className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <img
                              src={item.productId.images[0] || '/images/products/placeholder.svg'}
                              alt={getMultilingualText(item.productId?.name) || 'Product'}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {getMultilingualText(item.productId?.name) || 'Unknown Product'}
                            </h4>
                            <p className="text-sm text-gray-500">
                              📂 {(() => {
                                if (!item.productId.categories || !item.productId.categories[0]) return 'Uncategorized';
                                const category = item.productId.categories[0];
                                if (typeof category === 'string') return category;
                                if (category.name) {
                                  return getMultilingualText(category.name);
                                }
                                return 'Uncategorized';
                              })()}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {getMultilingualText(item.productId.description) || 'No description available'}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ₹{item.price.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Footer */}
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="mb-4 sm:mb-0">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Recipient Address</h4>
                        <div className="text-sm text-gray-600">
                          <p><strong>{order.recipientAddress.name}</strong></p>
                          <p>{order.recipientAddress.phone}</p>
                          <p>
                            {order.recipientAddress.address.streetName} {order.recipientAddress.address.houseNumber}
                          </p>
                          <p>
                            {order.recipientAddress.address.postalCode} {order.recipientAddress.address.city}
                          </p>
                          {order.recipientAddress.additionalInstructions && (
                            <p className="mt-2 text-gray-500">
                              <strong>Instructions:</strong> {order.recipientAddress.additionalInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          Total: ₹{order.totalAmount.toFixed(2)}
                        </p>
                        {order.paymentMethod && (
                          <p className="text-sm text-gray-600 mt-1">
                            Payment: {order.paymentMethod === 'cod-test' ? 'COD (Cash on Delivery)' : 'Online Payment'}
                          </p>
                        )}
                        <div className="mt-3">
                          <button
                            onClick={() => handleDownloadReceipt(order._id)}
                            disabled={downloading === order._id}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {downloading === order._id ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Receipt
                              </>
                            )}
                          </button>
                        </div>
                        <OrderStatusTimeline currentStatus={order.status} statusHistory={order.statusHistory || []} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrdersPage;

// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  };
}
