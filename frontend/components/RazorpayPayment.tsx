import React, { useEffect, useRef, useState } from 'react';
import resourceManager from '../utils/resourceManager';
import razorpayInstanceManager from '../utils/razorpayInstanceManager';

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
  onStatusCheck?: (status: 'checking' | 'success' | 'failed' | 'unknown') => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayPayment: React.FC<RazorpayPaymentProps> = ({
  orderData,
  customerData,
  onSuccess,
  onError,
  onClose,
  onStatusCheck
}) => {
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed' | 'unknown'>('idle');
  const [paymentData, setPaymentData] = useState<any>(null);
  const razorpayInstance = useRef<any>(null);
  const statusCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Optimized script loader with resource management and improved error handling
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.Razorpay) {
        console.log('✅ Razorpay SDK already available');
        resolve(true);
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        console.log('🔄 Razorpay script already exists, waiting for SDK initialization...');
        let attempts = 0;
        const maxAttempts = 30; // 3 seconds max wait
        
        const checkRazorpay = () => {
          attempts++;
          if (window.Razorpay) {
            console.log('✅ Razorpay SDK initialized successfully');
            resolve(true);
          } else if (attempts < maxAttempts) {
            setTimeout(checkRazorpay, 100);
          } else {
            console.warn('⚠️ Razorpay SDK initialization timeout, removing stale script...');
            existingScript.remove();
            // Retry loading
            setTimeout(() => loadRazorpayScript().then(resolve).catch(reject), 500);
          }
        };
        checkRazorpay();
        return;
      }

      console.log('🔄 Loading Razorpay SDK script...');
      
      // Use resource manager to prevent resource exhaustion
      if (!resourceManager.trackScript('https://checkout.razorpay.com/v1/checkout.js')) {
        console.log('✅ Razorpay script already tracked');
        // Still try to resolve after a delay to allow initialization
        setTimeout(() => {
          if (window.Razorpay) {
            resolve(true);
          } else {
            // Force retry by removing from tracking
            resourceManager.forceCleanup();
            loadRazorpayScript().then(resolve).catch(reject);
          }
        }, 500);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.defer = false; // Changed to false for immediate execution
      script.crossOrigin = 'anonymous';
      
      // Add resource optimization attributes
      script.setAttribute('data-razorpay', 'true');
      
      const timeout = setTimeout(() => {
        console.error('❌ Razorpay script load timeout (10s)');
        script.remove();
        reject(new Error('Razorpay SDK failed to load: Network timeout. Please check your connection and try again.'));
      }, 10000); // Increased timeout for slower connections
      
      script.onload = () => {
        clearTimeout(timeout);
        console.log('✅ Razorpay script loaded, initializing SDK...');
        
        // Wait for Razorpay to be available with progressive backoff
        let attempts = 0;
        const maxAttempts = 30; // 3 seconds max wait after script load
        
        const checkRazorpay = () => {
          attempts++;
          if (window.Razorpay) {
            console.log('✅ Razorpay SDK ready');
            resolve(true);
          } else if (attempts < maxAttempts) {
            setTimeout(checkRazorpay, 100);
          } else {
            console.error('❌ Razorpay SDK object not found after script loaded');
            script.remove();
            reject(new Error('Razorpay SDK failed to initialize. Please refresh the page and try again.'));
          }
        };
        checkRazorpay();
      };
      
      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ Failed to load Razorpay script:', error);
        script.remove();
        reject(new Error('Razorpay SDK failed to load: Network error. Please check your connection and try again.'));
      };
      
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    const initializeRazorpay = async () => {
      // Prevent multiple initializations using global manager
      if (razorpayInstanceManager.isCurrentlyInitializing()) {
        console.log('⚠️ Razorpay already initializing globally, waiting...');
        const existingInstance = await razorpayInstanceManager.waitForInitialization();
        if (existingInstance) {
          console.log('✅ Using existing Razorpay instance');
          setIsInitializing(false);
          setIsInitialized(true);
          return;
        }
      }

      if (isInitialized) {
        console.log('⚠️ Razorpay already initialized, skipping...');
        return;
      }

      try {
        setIsInitializing(true);
        razorpayInstanceManager.setInitializing(true);
        console.log('🔄 Initializing Razorpay payment gateway...');
        console.log('Order amount:', orderData.amount, orderData.currency);
        
        // Clean up any existing Razorpay instances to prevent resource exhaustion
        if (razorpayInstance.current) {
          try {
            razorpayInstance.current.close();
          } catch (e) {
            // Silently handle - no instance to close
          }
          razorpayInstance.current = null;
        }
        
        // Check resource usage before loading
        const stats = resourceManager.getStats();
        if (stats.totalElements > 50) {
          console.warn('⚠️ High resource usage detected, performing cleanup...');
          resourceManager.forceCleanup();
        }
        
        // Load Razorpay script with better error handling
        try {
          await loadRazorpayScript();
        } catch (loadError: any) {
          // Provide user-friendly error message
          throw new Error(loadError.message || 'Failed to load payment gateway. Please check your internet connection.');
        }
        
        if (!window.Razorpay) {
          throw new Error('Payment gateway not available. Please refresh the page and try again.');
        }

        const options = {
          key: orderData.key,
          amount: Math.round(orderData.amount * 100), // Convert to paise
          currency: orderData.currency,
          name: 'OnYourBehlf - Kerala Gifts Online',
          description: 'Payment for your Kerala gifts order',
          order_id: orderData.order_id || orderData.razorpayOrderId,
          handler: function (response: any) {
            console.log('Razorpay payment success:', response);
            setPaymentStatus('success');
            setPaymentData({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
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
              handleModalDismiss();
            }
          }
        };

        console.log('✅ Creating Razorpay payment instance...');
        const razorpay = new window.Razorpay(options);
        razorpayInstance.current = razorpay;
        
        razorpay.on('payment.failed', function (response: any) {
          console.error('❌ Payment failed:', response.error?.description || 'Unknown error');
          setPaymentStatus('failed');
          onError(response.error);
        });
        
        razorpay.on('payment.authorized', function (response: any) {
          console.log('✅ Payment authorized, processing...');
          setPaymentStatus('processing');
        });

        console.log('🔄 Opening payment modal...');
        razorpay.open();
        razorpayInstanceManager.setCurrentInstance(razorpay);
        setIsInitializing(false);
        setIsInitialized(true);
        razorpayInstanceManager.setInitializing(false);
        console.log('✅ Payment gateway ready');
      } catch (error: any) {
        console.error('❌ Payment gateway initialization failed:', error.message);
        setIsInitializing(false);
        razorpayInstanceManager.setInitializing(false);
        
        // Handle specific error types with user-friendly messages
        let errorMessage = 'Payment gateway error. Please try again.';
        
        if (error.message.includes('timeout') || error.message.includes('Network timeout')) {
          errorMessage = 'Payment gateway took too long to load. Please check your internet connection and try again.';
        } else if (error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
          console.warn('⚠️ Resource exhaustion detected, performing cleanup...');
          resourceManager.forceCleanup();
          errorMessage = 'System resources exhausted. Please refresh the page and try again.';
        } else if (error.message.includes('CORS') || error.message.includes('Network error')) {
          errorMessage = 'Network security issue. Please check your connection and try again.';
        } else if (error.message.includes('failed to load') || error.message.includes('not available')) {
          errorMessage = error.message;
        }
        
        onError(new Error(errorMessage));
      }
    };

    initializeRazorpay();
  }, [orderData, customerData, onSuccess, onError, onClose]);

  const handleModalDismiss = () => {
    console.log('Modal dismissed, payment status:', paymentStatus);
    
    // If payment was successful but modal was dismissed, still call onSuccess
    if (paymentStatus === 'success' && paymentData) {
      console.log('Payment was successful, calling onSuccess with stored data');
      onSuccess(paymentData);
      return;
    }
    
    // If payment status is unknown or processing, we need to check status
    if (paymentStatus === 'processing' || paymentStatus === 'idle') {
      console.log('Payment status unclear, checking status...');
      onStatusCheck?.('checking');
      
      // Set a timeout to check status after a short delay
      statusCheckTimeout.current = setTimeout(() => {
        console.log('Status check timeout reached, treating as unknown');
        onStatusCheck?.('unknown');
        onClose();
      }, 5000);
      
      return;
    }
    
    // If payment failed or we have a clear status, proceed normally
    if (paymentStatus === 'failed') {
      onStatusCheck?.('failed');
    } else {
      onStatusCheck?.('unknown');
    }
    
    onClose();
  };

  // Cleanup timeout and resources on unmount
  useEffect(() => {
    return () => {
      if (statusCheckTimeout.current) {
        clearTimeout(statusCheckTimeout.current);
      }
      
      // Clean up Razorpay instance using global manager
      razorpayInstanceManager.closeCurrentInstance();
      razorpayInstance.current = null;
      
      // Clean up any Razorpay scripts to prevent resource exhaustion
      const razorpayScripts = document.querySelectorAll('script[data-razorpay="true"]');
      razorpayScripts.forEach(script => {
        try {
          script.remove();
        } catch (e) {
          console.log('Error removing Razorpay script:', e);
        }
      });
    };
  }, []);

  // Expose payment status for external checking
  useEffect(() => {
    if (onStatusCheck) {
      onStatusCheck(paymentStatus === 'success' ? 'success' : 
                   paymentStatus === 'failed' ? 'failed' : 
                   paymentStatus === 'processing' ? 'checking' : 'unknown');
    }
  }, [paymentStatus, onStatusCheck]);

  // Show loading state while initializing
  if (isInitializing) {
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

  return null; // This component doesn't render anything when not initializing
};

export default RazorpayPayment;