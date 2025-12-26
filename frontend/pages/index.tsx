import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import SEOHead from '../components/SEOHead';
import Balloon from '../components/Balloon';

export default function Home() {
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
        
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center relative pt-16 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/products/LandingPageBackground.png"
              alt="Christmas Background"
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Subtle overlay for glassmorphic effect */}
          <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>

          {/* Floating Balloons */}
          <Balloon left={10} delay={0} duration={15} color="#FF6B6B" size={0.8} />
          <Balloon left={20} delay={2} duration={18} color="#4ECDC4" size={1} />
          <Balloon left={30} delay={4} duration={16} color="#FFD700" size={0.9} />
          <Balloon left={40} delay={1} duration={17} color="#FF6B9D" size={1.1} />
          <Balloon left={50} delay={3} duration={19} color="#C7CEEA" size={0.85} />
          <Balloon left={60} delay={5} duration={15} color="#FFE66D" size={1} />
          <Balloon left={70} delay={1.5} duration={18} color="#FF6B6B" size={0.95} />
          <Balloon left={80} delay={3.5} duration={16} color="#4ECDC4" size={1.05} />
          <Balloon left={90} delay={2.5} duration={17} color="#FFD700" size={0.9} />
          
          <div className="text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative z-20">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              We deliver Gifts On your Behalf
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white">
              Premium quality gifts with fast delivery across Kerala
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/products"
                className="px-8 py-4 text-lg font-semibold text-white bg-white bg-opacity-20 backdrop-blur-md border border-white border-opacity-30 rounded-full hover:bg-opacity-30 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Shop Now
              </Link>
              <Link 
                href="/products"
                className="px-8 py-4 text-lg font-semibold text-white bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-30 rounded-full hover:bg-opacity-20 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                View Products
              </Link>
            </div>

            {/* Emergency Delivery Notice */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="bg-white bg-opacity-15 backdrop-blur-xl rounded-2xl p-6 border border-white border-opacity-25 shadow-2xl">
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium text-lg">
                      Need Same Day or Emergency Delivery?
                    </p>
                    <p className="text-white text-opacity-80 text-sm mt-1">
                      Contact our customer support team via WhatsApp for immediate assistance
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4">
                      {/* US Support Button */}
                      <a 
                        href="https://wa.me/12817238520" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-2 bg-white bg-opacity-20 backdrop-blur-md text-white rounded-xl font-medium hover:bg-opacity-30 transition-all duration-300 border border-white border-opacity-30 shadow-lg"
                      >
                        <span className="text-xl mr-2">🇺🇸</span>
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                        </svg>
                        <span className="text-sm">US Support</span>
                      </a>
                      
                      {/* India Support Button */}
                      <a 
                        href="https://wa.me/918075030919" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-2 bg-white bg-opacity-20 backdrop-blur-md text-white rounded-xl font-medium hover:bg-opacity-30 transition-all duration-300 border border-white border-opacity-30 shadow-lg"
                      >
                        <span className="text-xl mr-2">🇮🇳</span>
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                        </svg>
                        <span className="text-sm">India Support</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

    </>
  );
}
