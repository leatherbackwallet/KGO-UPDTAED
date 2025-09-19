/**
 * Razorpay utility functions
 */

export const loadScript = (src: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const validatePaymentResponse = (response: any): boolean => {
  return !!(
    response &&
    response.razorpay_payment_id &&
    response.razorpay_order_id &&
    response.razorpay_signature
  );
};
