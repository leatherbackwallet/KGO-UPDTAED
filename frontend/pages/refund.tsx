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
        <section className="relative py-20 bg-gradient-to-r from-green-600 to-red-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
                Refund & Cancellation Policy
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white drop-shadow-md">
                Our commitment to your satisfaction with clear refund and cancellation terms
              </p>
              <p className="text-sm text-white opacity-95 drop-shadow-sm">
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
                  At KGO (Kerala Gifts Online), we specialize in premium, customized, and perishable gift items. Due to the nature of our products, we have a strict no-return policy for all items. This Refund Policy outlines the limited circumstances under which refunds may be processed.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Business Information:</strong><br />
                  Business Name: KGO (Kerala Gifts Online)<br />
                  Contact: sales@keralagiftsonline.com<br />
                  Phone: +91 9400 436 424 OR +1 (281) 723-8520
                </p>
              </div>

              {/* No Returns Policy */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">2. No Returns Policy</h2>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>❌ IMPORTANT: We do not accept returns for any products due to the following reasons:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li><strong>Perishable Nature:</strong> All our products are fresh, customized, and perishable</li>
                    <li><strong>Customization:</strong> Items are personalized and made to order</li>
                    <li><strong>Fresh Purchases:</strong> We make fresh purchases for each order</li>
                    <li><strong>Hygiene & Safety:</strong> Food safety regulations prevent returns of perishable items</li>
                    <li><strong>Quality Control:</strong> We ensure quality before dispatch</li>
                  </ul>
                </div>

                <p className="text-gray-600 leading-relaxed mb-4">
                  Since we deal exclusively with perishable, customized gift items, we cannot accept returns under any circumstances. This policy is in place to maintain the highest standards of food safety and hygiene.
                </p>
              </div>

              {/* Limited Refund Policy */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">3. Limited Refund Policy</h2>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>⚠️ Refunds are processed ONLY in the following technical failure scenarios:</strong>
                  </p>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">3.1 Failed Payments</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>✅ Refunds for Failed Payments:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li>Payment deducted from your account but not reflected in our system</li>
                    <li>Duplicate payments processed by mistake</li>
                    <li>Overcharges due to technical errors</li>
                    <li>Payment gateway failures resulting in multiple charges</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">3.2 Unsuccessful Orders</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>✅ Refunds for Unsuccessful Orders:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li>Orders that could not be processed due to system errors</li>
                    <li>Orders cancelled due to our inability to fulfill</li>
                    <li>Technical issues preventing order completion</li>
                    <li>Website errors causing order failures</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">3.3 Unsuccessful Deliveries</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>✅ Refunds for Unsuccessful Deliveries:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li>Delivery failures due to our logistics errors</li>
                    <li>Incorrect addresses provided by us</li>
                    <li>Delivery partner failures (our responsibility)</li>
                    <li>Items damaged during our handling/transport</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>❌ NO REFUNDS for:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li>Change of mind after order placement</li>
                    <li>Customer-provided incorrect delivery address</li>
                    <li>Recipient not available at delivery time</li>
                    <li>Customer dissatisfaction with product quality</li>
                    <li>Any other customer-initiated reasons</li>
                  </ul>
                </div>
              </div>

              {/* Refund Process */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">4. Refund Process</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">4.1 How to Request a Refund</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Contact Us Immediately</h4>
                      <p className="text-gray-600">Email us at sales@keralagiftsonline.com with "Refund Request" in the subject line</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Provide Details</h4>
                      <p className="text-gray-600">Include order number, payment proof, and detailed explanation of the technical issue</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Investigation</h4>
                      <p className="text-gray-600">We will investigate the technical failure and verify the issue</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Refund Processing</h4>
                      <p className="text-gray-600">If approved, refund will be processed within 5-7 business days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Refund Timeline */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">5. Refund Timeline</h2>
                
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

                <p className="text-gray-600 leading-relaxed">
                  <strong>Note:</strong> Refunds will be processed to the original payment method used for the order. We cannot process refunds to a different payment method for security reasons.
                </p>
              </div>

              {/* Contact Information */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">6. Contact Information</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 leading-relaxed mb-4">
                    For refund requests due to technical failures, please contact us:
                  </p>
                  <div className="space-y-2 text-gray-600">
                    <p><strong>Email:</strong> sales@keralagiftsonline.com</p>
                    <p><strong>Phone:</strong> +91 9400 436 424</p>
                    <p><strong>International:</strong> +1 (281) 723-8520</p>
                    <p><strong>WhatsApp:</strong> +91 9400 436 424</p>
                    <p><strong>Business Hours:</strong> Monday-Friday 9:00 AM - 6:00 PM IST</p>
                  </div>
                  <p className="text-gray-600 leading-relaxed mt-4">
                    <strong>For faster processing:</strong> Include "Refund Request" in your email subject line along with your order number and payment proof.
                  </p>
                </div>
              </div>

              {/* Policy Updates */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">7. Policy Updates</h2>
                <p className="text-gray-600 leading-relaxed">
                  We reserve the right to update this Refund Policy at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services constitutes acceptance of any modifications.
                </p>
              </div>

            </div>

            {/* Call to Action */}
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-kgo-green to-kgo-red p-8 rounded-2xl text-white">
                <h3 className="text-2xl font-bold mb-4">Need Help with Technical Issues?</h3>
                <p className="text-lg mb-6 opacity-90">
                  Our customer service team is here to assist with payment and delivery issues
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
