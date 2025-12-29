import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import CartItemCard from '../components/CartItemCard';
import WhatsAppNotification from '../components/WhatsAppNotification';
import TermsAndConditionsModal from '../components/TermsAndConditionsModal';
import { useCart } from '../context/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, isLoaded, error, totalItems, totalPrice } = useCart();
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleProceedToCheckout = () => {
    setShowTermsModal(true);
  };

  const handleAcceptTerms = () => {
    setShowTermsModal(false);
    router.push('/checkout');
  };

  const handleCloseTerms = () => {
    setShowTermsModal(false);
  };

  // Show loading state
  if (!isLoaded) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kgo-red mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your cart...</p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4">
          
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Cart Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Elegant Header Section */}
          <div className="mb-10">
            <h1 className="text-5xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Shopping Cart</h1>
            <p className="text-gray-600 text-lg">
              {cart.length === 0 
                ? 'Your cart is empty' 
                : `${totalItems} ${totalItems === 1 ? 'item' : 'items'} in your cart`
              }
            </p>
          </div>

          {/* WhatsApp Support Notification */}
          {cart.length > 0 && showNotification && (
            <div className="mb-6">
              <WhatsAppNotification
                onDismiss={() => setShowNotification(false)}
                variant="info"
              />
            </div>
          )}

          {cart.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-6">
                <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h3>
              <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
              <Link 
                href="/products" 
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-kgo-red to-red-700 text-white rounded-full font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Start Shopping
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items Grid */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
                  {cart.map((item, index) => (
                    <div 
                      key={item.product}
                      className="opacity-0 animate-fade-in"
                      style={{ 
                        animationDelay: `${index * 100}ms`,
                        animationFillMode: 'forwards'
                      }}
                    >
                      <CartItemCard
                        item={item}
                        onQuantityChange={updateQuantity}
                        onRemove={removeFromCart}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Elegant Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl shadow-elegant border border-gray-100 p-8 sticky top-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">Order Summary</h2>
                  
                  {/* Items Count */}
                  <div className="flex justify-between items-center mb-5 pb-5 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Items ({totalItems})</span>
                    <span className="font-bold text-gray-900 text-lg">₹{totalPrice.toFixed(2)}</span>
                  </div>

                  {/* Delivery */}
                  <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Delivery</span>
                    <span className="font-bold text-kgo-green text-lg flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Free
                    </span>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-gray-200">
                    <span className="text-2xl font-bold text-gray-900">Total</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-kgo-red to-kgo-red-dark bg-clip-text text-transparent">₹{totalPrice.toFixed(2)}</span>
                  </div>

                  {/* Checkout Button */}
                  <button 
                    onClick={handleProceedToCheckout}
                    className="btn-primary w-full py-4 text-lg mb-4"
                  >
                    Proceed to Checkout
                  </button>

                  {/* Continue Shopping */}
                  <Link 
                    href="/products" 
                    className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center transform hover:scale-105"
                  >
                    <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={handleCloseTerms}
        onAccept={handleAcceptTerms}
      />
    </>
  );
}

// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  };
}