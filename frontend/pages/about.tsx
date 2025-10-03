import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  return (
    <>
      <Head>
        <title>About Us - OnYourBehlf | Kerala Gifts Online</title>
        <meta
          name="description"
          content="Learn about KGO GROUP (Kerala Gifts Online) - Your trusted source for authentic Kerala gifts and traditional products delivered  to  the recepients in  Kerala"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-green-600 to-red-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
                About KGO Group
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white drop-shadow-md">
                Bringing the authentic taste and culture of Kerala to the global diaspora through carefully curated gifts and traditional products
              </p>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-8 backdrop-blur-sm">
                <p className="text-lg font-semibold mb-2 text-white">Business Information</p>
                <p className="text-sm text-white opacity-95">Business Name: KGO (Kerala Gifts Online)</p>
                <p className="text-sm text-white opacity-95">Billing Label: KGO - Kerala Gifts Online</p>
              </div>
              <div className="flex justify-center space-x-4">
                <Link href="/products" className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Shop Now
                </Link>
                <Link href="/content" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors">
                  Cultural Content
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Our Story
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Founded with a passion for sharing Kerala's rich cultural heritage, KGO (Kerala Gifts Online) was born from the desire to connect the global Malayali diaspora with authentic products from their homeland.
                </p>
                <p className="text-lg text-gray-600 mb-6">
                  What started as a small initiative to bring traditional Kerala snacks and gifts to friends and family has grown into a trusted platform serving the global Malayali diaspora under the brand name OnYourBehlf.
                </p>
                <p className="text-lg text-gray-600">
                  Today, we take pride in offering a carefully curated selection of products that represent the best of Kerala's traditions, flavors, and craftsmanship.
                </p>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-kgo-green to-kgo-red p-8 rounded-2xl text-white">
                  <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                  <p className="text-lg">
                    To bridge the cultural gap between Kerala and the global diaspora by providing authentic, high-quality products that bring joy, comfort, and a taste of home to our customers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Values
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="w-16 h-16 bg-kgo-green rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Authenticity</h3>
                <p className="text-gray-600">
                  Every product we offer is carefully selected to ensure it represents the true essence of Kerala's culture and traditions.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="w-16 h-16 bg-kgo-red rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quality</h3>
                <p className="text-gray-600">
                  We maintain the highest standards of quality in all our products, from sourcing to delivery, ensuring customer satisfaction.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="w-16 h-16 bg-kgo-green rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Community</h3>
                <p className="text-gray-600">
                  We're more than just a business - we're a community that celebrates and preserves Kerala's rich cultural heritage.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What We Offer
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                A diverse range of authentic Kerala products and traditional items
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-kgo-green rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Traditional Gifts</h3>
                <p className="text-gray-600">Authentic Kerala products and souvenirs</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-kgo-red rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Traditional Crafts</h3>
                <p className="text-gray-600">Handcrafted items and traditional artifacts</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-kgo-green rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Snacks & Treats</h3>
                <p className="text-gray-600">Traditional Kerala snacks and sweets</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-kgo-red rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Home Delivery</h3>
                <p className="text-gray-600">Fast and reliable delivery </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 bg-gradient-to-r from-kgo-green to-kgo-red text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose OnYourBehlf?
              </h2>
              <p className="text-xl max-w-3xl mx-auto">
                We're committed to providing the best experience for our customers
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Authentic Products</h3>
                <p>Directly sourced from Kerala to ensure authenticity and quality</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p>Quick and reliable delivery service Kerala</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
                <p>Round-the-clock customer support to assist you</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
                <p>Safe and secure payment options for your peace of mind</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Personal Touch</h3>
                <p>Personalized service and attention to detail</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Community Focus</h3>
                <p>Supporting and strengthening the Malayali community</p>
              </div>
            </div>
          </div>
        </section>

        {/* Terms & Conditions Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Terms & Conditions
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Please read our terms and conditions carefully before placing your order.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                <div className="space-y-8 text-gray-700">
                  {/* 1. Order Processing */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Order Processing</h3>
                    <p className="mb-2">
                      By placing an order, you agree to provide accurate and complete information. We reserve the right to cancel or refuse any order at our discretion.
                    </p>
                    <p className="mb-2">
                      Orders are processed within 1-2 business days. You will receive a confirmation email once your order is confirmed. For same day orders an emergency charge of <span className="font-semibold text-kgo-red">Rs:750/-</span> is applicable as extra.
                    </p>
                    <p className="mb-2">
                      If you want to remove any item from the pre-set gift combo and want to add your own, the choice is yours and any item of your choice can be added and delivered by paying additional cost incurred if any by making a direct call or WhatsApp to us at <a href="tel:+919400436424" className="text-kgo-green font-semibold underline">+91 9400 436 424</a> or <a href="tel:+12817238520" className="text-kgo-green font-semibold underline">+1 (281) 723-8520</a>.
                    </p>
                  </div>
                  {/* 2. Payment Terms */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Payment Terms</h3>
                    <p className="mb-2">
                      Payment is required at the time of order placement. We accept various payment methods including credit cards, debit cards, and digital wallets.
                    </p>
                    <p>
                      All prices are in Indian Rupees (₹), including premium quality product cost, customization and personal delivery charge and applicable taxes unless otherwise stated.
                    </p>
                  </div>
                  {/* 3. Delivery and Shipping */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Delivery and Shipping</h3>
                    <p className="mb-2">
                      We customize, make fresh purchases and do one-on-one personal premium delivery of your gifts across Kerala. Delivery time and design of the items may vary based on location and product availability without compromising quality, quantity and timeliness of the occasion.
                    </p>
                    <p className="mb-2">
                      We undertake that we will try our level best to keep the surprise elements as of your choice and photos of your gifts will be shared without any fail. Videos and photos of delivery are subject to the privacy and permission of the receiver.
                    </p>
                    <p>
                      We are not responsible for delays caused by weather, natural disasters, or other circumstances beyond our control.
                    </p>
                  </div>
                  {/* 4. Returns and Refunds */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Returns and Refunds</h3>
                    <p className="mb-2">
                      Since most of the items in the gift combos are customized with fresh items or perishable items as of customer’s choice and are not eligible for returns. Refunds will be processed within 5-7 business days in case of any technical errors after your payment is deducted but not reflected in our end.
                    </p>
                  </div>
                  {/* 5. Privacy and Data Protection */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">5. Privacy and Data Protection</h3>
                    <p className="mb-2">
                      We collect and process your personal information in accordance with our Privacy Policy. Your data is used solely for order processing and customer service.
                    </p>
                    <p>
                      We do not sell or share your personal information with third parties without your consent.
                    </p>
                  </div>
                  {/* 6. Limitation of Liability */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">6. Limitation of Liability</h3>
                    <p>
                      Our liability is limited to the purchase and delivery of the products. We are not liable for any indirect, incidental, or consequential damages at users end. We don’t offer any guarantees or warranty unless the original product manufacturer provides so.
                    </p>
                  </div>
                  {/* 7. Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">7. Contact Information</h3>
                    <p className="mb-2">
                      For any questions regarding these terms, shipping and delivery please contact us at:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 mb-2">
                      <li>
                        <span className="font-semibold">Email:</span> <a href="mailto:support@keralagiftsonline.com" className="text-kgo-red underline">support@keralagiftsonline.com</a>
                      </li>
                      <li>
                        <span className="font-semibold">Phone:</span> <a href="tel:+918075030919" className="text-kgo-green underline">+91-8075 030 919</a>, <a href="tel:+12817238520" className="text-kgo-green underline">+1 (281) 723-8520</a>
                      </li>
                      <li>
                        <span className="font-semibold">WhatsApp:</span> <a href="https://wa.me/919400436424" className="text-kgo-green underline">+91-9400 436 424</a>
                      </li>
                    </ul>
                    <p className="text-sm text-gray-500 mt-2">
                      <span className="font-semibold">Note:</span> By accepting these terms, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Commitment Section */}
        <section>
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="bg-gradient-to-r from-kgo-green to-kgo-red p-6 rounded-xl text-white text-center">
              <h4 className="text-xl font-bold mb-2">Our Commitment to You</h4>
              <p className="text-lg opacity-90">
                We are dedicated to providing exceptional service and maintaining the highest standards of quality in every aspect of our business.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Get in Touch
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Have questions or need assistance? We'd love to hear from you!
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-kgo-green rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Email</p>
                      <p className="text-gray-600">sales@keralagiftsonline.com</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-kgo-red rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                    </div>
                    <div>                      <p className="font-semibold text-gray-900">WhatsApp</p>
                      <p className="text-gray-600">+91 8075030919</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-kgo-green rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Location</p>
                      <p className="text-gray-600">Kerala</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Business Hours</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">International Holidays</span>
                    <span className="font-semibold">24/7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">National Holidays</span>
                    <span className="font-semibold">24/7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Area</span>
                    <span className="font-semibold">Entire state of Kerala</span>
                  </div>
                </div>

                <div className="mt-8">
                  <Link href="/products" className="inline-block bg-kgo-red text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                    Shop Now
                  </Link>
                </div>
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
