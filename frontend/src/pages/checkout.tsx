/**
 * Enhanced Checkout Page - Modal-based Tab System
 * Supports both authenticated users and guest checkout
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import AdminTabs from '../components/AdminTabs';
import RecipientAddresses from '../components/RecipientAddresses';
import api from '../utils/api';

type TabType = 'login' | 'guest';

interface GuestFormData {
  name: string;
  email: string;
  phone: string;
  deliveryAddress: {
    street: string;
    houseNumber: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  deliveryAddress: {
    street: string;
    houseNumber: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

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

interface OrderRecipient {
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

export default function Checkout() {
  const router = useRouter();
  const { cart, clearCart, refreshCart } = useCart();
  const { user, login, token } = useAuth();
  const { wishlist } = useWishlist();
  
  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedRecipientAddress, setSelectedRecipientAddress] = useState<RecipientAddress | null>(null);
  const [previousOrderRecipients, setPreviousOrderRecipients] = useState<OrderRecipient[]>([]);
  const [showPreviousRecipients, setShowPreviousRecipients] = useState(false);

  // Fetch previous order recipients when user is authenticated
  useEffect(() => {
    if (token && user) {
      fetchPreviousOrderRecipients();
    }
  }, [token, user]);

  const fetchPreviousOrderRecipients = async () => {
    try {
      const res = await api.get('/orders/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Extract unique recipients from previous orders
      const recipients = res.data
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

  // Form data
  const [guestData, setGuestData] = useState<GuestFormData>({
    name: '',
    email: '',
    phone: '',
    deliveryAddress: {
      street: '',
      houseNumber: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    paymentMethod: 'razorpay'
  });

  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    deliveryAddress: {
      street: '',
      houseNumber: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    }
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      router.push('/cart');
    }
  }, [cart.length, router]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0; // Free shipping for now
  const total = subtotal + shipping;

  // Handle authenticated user order placement
  const handleAuthenticatedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!selectedRecipientAddress) {
      setError('Please select a recipient address');
      setLoading(false);
      return;
    }

    try {
      // Place order using authenticated user's details
      await api.post('/orders', {
        products: cart.map(item => ({ product: item.product, quantity: item.quantity })),
        paymentMethod: guestData.paymentMethod,
        recipientAddress: {
          name: selectedRecipientAddress.name,
          phone: selectedRecipientAddress.phone,
          address: selectedRecipientAddress.address,
          additionalInstructions: selectedRecipientAddress.additionalInstructions
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Order placed successfully!');
      
      // Clear cart and localStorage only after successful order
      clearCart();
      localStorage.removeItem('cart');
      localStorage.removeItem('wishlist');
      
      router.push('/orders');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Order placement failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle guest checkout
  const handleGuestCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Create guest user
      const guestResponse = await api.post('/auth/guest', guestData);
      const data = guestResponse.data as { data: { token: string; user: any } };
      const { token: guestToken, user: guestUser } = data.data;

      // Merge guest data with existing cart/wishlist
      await mergeGuestData(guestToken);

      // Place order
      await api.post('/orders', {
        products: cart.map(item => ({ product: item.product, quantity: item.quantity })),
        deliveryAddress: guestData.deliveryAddress,
        paymentMethod: guestData.paymentMethod,

      }, {
        headers: { Authorization: `Bearer ${guestToken}` }
      });

      setSuccess('Order placed successfully! Guest account created.');
      
      // Clear cart and localStorage only after successful order
      clearCart();
      localStorage.removeItem('cart');
      localStorage.removeItem('wishlist');
      
      router.push('/orders');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Guest checkout failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', loginData);
      const data = response.data as { data: { token: string; user: any } };
      const { token: loginToken, user: loginUser } = data.data;
      
      // Merge guest data with account
      await mergeGuestData(loginToken);
      
      login(loginToken, data.data.user);
      setSuccess('Login successful! Your cart and wishlist have been merged.');
      setShowAuthModal(false);
      
      // Refresh cart to ensure it's up to date
      refreshCart();
      
      // Redirect to order confirmation
      setTimeout(() => {
        router.push('/orders');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', registerData);
      const data = response.data as { data: { token: string; user: any } };
      const { token: registerToken, user: registerUser } = data.data;
      
      // Merge guest data with new account
      await mergeGuestData(registerToken);
      
      login(registerToken, data.data.user);
      setSuccess('Registration successful! Your cart and wishlist have been merged.');
      setShowAuthModal(false);
      
      // Refresh cart to ensure it's up to date
      refreshCart();
      
      // Redirect to order confirmation
      setTimeout(() => {
        router.push('/orders');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Merge guest data (cart/wishlist) with user account
  const mergeGuestData = async (userToken: string) => {
    try {
      // Get local cart and wishlist data
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const localWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

      // Merge cart data
      if (localCart.length > 0) {
        await api.post('/cart/merge', { items: localCart }, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
      }

      // Merge wishlist data
      if (localWishlist.length > 0) {
        await api.post('/wishlist/merge', { items: localWishlist }, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
      }

      // Note: We don't clear localStorage here to preserve cart items
      // Cart will be cleared only after successful order placement
      console.log('Guest data merged successfully');
    } catch (error) {
      console.error('Error merging guest data:', error);
      // Don't fail the entire process if merge fails
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Complete Your Order</h1>
        
        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Shipping:</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment & Delivery Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Payment & Delivery</h2>
            
            {user ? (
              // Authenticated user - show recipient selection and payment
              <div>
                {/* Recipient Address Selection */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
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
                
                <form onSubmit={handleAuthenticatedOrder}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Method</label>
                      <select 
                        value={guestData.paymentMethod}
                        onChange={(e) => setGuestData({...guestData, paymentMethod: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="razorpay">Razorpay (Credit/Debit Card)</option>
                        <option value="cod">Cash on Delivery</option>
                      </select>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={loading || !selectedRecipientAddress}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                      {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                    </button>
                  </div>
                </form>

                {!selectedRecipientAddress && (
                  <div className="mt-4 text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Please select a recipient address to continue with your order.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Non-authenticated user - show authentication options
              <div>
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">Please choose how you'd like to proceed:</p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Login / Register
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('guest')}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Continue as Guest
                    </button>
                  </div>
                </div>

                {/* Guest Checkout Form */}
                {activeTab === 'guest' && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Guest Checkout</h3>
                    <form onSubmit={handleGuestCheckout}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Full Name *</label>
                          <input
                            type="text"
                            value={guestData.name}
                            onChange={(e) => setGuestData({...guestData, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Email *</label>
                          <input
                            type="email"
                            value={guestData.email}
                            onChange={(e) => setGuestData({...guestData, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Phone Number *</label>
                          <input
                            type="tel"
                            value={guestData.phone}
                            onChange={(e) => setGuestData({...guestData, phone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Street Address *</label>
                            <input
                              type="text"
                              value={guestData.deliveryAddress.street}
                              onChange={(e) => {
                                setGuestData({
                                  ...guestData,
                                  deliveryAddress: {
                                    ...guestData.deliveryAddress,
                                    street: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Street address"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">House/Flat Number *</label>
                            <input
                              type="text"
                              value={guestData.deliveryAddress.houseNumber}
                              onChange={(e) => {
                                setGuestData({
                                  ...guestData,
                                  deliveryAddress: {
                                    ...guestData.deliveryAddress,
                                    houseNumber: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="House/Flat number"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">City *</label>
                            <input
                              type="text"
                              value={guestData.deliveryAddress.city}
                              onChange={(e) => {
                                setGuestData({
                                  ...guestData,
                                  deliveryAddress: {
                                    ...guestData.deliveryAddress,
                                    city: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="City"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">State *</label>
                            <input
                              type="text"
                              value={guestData.deliveryAddress.state}
                              onChange={(e) => {
                                setGuestData({
                                  ...guestData,
                                  deliveryAddress: {
                                    ...guestData.deliveryAddress,
                                    state: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="State"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">ZIP Code *</label>
                            <input
                              type="text"
                              value={guestData.deliveryAddress.zipCode}
                              onChange={(e) => {
                                setGuestData({
                                  ...guestData,
                                  deliveryAddress: {
                                    ...guestData.deliveryAddress,
                                    zipCode: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="ZIP Code"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Payment Method</label>
                          <select 
                            value={guestData.paymentMethod}
                            onChange={(e) => setGuestData({...guestData, paymentMethod: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="razorpay">Razorpay (Credit/Debit Card)</option>
                            <option value="cod">Cash on Delivery</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                        >
                          {loading ? 'Processing...' : `Complete Order - $${total.toFixed(2)}`}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Authentication Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Login / Register</h2>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="mb-4">
                <AdminTabs
                  tabs={['Login', 'Register']}
                  activeTab={isRegistering ? 'Register' : 'Login'}
                  onTabChange={(tab) => setIsRegistering(tab === 'Register')}
                />
              </div>

              {!isRegistering ? (
                <form onSubmit={handleLogin}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Password</label>
                      <input
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                      {loading ? 'Logging in...' : 'Login & Continue'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Password</label>
                      <input
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Street Address *</label>
                        <input
                          type="text"
                          value={registerData.deliveryAddress.street}
                          onChange={(e) => {
                            setRegisterData({
                              ...registerData,
                              deliveryAddress: {
                                ...registerData.deliveryAddress,
                                street: e.target.value
                              }
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Street address"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">House/Flat Number *</label>
                        <input
                          type="text"
                          value={registerData.deliveryAddress.houseNumber}
                          onChange={(e) => {
                            setRegisterData({
                              ...registerData,
                              deliveryAddress: {
                                ...registerData.deliveryAddress,
                                houseNumber: e.target.value
                              }
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="House/Flat number"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">City *</label>
                        <input
                          type="text"
                          value={registerData.deliveryAddress.city}
                          onChange={(e) => {
                            setRegisterData({
                              ...registerData,
                              deliveryAddress: {
                                ...registerData.deliveryAddress,
                                city: e.target.value
                              }
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="City"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">State *</label>
                        <input
                          type="text"
                          value={registerData.deliveryAddress.state}
                          onChange={(e) => {
                            setRegisterData({
                              ...registerData,
                              deliveryAddress: {
                                ...registerData.deliveryAddress,
                                state: e.target.value
                              }
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="State"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">ZIP Code *</label>
                        <input
                          type="text"
                          value={registerData.deliveryAddress.zipCode}
                          onChange={(e) => {
                            setRegisterData({
                              ...registerData,
                              deliveryAddress: {
                                ...registerData.deliveryAddress,
                                zipCode: e.target.value
                              }
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="ZIP Code"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                      {loading ? 'Creating Account...' : 'Create Account & Continue'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
