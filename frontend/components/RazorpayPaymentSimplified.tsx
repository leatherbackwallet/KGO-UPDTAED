import React, { useEffect, useRef, useState } from 'react';

interface RazorpayPaymentProps {
  orderData: {
    order_id?: string;
    orderId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    key: string;
  };
  customerData: {
    name: string;
    email: string;
    contact: string;
  };
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayPaymentSimplified: React.FC<RazorpayPaymentProps> = ({
  orderData,
  customerData,
  onSuccess,
  onError,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const razorpayInstance = useRef<any>(null);
  const isInitialized = useRef(false);

  // Simple script loader
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.Razorpay) {
        console.log('✅ Razorpay already available');
        resolve(true);
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        console.log('✅ Razorpay script already loaded, waiting for SDK...');
        const checkRazorpay = () => {
          if (window.Razorpay) {
            console.log('✅ Razorpay SDK is now available');
            resolve(true);
          } else {
            setTimeout(checkRazorpay, 100);
          }
        };
        checkRazorpay();
        return;
      }

      console.log('🔄 Loading Razorpay script...');
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        console.error('❌ Razorpay script load timeout');
        reject(new Error('Razorpay script load timeout'));
      }, 10000);
      
      script.onload = () => {
        clearTimeout(timeout);
        console.log('✅ Razorpay script loaded');
        
        // Wait for Razorpay to be available
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkRazorpay = () => {
          attempts++;
          if (window.Razorpay) {
            console.log('✅ Razorpay SDK is available');
            resolve(true);
          } else if (attempts < maxAttempts) {
            setTimeout(checkRazorpay, 100);
          } else {
            console.error('❌ Razorpay SDK not available after script load');
            reject(new Error('Razorpay SDK not available after script load'));
          }
        };
        checkRazorpay();
      };
      
      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ Failed to load Razorpay script:', error);
        reject(new Error('Failed to load Razorpay script'));
      };
      
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    const initializeRazorpay = async () => {
      // Prevent multiple initializations
      if (isInitialized.current) {
        console.log('⚠️ Razorpay already initialized, skipping...');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Initializing Razorpay with order data:', orderData);
        console.log('Customer data:', customerData);
        
        // Clean up any existing Razorpay instances
        if (razorpayInstance.current) {
          try {
            razorpayInstance.current.close();
          } catch (e) {
            console.log('No existing Razorpay instance to close');
          }
          razorpayInstance.current = null;
        }
        
        // Load Razorpay script
        await loadRazorpayScript();
        
        if (!window.Razorpay) {
          throw new Error('Razorpay SDK not available');
        }
        
        console.log('✅ Razorpay SDK loaded successfully');

        // Validate order data
        if (!orderData.amount || !orderData.key || !orderData.razorpayOrderId) {
          throw new Error('Invalid order data provided');
        }

        const options = {
          key: orderData.key,
          amount: Math.round(orderData.amount * 100), // Convert to paise
          currency: orderData.currency || 'INR',
          name: 'OnYourBehlf - Kerala Gifts Online',
          description: 'Payment for your Kerala gifts order',
          order_id: orderData.order_id || orderData.razorpayOrderId,
          handler: function (response: any) {
            console.log('✅ Razorpay payment success:', response);
            onSuccess({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
          },
          prefill: {
            name: customerData.name || 'Customer',
            email: customerData.email || 'customer@example.com',
            contact: customerData.contact || '9999999999'
          },
          notes: {
            order_id: orderData.orderId,
            source: 'OnYourBehlf - Kerala Gifts Online'
          },
          theme: {
            color: '#059669'
          },
          modal: {
            ondismiss: function() {
              console.log('Razorpay modal dismissed');
              onClose();
            }
          }
        };

        console.log('Creating Razorpay instance with options:', options);
        const razorpay = new window.Razorpay(options);
        razorpayInstance.current = razorpay;
        
        razorpay.on('payment.failed', function (response: any) {
          console.error('❌ Razorpay payment failed:', response);
          onError(response.error);
        });
        
        razorpay.on('payment.authorized', function (response: any) {
          console.log('🔄 Razorpay payment authorized:', response);
        });

        console.log('Opening Razorpay modal...');
        razorpay.open();
        
        isInitialized.current = true;
        setIsLoading(false);
      } catch (error: any) {
        console.error('❌ Error initializing Razorpay:', error);
        setError(error.message);
        setIsLoading(false);
        onError(error);
      }
    };

    initializeRazorpay();
  }, [orderData, customerData, onSuccess, onError, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (razorpayInstance.current) {
        try {
          razorpayInstance.current.close();
        } catch (e) {
          console.log('Error closing Razorpay instance:', e);
        }
        razorpayInstance.current = null;
      }
    };
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Payment Gateway</h3>
            <p className="text-gray-600">Please wait while we initialize Razorpay...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Gateway Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null; // This component doesn't render anything when not loading/error
};

export default RazorpayPaymentSimplified;
