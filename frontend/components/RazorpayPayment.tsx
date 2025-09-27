import React, { useEffect, useRef, useState } from 'react';
import { loadScript } from '../utils/razorpay';

interface RazorpayPaymentProps {
  orderData: {
    order_id?: string; // Google's recommended field name
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

  useEffect(() => {
    const initializeRazorpay = async () => {
      try {
        console.log('Initializing Razorpay with order data:', orderData);
        console.log('Customer data:', customerData);
        
        // Load Razorpay script with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        let scriptLoaded = false;
        
        while (retryCount < maxRetries && !scriptLoaded) {
          try {
            console.log(`🔄 Attempting to load Razorpay script (attempt ${retryCount + 1}/${maxRetries})`);
            await loadScript('https://checkout.razorpay.com/v1/checkout.js');
            scriptLoaded = true;
            console.log('✅ Razorpay script loaded successfully');
          } catch (error) {
            retryCount++;
            console.warn(`⚠️ Razorpay script load failed (attempt ${retryCount}/${maxRetries}):`, error);
            
            if (retryCount < maxRetries) {
              console.log(`🔄 Retrying in ${retryCount * 1000}ms...`);
              await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
            }
          }
        }
        
        if (!scriptLoaded || !window.Razorpay) {
          console.error('❌ Razorpay SDK failed to load after all retries');
          onError(new Error('Razorpay SDK failed to load after multiple attempts. Please check your internet connection and try again.'));
          return;
        }
        
        console.log('✅ Razorpay SDK loaded successfully');

        const options = {
          key: orderData.key,
          amount: Math.round(orderData.amount * 100), // Convert to paise and ensure integer
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
            color: '#059669' // Green color matching your brand
          },
          modal: {
            ondismiss: function() {
              console.log('Razorpay modal dismissed');
              handleModalDismiss();
            }
          },
          // Add retry configuration
          retry: {
            enabled: true,
            max_count: 3
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

        // Add additional event listeners for better tracking
        razorpay.on('payment.captured', function (response: any) {
          console.log('Razorpay payment captured:', response);
          setPaymentStatus('success');
        });

        razorpay.on('payment.verification.failed', function (response: any) {
          console.error('Razorpay payment verification failed:', response);
          setPaymentStatus('failed');
        });

        console.log('Opening Razorpay modal...');
        razorpay.open();
      } catch (error) {
        console.error('Error initializing Razorpay:', error);
        onError(error);
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
      }, 5000); // 5 second timeout
      
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (statusCheckTimeout.current) {
        clearTimeout(statusCheckTimeout.current);
      }
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

  return null; // This component doesn't render anything
};

export default RazorpayPayment;
