import React, { useState, useEffect, useRef } from 'react';

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
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if content needs scrolling when modal opens
  useEffect(() => {
    if (isOpen && contentRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current;
      // If content doesn't need scrolling, enable the button immediately
      if (scrollHeight <= clientHeight) {
        setHasScrolledToBottom(true);
      }
    }
  }, [isOpen]);

  // Fallback: Enable button after 3 seconds if user has been scrolling
  useEffect(() => {
    if (isOpen && scrollProgress > 50) {
      const timer = setTimeout(() => {
        setHasScrolledToBottom(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, scrollProgress]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // More lenient scroll detection - consider at bottom if within 10px of bottom
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setHasScrolledToBottom(isAtBottom);
    
    // Calculate scroll progress for the progress bar
    const progress = Math.min(100, ((scrollTop + clientHeight) / scrollHeight) * 100);
    setScrollProgress(progress);
    
    // Debug logging
    console.log('Scroll Debug:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      isAtBottom,
      progress: progress.toFixed(1) + '%'
    });
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
                  email once your order is confirmed.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Payment Terms</h3>
                <p className="mb-3">
                  Payment is required at the time of order placement. We accept various payment 
                  methods including credit cards, debit cards, and digital wallets.
                </p>
                <p className="mb-3">
                  All prices are in Indian Rupees (₹) and include applicable taxes unless 
                  otherwise stated.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Delivery and Shipping</h3>
                <p className="mb-3">
                  We deliver to select cities in Kerala. Delivery times may vary based on 
                  location and product availability.
                </p>
                <p className="mb-3">
                  Risk of loss and title for products purchased pass to you upon delivery to 
                  the carrier.
                </p>
                <p className="mb-3">
                  We are not responsible for delays caused by weather, natural disasters, 
                  or other circumstances beyond our control.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Returns and Refunds</h3>
                <p className="mb-3">
                  Returns are accepted within 7 days of delivery for unused items in original 
                  packaging. Customized or perishable items are not eligible for returns.
                </p>
                <p className="mb-3">
                  Refunds will be processed within 5-7 business days after we receive the 
                  returned items.
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
                  Our liability is limited to the purchase price of the products. We are not 
                  liable for any indirect, incidental, or consequential damages.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Contact Information</h3>
                <p className="mb-3">
                  For any questions regarding these terms, please contact us at:
                </p>
                <p className="mb-3">
                  Email: support@keralagiftsonline.com<br />
                  Phone: +91-XXXXXXXXXX<br />
                  WhatsApp: +91-XXXXXXXXXX
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
