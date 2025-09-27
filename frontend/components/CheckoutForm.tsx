import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import RecipientAddresses from './RecipientAddresses';
import RazorpayPayment from './RazorpayPayment';
import api from '../utils/api';
import { validatePaymentResponse } from '../utils/razorpay';
import { createStandardRecipientAddress } from '../utils/addressMapping';

interface RecipientAddress {
  name: string;
  phone: string;
  address: {
    streetName: string;
    houseNumber?: string;
    postalCode: string;
    city: string;
    countryCode: string;
  };
  additionalInstructions?: string;
  isDefault: boolean;
}

interface OrderRecipient {
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

interface GuestFormData {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: {
    street: string;
    houseNumber?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  specialInstructions?: string;
  paymentMethod: string;
}

interface CheckoutFormProps {
  guestData?: GuestFormData;
  isGuest?: boolean;
}

export default function CheckoutForm({ guestData, isGuest = false }: CheckoutFormProps) {
  const { cart, clearCart } = useCart();
  const { user, tokens } = useAuth();
  const [selectedRecipientAddress, setSelectedRecipientAddress] = useState<RecipientAddress | null>(null);
  const [previousOrderRecipients, setPreviousOrderRecipients] = useState<OrderRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreviousRecipients, setShowPreviousRecipients] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Fetch previous order recipients
  useEffect(() => {
    if (tokens?.accessToken) {
      fetchPreviousOrderRecipients();
    }
  }, [tokens]);

  const fetchPreviousOrderRecipients = async () => {
    try {
      const res = await api.get('/orders/my', {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` }
      });
      
      // Extract unique recipients from previous orders
      const orders = res.data.data || res.data || [];
      const recipients = orders
        .filter((order: any) => order.shippingDetails)
        .map((order: any) => order.shippingDetails)
        .filter((recipient: OrderRecipient, index: number, self: OrderRecipient[]) => 
          index === self.findIndex((r: OrderRecipient) => 
            r.recipientName === recipient.recipientName && 
            r.recipientPhone === recipient.recipientPhone &&
            r.address.streetName === recipient.address.streetName &&
            r.address.houseNumber === recipient.address.houseNumber
          )
        );
      
      setPreviousOrderRecipients(recipients);
    } catch (err) {
      console.error('Error fetching previous recipients:', err);
    }
  };

  const handlePreviousRecipientSelect = (recipient: OrderRecipient) => {
    const convertedRecipient: RecipientAddress = {
      name: recipient.recipientName,
      phone: recipient.recipientPhone,
      address: recipient.address,
      additionalInstructions: recipient.specialInstructions,
      isDefault: false
    };
    setSelectedRecipientAddress(convertedRecipient);
    setShowPreviousRecipients(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!selectedRecipientAddress) {
      setError('Please select a recipient address');
      setLoading(false);
      return;
    }

    try {
      // Handle COD payment (development only)
      if (paymentMethod === 'cod-test' || paymentMethod === 'cod') {
        if (process.env.NODE_ENV !== 'development') {
          setError('COD payment is only available in development environment');
          setLoading(false);
          return;
        }

        // Create COD order directly
        const codOrderResponse = await api.post('/orders', {
          products: cart.map(item => ({
            product: item.product,
            quantity: item.quantity,
            // Include combo-specific fields if it's a combo product
            ...(item.isCombo && {
              isCombo: item.isCombo,
              comboBasePrice: item.comboBasePrice,
              comboItemConfigurations: item.comboItemConfigurations
            })
          })),
          recipientAddress: {
            name: selectedRecipientAddress.name,
            phone: selectedRecipientAddress.phone,
            address: selectedRecipientAddress.address,
            additionalInstructions: selectedRecipientAddress.additionalInstructions
          },
          paymentMethod: paymentMethod
        }, {
          headers: { Authorization: `Bearer ${tokens?.accessToken}` }
        });

        if (codOrderResponse.data.success) {
          setSuccess('COD order placed successfully! You will receive a confirmation shortly.');
          
          // Clear cart and localStorage only after successful order
          clearCart();
          localStorage.removeItem('cart');
          localStorage.removeItem('wishlist');
          
          // Redirect to order confirmation page with order ID
          const orderId = codOrderResponse.data.data.order.id;
          setTimeout(() => {
            window.location.href = `/order-confirmation/${orderId}`;
          }, 2000);
        } else {
          setError(codOrderResponse.data.error?.message || 'Failed to create COD order');
        }
        setLoading(false);
        return;
      }

      // Create payment order for Razorpay
      const response = await api.post('/payments/create-order', {
        products: cart.map(item => ({
          product: item.product,
          quantity: item.quantity,
          // Include combo-specific fields if it's a combo product
          ...(item.isCombo && {
            isCombo: item.isCombo,
            comboBasePrice: item.comboBasePrice,
            comboItemConfigurations: item.comboItemConfigurations
          })
        })),
        recipientAddress: createStandardRecipientAddress(selectedRecipientAddress, false)
      }, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` }
      });

      if (response.data.success) {
        setPaymentData(response.data.data);
        setShowPayment(true);
      } else {
        setError(response.data.error?.message || 'Failed to create payment order');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create payment order');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentResponse: any) => {
    try {
      setLoading(true);
      
      // Verify payment
      const verifyResponse = await api.post('/payments/verify', paymentResponse, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` }
      });

      if (verifyResponse.data.success) {
        setSuccess('Payment successful! Your order has been placed and will be delivered to the selected recipient.');
        clearCart();
        setSelectedRecipientAddress(null);
        setShowPayment(false);
        setPaymentData(null);
        
        // Redirect to order confirmation page with order ID
        const orderId = verifyResponse.data.data.orderId;
        window.location.href = `/order-confirmation/${orderId}`;
      } else {
        setError(verifyResponse.data.error?.message || 'Payment verification failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: any) => {
    setError(`Payment failed: ${error.description || error.message || 'Unknown error'}`);
    setShowPayment(false);
    setPaymentData(null);
  };

  const handlePaymentClose = () => {
    setShowPayment(false);
    setPaymentData(null);
  };

  const handlePaymentStatusCheck = async (status: 'checking' | 'success' | 'failed' | 'unknown') => {
    console.log('Payment status check triggered in CheckoutForm:', status);
    
    if (status === 'checking') {
      setLoading(true);
      setError('');
      setSuccess('Checking payment status...');
      return;
    }
    
    if (status === 'success') {
      // Payment was successful, proceed with verification
      if (paymentData) {
        await handlePaymentSuccess(paymentData);
      }
      return;
    }
    
    if (status === 'failed') {
      setError('Payment failed. Please try again.');
      setLoading(false);
      return;
    }
    
    if (status === 'unknown') {
      // Payment status is unclear, we need to check with backend
      console.log('Payment status unknown, checking with backend...');
      await checkPaymentStatusWithBackend();
    }
  };

  const checkPaymentStatusWithBackend = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('Checking payment status...');
      
      // Import the payment status utility
      const { checkPaymentStatusWithFallback } = await import('../utils/paymentStatus');
      
      // Get the current payment data from state
      if (!paymentData) {
        console.error('No payment data available for status check');
        setError('Unable to check payment status. Please contact support if payment was deducted.');
        setLoading(false);
        return;
      }
      
      console.log('Checking payment status with data:', paymentData);
      
      const result = await checkPaymentStatusWithFallback(
        paymentData,
        tokens?.accessToken,
        {
          maxRetries: 3,
          retryDelay: 1000,
          enablePolling: true
        }
      );
      
      console.log('Payment status check result:', result);
      
      if (result.success) {
        if (result.status === 'verified') {
          // Payment is already verified, redirect to order confirmation
          setSuccess('Payment verified! Your order has been confirmed.');
          clearCart();
          setSelectedRecipientAddress(null);
          setShowPayment(false);
          setPaymentData(null);
          
          if (result.orderId) {
            window.location.href = `/order-confirmation/${result.orderId}`;
          }
        } else if (result.status === 'payment_success' && result.needsVerification) {
          // Payment succeeded but needs verification, try to verify
          if (paymentData.razorpay_payment_id && paymentData.razorpay_order_id) {
            setSuccess('Payment successful! Verifying payment...');
            await handlePaymentSuccess(paymentData);
          } else {
            setError('Payment successful but verification data is missing. Please contact support.');
          }
        } else if (result.status === 'payment_failed') {
          setError('Payment failed. Please try again.');
        } else {
          setError('Payment status is unclear. Please contact support if payment was deducted.');
        }
      } else {
        setError(result.message || 'Unable to verify payment status. Please contact support if payment was deducted.');
      }
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      setError('Error checking payment status. Please contact support if payment was deducted.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">Please log in to checkout</p>
        <a href="/login" className="text-blue-600 hover:text-blue-700">
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Complete Your Order</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Address Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">🎁 Gift Recipient</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select who will receive this gift, or add a new recipient address.
          </p>
          
          {/* Previous Order Recipients */}
          {previousOrderRecipients.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">📋 Previously Used Recipients</h4>
                <button
                  type="button"
                  onClick={() => setShowPreviousRecipients(!showPreviousRecipients)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {showPreviousRecipients ? 'Hide' : 'Show'} ({previousOrderRecipients.length})
                </button>
              </div>
              
              {showPreviousRecipients && (
                <div className="space-y-2 mb-4">
                  {previousOrderRecipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => handlePreviousRecipientSelect(recipient)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{recipient.recipientName}</div>
                          <div className="text-sm text-gray-600">{recipient.recipientPhone}</div>
                          <div className="text-sm text-gray-700">
                            {recipient.address.streetName} {recipient.address.houseNumber}, {recipient.address.postalCode} {recipient.address.city}
                          </div>
                          {recipient.specialInstructions && (
                            <div className="text-sm text-gray-600 italic mt-1">
                              📝 {recipient.specialInstructions}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Saved Recipient Addresses */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-3">💾 Saved Recipient Addresses</h4>
            <RecipientAddresses
              onAddressSelect={setSelectedRecipientAddress}
              selectedAddress={selectedRecipientAddress}
              showAddButton={true}
              className=""
            />
          </div>

          {selectedRecipientAddress && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">✅ Selected Recipient:</h4>
              <p className="text-sm text-blue-800">
                <strong>{selectedRecipientAddress.name}</strong><br />
                📞 {selectedRecipientAddress.phone}<br />
                📍 {selectedRecipientAddress.address.streetName} {selectedRecipientAddress.address.houseNumber}<br />
                {selectedRecipientAddress.address.postalCode} {selectedRecipientAddress.address.city}, {selectedRecipientAddress.address.countryCode}
                {selectedRecipientAddress.additionalInstructions && (
                  <>
                    <br />
                    📝 <em>{selectedRecipientAddress.additionalInstructions}</em>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">📋 Order Summary</h3>
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.product} className="flex items-center space-x-3 py-2 border-b border-gray-200 last:border-b-0">
                {/* Product Thumbnail */}
                <div className="flex-shrink-0">
                  <img 
                    src={item.image || '/images/products/placeholder.svg'} 
                    alt={item.name} 
                    className="w-12 h-12 object-cover rounded border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/products/placeholder.svg';
                    }}
                  />
                </div>
                
                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-500">Qty: {item.quantity} × ₹{item.price.toFixed(2)}</div>
                </div>
                
                {/* Total Price */}
                <div className="text-right">
                  <span className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
            <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-xl font-bold text-blue-600">₹{subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">💳 Payment Method</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="razorpay"
                checked={paymentMethod === 'razorpay'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Razorpay (Credit/Debit Card)</div>
                <div className="text-sm text-gray-500">Secure online payment</div>
              </div>
            </label>
            
            {process.env.NODE_ENV === 'development' && (
              <>
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Cash on Delivery (COD)</div>
                    <div className="text-sm text-gray-500">Payment collected on delivery</div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod-test"
                    checked={paymentMethod === 'cod-test'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">COD-TEST (Development Only)</div>
                    <div className="text-sm text-gray-500">Cash on Delivery - Payment collected on delivery</div>
                  </div>
                </label>
              </>
            )}
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-blue-900">🚚 Delivery Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Free delivery within India</li>
            <li>• Delivery time: 2-3 business days</li>
            <li>• Gift will be delivered to the selected recipient</li>
            <li>• You can add a gift message during checkout</li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || cart.length === 0 || !selectedRecipientAddress}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Order...
            </span>
          ) : (
            `Pay ₹${subtotal.toFixed(2)}`
          )}
        </button>

        {!selectedRecipientAddress && cart.length > 0 && (
          <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              ⚠️ Please select a recipient address to continue with your order.
            </p>
          </div>
        )}
      </form>

      {/* Razorpay Payment Component */}
      {showPayment && paymentData && (
        <RazorpayPayment
          orderData={paymentData}
          customerData={{
            name: user ? `${user.firstName} ${user.lastName}` : (guestData?.senderName || 'Customer'),
            email: user ? user.email : (guestData?.senderEmail || ''),
            contact: user ? user.phone : (guestData?.senderPhone || '')
          }}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onClose={handlePaymentClose}
          onStatusCheck={handlePaymentStatusCheck}
        />
      )}
    </div>
  );
}

