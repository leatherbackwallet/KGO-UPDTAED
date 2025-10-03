import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Primary Meta Tags */}
        <meta charSet="utf-8" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* SEO Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://keralagiftsonline.in/" />
        <meta property="og:title" content="KeralGiftsOnline - Premium Gifts & Traditional Products | Kerala's Best Online Gift Store" />
        <meta property="og:description" content="Discover premium quality gifts, traditional Kerala products, and authentic items. Fast delivery across Kerala with advanced logistics. Shop for festivals, occasions & special moments." />
        <meta property="og:image" content="https://keralagiftsonline.in/images/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="KeralGiftsOnline - Premium Gifts and Traditional Products" />
        <meta property="og:site_name" content="KeralGiftsOnline" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:locale:alternate" content="ml_IN" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@keralgiftsonline" />
        <meta name="twitter:creator" content="@keralgiftsonline" />
        <meta name="twitter:url" content="https://keralagiftsonline.in/" />
        <meta name="twitter:title" content="KeralGiftsOnline - Premium Gifts & Traditional Products | Kerala's Best Online Gift Store" />
        <meta name="twitter:description" content="Discover premium quality gifts, traditional Kerala products, and authentic items. Fast delivery across Kerala with advanced logistics. Shop for festivals, occasions & special moments." />
        <meta name="twitter:image" content="https://keralagiftsonline.in/images/og-image.jpg" />
        <meta name="twitter:image:alt" content="KeralGiftsOnline - Premium Gifts and Traditional Products" />
        
        {/* Additional Meta Tags */}
        <meta name="theme-color" content="#059669" />
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="application-name" content="KeralGiftsOnline" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KeralGiftsOnline" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Permissions Policy - Allow camera for Razorpay UPI QR scanning */}
        <meta httpEquiv="Permissions-Policy" content="camera=(self https://checkout.razorpay.com https://*.razorpay.com), microphone=(), geolocation=(), payment=(self https://checkout.razorpay.com https://*.razorpay.com)" />
        <meta httpEquiv="Feature-Policy" content="camera 'self' https://checkout.razorpay.com https://*.razorpay.com; microphone 'none'; payment 'self' https://checkout.razorpay.com https://*.razorpay.com" />
        
        {/* Content Security Policy - Allow Razorpay and its dependencies */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://browser.sentry-cdn.com; style-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.razorpay.com https://*.razorpay.com https://browser.sentry-cdn.com https://api-dot-onyourbehlf.uc.r.appspot.com https://onyourbehlf.uc.r.appspot.com https://*.uc.r.appspot.com https://res.cloudinary.com wss://*; frame-src 'self' https://api.razorpay.com https://*.razorpay.com; font-src 'self' data:;" />
        
        {/* Geo Tags */}
        <meta name="geo.region" content="IN-KL" />
        <meta name="geo.placename" content="Kerala, India" />
        <meta name="ICBM" content="10.8505, 76.2711" />
        
        {/* Business Information */}
        <meta name="author" content="KeralGiftsOnline" />
        <meta name="publisher" content="KeralGiftsOnline" />
        <meta name="copyright" content="© 2024 KeralGiftsOnline. All rights reserved." />
        
        {/* Language and Content */}
        <meta httpEquiv="content-language" content="en-US" />
        <meta name="language" content="English" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        
        {/* Razorpay preconnect for faster payment loading */}
        <link rel="preconnect" href="https://checkout.razorpay.com" />
        <link rel="preconnect" href="https://api.razorpay.com" />
        <link rel="preconnect" href="https://cdn.razorpay.com" />
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
        <link rel="dns-prefetch" href="https://api.razorpay.com" />
        <link rel="dns-prefetch" href="https://cdn.razorpay.com" />
        
        {/* Fonts - Using system fonts for better performance */}
        {/* No external fonts loaded to avoid unused resource warnings */}
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "KeralGiftsOnline",
              "alternateName": "Kerala Gifts Online",
              "url": "https://keralagiftsonline.in",
              "logo": {
                "@type": "ImageObject",
                "url": "https://keralagiftsonline.in/favicon.svg",
                "width": 512,
                "height": 512
              },
              "description": "Premium quality gifts, traditional Kerala products, and authentic items with fast delivery across Kerala. Your trusted partner for festivals, occasions, and special moments.",
              "foundingDate": "2024",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "IN",
                "addressRegion": "Kerala",
                "addressLocality": "Kerala"
              },
              "contactPoint": [
                {
                  "@type": "ContactPoint",
                  "contactType": "customer service",
                  "telephone": "+918075030919",
                  "availableLanguage": ["English", "Malayalam"],
                  "areaServed": "IN"
                }
              ],
              "sameAs": [
                "https://facebook.com/keralgiftsonline",
                "https://instagram.com/keralgiftsonline",
                "https://twitter.com/keralgiftsonline"
              ],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Gift Products",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Product",
                      "name": "Traditional Kerala Gifts"
                    }
                  },
                  {
                    "@type": "Offer", 
                    "itemOffered": {
                      "@type": "Product",
                      "name": "Festival Gifts"
                    }
                  }
                ]
              },
              "areaServed": {
                "@type": "State",
                "name": "Kerala"
              },
              "serviceType": "Gift Delivery Service"
            })
          }}
        />
        
        {/* Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "KeralGiftsOnline",
              "url": "https://keralagiftsonline.in",
              "description": "Premium gifts and traditional products delivery service in Kerala",
              "inLanguage": "en-US",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://keralagiftsonline.in/products?search={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// Disable static generation for this page
