import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Refund() {
  return (
    <>
      <Head>
        <title>Refund & Cancellation Policy - OnYourBehlf | Kerala Gifts Online</title>
        <meta name="description" content="Read our Refund & Cancellation Policy for OnYourBehlf - Kerala Gifts Online. Understand our return process and refund terms." />
        <meta name="keywords" content="refund, cancellation, return policy, Kerala gifts, e-commerce, customer service" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-kgo-green to-kgo-red text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Refund & Cancellation Policy
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                Our commitment to your satisfaction with clear refund and cancellation terms
              </p>
              <p className="text-sm opacity-90">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </section>

        {/* Refund Content */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              
              {/* Introduction */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Introduction</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  At OnYourBehlf (Kerala Gifts Online), we strive to provide the highest quality products and services. This Refund & Cancellation Policy outlines the terms and conditions for returns, refunds, and order cancellations.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Business Information:</strong><br />
                  Business Name: OnYourBehlf (Kerala Gifts Online)<br />
                  Contact: sales@keralagiftsonline.com<br />
                  Phone: +91 8075030919
                </p>
              </div>

              {/* Order Cancellation */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">2. Order Cancellation</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">2.1 Before Processing</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>✅ You can cancel your order if:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li>Order has not yet been processed for fulfillment</li>
                    <li>Payment has not been captured by our payment processor</li>
                    <li>Order is still in "pending" or "confirmed" status</li>
                    <li>Cancellation request is made within 2 hours of order placement</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">2.2 After Processing</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>⚠️ Cancellation may not be possible if:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li>Order has been processed and is being prepared for shipment</li>
                    <li>Payment has been successfully captured</li>
                    <li>Order status is "collecting_items" or beyond</li>
                    <li>More than 2 hours have passed since order placement</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">2.3 How to Cancel</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  To cancel your order, please contact us immediately:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li><strong>Email:</strong> sales@keralagiftsonline.com (Subject: "Order Cancellation")</li>
                  <li><strong>Phone:</strong> +91 8075030919</li>
                  <li><strong>WhatsApp:</strong> +91 8075030919</li>
                  <li>Include your order number and reason for cancellation</li>
                </ul>
              </div>

              {/* Return Policy */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">3. Return Policy</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">3.1 Eligible Returns</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>✅ We accept returns for:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li>Defective or damaged products upon delivery</li>
                    <li>Wrong items sent (our error)</li>
                    <li>Products not matching the description</li>
                    <li>Quality issues that don't meet our standards</li>
                    <li>Non-perishable items in original packaging</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">3.2 Non-Returnable Items</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>❌ We cannot accept returns for:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li>Perishable food items (spices, snacks, sweets)</li>
                    <li>Custom or personalized orders</li>
                    <li>Items damaged by customer misuse</li>
                    <li>Products returned after 48 hours of delivery</li>
                    <li>Items without original packaging or tags</li>
                    <li>Gift items that have been opened or used</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">3.3 Return Timeframe</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  <strong>Return Request Window:</strong> 48 hours from delivery
                </p>
                <p className="text-gray-600 leading-relaxed">
                  You must initiate a return request within 48 hours of receiving your order. After this period, returns will not be accepted unless there are exceptional circumstances.
                </p>
              </div>

              {/* Return Process */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">4. Return Process</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">4.1 Step-by-Step Process</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Contact Us</h4>
                      <p className="text-gray-600">Email us at sales@keralagiftsonline.com with your order number and reason for return</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Return Authorization</h4>
                      <p className="text-gray-600">We will review your request and provide return authorization if eligible</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Package Items</h4>
                      <p className="text-gray-600">Pack items in original packaging with all accessories and documentation</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Return Shipping</h4>
                      <p className="text-gray-600">We will arrange pickup or provide return shipping instructions</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">5</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Quality Check</h4>
                      <p className="text-gray-600">We will inspect returned items upon receipt</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">6</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Refund Processing</h4>
                      <p className="text-gray-600">Refund will be processed within 5-7 business days after approval</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Refund Policy */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">5. Refund Policy</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">5.1 Refund Eligibility</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Refunds will be processed for:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-6">
                  <li>Successfully cancelled orders (before processing)</li>
                  <li>Approved returns within the return policy</li>
                  <li>Orders that could not be delivered due to our error</li>
                  <li>Duplicate payments or overcharges</li>
                </ul>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">5.2 Refund Timeline</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>Refund Processing Times:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li><strong>Credit/Debit Cards:</strong> 5-7 business days</li>
                    <li><strong>UPI Payments:</strong> 2-3 business days</li>
                    <li><strong>Net Banking:</strong> 3-5 business days</li>
                    <li><strong>Digital Wallets:</strong> 1-2 business days</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">5.3 Refund Method</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Refunds will be processed to the original payment method used for the order. We cannot process refunds to a different payment method for security reasons.
                </p>
              </div>

              {/* Shipping Charges */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">6. Shipping Charges</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">6.1 Return Shipping</h3>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <p className="text-gray-600 leading-relaxed">
                      <strong>✅ Free Return Shipping:</strong>
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                      <li>Defective or damaged products (our fault)</li>
                      <li>Wrong items sent (our error)</li>
                      <li>Products not matching description</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <p className="text-gray-600 leading-relaxed">
                      <strong>⚠️ Customer Pays Return Shipping:</strong>
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                      <li>Change of mind returns</li>
                      <li>Customer-initiated returns</li>
                      <li>Returns due to customer error</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">6.2 Original Shipping Charges</h3>
                <p className="text-gray-600 leading-relaxed">
                  Original shipping charges are non-refundable unless the return is due to our error (wrong item, defective product, etc.).
                </p>
              </div>

              {/* Special Circumstances */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">7. Special Circumstances</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">7.1 Force Majeure</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  In case of force majeure events (natural disasters, government restrictions, etc.), we may extend return timeframes or offer alternative solutions.
                </p>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">7.2 Quality Issues</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  For quality issues with perishable items, we may offer:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Full refund without return</li>
                  <li>Replacement with fresh items</li>
                  <li>Store credit for future purchases</li>
                </ul>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">7.3 Gift Orders</h3>
                <p className="text-gray-600 leading-relaxed">
                  For gift orders, the recipient can initiate returns within 48 hours of delivery. We will coordinate with the gift giver for refund processing.
                </p>
              </div>

              {/* Contact Information */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">8. Contact Information</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 leading-relaxed mb-4">
                    For returns, refunds, or cancellations, please contact us:
                  </p>
                  <div className="space-y-2 text-gray-600">
                    <p><strong>Email:</strong> sales@keralagiftsonline.com</p>
                    <p><strong>Phone:</strong> +91 8075030919</p>
                    <p><strong>WhatsApp:</strong> +91 8075030919</p>
                    <p><strong>Business Hours:</strong> Monday-Friday 9:00 AM - 6:00 PM IST</p>
                  </div>
                  <p className="text-gray-600 leading-relaxed mt-4">
                    <strong>For faster processing:</strong> Include "Return/Refund Request" in your email subject line along with your order number.
                  </p>
                </div>
              </div>

              {/* Policy Updates */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">9. Policy Updates</h2>
                <p className="text-gray-600 leading-relaxed">
                  We reserve the right to update this Refund & Cancellation Policy at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services constitutes acceptance of any modifications.
                </p>
              </div>

            </div>

            {/* Call to Action */}
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-kgo-green to-kgo-red p-8 rounded-2xl text-white">
                <h3 className="text-2xl font-bold mb-4">Need Help with Returns or Refunds?</h3>
                <p className="text-lg mb-6 opacity-90">
                  Our customer service team is here to assist you
                </p>
                <Link 
                  href="/contact" 
                  className="inline-block bg-white text-kgo-red px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  };
}
