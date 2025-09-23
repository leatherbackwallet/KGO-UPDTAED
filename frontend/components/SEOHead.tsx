import Head from 'next/head';
import { useRouter } from 'next/router';
import { generateKeywords } from '../utils/seoKeywords';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  structuredData?: object;
  noindex?: boolean;
  canonical?: string;
  // Enhanced SEO context
  products?: Array<{name: string; categories?: any[]; occasions?: any[]}>;
  categories?: Array<{name: string}>;
  occasions?: Array<{name: string}>;
  location?: string;
  searchTerm?: string;
  isHomepage?: boolean;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'KeralGiftsOnline - Premium Gifts & Traditional Products | Kerala\'s Best Online Gift Store',
  description = 'Discover premium quality gifts, traditional Kerala products & authentic items. Fast delivery across Kerala with advanced logistics. Perfect for festivals, occasions & special moments.',
  keywords,
  image = 'https://keralgiftsonline.in/images/og-image.jpg',
  url,
  type = 'website',
  structuredData,
  noindex = false,
  canonical,
  products,
  categories,
  occasions,
  location,
  searchTerm,
  isHomepage = false
}) => {
  const router = useRouter();
  const currentUrl = url || `https://keralgiftsonline.in${router.asPath}`;
  const canonicalUrl = canonical || currentUrl;

  // Generate comprehensive keywords using the new utility
  const enhancedKeywords = keywords || generateKeywords({
    products,
    categories,
    occasions,
    location,
    searchTerm,
    isHomepage
  });

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={enhancedKeywords} />
      
      {/* Robots */}
      <meta 
        name="robots" 
        content={noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} 
      />
      <meta 
        name="googlebot" 
        content={noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} 
      />
      
      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="KeralGiftsOnline" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@keralgiftsonline" />
      <meta name="twitter:creator" content="@keralgiftsonline" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={title} />
      
      {/* Additional Meta */}
      <meta name="author" content="KeralGiftsOnline" />
      <meta name="publisher" content="KeralGiftsOnline" />
      <meta httpEquiv="content-language" content="en-US" />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
    </Head>
  );
};

export default SEOHead;
