import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - OnYourBehlf | Kerala Gifts Online</title>
        <meta name="description" content="Read our Privacy Policy to understand how OnYourBehlf - Kerala Gifts Online collects, uses, and protects your personal information." />
        <meta name="keywords" content="privacy, policy, data protection, personal information, Kerala gifts, e-commerce" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-green-600 to-red-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
                Privacy Policy
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white drop-shadow-md">
                Your privacy is important to us. Learn how we protect and use your information.
              </p>
              <p className="text-sm text-white opacity-95 drop-shadow-sm">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Content */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              
              {/* Introduction */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Introduction</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  OnYourBehlf (Kerala Gifts Online) ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Business Information:</strong><br />
                  Business Name: OnYourBehlf (Kerala Gifts Online)<br />
                  Contact: sales@keralagiftsonline.com<br />
                  Phone: +91 8075030919
                </p>
              </div>

              {/* Information We Collect */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">2. Information We Collect</h2>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">2.1 Personal Information</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We may collect the following types of personal information:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-6">
                  <li><strong>Contact Information:</strong> Name, email address, phone number, mailing address</li>
                  <li><strong>Account Information:</strong> Username, password, profile information</li>
                  <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely through Razorpay)</li>
                  <li><strong>Order Information:</strong> Purchase history, delivery preferences, gift messages</li>
                  <li><strong>Communication Records:</strong> Customer service interactions, feedback, reviews</li>
                </ul>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">2.2 Automatically Collected Information</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We automatically collect certain information when you visit our website:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-6">
                  <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                  <li><strong>Usage Information:</strong> Pages visited, time spent on site, click patterns, referral sources</li>
                  <li><strong>Cookies and Tracking:</strong> Cookies, web beacons, and similar technologies</li>
                  <li><strong>Location Information:</strong> General geographic location based on IP address</li>
                </ul>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">2.3 Third-Party Information</h3>
                <p className="text-gray-600 leading-relaxed">
                  We may receive information from third parties, including:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Payment processors (Razorpay) for transaction verification</li>
                  <li>Social media platforms if you connect your accounts</li>
                  <li>Analytics providers for website usage statistics</li>
                  <li>Marketing partners for promotional activities</li>
                </ul>
              </div>

              {/* How We Use Information */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">3. How We Use Your Information</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We use your information for the following purposes:
                </p>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">3.1 Service Provision</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-6">
                  <li>Process and fulfill your orders</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Manage your account and preferences</li>
                  <li>Send order confirmations and delivery updates</li>
                  <li>Process payments and prevent fraud</li>
                </ul>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">3.2 Communication</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-6">
                  <li>Send marketing communications (with your consent)</li>
                  <li>Provide product recommendations and updates</li>
                  <li>Notify you about promotions and special offers</li>
                  <li>Send important service announcements</li>
                </ul>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">3.3 Business Operations</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-6">
                  <li>Analyze website usage and improve user experience</li>
                  <li>Conduct research and analytics</li>
                  <li>Develop new products and services</li>
                  <li>Ensure website security and prevent abuse</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>

              {/* Information Sharing */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">4. Information Sharing and Disclosure</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
                </p>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">4.1 Service Providers</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-6">
                  <li><strong>Payment Processing:</strong> Razorpay for secure payment processing</li>
                  <li><strong>Shipping Partners:</strong> Delivery companies for order fulfillment</li>
                  <li><strong>Cloud Services:</strong> Hosting and data storage providers</li>
                  <li><strong>Analytics:</strong> Website analytics and performance monitoring</li>
                  <li><strong>Marketing:</strong> Email marketing and customer communication tools</li>
                </ul>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">4.2 Legal Requirements</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-6">
                  <li>Comply with legal obligations and court orders</li>
                  <li>Respond to government requests and investigations</li>
                  <li>Protect our rights, property, and safety</li>
                  <li>Prevent fraud and ensure security</li>
                </ul>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">4.3 Business Transfers</h3>
                <p className="text-gray-600 leading-relaxed">
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity, subject to the same privacy protections.
                </p>
              </div>

              {/* Data Security */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">5. Data Security</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We implement appropriate technical and organizational measures to protect your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-6">
                  <li><strong>Encryption:</strong> Data is encrypted in transit and at rest</li>
                  <li><strong>Access Controls:</strong> Limited access to personal information on a need-to-know basis</li>
                  <li><strong>Secure Infrastructure:</strong> Protected servers and secure hosting environments</li>
                  <li><strong>Regular Updates:</strong> Security patches and system updates</li>
                  <li><strong>Monitoring:</strong> Continuous monitoring for security threats</li>
                </ul>
                <p className="text-gray-600 leading-relaxed">
                  However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                </p>
              </div>

              {/* Cookies and Tracking */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">6. Cookies and Tracking Technologies</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We use cookies and similar technologies to enhance your experience:
                </p>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">6.1 Types of Cookies</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-6">
                  <li><strong>Essential Cookies:</strong> Required for website functionality</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand website usage</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Marketing Cookies:</strong> Used for targeted advertising (with consent)</li>
                </ul>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">6.2 Cookie Management</h3>
                <p className="text-gray-600 leading-relaxed">
                  You can control cookies through your browser settings. However, disabling certain cookies may affect website functionality.
                </p>
              </div>

              {/* Your Rights */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">7. Your Rights and Choices</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  You have the following rights regarding your personal information:
                </p>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">7.1 Access and Portability</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-6">
                  <li>Request access to your personal information</li>
                  <li>Receive a copy of your data in a portable format</li>
                  <li>Verify the accuracy of your information</li>
                </ul>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">7.2 Correction and Updates</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-6">
                  <li>Update or correct your personal information</li>
                  <li>Modify your account preferences</li>
                  <li>Change your communication preferences</li>
                </ul>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">7.3 Deletion and Restriction</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-6">
                  <li>Request deletion of your personal information</li>
                  <li>Restrict processing of your data</li>
                  <li>Object to certain uses of your information</li>
                </ul>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">7.4 Marketing Communications</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Opt-out of marketing emails (unsubscribe link in emails)</li>
                  <li>Manage your communication preferences</li>
                  <li>Withdraw consent for marketing activities</li>
                </ul>
              </div>

              {/* Data Retention */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">8. Data Retention</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We retain your personal information for as long as necessary to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-6">
                  <li>Provide our services and fulfill orders</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                  <li>Improve our services and user experience</li>
                </ul>
                <p className="text-gray-600 leading-relaxed">
                  When personal information is no longer needed, we will securely delete or anonymize it.
                </p>
              </div>

              {/* International Transfers */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">9. International Data Transfers</h2>
                <p className="text-gray-600 leading-relaxed">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information during such transfers, including standard contractual clauses and adequacy decisions.
                </p>
              </div>

              {/* Children's Privacy */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">10. Children's Privacy</h2>
                <p className="text-gray-600 leading-relaxed">
                  Our services are not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
                </p>
              </div>

              {/* Third-Party Links */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">11. Third-Party Links</h2>
                <p className="text-gray-600 leading-relaxed">
                  Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
                </p>
              </div>

              {/* Changes to Privacy Policy */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">12. Changes to This Privacy Policy</h2>
                <p className="text-gray-600 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on our website and updating the "Last updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.
                </p>
              </div>

              {/* Contact Information */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">13. Contact Us</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 leading-relaxed mb-4">
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
                  </p>
                  <div className="space-y-2 text-gray-600">
                    <p><strong>Email:</strong> sales@keralagiftsonline.com</p>
                    <p><strong>Phone:</strong> +91 8075030919</p>
                    <p><strong>WhatsApp:</strong> +91 8075030919</p>
                    <p><strong>Business Hours:</strong> Monday-Friday 9:00 AM - 6:00 PM IST</p>
                  </div>
                  <p className="text-gray-600 leading-relaxed mt-4">
                    For privacy-related requests, please include "Privacy Request" in your subject line for faster processing.
                  </p>
                </div>
              </div>

            </div>

            {/* Call to Action */}
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-kgo-green to-kgo-red p-8 rounded-2xl text-white">
                <h3 className="text-2xl font-bold mb-4">Questions About Your Privacy?</h3>
                <p className="text-lg mb-6 opacity-90">
                  We're here to help with any privacy concerns or questions
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
