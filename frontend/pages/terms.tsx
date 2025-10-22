import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms & Conditions - OnYourBehlf | Kerala Gifts Online</title>
        <meta name="description" content="Read our Terms & Conditions for OnYourBehlf - Kerala Gifts Online. Understand your rights and responsibilities when using our platform." />
        <meta name="keywords" content="terms, conditions, legal, Kerala gifts, e-commerce, user agreement" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-green-600 to-red-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
                Terms & Conditions
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white drop-shadow-md">
                Please read these terms carefully before using our platform
              </p>
              <p className="text-sm text-white opacity-95 drop-shadow-sm">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              
              {/* Introduction */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Introduction</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Please read and accept our terms and conditions to proceed with your order.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Business Information:</strong><br />
                  Business Name: KGO (Kerala Gifts Online)<br />
                  Billing Label: KGO - Kerala Gifts Online<br />
                  Contact: sales@keralagiftsonline.com<br />
                  Phone: +91 8075030919 OR +1 (281) 723-8520
                </p>
              </div>

              {/* Order Processing */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Order Processing</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    By placing an order, you agree to provide accurate and complete information. 
                    We reserve the right to cancel or refuse any order at our discretion.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Orders are processed within 1-2 business days. You will receive a confirmation 
                    email once your order is confirmed. For same day orders an emergency charge of 
                    Rs:750/- is applicable as extra.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    If you want to remove any item from the pre-set gift combo and want to add your 
                    own then choice is yours and any item of your choice can be added and delivered 
                    by paying additional cost incurred if any by making a direct call or WhatsApp to 
                    us at +91 8075030919 OR +1 (281) 723-8520
                  </p>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">2. Payment Terms</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    Payment is required at the time of order placement. We accept various payment 
                    methods including credit cards, debit cards, and digital wallets.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    All prices are in Indian Rupees (₹), including premium quality product cost, 
                    customization and personal delivery charge and applicable taxes unless otherwise stated.
                  </p>
                </div>
              </div>

              {/* Delivery and Shipping */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">3. Delivery and Shipping</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    We customize, make fresh purchases and do one-on-one personal premium delivery 
                    of your gifts across Kerala. Delivery time and design of the items may vary 
                    based on location and product availability without compromising quality, quantity 
                    and timeliness of the occasion.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    We undertake that we will try our level best to keep the surprise elements as 
                    of your choice and Photos of your gifts will be shared without any fail. Videos 
                    and photos of delivery are subject to the privacy and permission of the receiver.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    We are not responsible for delays caused by weather, natural disasters, or other 
                    circumstances beyond our control.
                  </p>
                </div>
              </div>

              {/* Returns and Refunds */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">4. Returns and Refunds</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    Since most of the items in the gift combos are customized with fresh items or 
                    perishable items as of customer's choice and are not eligible for returns. 
                    Refunds will be processed within 5-7 business days in case of any technical 
                    errors after your payment is deducted but not reflected in our end.
                  </p>
                </div>
              </div>

              {/* Privacy and Data Protection */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">5. Privacy and Data Protection</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    We collect and process your personal information in accordance with our 
                    Privacy Policy. Your data is used solely for order processing and customer service.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    We do not sell or share your personal information with third parties without 
                    your consent.
                  </p>
                </div>
              </div>

              {/* Limitation of Liability */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">6. Limitation of Liability</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    Our liability is limited to the purchase and delivery of the products. We are 
                    not liable for any indirect, incidental, or consequential damages at users end. 
                    We don't offer any guarantees or warranty unless the original product manufacturer 
                    provides so.
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Contact Information</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 leading-relaxed mb-4">
                    For any questions regarding these terms, please contact us:
                  </p>
                  <div className="space-y-2 text-gray-600">
                    <p><strong>Phone:</strong> +91 8075030919</p>
                    <p><strong>International:</strong> +1 (281) 723-8520</p>
                    <p><strong>WhatsApp:</strong> +91 8075030919</p>
                    <p><strong>Email:</strong> sales@keralagiftsonline.com</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Call to Action */}
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-kgo-green to-kgo-red p-8 rounded-2xl text-white">
                <h3 className="text-2xl font-bold mb-4">Questions About Our Terms?</h3>
                <p className="text-lg mb-6 opacity-90">
                  Contact us if you need clarification on any of these terms
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

