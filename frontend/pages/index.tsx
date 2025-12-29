import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SEOHead from '../components/SEOHead';
import RandomProductCarousel from '../components/RandomProductCarousel';
import { Product } from '../types/shared';
import { loadProductsFromJSON } from '../utils/jsonDataTransformers';
import { GetServerSideProps } from 'next';

interface HomeProps {
  products: Product[];
}

export default function Home({ products }: HomeProps) {
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(false);
  const [backgroundImageError, setBackgroundImageError] = useState(false);
  const [backgroundImageSrc, setBackgroundImageSrc] = useState('/images/products/Landing page/LandingPageBackground.png');

  // Preload background image with error handling and CORS support
  useEffect(() => {
    const img = new Image();
    // Encode the path to handle spaces in directory names
    const imagePath = '/images/products/Landing page/LandingPageBackground.png';
    const encodedPath = imagePath.replace(/ /g, '%20');
    
    // Set crossOrigin for CORS
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      setBackgroundImageLoaded(true);
      setBackgroundImageError(false);
      setBackgroundImageSrc(imagePath);
    };
    
    img.onerror = (error) => {
      console.warn('Background image failed to load, trying fallback paths', error);
      setBackgroundImageError(true);
      setBackgroundImageLoaded(false);
      
      // Try alternative paths in order
      const fallbackPaths = [
        '/images/products/LandingPageBackground.png',
        '/images/products/Landing%20page/LandingPageBackground.png',
        encodedPath
      ];
      
      let fallbackIndex = 0;
      const tryFallback = () => {
        if (fallbackIndex >= fallbackPaths.length) {
          // All fallbacks failed, use gradient
          console.warn('All background image paths failed, using gradient fallback');
          setBackgroundImageLoaded(false);
          return;
        }
        
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => {
          setBackgroundImageSrc(fallbackPaths[fallbackIndex]);
          setBackgroundImageLoaded(true);
          setBackgroundImageError(false);
        };
        fallbackImg.onerror = () => {
          fallbackIndex++;
          tryFallback();
        };
        fallbackImg.src = fallbackPaths[fallbackIndex];
      };
      
      tryFallback();
    };
    
    // Start loading with encoded path first
    img.src = encodedPath;
    
    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, []);
  // Generate enhanced homepage structured data
  const generateHomepageStructuredData = () => {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "KeralGiftsOnline - Personalized Gifts & Delivery Across All Kerala Districts",
      "description": "Send personalized gifts across all 14 districts of Kerala. Custom gifts for Onam, Vishu, Christmas, Valentine's Day, Anniversary, Independence Day, Republic Day, Father's Day, Mother's Day, Easter, Gandhi Jayanti. Same-day delivery, personalized gift hampers, traditional Kerala products.",
      "url": "https://keralagiftsonline.in/",
      "inLanguage": "en",
      "mainEntity": {
        "@type": "Organization",
        "name": "KeralGiftsOnline",
        "url": "https://keralagiftsonline.in",
        "description": "Premium personalized gift delivery service across all 14 districts of Kerala - Kochi, Trivandrum, Kozhikode, Thrissur, Kannur, Kollam, Palakkad, Malappuram, Alappuzha, Kottayam, Idukki, Wayanad, Kasaragod, Pathanamthitta. Custom gifts for all occasions including Onam, Vishu, Christmas, Valentine's Day, Anniversary, Independence Day, Republic Day, Father's Day, Mother's Day, Easter, Gandhi Jayanti. Same-day delivery, personalized gift hampers, traditional Kerala products.",
        "areaServed": [
          {
            "@type": "State",
            "name": "Kerala",
            "containsPlace": [
              {"@type": "City", "name": "Kochi"},
              {"@type": "City", "name": "Thiruvananthapuram"},
              {"@type": "City", "name": "Kozhikode"},
              {"@type": "City", "name": "Thrissur"},
              {"@type": "City", "name": "Kannur"},
              {"@type": "City", "name": "Kollam"},
              {"@type": "City", "name": "Palakkad"},
              {"@type": "City", "name": "Malappuram"},
              {"@type": "City", "name": "Alappuzha"},
              {"@type": "City", "name": "Kottayam"},
              {"@type": "City", "name": "Idukki"},
              {"@type": "City", "name": "Wayanad"},
              {"@type": "City", "name": "Kasaragod"},
              {"@type": "City", "name": "Pathanamthitta"}
            ]
          }
        ],
        "makesOffer": {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Gift Delivery Service",
            "description": "Personalized gift delivery across all 14 districts of Kerala. Custom gifts for Onam, Vishu, Christmas, Valentine's Day, Anniversary, Independence Day, Republic Day, Father's Day, Mother's Day, Easter, Gandhi Jayanti. Same-day delivery, personalized gift hampers, traditional Kerala products."
          }
        }
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

  const handleProductClick = (product: Product) => {
    // This will be handled by the carousel component
  };

  return (
    <>
      <SEOHead
        title="KeralGiftsOnline - Personalized Gifts & Delivery Across All Kerala Districts | Online Gift Store"
        description="Send personalized gifts across all 14 districts of Kerala - Kochi, Trivandrum, Kozhikode, Thrissur, Kannur, Kollam, Palakkad, Malappuram, Alappuzha, Kottayam, Idukki, Wayanad, Kasaragod, Pathanamthitta. Custom gifts for Onam, Vishu, Christmas, Valentine's Day, Anniversary, Independence Day, Republic Day, Father's Day, Mother's Day, Easter, Gandhi Jayanti. Same-day delivery, personalized gift hampers, traditional Kerala products."
        url="https://keralagiftsonline.in/"
        type="website"
        isHomepage={true}
        structuredData={generateHomepageStructuredData()}
      />
      
      <Head>
        {/* Preload background image for better performance and CORS support */}
        <link
          rel="preload"
          as="image"
          href="/images/products/Landing%20page/LandingPageBackground.png"
          crossOrigin="anonymous"
        />
      </Head>

      <main className="min-h-screen">
        <Navbar />
        
        {/* Modern Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
          {/* Background with gradient overlay - Robust image loading with CORS support */}
          <div 
            className="absolute inset-0 z-0 transition-opacity duration-1000"
            style={{
              backgroundImage: backgroundImageLoaded 
                ? `url("${backgroundImageSrc.replace(/ /g, '%20')}")` 
                : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
              opacity: backgroundImageLoaded ? 1 : 0.8,
              willChange: 'opacity'
            }}
          >
            {/* Fallback gradient background */}
            {!backgroundImageLoaded && (
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
                }}
              />
            )}
            
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/80"></div>
          </div>

          {/* Animated background elements - Moving lights across visible area */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {/* Light 1 - Red, moves in pattern 1 */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-kgo-red/30 rounded-full blur-3xl animate-moving-light-1"></div>
            
            {/* Light 2 - Green, moves in pattern 2 */}
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-kgo-green/30 rounded-full blur-3xl animate-moving-light-2"></div>
            
            {/* Light 3 - Purple, moves in pattern 3 */}
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-moving-light-3"></div>
            
            {/* Light 4 - Gold/Yellow, moves in pattern 4 */}
            <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-yellow-400/25 rounded-full blur-3xl animate-moving-light-4"></div>
            
            {/* Light 5 - Blue, moves in pattern 5 */}
            <div className="absolute bottom-1/3 left-1/3 w-88 h-88 bg-blue-400/20 rounded-full blur-3xl animate-moving-light-5"></div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="space-y-8 animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full mb-4">
                <span className="text-white/90 text-sm font-semibold">✨ Premium Gift Delivery Service</span>
              </div>

              {/* Subheading */}
              <p className="text-xl sm:text-2xl md:text-3xl text-gray-200 font-light max-w-3xl mx-auto leading-relaxed">
                Premium quality gifts with fast delivery across all Kerala districts
              </p>
              <p className="text-lg sm:text-xl text-gray-300 font-light">
                Bringing authentic Kerala culture to your doorstep
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                <Link 
                  href="/products"
                  className="group relative px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-kgo-red to-kgo-red-dark rounded-2xl hover:from-kgo-red-dark hover:to-kgo-red transition-all duration-300 shadow-2xl hover:shadow-glow transform hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    Shop Now
                    <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <Link 
                  href="/products"
                  className="px-10 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl hover:bg-white/20 hover:border-white/50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  Explore Products
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">14+</div>
                  <div className="text-sm md:text-base text-gray-300">Kerala Districts</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">1000+</div>
                  <div className="text-sm md:text-base text-gray-300">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">24/7</div>
                  <div className="text-sm md:text-base text-gray-300">Support Available</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">Same Day</div>
                  <div className="text-sm md:text-base text-gray-300">Delivery</div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
            <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* Emergency Delivery Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-100">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">
                  Need Same Day or Emergency Delivery?
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  Contact our customer support team via WhatsApp for immediate assistance
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="https://wa.me/12817238520" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center px-8 py-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="text-2xl mr-3">🇺🇸</span>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                  </svg>
                  <span>US Support</span>
                </a>
                
                <a 
                  href="https://wa.me/918075030919" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center px-8 py-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="text-2xl mr-3">🇮🇳</span>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                  </svg>
                  <span>India Support</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products Carousel */}
        {products.length > 0 && (
          <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Featured Products
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Discover our handpicked selection of premium gifts and traditional Kerala products
                </p>
              </div>
              <RandomProductCarousel
                allProducts={products}
                onProductClick={handleProductClick}
              />
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Why Choose Us?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                We make gift delivery simple, fast, and memorable
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="group text-center p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-kgo-red to-kgo-red-dark rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Delivery</h3>
                <p className="text-gray-600 leading-relaxed">
                  Same-day and express delivery options available across all Kerala districts
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group text-center p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-kgo-green to-kgo-green-dark rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Premium Quality</h3>
                <p className="text-gray-600 leading-relaxed">
                  Handpicked authentic Kerala products and premium gift items
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group text-center p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Customizable</h3>
                <p className="text-gray-600 leading-relaxed">
                  Personalize your gifts with custom messages, wrapping, and more
                </p>
              </div>

              {/* Feature 4 */}
              <div className="group text-center p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">24/7 Support</h3>
                <p className="text-gray-600 leading-relaxed">
                  Round-the-clock customer support via WhatsApp for all your needs
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Service Areas Section */}
        <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-kgo-red rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-kgo-green rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Delivery Across All Kerala Districts
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                We deliver to all 14 districts of Kerala with fast and reliable service
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {['Kochi', 'Trivandrum', 'Kozhikode', 'Thrissur', 'Kannur', 'Kollam', 'Palakkad', 
                'Malappuram', 'Alappuzha', 'Kottayam', 'Idukki', 'Wayanad', 'Kasaragod', 'Pathanamthitta'].map((city, index) => (
                <div 
                  key={city}
                  className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-center hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="text-lg font-semibold">{city}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-kgo-red via-kgo-red-dark to-kgo-red text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}></div>
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Send a Gift?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Browse our extensive collection of premium gifts and traditional Kerala products. 
              Fast delivery guaranteed across all districts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/products"
                className="px-10 py-4 text-lg font-bold text-kgo-red bg-white rounded-2xl hover:bg-gray-100 transition-all duration-300 shadow-2xl transform hover:scale-105"
              >
                Browse Products
              </Link>
              <a 
                href="https://wa.me/918075030919" 
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-4 text-lg font-semibold text-white bg-white/20 backdrop-blur-xl border-2 border-white/30 rounded-2xl hover:bg-white/30 transition-all duration-300 shadow-xl transform hover:scale-105"
              >
                Contact Support
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

// Server-side rendering - load products from JSON
export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  try {
    const products = await loadProductsFromJSON();
    return {
      props: {
        products: products || []
      }
    };
  } catch (error) {
    console.error('Error loading products:', error);
    return {
      props: {
        products: []
      }
    };
  }
};
