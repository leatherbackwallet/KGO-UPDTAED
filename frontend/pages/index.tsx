import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import SEOHead from '../components/SEOHead';

export default function Home() {
  const [isClient, setIsClient] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    setIsHydrated(true);
  }, []);

  // Generate enhanced homepage structured data
  const generateHomepageStructuredData = () => {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "KeralGiftsOnline - Premium Gifts & Traditional Products",
      "description": "Kerala's premier online gift store offering traditional products and premium gifts with fast delivery across Kerala and worldwide",
      "url": "https://keralagiftsonline.in/",
      "mainEntity": {
        "@type": "Organization",
        "name": "KeralGiftsOnline",
        "url": "https://keralagiftsonline.in",
        "description": "Premium gift delivery service specializing in authentic Kerala products and traditional gifts"
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://keralagiftsonline.in/"
          }
        ]
      }
    };
  };

  return (
    <>
      <SEOHead
        title="KeralGiftsOnline - Premium Gifts & Traditional Products | Kerala's Best Online Gift Store"
        description="Discover premium quality gifts, traditional Kerala products & authentic items. Fast delivery across Kerala with advanced logistics. Perfect for festivals, occasions & special moments. Shop now!"
        url="https://keralagiftsonline.in/"
        type="website"
        isHomepage={true}
        structuredData={generateHomepageStructuredData()}
      />

      <main className="min-h-screen">
        <Navbar />
        
        {/* Hero Section with Onam Background */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/images/onam-background.svg')`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-green-900/40 via-green-800/60 to-green-900/80"></div>
          </div>

          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/20 rounded-full float-animation"></div>
            <div className="absolute top-40 right-20 w-16 h-16 bg-yellow-300/15 rounded-full float-animation-delay-1"></div>
            <div className="absolute bottom-40 left-20 w-24 h-24 bg-yellow-500/25 rounded-full float-animation-delay-2"></div>
            <div className="absolute bottom-20 right-10 w-12 h-12 bg-yellow-400/20 rounded-full float-animation-delay-3"></div>
            <div className="absolute top-60 left-1/4 w-8 h-8 bg-white/30 rounded-full float-animation"></div>
            <div className="absolute top-80 right-1/3 w-10 h-10 bg-white/25 rounded-full float-animation-delay-1"></div>
            <div className="absolute bottom-60 left-1/3 w-6 h-6 bg-white/35 rounded-full float-animation-delay-2"></div>
            <div className="absolute bottom-80 right-1/4 w-14 h-14 bg-white/20 rounded-full float-animation-delay-3"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
                <span className="block text-yellow-300 onam-text-glow">We deliver Gifts On your Behalf</span>
                <span className="block text-3xl md:text-5xl mt-4">Celebrate Every Moment</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-green-100 leading-relaxed">
                Premium quality gifts with fast delivery across Kerala.<br />
                <span className="text-yellow-200 font-medium">Traditional products made special</span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/products"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-green-900 bg-yellow-400 rounded-full hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10">Shop Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link 
                href="/products"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white rounded-full hover:bg-white hover:text-green-900 transition-all duration-300 transform hover:scale-105"
              >
                Products
              </Link>
            </div>

            {/* Customer Support Information Banner */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-200">
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-800 font-medium text-lg">
                      Need Same Day or Emergency Delivery?
                    </p>
                    <p className="text-blue-600 text-sm mt-1">
                      Contact our customer support team via WhatsApp for immediate assistance
                    </p>
                    <a 
                      href="https://wa.me/918075030919" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300 shadow-sm"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                      Contact Support
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
                <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-green-50 to-white relative">
          <div className="absolute inset-0 bg-pattern opacity-5"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-green-900 mb-4">Why Choose KeralGiftsOnline?</h2>
              <p className="text-xl text-green-700 max-w-3xl mx-auto">
                We bring the spirit of Kerala's culture to your doorstep with premium quality and exceptional service
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-4">Lightning Fast Delivery</h3>
                <p className="text-green-700 leading-relaxed">Express delivery across Kerala with real-time tracking and guaranteed on-time delivery</p>
              </div>
              
              <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-4">Premium Quality</h3>
                <p className="text-green-700 leading-relaxed">Handpicked selection of the finest gifts and traditional products</p>
              </div>
              
              <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-4">Personal Touch</h3>
                <p className="text-green-700 leading-relaxed">Personalized service and custom gift arrangements for every occasion</p>
              </div>
            </div>
          </div>
        </section>


        {/* Celebration Banner */}
        <section className="py-20 bg-gradient-to-r from-green-600 via-green-700 to-green-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-pattern opacity-10"></div>
          <div className="absolute inset-0 festive-pattern opacity-5"></div>
          
          {/* Decorative Elements */}
          <div className="absolute top-10 left-10 w-16 h-16 bg-yellow-400/20 rounded-full float-animation"></div>
          <div className="absolute top-20 right-20 w-12 h-12 bg-yellow-300/15 rounded-full float-animation-delay-1"></div>
          <div className="absolute bottom-20 left-20 w-20 h-20 bg-yellow-500/25 rounded-full float-animation-delay-2"></div>
          <div className="absolute bottom-10 right-10 w-14 h-14 bg-yellow-400/20 rounded-full float-animation-delay-3"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 onam-text-glow">
                Celebrate Onam with Us
              </h2>
              <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                Join thousands of happy customers who trust us for their gift needs. 
                From traditional to modern, we have everything you need to make your Onam special.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/register"
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-green-900 rounded-full font-semibold hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10">Join Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                href="/contact"
                className="group inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-green-900 transition-all duration-300 transform hover:scale-105"
              >
                Contact Us
              </Link>
            </div>
            
            {/* Festive Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">10K+</div>
                <div className="text-green-100">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">500+</div>
                <div className="text-green-100">Cities Served</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">24/7</div>
                <div className="text-green-100">Customer Support</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
          .bg-pattern {
            background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0);
            background-size: 20px 20px;
          }
        `
      }} />
    </>
  );
}

// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  };
}
