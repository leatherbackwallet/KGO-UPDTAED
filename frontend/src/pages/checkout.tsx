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
import RazorpayPayment from '../components/RazorpayPayment';
import api from '../utils/api';
import { validatePaymentResponse } from '../utils/razorpay';
import { createStandardRecipientAddress } from '../utils/addressMapping';

type TabType = 'login' | 'guest';

interface GuestFormData {
  // Sender Information (User placing the order)
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  // Recipient Information (Person receiving the gift)
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: {
    street: string;
    houseNumber: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  specialInstructions?: string;
  paymentMethod: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  // User Account Information
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone: string;
  // User's Address (for billing/account purposes)
  userAddress: {
    street: string;
    houseNumber?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  // Recipient Information (Person receiving the gift)
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
}

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

export default function Checkout() {
  const router = useRouter();
  const { cart, clearCart, refreshCart } = useCart();
  const { user, login, tokens, isLoading, isAuthenticated } = useAuth();
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
  const [paymentData, setPaymentData] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [guestTokens, setGuestTokens] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);

  // Fetch previous order recipients when user is authenticated
  useEffect(() => {
    if (tokens?.accessToken && user) {
      fetchPreviousOrderRecipients();
    }
  }, [tokens, user]);

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

  // Form data
  const [guestData, setGuestData] = useState<GuestFormData>({
    senderName: '',
    senderEmail: '',
    senderPhone: '',
    recipientName: '',
    recipientPhone: '',
    deliveryAddress: {
      street: '',
      houseNumber: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    specialInstructions: '',
    paymentMethod: 'razorpay'
  });

  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    userAddress: {
      street: '',
      houseNumber: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    recipientName: '',
    recipientPhone: '',
    deliveryAddress: {
      street: '',
      houseNumber: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    specialInstructions: ''
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
      // Create payment order
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
      
      // Use guest tokens if available, otherwise use authenticated user tokens
      const authToken = guestTokens?.accessToken || tokens?.accessToken;
      
      // Verify payment
      const verifyResponse = await api.post('/payments/verify', paymentResponse, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (verifyResponse.data.success) {
        const successMessage = guestTokens 
          ? 'Payment successful! Your order has been placed and will be delivered to the provided address.'
          : 'Payment successful! Your order has been placed and will be delivered to the selected recipient.';
        
        setSuccess(successMessage);
        clearCart();
        localStorage.removeItem('cart');
        localStorage.removeItem('wishlist');
        setSelectedRecipientAddress(null);
        setShowPayment(false);
        setPaymentData(null);
        // Don't clear guest tokens immediately - keep them for order confirmation
        
        // Redirect to order confirmation page with order ID
        const orderId = verifyResponse.data.data.orderId;
        router.push(`/order-confirmation/${orderId}`);
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
    console.error('Payment error:', error);
    
    let errorMessage = 'Payment failed';
    
    // Handle different types of payment errors
    if (error.code) {
      switch (error.code) {
        case 'BAD_REQUEST_ERROR':
          errorMessage = 'Invalid payment details. Please check your card information.';
          break;
        case 'GATEWAY_ERROR':
          errorMessage = 'Payment gateway is temporarily unavailable. Please try again.';
          break;
        case 'NETWORK_ERROR':
          errorMessage = 'Network error occurred. Please check your internet connection.';
          break;
        case 'INSUFFICIENT_FUNDS':
          errorMessage = 'Insufficient funds. Please use a different payment method.';
          break;
        case 'CARD_DECLINED':
          errorMessage = 'Your card was declined. Please contact your bank or use a different card.';
          break;
        case 'EXPIRED_CARD':
          errorMessage = 'Your card has expired. Please use a different payment method.';
          break;
        case 'INVALID_CARD':
          errorMessage = 'Invalid card details. Please check and try again.';
          break;
        default:
          errorMessage = `Payment failed: ${error.description || error.message || 'Unknown error'}`;
      }
    } else {
      errorMessage = `Payment failed: ${error.description || error.message || 'Unknown error'}`;
    }
    
    setError(errorMessage);
    setShowPayment(false);
    setPaymentData(null);
    setGuestTokens(null); // Clear guest tokens on error
    setLoading(false); // Ensure loading state is cleared
  };

  const handlePaymentClose = () => {
    console.log('Payment modal closed by user');
    setShowPayment(false);
    setPaymentData(null);
    setGuestTokens(null); // Clear guest tokens on close
    setLoading(false); // Ensure loading state is cleared
    
    // Show a friendly message for cancellation
    if (!error && !success) {
      setError('Payment was cancelled. You can try again anytime.');
    }
  };

  // Handle guest checkout
  const handleGuestCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate guest form data
      if (!guestData.senderName.trim()) {
        setError('Your name is required');
        setLoading(false);
        return;
      }

      if (!guestData.senderEmail.trim()) {
        setError('Your email is required');
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestData.senderEmail)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (!guestData.senderPhone.trim()) {
        setError('Your phone number is required');
        setLoading(false);
        return;
      }

      if (!guestData.recipientName.trim()) {
        setError('Recipient name is required');
        setLoading(false);
        return;
      }

      if (!guestData.recipientPhone.trim()) {
        setError('Recipient phone number is required');
        setLoading(false);
        return;
      }

      if (!guestData.deliveryAddress.street.trim() || 
          !guestData.deliveryAddress.city.trim() || !guestData.deliveryAddress.state.trim() || 
          !guestData.deliveryAddress.zipCode.trim()) {
        setError('Delivery address information is required');
        setLoading(false);
        return;
      }
      // Create guest user - transform data to match backend expectations
      const guestAuthData = {
        fullName: guestData.senderName,
        email: guestData.senderEmail,
        phone: guestData.senderPhone,
        address: {
          streetName: guestData.deliveryAddress.street, // This will be updated to user's address later
          houseNumber: guestData.deliveryAddress.houseNumber,
          city: guestData.deliveryAddress.city,
          postalCode: guestData.deliveryAddress.zipCode,
          countryCode: guestData.deliveryAddress.country || 'IN'
        },
        recipientName: guestData.recipientName,
        recipientPhone: guestData.recipientPhone,
        deliveryAddress: {
          street: guestData.deliveryAddress.street,
          houseNumber: guestData.deliveryAddress.houseNumber,
          city: guestData.deliveryAddress.city,
          state: guestData.deliveryAddress.state,
          zipCode: guestData.deliveryAddress.zipCode,
          country: guestData.deliveryAddress.country || 'IN'
        },
        specialInstructions: guestData.specialInstructions
      };
      
      const guestResponse = await api.post('/auth/guest', guestAuthData);
      const data = guestResponse.data as { data: { tokens: any; user: any } };
      const { tokens: guestTokens, user: guestUser } = data.data;
      
      // Store guest tokens in AuthContext for persistence
      login(guestTokens, guestUser);
      setGuestTokens(guestTokens);

      // Merge guest data with existing cart/wishlist
      await mergeGuestData(guestTokens.accessToken);

      // Handle COD payment
      if (guestData.paymentMethod === 'cod-test' || guestData.paymentMethod === 'cod') {

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
          recipientAddress: createStandardRecipientAddress(guestData, true),
          paymentMethod: guestData.paymentMethod
        }, {
          headers: { Authorization: `Bearer ${guestTokens.accessToken}` }
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
            router.push(`/order-confirmation/${orderId}`);
          }, 2000);
        } else {
          setError(codOrderResponse.data.error?.message || 'Failed to create COD order');
        }
        setLoading(false);
        return;
      }

      // Create payment order for Razorpay with timeout
      const paymentResponse = await Promise.race([
        api.post('/payments/create-order', {
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
          recipientAddress: createStandardRecipientAddress(guestData, true)
        }, {
          headers: { Authorization: `Bearer ${guestTokens.accessToken}` }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout - please try again')), 30000)
        )
      ]) as any;

      if (paymentResponse.data.success) {
        setPaymentData(paymentResponse.data.data);
        setShowPayment(true);
      } else {
        setError(paymentResponse.data.error?.message || 'Failed to create payment order');
      }
    } catch (err: any) {
      console.error('Guest checkout error:', err);
      
      let errorMessage = 'Guest checkout failed';
      
      if (err.message === 'Request timeout - please try again') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please refresh the page and try again.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.error?.message || 'Invalid data provided. Please check your information.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again in a few moments.';
      } else if (err.code === 'NETWORK_ERROR' || !navigator.onLine) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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
      const data = response.data as { data: { tokens: any; user: any } };
      const { tokens: loginTokens, user: loginUser } = data.data;
      
      // Merge guest data with account
      await mergeGuestData(loginTokens.accessToken);
      
      login(loginTokens, data.data.user);
      setSuccess('Login successful! Your cart and wishlist have been merged.');
      setShowAuthModal(false);
      
      // Refresh cart to ensure it's up to date
      refreshCart();
      
      // Stay on checkout page - no redirect needed
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (e: React.FormEvent) => {
    console.log('handleRegister called', { e, registerData });
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate registration data
      if (!registerData.firstName.trim() || !registerData.lastName.trim()) {
        setError('First name and last name are required');
        setLoading(false);
        return;
      }
      
      if (!registerData.email.trim()) {
        setError('Email is required');
        setLoading(false);
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
      
      if (!registerData.phone.trim()) {
        setError('Phone number is required');
        setLoading(false);
        return;
      }
      
      if (!registerData.password) {
        setError('Password is required');
        setLoading(false);
        return;
      }
      
      // Password complexity validation (simplified for testing)
      if (registerData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      // Confirm password validation
      if (registerData.confirmPassword && registerData.password !== registerData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Validate recipient information
      if (!registerData.recipientName.trim()) {
        setError('Recipient name is required');
        setLoading(false);
        return;
      }

      if (!registerData.recipientPhone.trim()) {
        setError('Recipient phone number is required');
        setLoading(false);
        return;
      }

      // Validate user address
      if (!registerData.userAddress.street.trim() || 
          !registerData.userAddress.city.trim() || !registerData.userAddress.state.trim() || 
          !registerData.userAddress.zipCode.trim()) {
        setError('Your address information is required');
        setLoading(false);
        return;
      }

      // Validate delivery address
      if (!registerData.deliveryAddress.street.trim() || 
          !registerData.deliveryAddress.city.trim() || !registerData.deliveryAddress.state.trim() || 
          !registerData.deliveryAddress.zipCode.trim()) {
        setError('Delivery address information is required');
        setLoading(false);
        return;
      }
      
      // Send registration data with address information
      const registrationData = {
        firstName: registerData.firstName.trim(),
        lastName: registerData.lastName.trim(),
        email: registerData.email.trim().toLowerCase(),
        password: registerData.password,
        phone: registerData.phone.trim(),
        userAddress: {
          street: registerData.userAddress.street,
          houseNumber: registerData.userAddress.houseNumber,
          city: registerData.userAddress.city,
          state: registerData.userAddress.state,
          zipCode: registerData.userAddress.zipCode,
          country: registerData.userAddress.country || 'IN'
        },
        recipientName: registerData.recipientName,
        recipientPhone: registerData.recipientPhone,
        deliveryAddress: {
          street: registerData.deliveryAddress.street,
          houseNumber: registerData.deliveryAddress.houseNumber,
          city: registerData.deliveryAddress.city,
          state: registerData.deliveryAddress.state,
          zipCode: registerData.deliveryAddress.zipCode,
          country: registerData.deliveryAddress.country || 'IN'
        },
        specialInstructions: registerData.specialInstructions
      };
      
      const response = await api.post('/auth/register', registrationData);
      const data = response.data as { data: { tokens: any; user: any } };
      const { tokens: registerTokens, user: registerUser } = data.data;
      
      // Merge guest data with new account
      await mergeGuestData(registerTokens.accessToken);
      
      login(registerTokens, data.data.user);
      setSuccess('Registration successful! Your cart and wishlist have been merged.');
      setShowAuthModal(false);
      
      // Refresh cart to ensure it's up to date
      refreshCart();
      
      // Stay on checkout page - no redirect needed
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

  // Show loading state while authentication is being initialized
  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading checkout...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Complete Your Order</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              {retryCount < maxRetries && (
                <button
                  onClick={() => {
                    setError('');
                    setRetryCount(prev => prev + 1);
                    // Retry the last action based on authentication status
                    if (isAuthenticated) {
                      handleAuthenticatedOrder(new Event('click') as any);
                    } else {
                      handleGuestCheckout(new Event('click') as any);
                    }
                  }}
                  className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Retry ({maxRetries - retryCount} left)
                </button>
              )}
            </div>
          </div>
        )}
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
                  <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Shipping:</span>
                <span>₹{shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment & Delivery Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Payment & Delivery</h2>
            
            {isAuthenticated && activeTab !== 'guest' ? (
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
                                  onClick={() => {
                                    setSelectedRecipientAddress({
                                      name: recipient.recipientName,
                                      phone: recipient.recipientPhone,
                                      address: recipient.address,
                                      additionalInstructions: recipient.specialInstructions,
                                      isDefault: false
                                    });
                                    setShowPreviousRecipients(false);
                                  }}
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
                  
                  {/* Recipient Address Selection */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">📍 Select Recipient Address</h4>
                    <p className="text-sm text-blue-800 mb-4">
                      Choose where you want to send your Kerala gifts. You can select from previous addresses or add a new one.
                    </p>
                    
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
                
                <form>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Method</label>
                      <select 
                        value="razorpay"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                      >
                        <option value="razorpay">Razorpay (Credit/Debit Card)</option>
                        <option value="cod">Cash on Delivery (COD)</option>
                        {process.env.NODE_ENV === 'development' && (
                          <option value="cod-test">COD-TEST (Development Only)</option>
                        )}
                      </select>
                    </div>
                    
                    <button 
                      type="button" 
                      disabled={loading || !selectedRecipientAddress}
                      onClick={(e) => {
                        e.preventDefault();
                        handleAuthenticatedOrder(e);
                      }}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                      {loading ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
                    </button>
                  </div>
                </form>

                {!selectedRecipientAddress && (
                  <div className="mt-4 text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-yellow-800 mb-3">
                      <p className="font-medium">⚠️ Address Required</p>
                      <p className="text-sm">Please select a recipient address to continue with your order.</p>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowPreviousRecipients(true)}
                        className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        📋 Select from Previous Addresses
                      </button>
                      <p className="text-xs text-yellow-700">Or scroll up to add a new address</p>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'guest' ? (
              // Guest checkout form
              <div>
                <h3 className="text-lg font-semibold mb-4">Guest Checkout</h3>
                <form onSubmit={handleGuestCheckout}>
                  <div className="space-y-6">
                    {/* Sender Information Section */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold mb-3 text-blue-800">Your Information (Sender)</h4>
                      <p className="text-sm text-blue-600 mb-4">This is your contact information for order updates and billing.</p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Your Full Name *</label>
                          <input
                            type="text"
                            value={guestData.senderName}
                            onChange={(e) => setGuestData({...guestData, senderName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Your Email *</label>
                          <input
                            type="email"
                            value={guestData.senderEmail}
                            onChange={(e) => setGuestData({...guestData, senderEmail: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Your Phone Number *</label>
                          <input
                            type="tel"
                            value={guestData.senderPhone}
                            onChange={(e) => setGuestData({...guestData, senderPhone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Recipient Information Section */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold mb-3 text-green-800">Recipient Information</h4>
                      <p className="text-sm text-green-600 mb-4">Who will receive this gift? This is where we'll deliver the items.</p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Recipient's Full Name *</label>
                          <input
                            type="text"
                            value={guestData.recipientName}
                            onChange={(e) => setGuestData({...guestData, recipientName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Recipient's Phone Number *</label>
                          <input
                            type="tel"
                            value={guestData.recipientPhone}
                            onChange={(e) => setGuestData({...guestData, recipientPhone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address Section */}
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold mb-3 text-orange-800">Delivery Address</h4>
                      <p className="text-sm text-orange-600 mb-4">Where should we deliver the gift?</p>
                      <div className="space-y-4">
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Street address"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">House/Flat Number</label>
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="House/Flat number (optional)"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="ZIP Code"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Special Instructions (Optional)</label>
                          <textarea
                            value={guestData.specialInstructions || ''}
                            onChange={(e) => setGuestData({...guestData, specialInstructions: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Any special delivery instructions..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Method</label>
                      <select 
                        value={guestData.paymentMethod}
                        onChange={(e) => setGuestData({...guestData, paymentMethod: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="razorpay">Razorpay (Credit/Debit Card)</option>
                        <option value="cod">Cash on Delivery (COD)</option>
                        {process.env.NODE_ENV === 'development' && (
                          <option value="cod-test">COD-TEST (Development Only)</option>
                        )}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      {loading ? 'Processing...' : `Complete Order - ₹${total.toFixed(2)}`}
                    </button>
                  </div>
                </form>
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
              </div>
            )}
          </div>
        </div>

        {/* Authentication Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
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
                  <div className="space-y-4 max-w-md mx-auto">
                    {error && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {success}
                      </div>
                    )}
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
                  <div className="space-y-6">
                    {error && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {success}
                      </div>
                    )}
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Personal Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">First Name</label>
                          <input
                            type="text"
                            value={registerData.firstName}
                            onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Last Name</label>
                          <input
                            type="text"
                            value={registerData.lastName}
                            onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
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
                      <div>
                        <label className="block text-sm font-medium mb-1">Confirm Password</label>
                        <input
                          type="password"
                          value={registerData.confirmPassword || ''}
                          onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* User Address Section */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold mb-3 text-blue-800">Your Address (for billing/account)</h4>
                      <p className="text-sm text-blue-600 mb-4">This is your personal address for account purposes.</p>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Street Address *</label>
                            <input
                              type="text"
                              value={registerData.userAddress.street}
                              onChange={(e) => {
                                setRegisterData({
                                  ...registerData,
                                  userAddress: {
                                    ...registerData.userAddress,
                                    street: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Your street address"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">House/Flat Number</label>
                            <input
                              type="text"
                              value={registerData.userAddress.houseNumber}
                              onChange={(e) => {
                                setRegisterData({
                                  ...registerData,
                                  userAddress: {
                                    ...registerData.userAddress,
                                    houseNumber: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Your house/flat number (optional)"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">City *</label>
                            <input
                              type="text"
                              value={registerData.userAddress.city}
                              onChange={(e) => {
                                setRegisterData({
                                  ...registerData,
                                  userAddress: {
                                    ...registerData.userAddress,
                                    city: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Your city"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">State *</label>
                            <input
                              type="text"
                              value={registerData.userAddress.state}
                              onChange={(e) => {
                                setRegisterData({
                                  ...registerData,
                                  userAddress: {
                                    ...registerData.userAddress,
                                    state: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Your state"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">ZIP Code *</label>
                            <input
                              type="text"
                              value={registerData.userAddress.zipCode}
                              onChange={(e) => {
                                setRegisterData({
                                  ...registerData,
                                  userAddress: {
                                    ...registerData.userAddress,
                                    zipCode: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Your ZIP code"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recipient Information Section */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold mb-3 text-green-800">Recipient Information</h4>
                      <p className="text-sm text-green-600 mb-4">Who will receive this gift? This is where we'll deliver the items.</p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Recipient's Full Name *</label>
                          <input
                            type="text"
                            value={registerData.recipientName}
                            onChange={(e) => setRegisterData({...registerData, recipientName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Recipient's Phone Number *</label>
                          <input
                            type="tel"
                            value={registerData.recipientPhone}
                            onChange={(e) => setRegisterData({...registerData, recipientPhone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address Section */}
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold mb-3 text-orange-800">Delivery Address</h4>
                      <p className="text-sm text-orange-600 mb-4">Where should we deliver the gift?</p>
                      <div className="space-y-4">
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Delivery street address"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">House/Flat Number</label>
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Delivery house/flat number (optional)"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Delivery city"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Delivery state"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Delivery ZIP code"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Special Instructions (Optional)</label>
                          <textarea
                            value={registerData.specialInstructions || ''}
                            onChange={(e) => setRegisterData({...registerData, specialInstructions: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Any special delivery instructions..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                      onClick={(e) => {
                        console.log('Button clicked!', { loading, registerData });
                        e.preventDefault();
                        handleRegister(e);
                      }}
                    >
                      {loading ? 'Creating Account...' : 'Create Account & Continue'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Razorpay Payment Component */}
        {showPayment && paymentData && (
          <RazorpayPayment
            orderData={paymentData}
            customerData={{
              name: user ? `${user.firstName} ${user.lastName}` : guestData.senderName,
              email: user ? user.email : guestData.senderEmail,
              contact: user ? user.phone : guestData.senderPhone
            }}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onClose={handlePaymentClose}
          />
        )}
      </main>
    </>
  );
}

// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  };
}
