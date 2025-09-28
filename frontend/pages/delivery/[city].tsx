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
import { generateLocationSEO, KERALA_CITIES } from '../../utils/locationSEO';
import { Product } from '../../types/shared';
import { getMultilingualText } from '../../utils/api';

interface LocationPageProps {
  city: any;
  products: Product[];
  totalProducts: number;
}

const LocationDeliveryPage: React.FC<LocationPageProps> = ({ 
  city, 
  products: initialProducts, 
  totalProducts: initialTotal 
}) => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(false);

  if (!city) {
    return (
      <>
        <SEOHead
          title="Delivery Location Not Found | KeralGiftsOnline"
          description="The delivery location you are looking for is not available. We deliver across all major Kerala cities."
          noindex={true}
        />
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Delivery Location Not Found</h1>
            <p className="text-gray-600 mb-6">We don't deliver to this location yet, but we're expanding!</p>
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

  const seoData = generateLocationSEO(city.slug, products);

  return (
    <>
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        url={`https://keralagiftsonline.in/delivery/${city.slug}`}
        structuredData={seoData.structuredData}
        products={products.map(product => ({
          name: getMultilingualText(product.name),
          categories: product.categories?.map(cat => ({ name: cat })) || [],
          occasions: product.occasions?.map(occ => ({ name: occ })) || []
        }))}
        location={city.name}
      />
      
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            items={[
              { name: 'Delivery Areas', href: '/items' },
              { name: `${city.name} Delivery`, current: true }
            ]}
            className="mb-8"
          />

          {/* Location Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">
                Gift Delivery in {city.name}
              </h1>
              <p className="text-xl mb-6 opacity-90">
                {city.description} - Premium gifts delivered to your doorstep
              </p>
              <div className="flex items-center justify-center space-x-8 text-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Same Day Delivery
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Quality Guaranteed
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l-2.5-5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
                  </svg>
                  Free Shipping Over ₹500
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-green-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Express Delivery</h3>
              <p className="text-gray-600">Same-day delivery available for orders placed before 2 PM in {city.name}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-blue-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Wide Coverage</h3>
              <p className="text-gray-600">We deliver to all areas in {city.name} and {city.district} district</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-purple-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Best Prices</h3>
              <p className="text-gray-600">Competitive pricing with special discounts for {city.name} customers</p>
            </div>
          </div>

          {/* Popular Products Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Popular Gifts in {city.name}
            </h2>
            
            {loading ? (
              <ProductSkeletonGrid count={8} />
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.slice(0, 8).map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onQuickView={() => {}} // Implement quick view if needed
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading popular products for {city.name}...</p>
              </div>
            )}

            {products.length > 8 && (
              <div className="text-center mt-8">
                <a
                  href="/products"
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  View All Products
                </a>
              </div>
            )}
          </div>

          {/* SEO Content Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Gift Delivery Service in {city.name}, {city.district}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Why Choose Our {city.name} Delivery?</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Same-day delivery available for urgent gift needs
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Local delivery partners who know {city.name} well
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Real-time tracking for all deliveries in {city.name}
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Special packaging to ensure gifts arrive perfect
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Areas We Cover</h3>
                <p className="text-gray-600 mb-4">
                  We provide comprehensive gift delivery services across all areas of {city.name} and surrounding regions in {city.district} district.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Popular Delivery Areas:</h4>
                  <p className="text-sm text-gray-600">
                    City Center, Residential Areas, Commercial Districts, Educational Institutions, 
                    Hospitals, and all major landmarks in {city.name}.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Order Your Gifts for {city.name} Delivery Today!
              </h3>
              <p className="text-gray-700 mb-4">
                Browse our extensive collection of premium gifts, traditional Kerala products, and personalized items. 
                With our reliable delivery service in {city.name}, your gifts will reach your loved ones on time, every time.
              </p>
              <div className="flex flex-wrap gap-2">
                {city.keywords.slice(0, 6).map((keyword: string, index: number) => (
                  <span key={index} className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  try {
    const { city: citySlug } = params!;
    
    // Find city in our predefined list
    const city = KERALA_CITIES.find(c => c.slug === citySlug);
    
    if (!city) {
      return {
        props: {
          city: null,
          products: [],
          totalProducts: 0
        }
      };
    }

    // Fetch some popular products for display
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-dot-onyourbehlf.uc.r.appspot.com/api';
    let products = [];
    
    try {
      const productsResponse = await fetch(`${apiUrl}/products?featured=true&limit=12`);
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        products = productsData.data || productsData || [];
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }

    // Set cache headers
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

    return {
      props: {
        city,
        products,
        totalProducts: products.length
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        city: null,
        products: [],
        totalProducts: 0
      }
    };
  }
};

export default LocationDeliveryPage;
