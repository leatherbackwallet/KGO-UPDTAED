/**
 * Razorpay utility functions
 */

export const loadScript = (src: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Check if Razorpay is already available
    if (window.Razorpay) {
      console.log('✅ Razorpay already available on window');
      resolve(true);
      return;
    }

    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      console.log('✅ Razorpay script already loaded, waiting for SDK...');
      
      // Wait a bit for the script to initialize
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

    console.log('🔄 Loading Razorpay script from:', src);
    
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.error('❌ Razorpay script load timeout');
      reject(new Error(`Script load timeout: ${src}`));
    }, 10000); // 10 second timeout
    
    script.onload = () => {
      clearTimeout(timeout);
      console.log('✅ Razorpay script loaded successfully');
      
      // Wait a bit for Razorpay to initialize
      setTimeout(() => {
        if (window.Razorpay) {
          console.log('✅ Razorpay SDK is available');
          resolve(true);
        } else {
          console.error('❌ Razorpay SDK not available after script load');
          reject(new Error('Razorpay SDK not available after script load'));
        }
      }, 500); // Give it 500ms to initialize
    };
    
    script.onerror = (error) => {
      clearTimeout(timeout);
      console.error('❌ Failed to load Razorpay script:', error);
      reject(new Error(`Failed to load script: ${src}`));
    };
    
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