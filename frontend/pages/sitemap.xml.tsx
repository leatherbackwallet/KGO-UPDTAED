import { GetServerSideProps } from 'next';
import { generateKeywords } from '../utils/seoKeywords';

/**
 * Escapes XML special characters to prevent parsing errors
 * @param text - The text to escape
 * @returns Escaped text safe for XML
 */
function escapeXml(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Enhanced sitemap generation with comprehensive SEO
function generateSiteMap(products: any[], categories: any[], occasions: any[] = []) {
  const baseUrl = 'https://keralagiftsonline.in';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
           xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
           xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
     <!-- Static Pages -->
     <url>
       <loc>${baseUrl}/</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>daily</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${baseUrl}/products</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.9</priority>
     </url>
     <url>
       <loc>${baseUrl}/about</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${baseUrl}/contact</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.6</priority>
     </url>
     <url>
       <loc>${baseUrl}/privacy</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>yearly</changefreq>
       <priority>0.3</priority>
     </url>
     <url>
       <loc>${baseUrl}/terms</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>yearly</changefreq>
       <priority>0.3</priority>
     </url>
     <url>
       <loc>${baseUrl}/cart</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.6</priority>
     </url>
     
     <!-- Category Pages with Enhanced SEO -->
     ${categories
       .map((category) => {
         const categoryName = typeof category.name === 'string' ? category.name : category.name?.en || 'Category';
         const escapedCategoryName = escapeXml(categoryName);
         return `
       <url>
         <loc>${baseUrl}/products?category=${encodeURIComponent(category.slug || category._id)}</loc>
         <lastmod>${new Date().toISOString()}</lastmod>
         <changefreq>weekly</changefreq>
         <priority>0.8</priority>
         <!-- SEO: ${escapedCategoryName} gifts, ${escapedCategoryName} kerala, traditional ${escapedCategoryName} -->
       </url>`;
       })
       .join('')}

     <!-- Occasion-Based Category Pages -->
     ${occasions
       .map((occasion) => {
         const occasionName = typeof occasion.name === 'string' ? occasion.name : occasion.name?.en || 'Occasion';
         const escapedOccasionName = escapeXml(occasionName);
         return `
       <url>
         <loc>${baseUrl}/products?occasions=${encodeURIComponent(occasion.slug || occasion._id)}</loc>
         <lastmod>${new Date().toISOString()}</lastmod>
         <changefreq>weekly</changefreq>
         <priority>0.7</priority>
         <!-- SEO: ${escapedOccasionName} gifts kerala, ${escapedOccasionName} celebration gifts -->
       </url>`;
       })
       .join('')}
     
     <!-- Enhanced Product Pages with SEO Keywords -->
     ${products
       .map((product) => {
         // Escape product name and description for XML
         const productName = escapeXml(product.name);
         const productDescription = escapeXml(product.description || `${product.name} - Premium Kerala gift with fast delivery`);
         
         const images = product.images && product.images.length > 0 
           ? product.images.slice(0, 5).map((img: string) => {
               // Encode image path for URL (encodeURI handles special characters)
               const encodedImg = encodeURI(img);
               return `
         <image:image>
           <image:loc>${baseUrl}/images/${encodedImg}</image:loc>
           <image:title>${productName} - Kerala Traditional Gift</image:title>
           <image:caption>${productDescription}</image:caption>
         </image:image>`;
             }).join('') 
           : '';

         // Generate product-specific keywords (escape for comments)
         const productKeywords = [
           product.name?.toLowerCase(),
           `${product.name?.toLowerCase()} kerala`,
           `buy ${product.name?.toLowerCase()}`,
           `${product.name?.toLowerCase()} online`,
           `${product.name?.toLowerCase()} delivery`,
           `${product.name?.toLowerCase()} gifts`
         ].filter(Boolean).join(', ');

         const categoryNames = product.categories?.map((cat: any) => 
           typeof cat === 'string' ? cat : 
           typeof cat.name === 'string' ? cat.name : cat.name?.en
         ).filter(Boolean).join(', ');

         const occasionNames = product.occasions?.map((occ: any) => 
           typeof occ === 'string' ? occ : 
           typeof occ.name === 'string' ? occ.name : occ.name?.en
         ).filter(Boolean).join(', ');
         
         // Escape all text content in comments
         const escapedKeywords = escapeXml(productKeywords);
         const escapedCategoryNames = escapeXml(categoryNames);
         const escapedOccasionNames = escapeXml(occasionNames);
           
         return `
       <url>
         <loc>${baseUrl}/product/${product._id}</loc>
         <lastmod>${product.updatedAt ? new Date(product.updatedAt).toISOString() : new Date().toISOString()}</lastmod>
         <changefreq>weekly</changefreq>
         <priority>0.7</priority>
         <!-- SEO Keywords: ${escapedKeywords} -->
         <!-- Categories: ${escapedCategoryNames} -->
         <!-- Occasions: ${escapedOccasionNames} -->${images}
       </url>`;
       })
       .join('')}
   </urlset>
 `;
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-dot-onyourbehlf.uc.r.appspot.com/api';
    
    // Fetch products, categories, and occasions for comprehensive sitemap
    const [productsResponse, categoriesResponse, occasionsResponse] = await Promise.all([
      fetch(`${apiUrl}/products?limit=1000&admin=true`).catch(() => ({ ok: false, json: () => ({ data: [] }) })),
      fetch(`${apiUrl}/categories`).catch(() => ({ ok: false, json: () => ({ data: [] }) })),
      fetch(`${apiUrl}/occasions`).catch(() => ({ ok: false, json: () => ({ data: [] }) }))
    ]);

    let products = [];
    let categories = [];
    let occasions = [];

    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      products = productsData.data || productsData || [];
    }

    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      categories = categoriesData.data || categoriesData || [];
    }

    if (occasionsResponse.ok) {
      const occasionsData = await occasionsResponse.json();
      occasions = occasionsData.data || occasionsData || [];
    }

    // Generate the enhanced XML sitemap with comprehensive data
    const sitemap = generateSiteMap(products, categories, occasions);

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
    
    // Send the XML to the browser
    res.write(sitemap);
    res.end();

    return {
      props: {},
    };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Generate minimal sitemap on error
    const basicSitemap = generateSiteMap([], [], []);
    res.setHeader('Content-Type', 'text/xml');
    res.write(basicSitemap);
    res.end();

    return {
      props: {},
    };
  }
};

export default SiteMap;