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
import { Product } from '../../types/shared';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

interface CategoryPageProps {
  category: Category | null;
  products: Product[];
  totalProducts: number;
}

const CategoryPage: React.FC<CategoryPageProps> = ({ 
  category, 
  products: initialProducts, 
  totalProducts: initialTotal 
}) => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState(initialTotal || 0);
  const [currentPage, setCurrentPage] = useState(1);

  // Generate comprehensive category SEO
  const generateCategorySEO = () => {
    if (!category) {
      return {
        title: 'Category Not Found | KeralGiftsOnline',
        description: 'The category you are looking for does not exist.',
        structuredData: {}
      };
    }

    const categoryName = category.name;
    const title = `${categoryName} - Premium Kerala ${categoryName} Gifts | KeralGiftsOnline`;
    const description = `Shop premium ${categoryName.toLowerCase()} gifts and traditional Kerala products. ${category.description || `Authentic ${categoryName.toLowerCase()} with fast delivery across Kerala.`} ${totalProducts}+ items available.`;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${categoryName} Collection`,
      "description": description,
      "url": `https://keralagiftsonline.in/category/${category.slug}`,
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
          "category": categoryName,
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
            "name": "Categories",
            "item": "https://keralagiftsonline.in/products"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": categoryName,
            "item": `https://keralagiftsonline.in/category/${category.slug}`
          }
        ]
      }
    };

    return { title, description, structuredData };
  };

  if (!category) {
    return (
      <>
        <SEOHead
          title="Category Not Found | KeralGiftsOnline"
          description="The category you are looking for does not exist. Browse our complete collection of premium Kerala gifts and traditional products."
          noindex={true}
        />
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Category Not Found</h1>
            <p className="text-gray-600 mb-6">The category you are looking for does not exist.</p>
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

  const seoData = generateCategorySEO();

  return (
    <>
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        url={`https://keralagiftsonline.in/category/${category.slug}`}
        structuredData={seoData.structuredData}
        products={products.map(product => ({
          name: product.name,
          categories: product.categories?.map(cat => ({ name: cat })) || [],
          occasions: product.occasions?.map(occ => ({ name: occ })) || []
        }))}
        categories={[category]}
      />
      
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            items={[
              { name: 'Categories', href: '/items' },
              { name: category.name, current: true }
            ]}
            className="mb-8"
          />

          {/* Category Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{category.name} Collection</h1>
              {category.description && (
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
                  {category.description}
                </p>
              )}
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <span>{totalProducts} Products Available</span>
                <span>•</span>
                <span>Fast Delivery Across Kerala</span>
                <span>•</span>
                <span>Premium Quality Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <ProductSkeletonGrid count={12} />
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-12">
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
                    Load More Products ({totalProducts - products.length} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-6">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Products Available</h3>
              <p className="text-gray-600 mb-6">
                We're currently updating our {category.name.toLowerCase()} collection. Check back soon!
              </p>
              <a 
                href="/products" 
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Browse All Products
              </a>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  try {
    const { slug } = params!;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-dot-onyourbehlf.uc.r.appspot.com/api';

    // Fetch category and products
    const [categoryResponse, productsResponse] = await Promise.all([
      fetch(`${apiUrl}/categories`).catch(() => ({ ok: false })),
      fetch(`${apiUrl}/products?limit=50`).catch(() => ({ ok: false }))
    ]);

    let category = null;
    let products = [];
    let totalProducts = 0;

    // Find category by slug
    if (categoryResponse.ok && 'json' in categoryResponse) {
      const categoriesData = await categoryResponse.json();
      const categories = categoriesData.data || categoriesData || [];
      category = categories.find((cat: any) => cat.slug === slug);
    }

    // Fetch products for this category
    if (category && productsResponse.ok && 'json' in productsResponse) {
      const productsData = await productsResponse.json();
      const allProducts = productsData.data || productsData || [];
      
      // Filter products by category
      products = allProducts.filter((product: any) => {
        if (!product.categories) return false;
        return product.categories.some((cat: any) => {
          const catId = typeof cat === 'string' ? cat : cat._id;
          return catId === category._id;
        });
      });
      
      totalProducts = products.length;
    }

    // Set cache headers
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return {
      props: {
        category,
        products,
        totalProducts
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        category: null,
        products: [],
        totalProducts: 0
      }
    };
  }
};

export default CategoryPage;
