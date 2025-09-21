import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { getMultilingualText } from '../../utils/api';

interface OrderItem {
  _id: string;
  productId: {
    _id: string;
    name: { en: string; de: string };
    description?: { en: string; de: string };
    categories?: { name: { en: string; de: string } }[];
    images: string[];
    slug: string;
    price: number;
  };
  quantity: number;
  price: number;
}

interface ShippingDetails {
  recipientName: string;
  recipientPhone: string;
  address: {
    streetName: string;
    houseNumber?: string;
    postalCode: string;
    city: string;
    countryCode: string;
  };
  specialInstructions?: string;
}

interface TransactionSummary {
  orderId: string;
  transactionId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  paymentMethod: string;
  paymentGateway: string;
  currency: string;
  amountPaid: number;
  amountRefunded: number;
  refundStatus: string;
  paymentStatus: string;
  paymentDate: string;
  paymentVerifiedAt: string;
  webhookReceived: boolean;
  webhookEvents: any[];
  failureReason?: string;
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
  transactionSummary: TransactionSummary;
}

const OrderConfirmationPage: React.FC = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const { user, tokens } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const headers: any = {};
      
      // Add authorization header if user is authenticated
      if (tokens?.accessToken) {
        headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
      
      const response = await api.get(`/orders/${orderId}`, { headers });
      setOrder(response.data.data.order);
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      setDownloading(true);
      const config: any = { 
        responseType: 'blob',
        headers: {}
      };
      
      // Add authorization header if user is authenticated
      if (tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
      
      const response = await api.get(`/orders/${orderId}/receipt`, config);

      // Create blob link to download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${order?.orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading receipt:', err);
      setError('Failed to download receipt');
    } finally {
      setDownloading(false);
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

  // Allow both authenticated users and guest users with valid tokens
  if (!user && !tokens) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view order details</h2>
          <a href="/login" className="text-blue-600 hover:text-blue-800">Go to Login</a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The order you are looking for does not exist.'}</p>
          <div className="space-x-4">
            {user ? (
              <a href="/orders" className="text-blue-600 hover:text-blue-800">View All Orders</a>
            ) : (
              <a href="/" className="text-blue-600 hover:text-blue-800">Go Home</a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-lg text-gray-600">
              Thank you for your order. We've received your payment and will process your order shortly.
            </p>
          </div>

          {/* Order Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Order #{order.orderId}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <div key={item._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <img
                        src={item.productId.images[0] || '/images/products/placeholder.svg'}
                        alt={getMultilingualText(item.productId?.name) || 'Product'}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">
                        {getMultilingualText(item.productId?.name) || 'Unknown Product'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {item.productId.categories?.[0]?.name?.en || 'General'}
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
                      <p className="text-sm font-semibold text-gray-900">
                        Total: ₹{((item.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                <span className="text-2xl font-bold text-gray-900">₹{order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          {order.transactionSummary && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Transaction ID</p>
                    <p className="text-sm text-gray-900 font-mono">{order.transactionSummary.transactionId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Payment Method</p>
                    <p className="text-sm text-gray-900 capitalize">{order.transactionSummary?.paymentMethod || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Payment Status</p>
                    <p className="text-sm text-green-600 font-semibold capitalize">{order.transactionSummary?.paymentStatus || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Amount Paid</p>
                    <p className="text-sm text-gray-900">₹{order.transactionSummary?.amountPaid?.toFixed(2) || order.totalPrice?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Payment Date</p>
                    <p className="text-sm text-gray-900">
                      {order.transactionSummary.paymentDate ? 
                        new Date(order.transactionSummary.paymentDate).toLocaleString('en-IN') : 
                        'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Currency</p>
                    <p className="text-sm text-gray-900">{order.transactionSummary.currency}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Address */}
          {order.shippingDetails && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Delivery Address</h3>
              </div>
              <div className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  <p className="font-semibold">{order.shippingDetails.recipientName}</p>
                  <p>{order.shippingDetails.recipientPhone}</p>
                  <p>
                    {order.shippingDetails.address.streetName} {order.shippingDetails.address.houseNumber}
                  </p>
                  <p>
                    {order.shippingDetails.address.city} - {order.shippingDetails.address.postalCode}
                  </p>
                  <p>{order.shippingDetails.address.countryCode}</p>
                  {order.shippingDetails.specialInstructions && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-800">
                        <strong>Special Instructions:</strong> {order.shippingDetails.specialInstructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownloadReceipt}
              disabled={downloading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Receipt
                </>
              )}
            </button>
            <a
              href="/orders"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View All Orders
            </a>
            <a
              href="/products"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Continue Shopping
            </a>
          </div>

          {/* Next Steps */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• You will receive an email confirmation shortly</li>
              <li>• Your order will be processed within 1-2 business days</li>
              <li>• You'll receive tracking information once your order is dispatched</li>
              <li>• Expected delivery: 3-7 business days</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderConfirmationPage;
