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

  // Optimized script loader with resource management
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
      
      // Use resource manager to prevent resource exhaustion
      if (!resourceManager.trackScript('https://checkout.razorpay.com/v1/checkout.js')) {
        console.log('✅ Razorpay script already tracked, skipping duplicate load');
        resolve(true);
        return;
      }
      
      // Clean up any existing Razorpay scripts to prevent resource exhaustion
      const existingScripts = document.querySelectorAll('script[src*="razorpay"]');
      existingScripts.forEach(script => script.remove());
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      // Add resource optimization attributes
      script.setAttribute('data-razorpay', 'true');
      
      const timeout = setTimeout(() => {
        console.error('❌ Razorpay script load timeout');
        reject(new Error('Razorpay script load timeout'));
      }, 8000); // Reduced timeout to prevent hanging
      
      script.onload = () => {
        clearTimeout(timeout);
        console.log('✅ Razorpay script loaded');
        
        // Wait for Razorpay to be available with shorter intervals
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
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
        console.log('Initializing Razorpay with order data:', orderData);
        console.log('Customer data:', customerData);
        
        // Clean up any existing Razorpay instances to prevent resource exhaustion
        if (razorpayInstance.current) {
          try {
            razorpayInstance.current.close();
          } catch (e) {
            console.log('No existing Razorpay instance to close');
          }
          razorpayInstance.current = null;
        }
        
        // Check resource usage before loading
        const stats = resourceManager.getStats();
        console.log('📊 Resource stats:', stats);
        
        if (stats.totalElements > 50) {
          console.warn('⚠️ High resource usage detected, cleaning up...');
          resourceManager.forceCleanup();
        }
        
        // Load Razorpay script
        await loadRazorpayScript();
        
        if (!window.Razorpay) {
          throw new Error('Razorpay SDK not available');
        }
        
        console.log('✅ Razorpay SDK loaded successfully');

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

        console.log('Creating Razorpay instance with options:', options);
        const razorpay = new window.Razorpay(options);
        razorpayInstance.current = razorpay;
        
        razorpay.on('payment.failed', function (response: any) {
          console.error('Razorpay payment failed:', response);
          setPaymentStatus('failed');
          onError(response.error);
        });
        
        razorpay.on('payment.authorized', function (response: any) {
          console.log('Razorpay payment authorized:', response);
          setPaymentStatus('processing');
        });

        console.log('Opening Razorpay modal...');
        razorpay.open();
        razorpayInstance.current = razorpay;
        razorpayInstanceManager.setCurrentInstance(razorpay);
        setIsInitializing(false);
        setIsInitialized(true);
        razorpayInstanceManager.setInitializing(false);
      } catch (error: any) {
        console.error('Error initializing Razorpay:', error);
        setIsInitializing(false);
        razorpayInstanceManager.setInitializing(false);
        
        // Handle specific error types
        if (error.message.includes('timeout')) {
          onError(new Error('Payment gateway timeout. Please try again.'));
        } else if (error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
          console.warn('⚠️ Resource exhaustion detected, cleaning up...');
          resourceManager.forceCleanup();
          onError(new Error('System resources exhausted. Please refresh the page and try again.'));
        } else if (error.message.includes('CORS')) {
          onError(new Error('Network security issue. Please try again.'));
        } else {
          onError(error);
        }
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