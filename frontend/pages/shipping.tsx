import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Shipping() {
  return (
    <>
      <Head>
        <title>Shipping & Delivery Policy - OnYourBehlf | Kerala Gifts Online</title>
        <meta name="description" content="Read our Shipping & Delivery Policy for OnYourBehlf - Kerala Gifts Online. Learn about delivery times, shipping charges, and delivery areas." />
        <meta name="keywords" content="shipping, delivery, policy, Kerala gifts, e-commerce, delivery times, shipping charges" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-green-600 to-red-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
                Shipping & Delivery Policy
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white drop-shadow-md">
                Fast, reliable delivery of authentic Kerala gifts worldwide
              </p>
              <p className="text-sm text-white opacity-95 drop-shadow-sm">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </section>

        {/* Shipping Content */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              
              {/* Introduction */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Introduction</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  At KGO (Kerala Gifts Online), we are committed to delivering your authentic Kerala gifts safely and on time. This Shipping & Delivery Policy outlines our delivery processes, timelines, and terms.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Business Information:</strong><br />
                  Business Name: KGO (Kerala Gifts Online)<br />
                  Contact: sales@keralagiftsonline.com<br />
                  Phone: +91 8075030919
                </p>
              </div>

              {/* Delivery Areas */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">2. Delivery Areas</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">2.1 Domestic Delivery (India)</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>✅ We deliver to all major cities and towns in India:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li>All states and union territories</li>
                    <li>Metropolitan cities and tier-1 cities</li>
                    <li>Most tier-2 and tier-3 cities</li>
                    <li>Rural areas (subject to courier service availability)</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">2.2 International Delivery</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>🌍 We deliver worldwide to serve the global Malayali diaspora:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li>United States, Canada, United Kingdom</li>
                    <li>Australia, New Zealand, Singapore</li>
                    <li>UAE, Saudi Arabia, Qatar, Kuwait</li>
                    <li>European Union countries</li>
                    <li>Other countries (contact us for availability)</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">2.3 Remote Areas</h3>
                <p className="text-gray-600 leading-relaxed">
                  For remote or hard-to-reach areas, delivery may take longer or require special arrangements. Please contact us to confirm delivery availability to your location.
                </p>
              </div>

              {/* Delivery Timeframes */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">3. Delivery Timeframes</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">3.1 Standard Delivery Times</h3>
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Within Kerala</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li><strong>Standard Delivery:</strong> 24-48 hours</li>
                      <li><strong>Same Day Delivery:</strong> Available for select areas (additional charges apply)</li>
                      <li><strong>Processing Time:</strong> 2-4 hours after order confirmation</li>
                    </ul>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Other States in India</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li><strong>Metro Cities:</strong> 2-3 business days</li>
                      <li><strong>Tier-1 Cities:</strong> 3-4 business days</li>
                      <li><strong>Tier-2 Cities:</strong> 4-5 business days</li>
                      <li><strong>Rural Areas:</strong> 5-7 business days</li>
                    </ul>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">International Delivery</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li><strong>Gulf Countries:</strong> 5-7 business days</li>
                      <li><strong>US/Canada:</strong> 7-10 business days</li>
                      <li><strong>UK/Europe:</strong> 7-10 business days</li>
                      <li><strong>Australia/NZ:</strong> 8-12 business days</li>
                      <li><strong>Other Countries:</strong> 10-15 business days</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">3.2 Processing Time</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  All orders require a minimum processing time before dispatch:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li><strong>Regular Orders:</strong> 2-4 hours processing time</li>
                  <li><strong>Custom Orders:</strong> 24-48 hours processing time</li>
                  <li><strong>Combo Packages:</strong> 4-6 hours processing time</li>
                  <li><strong>Weekend Orders:</strong> Processed on next business day</li>
                </ul>
              </div>

              {/* Shipping Charges */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">4. Shipping Charges</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">4.1 Domestic Shipping (India)</h3>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Within Kerala</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li><strong>Free Shipping:</strong> Orders above ₹999</li>
                      <li><strong>Standard Shipping:</strong> ₹50 for orders below ₹999</li>
                      <li><strong>Same Day Delivery:</strong> ₹500 (emergency charge)</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Other States</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li><strong>Free Shipping:</strong> Orders above ₹1999</li>
                      <li><strong>Standard Shipping:</strong> ₹150 for orders below ₹1999</li>
                      <li><strong>Express Shipping:</strong> ₹300 (1-2 days faster)</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">4.2 International Shipping</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>International shipping charges vary by destination:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li><strong>Gulf Countries:</strong> ₹800-1200</li>
                    <li><strong>US/Canada:</strong> ₹1500-2000</li>
                    <li><strong>UK/Europe:</strong> ₹1200-1800</li>
                    <li><strong>Australia/NZ:</strong> ₹1800-2200</li>
                    <li><strong>Other Countries:</strong> Contact us for pricing</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">4.3 Additional Charges</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li><strong>Remote Area Surcharge:</strong> ₹100-300 (if applicable)</li>
                  <li><strong>COD (Cash on Delivery):</strong> ₹50 additional charge</li>
                  <li><strong>Gift Wrapping:</strong> ₹100-200 (optional)</li>
                  <li><strong>Insurance:</strong> ₹50-100 for high-value orders</li>
                </ul>
              </div>

              {/* Delivery Process */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">5. Delivery Process</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">5.1 Order Processing</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Order Confirmation</h4>
                      <p className="text-gray-600">You receive email confirmation with order details and tracking information</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Processing</h4>
                      <p className="text-gray-600">We prepare your order, ensuring quality and freshness of products</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Packaging</h4>
                      <p className="text-gray-600">Items are carefully packaged to maintain quality during transit</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Dispatch</h4>
                      <p className="text-gray-600">Order is handed over to our trusted courier partners</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">5</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Tracking</h4>
                      <p className="text-gray-600">You receive tracking details to monitor your order's progress</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-kgo-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">6</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Delivery</h4>
                      <p className="text-gray-600">Order is delivered to your specified address</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Requirements */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">6. Delivery Requirements</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">6.1 Address Requirements</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>⚠️ Please ensure accurate delivery information:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li>Complete and accurate address with landmarks</li>
                    <li>Correct postal code and city name</li>
                    <li>Valid contact number for delivery coordination</li>
                    <li>Alternative contact number (if available)</li>
                    <li>Special delivery instructions (if any)</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">6.2 Delivery Attempts</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Our courier partners will make delivery attempts as follows:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li><strong>First Attempt:</strong> On scheduled delivery date</li>
                  <li><strong>Second Attempt:</strong> Next business day</li>
                  <li><strong>Third Attempt:</strong> Following business day</li>
                  <li><strong>After 3 Attempts:</strong> Package returned to sender</li>
                </ul>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">6.3 Delivery Confirmation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Upon successful delivery, you will receive:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Delivery confirmation SMS/email</li>
                  <li>Photo proof of delivery (if requested)</li>
                  <li>Delivery receipt with signature</li>
                </ul>
              </div>

              {/* Special Services */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">7. Special Services</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">7.1 Same Day Delivery</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>🚀 Same Day Delivery Available:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                    <li>Limited to select areas within Kerala</li>
                    <li>Orders must be placed before 2:00 PM</li>
                    <li>Additional charge of ₹500 applies</li>
                    <li>Subject to product availability and distance</li>
                    <li>Contact us to confirm availability</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">7.2 Gift Services</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li><strong>Gift Wrapping:</strong> Available for ₹100-200</li>
                  <li><strong>Gift Messages:</strong> Free personalized messages</li>
                  <li><strong>Gift Cards:</strong> Digital gift cards available</li>
                  <li><strong>Surprise Delivery:</strong> Coordinate surprise deliveries</li>
                </ul>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">7.3 Corporate Orders</h3>
                <p className="text-gray-600 leading-relaxed">
                  For bulk or corporate orders, we offer:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Special pricing and discounts</li>
                  <li>Flexible delivery schedules</li>
                  <li>Custom packaging options</li>
                  <li>Dedicated account management</li>
                </ul>
              </div>

              {/* Delivery Issues */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">8. Delivery Issues</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">8.1 Common Issues</h3>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Failed Delivery</h4>
                    <p className="text-gray-600">If delivery fails due to incorrect address or unavailability, additional charges may apply for re-delivery.</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Delayed Delivery</h4>
                    <p className="text-gray-600">Delays due to weather, holidays, or courier issues are beyond our control. We will keep you updated on any delays.</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Damaged Package</h4>
                    <p className="text-gray-600">If your package arrives damaged, please contact us immediately. We will arrange for replacement or refund.</p>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">8.2 Resolution Process</h3>
                <p className="text-gray-600 leading-relaxed">
                  For any delivery issues:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Contact us immediately with your order number</li>
                  <li>Provide photos if package is damaged</li>
                  <li>We will investigate and resolve within 24-48 hours</li>
                  <li>Compensation or replacement will be provided as appropriate</li>
                </ul>
              </div>

              {/* Contact Information */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">9. Contact Information</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 leading-relaxed mb-4">
                    For shipping and delivery inquiries, please contact us:
                  </p>
                  <div className="space-y-2 text-gray-600">
                    <p><strong>Email:</strong> sales@keralagiftsonline.com</p>
                    <p><strong>Phone:</strong> +91 8075030919</p>
                    <p><strong>WhatsApp:</strong> +91 8075030919</p>
                    <p><strong>Business Hours:</strong> Monday-Friday 9:00 AM - 6:00 PM IST</p>
                  </div>
                  <p className="text-gray-600 leading-relaxed mt-4">
                    <strong>For delivery tracking:</strong> Use the tracking number provided in your order confirmation email.
                  </p>
                </div>
              </div>

              {/* Policy Updates */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">10. Policy Updates</h2>
                <p className="text-gray-600 leading-relaxed">
                  We reserve the right to update this Shipping & Delivery Policy at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services constitutes acceptance of any modifications.
                </p>
              </div>

            </div>

            {/* Call to Action */}
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-kgo-green to-kgo-red p-8 rounded-2xl text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Order?</h3>
                <p className="text-lg mb-6 opacity-90">
                  Experience fast and reliable delivery of authentic Kerala gifts
                </p>
                <Link 
                  href="/products" 
                  className="inline-block bg-white text-kgo-red px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Shop Now
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
