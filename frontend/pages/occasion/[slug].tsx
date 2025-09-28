import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
import SEOHead from '../../components/SEOHead';
import Breadcrumb from '../../components/Breadcrumb';
import { ProductSkeletonGrid } from '../../components/ProductSkeleton';
import api from '../../utils/api';
import { Product } from '../../types/product';

interface Occasion {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface OccasionPageProps {
  occasion: Occasion | null;
  products: Product[];
  totalProducts: number;
}

const OccasionPage: React.FC<OccasionPageProps> = ({ 
  occasion, 
  products: initialProducts, 
  totalProducts: initialTotal 
}) => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState(initialTotal || 0);

  // Generate comprehensive occasion SEO
  const generateOccasionSEO = () => {
    if (!occasion) {
      return {
        title: 'Occasion Not Found | KeralGiftsOnline',
        description: 'The occasion you are looking for does not exist.',
        structuredData: {}
      };
    }

    const occasionName = occasion.name;
    const title = `${occasionName} Gifts - Premium Collection | KeralGiftsOnline`;
    const description = `Perfect ${occasionName.toLowerCase()} gifts and traditional Kerala products for your special celebration. ${occasion.description || `Premium ${occasionName.toLowerCase()} gifts with fast delivery across Kerala.`} ${totalProducts}+ gift options available.`;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${occasionName} Gifts Collection`,
      "description": description,
      "url": `https://keralagiftsonline.in/occasion/${occasion.slug}`,
      "about": {
        "@type": "Event",
        "name": occasionName,
        "description": occasion.description
      },
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": totalProducts,
        "itemListElement": products.slice(0, 20).map((product, index) => ({
          "@type": "Product",
          "position": index + 1,
          "name": product.name,
          "description": product.description,
          "image": product.images?.[0] ? `https://keralagiftsonline.in/images/${product.images[0]}` : undefined,
          "url": `https://keralagiftsonline.in/product/${product._id}`,
          "category": "Gifts",
          "audience": {
            "@type": "Audience",
            "name": `${occasionName} Celebrants`
          },
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "INR",
            "availability": product.stock && product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        }))
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://keralagiftsonline.in/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Occasions",
            "item": "https://keralagiftsonline.in/products"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": `${occasionName} Gifts`,
            "item": `https://keralagiftsonline.in/occasion/${occasion.slug}`
          }
        ]
      }
    };

    return { title, description, structuredData };
  };

  if (!occasion) {
    return (
      <>
        <SEOHead
          title="Occasion Not Found | KeralGiftsOnline"
          description="The occasion you are looking for does not exist. Browse our complete collection of occasion-specific gifts and traditional Kerala products."
          noindex={true}
        />
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Occasion Not Found</h1>
            <p className="text-gray-600 mb-6">The occasion you are looking for does not exist.</p>
            <a 
              href="/products" 
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse All Products
            </a>
          </div>
        </div>
      </>
    );
  }

  const seoData = generateOccasionSEO();

  return (
    <>
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        url={`https://keralagiftsonline.in/occasion/${occasion.slug}`}
        structuredData={seoData.structuredData}
        products={products}
        occasions={[occasion]}
      />
      
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            items={[
              { name: 'Occasions', href: '/items' },
              { name: `${occasion.name} Gifts`, current: true }
            ]}
            className="mb-8"
          />

          {/* Occasion Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                {occasion.icon && (
                  <span className="text-6xl mr-4" role="img" aria-label={occasion.name}>
                    {occasion.icon}
                  </span>
                )}
                <h1 className="text-4xl font-bold text-gray-900">
                  {occasion.name} Gifts Collection
                </h1>
              </div>
              
              {occasion.description && (
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
                  {occasion.description}
                </p>
              )}
              
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <span>{totalProducts} Perfect Gift Options</span>
                <span>•</span>
                <span>Celebrate Your Special Moments</span>
                <span>•</span>
                <span>Fast Kerala Delivery</span>
              </div>
            </div>
          </div>

          {/* Gift Ideas Section */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Perfect {occasion.name} Gift Ideas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Traditional Gifts</h3>
                <p className="text-sm text-gray-600">Authentic Kerala products with cultural significance</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Personalized Items</h3>
                <p className="text-sm text-gray-600">Custom gifts tailored for your special someone</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Premium Collections</h3>
                <p className="text-sm text-gray-600">Luxury gift sets for memorable celebrations</p>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <ProductSkeletonGrid count={12} />
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onQuickView={() => {}} // Implement quick view if needed
                  />
                ))}
              </div>

              {/* Load More Button */}
              {products.length < totalProducts && (
                <div className="text-center">
                  <button
                    onClick={() => {/* Implement load more */}}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Load More Gifts ({totalProducts - products.length} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-6">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Perfect Gifts Coming Soon!</h3>
              <p className="text-gray-600 mb-6">
                We're curating the perfect {occasion.name.toLowerCase()} gift collection for you. Check back soon!
              </p>
              <a 
                href="/products" 
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Browse All Products
              </a>
            </div>
          )}

          {/* SEO Content Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Choose KeralGiftsOnline for {occasion.name}?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Authentic Kerala Products</h3>
                <p className="text-gray-600">
                  Every gift in our {occasion.name.toLowerCase()} collection is carefully sourced from Kerala's finest artisans and vendors.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Fast & Reliable Delivery</h3>
                <p className="text-gray-600">
                  Same-day and express delivery options available across Kerala to make your {occasion.name.toLowerCase()} celebration special.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Premium Quality Guarantee</h3>
                <p className="text-gray-600">
                  All our {occasion.name.toLowerCase()} gifts come with a quality guarantee and hassle-free returns.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Personalization Options</h3>
                <p className="text-gray-600">
                  Add a personal touch to your {occasion.name.toLowerCase()} gifts with custom messages and gift wrapping.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params, res }: any) => {
  try {
    const { slug } = params!;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-dot-onyourbehlf.uc.r.appspot.com/api';

    // Fetch occasions and products
    const [occasionsResponse, productsResponse] = await Promise.all([
      fetch(`${apiUrl}/occasions`).catch(() => ({ ok: false, json: () => Promise.resolve({ data: [] }) })),
      fetch(`${apiUrl}/products?limit=50`).catch(() => ({ ok: false, json: () => Promise.resolve({ data: [] }) }))
    ]);

    let occasion = null;
    let products = [];
    let totalProducts = 0;

    // Find occasion by slug
    if (occasionsResponse.ok) {
      const occasionsData = await (occasionsResponse as Response).json();
      const occasions = occasionsData.data || occasionsData || [];
      occasion = occasions.find((occ: any) => occ.slug === slug);
    }

    // Fetch products for this occasion
    if (occasion && productsResponse.ok) {
      const productsData = await (productsResponse as Response).json();
      const allProducts = productsData.data || productsData || [];
      
      // Filter products by occasion
      products = allProducts.filter((product: any) => {
        if (!product.occasions) return false;
        return product.occasions.some((occ: any) => {
          const occId = typeof occ === 'string' ? occ : occ._id;
          return occId === occasion._id;
        });
      });
      
      totalProducts = products.length;
    }

    // Set cache headers
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return {
      props: {
        occasion,
        products,
        totalProducts
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        occasion: null,
        products: [],
        totalProducts: 0
      }
    };
  }
};

export default OccasionPage;
