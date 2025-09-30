import * as React from 'react';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

/**
 * Terms and Conditions Modal Component
 * 
 * Displays a modal with terms and conditions that users must accept
 * before proceeding to checkout. Includes scrollable content and
 * accept/decline buttons.
 */
export default function TermsAndConditionsModal({ 
  isOpen, 
  onClose, 
  onAccept 
}: TermsAndConditionsModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = React.useState(false);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Check if content needs scrolling when modal opens
  React.useEffect(() => {
    if (isOpen && contentRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current;
      // If content doesn't need scrolling, enable the button immediately
      if (scrollHeight <= clientHeight) {
        setHasScrolledToBottom(true);
      }
    }
  }, [isOpen]);


  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // More lenient scroll detection - consider at bottom if within 10px of bottom
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setHasScrolledToBottom(isAtBottom);
    
    // Calculate scroll progress for the progress bar
    const progress = Math.min(100, ((scrollTop + clientHeight) / scrollHeight) * 100);
    setScrollProgress(progress);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Terms and Conditions
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div 
            ref={contentRef}
            className="flex-1 overflow-y-auto p-6"
            onScroll={handleScroll}
          >
            <div className="space-y-4 text-gray-700">
              <p className="text-sm text-gray-600 mb-4">
                Please read and accept our terms and conditions to proceed with your order.
              </p>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Order Processing</h3>
                <p className="mb-3">
                  By placing an order, you agree to provide accurate and complete information. 
                  We reserve the right to cancel or refuse any order at our discretion.
                </p>
                <p className="mb-3">
                  Orders are processed within 1-2 business days. You will receive a confirmation 
                  email once your order is confirmed. For same day orders an emergency charge of 
                  Rs:750/- is applicable as extra.
                </p>
                <p className="mb-3">
                  If you want to remove any item from the pre-set gift combo and want to add your 
                  own then choice is yours and any item of your choice can be added and delivered 
                  by paying additional cost incurred if any by making a direct call or WhatsApp to 
                  us at +91 9400 436 424 OR +1 (281) 723-8520
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Payment Terms</h3>
                <p className="mb-3">
                  Payment is required at the time of order placement. We accept various payment 
                  methods including credit cards, debit cards, and digital wallets.
                </p>
                <p className="mb-3">
                  All prices are in Indian Rupees (₹), including premium quality product cost, 
                  customization and personal delivery charge and applicable taxes unless otherwise stated.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Delivery and Shipping</h3>
                <p className="mb-3">
                  We customize, make fresh purchases and do one-on-one personal premium delivery 
                  of your gifts across Kerala. Delivery time and design of the items may vary 
                  based on location and product availability without compromising quality, quantity 
                  and timeliness of the occasion.
                </p>
                <p className="mb-3">
                  We undertake that we will try our level best to keep the surprise elements as 
                  of your choice and Photos of your gifts will be shared without any fail. Videos 
                  and photos of delivery are subject to the privacy and permission of the receiver.
                </p>
                <p className="mb-3">
                  We are not responsible for delays caused by weather, natural disasters, or other 
                  circumstances beyond our control.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Returns and Refunds</h3>
                <p className="mb-3">
                  Since most of the items in the gift combos are customized with fresh items or 
                  perishable items as of customer's choice and are not eligible for returns. 
                  Refunds will be processed within 5-7 business days in case of any technical 
                  errors after your payment is deducted but not reflected in our end.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Privacy and Data Protection</h3>
                <p className="mb-3">
                  We collect and process your personal information in accordance with our 
                  Privacy Policy. Your data is used solely for order processing and customer service.
                </p>
                <p className="mb-3">
                  We do not sell or share your personal information with third parties without 
                  your consent.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Limitation of Liability</h3>
                <p className="mb-3">
                  Our liability is limited to the purchase and delivery of the products. We are 
                  not liable for any indirect, incidental, or consequential damages at users end. 
                  We don't offer any guarantees or warranty unless the original product manufacturer 
                  provides so.
                </p>
              </section>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> By accepting these terms, you acknowledge that you have 
                  read, understood, and agree to be bound by these terms and conditions.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-300"
              >
                Decline
              </button>
              <button
                onClick={onAccept}
                disabled={!hasScrolledToBottom}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  hasScrolledToBottom
                    ? 'bg-gradient-to-r from-kgo-red to-red-700 text-white hover:from-red-700 hover:to-red-800 transform hover:scale-105 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Accept & Continue
              </button>
            </div>
            {!hasScrolledToBottom && (
              <div className="text-center mt-2">
                <p className="text-sm text-gray-500 mb-2">
                  Please scroll to the bottom to accept the terms
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${scrollProgress}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
