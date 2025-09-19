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
        <section className="relative py-20 bg-gradient-to-r from-kgo-green to-kgo-red text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Terms & Conditions
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                Please read these terms carefully before using our platform
              </p>
              <p className="text-sm opacity-90">
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Introduction</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Welcome to OnYourBehlf (Kerala Gifts Online). These Terms and Conditions ("Terms") govern your use of our website and services. By accessing or using our platform, you agree to be bound by these Terms.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Business Information:</strong><br />
                  Business Name: OnYourBehlf (Kerala Gifts Online)<br />
                  Billing Label: OnYourBehlf - Kerala Gifts Online<br />
                  Contact: sales@keralagiftsonline.com<br />
                  Phone: +91 8075030919
                </p>
              </div>

              {/* Acceptance of Terms */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">2. Acceptance of Terms</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  By using our website, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services constitutes acceptance of any modifications.
                </p>
              </div>

              {/* User Accounts */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">3. User Accounts</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    To place orders, you may need to create an account. You are responsible for:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Providing accurate and complete information</li>
                    <li>Maintaining the security of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any unauthorized use</li>
                  </ul>
                </div>
              </div>

              {/* Products and Services */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">4. Products and Services</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    We offer authentic Kerala gifts and traditional products including:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Traditional Kerala spices and condiments</li>
                    <li>Handcrafted items and artifacts</li>
                    <li>Traditional snacks and sweets</li>
                    <li>Combo gift packages</li>
                    <li>Personalized gift services</li>
                  </ul>
                  <p className="text-gray-600 leading-relaxed">
                    Product descriptions, images, and prices are subject to change without notice. We strive for accuracy but cannot guarantee that all information is error-free.
                  </p>
                </div>
              </div>

              {/* Orders and Payment */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">5. Orders and Payment</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>Order Process:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>All orders are subject to product availability</li>
                    <li>We reserve the right to refuse or cancel any order</li>
                    <li>Order confirmation will be sent via email</li>
                    <li>Prices are in Indian Rupees (INR) unless otherwise specified</li>
                  </ul>
                  
                  <p className="text-gray-600 leading-relaxed">
                    <strong>Payment Methods:</strong> We accept payments through Razorpay including:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Credit and Debit Cards</li>
                    <li>UPI payments</li>
                    <li>Net Banking</li>
                    <li>Digital Wallets</li>
                  </ul>
                  
                  <p className="text-gray-600 leading-relaxed">
                    All payments are processed securely through Razorpay. We do not store your payment information on our servers.
                  </p>
                </div>
              </div>

              {/* Pricing and Taxes */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">6. Pricing and Taxes</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>Pricing Policy:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>All prices include applicable taxes</li>
                    <li>Shipping charges are calculated based on delivery location</li>
                    <li>Prices are subject to change without prior notice</li>
                    <li>Special offers and discounts are subject to terms and conditions</li>
                  </ul>
                  
                  <p className="text-gray-600 leading-relaxed">
                    <strong>Billing:</strong> All charges will appear on your statement as "OnYourBehlf - Kerala Gifts Online"
                  </p>
                </div>
              </div>

              {/* Delivery and Shipping */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">7. Delivery and Shipping</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>Delivery Terms:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Standard delivery: 24-48 hours within Kerala</li>
                    <li>Other locations in India: 3-7 business days</li>
                    <li>International delivery: 7-14 business days</li>
                    <li>Delivery times are estimates and not guaranteed</li>
                  </ul>
                  
                  <p className="text-gray-600 leading-relaxed">
                    <strong>Delivery Requirements:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Valid delivery address must be provided</li>
                    <li>Someone must be available to receive the package</li>
                    <li>We are not responsible for delivery delays due to incorrect addresses</li>
                    <li>Additional charges may apply for remote locations</li>
                  </ul>
                </div>
              </div>

              {/* Returns and Refunds */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">8. Returns and Refunds</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    <strong>Return Policy:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Returns must be initiated within 48 hours of delivery</li>
                    <li>Products must be in original condition and packaging</li>
                    <li>Perishable items cannot be returned</li>
                    <li>Custom orders are non-returnable</li>
                  </ul>
                  
                  <p className="text-gray-600 leading-relaxed">
                    <strong>Refund Process:</strong>
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Refunds will be processed within 5-7 business days</li>
                    <li>Refunds will be issued to the original payment method</li>
                    <li>Shipping charges are non-refundable unless the return is due to our error</li>
                    <li>Contact us at sales@keralagiftsonline.com for return requests</li>
                  </ul>
                </div>
              </div>

              {/* User Conduct */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">9. User Conduct</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    You agree not to:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Use our services for any unlawful purpose</li>
                    <li>Interfere with the proper functioning of our website</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Provide false or misleading information</li>
                    <li>Violate any applicable laws or regulations</li>
                  </ul>
                </div>
              </div>

              {/* Intellectual Property */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">10. Intellectual Property</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    All content on our website, including text, images, logos, and software, is protected by copyright and other intellectual property laws. You may not:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Copy, modify, or distribute our content without permission</li>
                    <li>Use our trademarks or logos without authorization</li>
                    <li>Reverse engineer or attempt to extract source code</li>
                    <li>Create derivative works based on our content</li>
                  </ul>
                </div>
              </div>

              {/* Limitation of Liability */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">11. Limitation of Liability</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    To the maximum extent permitted by law, OnYourBehlf shall not be liable for:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Indirect, incidental, or consequential damages</li>
                    <li>Loss of profits, data, or business opportunities</li>
                    <li>Damages resulting from third-party actions</li>
                    <li>Force majeure events beyond our control</li>
                  </ul>
                  <p className="text-gray-600 leading-relaxed">
                    Our total liability shall not exceed the amount paid by you for the specific product or service in question.
                  </p>
                </div>
              </div>

              {/* Privacy */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">12. Privacy</h2>
                <p className="text-gray-600 leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.
                </p>
              </div>

              {/* Governing Law */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">13. Governing Law</h2>
                <p className="text-gray-600 leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Kerala, India.
                </p>
              </div>

              {/* Contact Information */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">14. Contact Information</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 leading-relaxed mb-4">
                    If you have any questions about these Terms, please contact us:
                  </p>
                  <div className="space-y-2 text-gray-600">
                    <p><strong>Email:</strong> sales@keralagiftsonline.com</p>
                    <p><strong>Phone:</strong> +91 8075030919</p>
                    <p><strong>WhatsApp:</strong> +91 8075030919</p>
                    <p><strong>Business Hours:</strong> Monday-Friday 9:00 AM - 6:00 PM IST</p>
                  </div>
                </div>
              </div>

              {/* Severability */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">15. Severability</h2>
                <p className="text-gray-600 leading-relaxed">
                  If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
                </p>
              </div>

              {/* Entire Agreement */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">16. Entire Agreement</h2>
                <p className="text-gray-600 leading-relaxed">
                  These Terms, together with our Privacy Policy and other policies referenced herein, constitute the entire agreement between you and OnYourBehlf regarding your use of our services.
                </p>
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
