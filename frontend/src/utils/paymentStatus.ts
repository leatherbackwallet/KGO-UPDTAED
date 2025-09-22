/**
 * Payment Status Utility
 * Handles payment status checking and verification with fallback mechanisms
 */

import { api } from './api';

export interface PaymentStatusResponse {
  success: boolean;
  data?: {
    orderId: string;
    status: 'verified' | 'payment_success' | 'payment_failed' | 'pending' | 'timeout';
    paymentStatus: string;
    orderStatus: string;
    message: string;
    needsVerification?: boolean;
    attempts?: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

export interface PaymentVerificationResponse {
  success: boolean;
  data?: {
    orderId: string;
    status: string;
    message: string;
  };
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Check payment status without full verification
 */
export const checkPaymentStatus = async (
  razorpayOrderId?: string,
  razorpayPaymentId?: string,
  authToken?: string
): Promise<PaymentStatusResponse> => {
  try {
    const response = await api.post('/payments/check-status', {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId
    }, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });

    return response.data;
  } catch (error: any) {
    console.error('Error checking payment status:', error);
    return {
      success: false,
      error: {
        message: error.response?.data?.error?.message || 'Failed to check payment status',
        code: error.response?.data?.error?.code || 'STATUS_CHECK_ERROR'
      }
    };
  }
};

/**
 * Poll payment status with retry mechanism
 */
export const pollPaymentStatus = async (
  razorpayOrderId?: string,
  razorpayPaymentId?: string,
  authToken?: string,
  maxAttempts: number = 10,
  intervalMs: number = 2000
): Promise<PaymentStatusResponse> => {
  try {
    const response = await api.post('/payments/poll-status', {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      maxAttempts,
      intervalMs
    }, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });

    return response.data;
  } catch (error: any) {
    console.error('Error polling payment status:', error);
    return {
      success: false,
      error: {
        message: error.response?.data?.error?.message || 'Failed to poll payment status',
        code: error.response?.data?.error?.code || 'POLL_ERROR'
      }
    };
  }
};

/**
 * Verify payment with signature
 */
export const verifyPayment = async (
  paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  },
  authToken?: string
): Promise<PaymentVerificationResponse> => {
  try {
    const response = await api.post('/payments/verify', paymentData, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });

    return response.data;
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: {
        message: error.response?.data?.error?.message || 'Payment verification failed',
        code: error.response?.data?.error?.code || 'VERIFICATION_ERROR'
      }
    };
  }
};

/**
 * Comprehensive payment status check with fallback mechanisms
 */
export const checkPaymentStatusWithFallback = async (
  paymentData: {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  },
  authToken?: string,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    enablePolling?: boolean;
  } = {}
): Promise<{
  success: boolean;
  orderId?: string;
  status: 'verified' | 'payment_success' | 'payment_failed' | 'pending' | 'timeout' | 'error';
  message: string;
  needsVerification?: boolean;
}> => {
  const { maxRetries = 3, retryDelay = 1000, enablePolling = true } = options;

  // First, try to verify payment if we have signature
  if (paymentData.razorpay_signature) {
    console.log('🔍 Attempting payment verification with signature...');
    const verifyResult = await verifyPayment(paymentData, authToken);
    
    if (verifyResult.success) {
      return {
        success: true,
        orderId: verifyResult.data?.orderId,
        status: 'verified',
        message: verifyResult.data?.message || 'Payment verified successfully'
      };
    }
    
    console.log('⚠️ Payment verification failed, trying status check...');
  }

  // If verification failed or no signature, check payment status
  console.log('🔍 Checking payment status...');
  const statusResult = await checkPaymentStatus(
    paymentData.razorpay_order_id,
    paymentData.razorpay_payment_id,
    authToken
  );

  if (statusResult.success) {
    const { status, orderId, message, needsVerification } = statusResult.data!;
    
    if (status === 'verified') {
      return {
        success: true,
        orderId,
        status: 'verified',
        message
      };
    }
    
    if (status === 'payment_success') {
      return {
        success: true,
        orderId,
        status: 'payment_success',
        message,
        needsVerification
      };
    }
    
    if (status === 'payment_failed') {
      return {
        success: false,
        orderId,
        status: 'payment_failed',
        message
      };
    }
  }

  // If status check failed and polling is enabled, try polling
  if (enablePolling) {
    console.log('🔍 Payment status unclear, starting polling...');
    const pollResult = await pollPaymentStatus(
      paymentData.razorpay_order_id,
      paymentData.razorpay_payment_id,
      authToken,
      5, // 5 attempts
      2000 // 2 second intervals
    );

    if (pollResult.success) {
      const { status, orderId, message, needsVerification } = pollResult.data!;
      
      if (status === 'verified' || status === 'payment_success') {
        return {
          success: true,
          orderId,
          status: status as 'verified' | 'payment_success',
          message,
          needsVerification
        };
      }
      
      if (status === 'payment_failed') {
        return {
          success: false,
          orderId,
          status: 'payment_failed',
          message
        };
      }
    }
  }

  // If all methods failed, return error
  return {
    success: false,
    status: 'error',
    message: 'Unable to determine payment status. Please contact support if payment was deducted.'
  };
};

/**
 * Retry mechanism for payment operations
 */
export const retryPaymentOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Payment operation attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
};
