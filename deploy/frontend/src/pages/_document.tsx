import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Primary Meta Tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
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
        <meta property="og:url" content="https://keralgiftsonline.in/" />
        <meta property="og:title" content="KeralGiftsOnline - Premium Gifts & Celebrations" />
        <meta property="og:description" content="Discover premium quality gifts, cakes, flowers, and celebration items. Fast delivery across Kerala with our advanced logistics network." />
        <meta property="og:image" content="https://keralgiftsonline.in/images/og-image.jpg" />
        <meta property="og:site_name" content="KeralGiftsOnline" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://keralgiftsonline.in/" />
        <meta property="twitter:title" content="KeralGiftsOnline - Premium Gifts & Celebrations" />
        <meta property="twitter:description" content="Discover premium quality gifts, cakes, flowers, and celebration items. Fast delivery across Kerala with our advanced logistics network." />
        <meta property="twitter:image" content="https://keralgiftsonline.in/images/og-image.jpg" />
        
        {/* Additional Meta Tags */}
        <meta name="theme-color" content="#dc2626" />
        <meta name="msapplication-TileColor" content="#dc2626" />
        <meta name="application-name" content="KeralGiftsOnline" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "KeralGiftsOnline",
              "url": "https://keralgiftsonline.in",
              "logo": "https://keralgiftsonline.in/favicon.svg",
              "description": "Premium quality gifts, cakes, flowers, and celebration items with fast delivery across Kerala",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "IN",
                "addressRegion": "Kerala"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": ["English", "Malayalam"]
              },
              "sameAs": [
                "https://facebook.com/keralgiftsonline",
                "https://instagram.com/keralgiftsonline"
              ]
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
