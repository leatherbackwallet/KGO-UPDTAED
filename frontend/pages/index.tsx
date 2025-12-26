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
      "name": "KeralGiftsOnline - Premium Gifts & Delivery | Kerala Online Gift Store",
      "description": "Premium gifts, baskets & personalised delivery across all Kerala districts. Customisable gifts, traditional products & fast delivery.",
      "url": "https://keralagiftsonline.in/",
      "inLanguage": "en",
      "mainEntity": {
        "@type": "Organization",
        "name": "KeralGiftsOnline",
        "url": "https://keralagiftsonline.in",
        "description": "Premium gift delivery service specializing in customisable gifts, personalised gifts, gift baskets, and traditional Kerala products with fast delivery across all districts of Kerala",
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
            "description": "Premium gift delivery, personalised gifts, customisable gift baskets, and traditional Kerala products delivery across all districts"
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

  return (
    <>
      <SEOHead
        title="KeralGiftsOnline - Premium Gifts & Delivery | Kerala Online Gift Store"
        description="Premium gifts, baskets & personalised delivery across all Kerala districts. Customisable gifts, traditional products & fast delivery. Shop gifts online now!"
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

        {/* SEO-Rich Content Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                We Deliver Gifts On Your Behalf - Premium Gift Delivery Service Across Kerala
              </h2>
              
              <p className="text-gray-700 mb-4 leading-relaxed">
                <strong>KeralGiftsOnline</strong> is Kerala's premier online gift store specializing in premium gifts, 
                customisable gifts, personalised gifts, and traditional Kerala products. We deliver gifts on your behalf 
                with fast and reliable personal delivery service across all districts of Kerala, including Ernakulam, 
                Thiruvananthapuram, Kozhikode, Thrissur, Kannur, Kollam, Palakkad, Malappuram, Alappuzha, Kottayam, 
                Idukki, Wayanad, Kasaragod, and Pathanamthitta.
              </p>

              <p className="text-gray-700 mb-4 leading-relaxed">
                Our extensive collection includes gift baskets, combo gifts, cakes, flowers, traditional sweets, 
                Kerala snacks, handicrafts, and customisable gift hampers perfect for birthdays, anniversaries, 
                weddings, festivals like Onam and Diwali, and special occasions. Whether you need same-day delivery, 
                express delivery, or scheduled personal delivery, we ensure your gifts reach your loved ones 
                across Kerala with care and precision.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Traditional Kerala Gift Items & Authentic Products
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Discover authentic traditional Kerala gift items including <Link href="/products" className="text-blue-600 hover:underline">Aranmula Val Kannadi</Link> 
                (handcrafted mirrors with certificate), <Link href="/products" className="text-blue-600 hover:underline">authentic Kasavu Saree</Link> for gift delivery, 
                <Link href="/products" className="text-blue-600 hover:underline"> Kerala Mural Art gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Brass Nilavilakku</Link> for online purchase, 
                <Link href="/products" className="text-blue-600 hover:underline"> Kerala Nettoor Petti</Link> for gifting, 
                <Link href="/products" className="text-blue-600 hover:underline"> Kasavu Mundu and Saree combo</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> traditional Kerala jewelry</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Kerala temple jewelry</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> snake boat model gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Kathakali face wall hanging gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> coir handicraft gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> wooden elephant handicrafts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Kerala spices gift box</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Kerala Ayurvedic gift hampers</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> banana chips gift packs</Link>, 
                and <Link href="/products" className="text-blue-600 hover:underline">traditional Kerala souvenirs</Link>. 
                Buy Aranmula Val Kannadi online, purchase authentic Kasavu Saree, and explore our complete collection of traditional Kerala gift items.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Premium Gift Categories & Products
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Explore our wide range of premium gifts including <Link href="/products" className="text-blue-600 hover:underline">combo gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> wedding gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> birthday gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> anniversary gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> festival gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> flowers and roses</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> cakes</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> chocolates</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> luxury gift hampers</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> premium gift hampers</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> fresh fruit baskets</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> dry fruit hampers</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> chocolate bouquets</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Ferrero Rocher gift boxes</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> orchid flower bouquets</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> mixed flower baskets</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> indoor plants</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> personalized photo frames</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> customized mugs</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> personalized cushions</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> personalized keychains</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> teddy bear and chocolate combos</Link>, 
                and <Link href="/products" className="text-blue-600 hover:underline">traditional Kerala products</Link>. 
                All our gifts can be personalised with custom greetings, gift wrapping, and special messages.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Cakes & Bakery Products
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Order premium cakes with same-day cake delivery across Kerala. Choose from <Link href="/products" className="text-blue-600 hover:underline">red velvet cake</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Black Forest cake</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> eggless cake</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> sugar-free cake</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> photo cake</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> heart shape cake for anniversary</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Christmas plum cake</Link>, 
                and <Link href="/products" className="text-blue-600 hover:underline">midnight cake delivery</Link>. 
                We offer same-day cake delivery in Kerala, midnight cake delivery, and express cake delivery to all districts.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Delivery Across All Kerala Districts & Cities
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                We provide fast and reliable gift delivery service to all 14 districts of Kerala. Our personal delivery 
                network covers major cities and towns including <Link href="/products" className="text-blue-600 hover:underline">online gift delivery in Kochi</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> send gifts to Trivandrum</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> cake delivery in Kozhikode</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> flower delivery in Thrissur</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> gift delivery in Alappuzha</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> same day gifts Kottayam</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> online cakes Palakkad</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> gift shop in Malappuram</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> send flowers to Kollam</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> midnight cake delivery Kannur</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> gift delivery in Idukki</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> gift delivery in Wayanad</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Pathanamthitta gift delivery</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Kasaragod online gift shop</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Ernakulam flower delivery same day</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Guruvayur gift delivery</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Perumbavoor cake delivery</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Angamaly gift shops</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Tirur gift delivery</Link>, 
                and <Link href="/products" className="text-blue-600 hover:underline">Thalassery cake and flower delivery</Link>. 
                Whether you're sending gifts within Kerala or from anywhere in the world, we ensure timely delivery with our advanced logistics network.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                International Gift Delivery - Send Gifts to Kerala from Abroad
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Our NRI gift delivery service makes it easy to <Link href="/products" className="text-blue-600 hover:underline">send gifts to Kerala from Dubai</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> gift delivery Kerala from USA</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> send Onam gifts from UK to Kerala</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> send birthday cake to Kerala from Australia</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> send gifts to Kerala from Canada</Link>, 
                and from anywhere in the world. Perfect for <Link href="/products" className="text-blue-600 hover:underline">Kerala gifts online for parents</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> gifts for wife in Kerala from abroad</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> gifts for husband in Kerala</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> gifts for sister in Kerala</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> brother's birthday gift delivery</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> wedding gifts for cousins</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> traditional gifts for grandparents</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> best gifts for Malayali friends</Link>, 
                and <Link href="/products" className="text-blue-600 hover:underline">surprise family in Kerala from abroad</Link>. 
                We specialize in helping NRIs send thoughtful gifts to their loved ones in Kerala.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Occasion-Specific Gifts & Festival Hampers
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Celebrate every occasion with our curated gift collections. Choose from <Link href="/products" className="text-blue-600 hover:underline">Onam gift hampers for family</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Vishu Kani kit online</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> birthday gift delivery in Kerala</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> wedding anniversary gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> engagement gifts for groom</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Valentine's Day gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Mother's Day gifts to Kerala</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Father's Day gift delivery</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Christmas plum cake delivery</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> New Year 2025 gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> housewarming gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> retirement gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> get well soon gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> sympathy flowers delivery</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> baby shower gift hampers</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Rakhi delivery in Kerala</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> Diwali sweets to Kerala</Link>, 
                and <Link href="/products" className="text-blue-600 hover:underline">Eid gift hampers</Link>. 
                We offer same-day delivery, midnight gift delivery, and surprise gift delivery options.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Customisable & Personalised Gifts
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Make every gift special with our customisable gifts and personalised gift baskets. Choose from our 
                extensive collection of gift hampers, gift baskets, and combo gifts that can be tailored to your 
                preferences. Add custom greetings, select specific products, and create the perfect gift package 
                for birthdays, anniversaries, weddings, festivals, or any special occasion. Our personalised delivery 
                service ensures your gifts are presented beautifully and delivered with care. We offer <Link href="/products" className="text-blue-600 hover:underline">budget gifts under 1000</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> corporate gifts</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> bulk gifting</Link>, 
                and <Link href="/products" className="text-blue-600 hover:underline">luxury gift hampers</Link>.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Special Delivery Services
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                We offer flexible delivery options to meet your needs. Choose from <Link href="/products" className="text-blue-600 hover:underline">same-day delivery</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> midnight gift delivery Kerala</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> surprise gift delivery</Link>, 
                <Link href="/products" className="text-blue-600 hover:underline"> express delivery</Link>, 
                and <Link href="/products" className="text-blue-600 hover:underline">scheduled personal delivery</Link>. 
                Our advanced logistics network ensures your gifts reach on time, whether it's a last-minute birthday surprise 
                or a carefully planned anniversary gift. We specialize in making every delivery special.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Why Choose KeralGiftsOnline?
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Premium quality gifts and authentic Kerala products</li>
                <li>Fast delivery across all Kerala districts</li>
                <li>Personal delivery service with tracking</li>
                <li>Customisable and personalised gift options</li>
                <li>Same-day and express delivery available</li>
                <li>Wide range of gift baskets and hampers</li>
                <li>Traditional and modern gift collections</li>
                <li>Secure online payment and easy ordering</li>
              </ul>

              <p className="text-gray-700 mb-4 leading-relaxed">
                Shop now for premium gifts, customisable gift baskets, and personalised delivery across Kerala. 
                Browse our <Link href="/products" className="text-blue-600 hover:underline">complete product catalog</Link> 
                to find the perfect gift for your loved ones. As Kerala's best online gift store, we offer the widest 
                selection of traditional Kerala gift items, authentic products, and modern gift solutions. Need assistance? 
                Contact our customer support team via WhatsApp for immediate help with your gift delivery needs.
              </p>
            </div>
          </div>
        </section>

      </main>

    </>
  );
}
