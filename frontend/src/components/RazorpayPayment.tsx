import React, { useEffect } from 'react';
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
  onClose
}) => {
  useEffect(() => {
    const initializeRazorpay = async () => {
      try {
        console.log('Initializing Razorpay with order data:', orderData);
        console.log('Customer data:', customerData);
        
        // Load Razorpay script
        await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        
        if (!window.Razorpay) {
          console.error('Razorpay SDK failed to load');
          onError(new Error('Razorpay SDK failed to load'));
          return;
        }
        
        console.log('Razorpay SDK loaded successfully');

        const options = {
          key: orderData.key,
          amount: Math.round(orderData.amount * 100), // Convert to paise and ensure integer
          currency: orderData.currency,
          name: 'OnYourBehlf - Kerala Gifts Online',
          description: 'Payment for your Kerala gifts order',
          order_id: orderData.order_id || orderData.razorpayOrderId,
          handler: function (response: any) {
            console.log('Razorpay payment success:', response);
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
              onClose();
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
        
        razorpay.on('payment.failed', function (response: any) {
          console.error('Razorpay payment failed:', response);
          onError(response.error);
        });
        
        razorpay.on('payment.authorized', function (response: any) {
          console.log('Razorpay payment authorized:', response);
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

  return null; // This component doesn't render anything
};

export default RazorpayPayment;
