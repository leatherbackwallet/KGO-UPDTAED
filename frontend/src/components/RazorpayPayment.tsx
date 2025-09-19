import React, { useEffect } from 'react';
import { loadScript } from '../utils/razorpay';

interface RazorpayPaymentProps {
  orderData: {
    orderId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    key: string;
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
  onSuccess,
  onError,
  onClose
}) => {
  useEffect(() => {
    const initializeRazorpay = async () => {
      try {
        // Load Razorpay script
        await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        
        if (!window.Razorpay) {
          onError(new Error('Razorpay SDK failed to load'));
          return;
        }

        const options = {
          key: orderData.key,
          amount: orderData.amount * 100, // Convert to paise
          currency: orderData.currency,
          name: 'OnYourBehlf - Kerala Gifts Online',
          description: 'Payment for your Kerala gifts order',
          order_id: orderData.razorpayOrderId,
          handler: function (response: any) {
            onSuccess({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
          },
          prefill: {
            name: 'Customer',
            email: 'customer@example.com',
            contact: '+919876543210'
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
              onClose();
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response: any) {
          onError(response.error);
        });

        razorpay.open();
      } catch (error) {
        onError(error);
      }
    };

    initializeRazorpay();
  }, [orderData, onSuccess, onError, onClose]);

  return null; // This component doesn't render anything
};

export default RazorpayPayment;
