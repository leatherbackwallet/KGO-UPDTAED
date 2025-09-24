/**
 * Image Utilities - Product images are now stored in Cloudinary CDN
 * This utility handles image paths for products stored in Cloudinary and local file system
 */

// Backend API base URL for API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Backend base URL for static files - remove /api suffix
const STATIC_BASE_URL = API_BASE_URL?.replace('/api', '') || '';

// Use relative paths for frontend static assets like placeholders and category SVGs
export const PRODUCT_IMAGES_PATH = `/images/products`;
export const DEFAULT_PRODUCT_IMAGE = `${PRODUCT_IMAGES_PATH}/placeholder.svg`;

/**
 * Get product image path - handles Cloudinary CDN and local file system images
 * @param imagePath - Cloudinary public_id (e.g., "keralagiftsonline/products/product-123") or local filename
 * @param slug - Product slug for fallback image filename
 * @returns Image path string
 */
export function getProductImage(imagePath?: string, slug?: string): string {
  // If no image path provided, use default
  if (!imagePath) {
    return DEFAULT_PRODUCT_IMAGE;
  }

  // If we have a full URL (already processed), use it directly
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If we have a Cloudinary public_id (starts with keralagiftsonline/products/)
  if (imagePath && imagePath.startsWith('keralagiftsonline/products/')) {
    // Validate the public_id format before creating URL
    if (imagePath.length > 30 && !imagePath.includes('..')) {
      return `https://res.cloudinary.com/deojqbepy/image/upload/w_400,h_400,c_fill,q_auto,f_auto/${imagePath}`;
    } else {
      // Invalid public_id, return default
      return DEFAULT_PRODUCT_IMAGE;
    }
  }
  
  // If we have a relative path starting with /images/products/ (from database)
  if (imagePath.startsWith('/images/products/')) {
    // Check if this is a local static asset (SVG files) vs uploaded product image
    if (imagePath.endsWith('.svg')) {
      // SVG files are served from frontend static folder
      return imagePath;
    } else {
      // Uploaded product images are served from backend
      return `${STATIC_BASE_URL}${imagePath}`;
    }
  }
  
  // If we have a relative path starting with /images/ (from database)
  if (imagePath.startsWith('/images/')) {
    // Check if this is a local static asset (SVG files) vs uploaded product image
    if (imagePath.endsWith('.svg')) {
      // SVG files are served from frontend static folder
      return imagePath;
    } else {
      // Uploaded product images are served from backend
      return `${STATIC_BASE_URL}${imagePath}`;
    }
  }
  
  // If we have just a filename, assume it's in the products directory
  if (imagePath && !imagePath.includes('/')) {
    // Check if this is a local static asset (SVG files) vs uploaded product image
    if (imagePath.endsWith('.svg')) {
      // SVG files are served from frontend static folder
      return `${PRODUCT_IMAGES_PATH}/${imagePath}`;
    } else {
      // Uploaded product images are served from backend
      return `${STATIC_BASE_URL}${PRODUCT_IMAGES_PATH}/${imagePath}`;
    }
  }
  
  // Fallback to category-based SVG or default
  const categoryFallback = getCategoryBasedFallback(slug);
  if (categoryFallback) {
    return categoryFallback;
  }
  
  return DEFAULT_PRODUCT_IMAGE;
}

/**
 * Get category-based fallback image based on product slug
 * @param slug - Product slug
 * @returns Fallback image path or null
 */
function getCategoryBasedFallback(slug?: string): string | null {
  if (!slug) return null;
  
  const slugLower = slug.toLowerCase();
  
  // Wedding cakes
  if (slugLower.includes('wedding')) {
    return `${PRODUCT_IMAGES_PATH}/wedding-cake.svg`;
  }
  
  // Birthday cakes
  if (slugLower.includes('birthday')) {
    return `${PRODUCT_IMAGES_PATH}/birthday-cake.svg`;
  }
  
  // Chocolates
  if (slugLower.includes('chocolate') || slugLower.includes('truffle')) {
    return `${PRODUCT_IMAGES_PATH}/chocolates.svg`;
  }
  
  // Flowers
  if (slugLower.includes('flower') || slugLower.includes('rose') || slugLower.includes('bouquet')) {
    return `${PRODUCT_IMAGES_PATH}/rose-bouquet.svg`;
  }
  
  // Gift baskets
  if (slugLower.includes('gift') || slugLower.includes('basket') || slugLower.includes('hamper')) {
    return `${PRODUCT_IMAGES_PATH}/gift-basket-premium.svg`;
  }
  
  // Cakes (general)
  if (slugLower.includes('cake')) {
    return `${PRODUCT_IMAGES_PATH}/birthday-cake.svg`;
  }
  
  return null;
}

/**
 * Check if image exists by attempting to load it
 * @param imagePath - Path to check
 * @returns Promise that resolves to true if image exists
 */
export async function imageExists(imagePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imagePath;
  });
}

/**
 * Get optimized Cloudinary image URL with transformations
 * @param publicId - Cloudinary public ID
 * @param size - Size suffix (thumb, small, medium, large)
 * @returns Optimized Cloudinary URL
 */
export function getOptimizedImagePath(publicId: string, size: 'thumb' | 'small' | 'medium' | 'large' = 'medium'): string {
  // If it's not a Cloudinary public ID, use the main image function
  if (!publicId.startsWith('keralagiftsonline/products/')) {
    return getProductImage(publicId);
  }
  
  // Validate the public_id format before creating URL
  if (publicId.length > 30 && !publicId.includes('..')) {
    const sizeConfig = PRODUCT_IMAGE_SIZES[size];
    const transformations = `w_${sizeConfig.width},h_${sizeConfig.height},c_fill,q_auto,f_auto`;
    
    return `https://res.cloudinary.com/deojqbepy/image/upload/${transformations}/${publicId}`;
  }
  
  // Invalid public_id, return default
  return DEFAULT_PRODUCT_IMAGE;
}

/**
 * Product image sizes for different use cases
 */
export const PRODUCT_IMAGE_SIZES = {
  thumb: { width: 150, height: 150 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 }
} as const; 

/**
 * Extract product name from image filename
 * Converts filename like "birthday-cake-chocolate.jpg" to "Birthday Cake Chocolate"
 */
export function extractProductNameFromImage(filename: string): string {
  if (!filename) return '';
  
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Replace hyphens and underscores with spaces
  const withSpaces = nameWithoutExt.replace(/[-_]/g, ' ');
  
  // Capitalize first letter of each word
  const capitalized = withSpaces.replace(/\b\w/g, (char) => char.toUpperCase());
  
  return capitalized.trim();
}

/**
 * Generate slug from product name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Preload images for better UX - Professional ecommerce pattern
 * @param imagePaths - Array of image paths to preload
 * @param priority - High priority images load first
 */
export function preloadImages(imagePaths: string[], priority: 'high' | 'low' = 'low'): Promise<void[]> {
  const preloadPromises = imagePaths.map((imagePath) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      // Set loading priority based on browser support
      if ('loading' in img) {
        img.loading = priority === 'high' ? 'eager' : 'lazy';
      }
      
      img.onload = () => {
        // Silently resolve successful loads
        resolve();
      };
      
      img.onerror = () => {
        // Silently handle errors without console spam
        resolve(); // Don't reject, just continue
      };
      
      img.src = imagePath;
    });
  });
  
  return Promise.all(preloadPromises);
}

/**
 * Create progressive image loading with placeholder
 * @param imagePath - Main image path
 * @param placeholderPath - Placeholder image path
 * @returns Object with progressive loading states
 */
export function createProgressiveImageLoader(imagePath: string, placeholderPath?: string) {
  return {
    src: placeholderPath || DEFAULT_PRODUCT_IMAGE,
    dataSrc: imagePath,
    loading: 'lazy' as const,
    onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.target as HTMLImageElement;
      if (img.dataset.src && img.src !== img.dataset.src) {
        img.src = img.dataset.src;
        img.classList.add('loaded');
      }
    },
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.target as HTMLImageElement;
      if (img.src !== DEFAULT_PRODUCT_IMAGE) {
        img.src = DEFAULT_PRODUCT_IMAGE;
      }
    }
  };
}

/**
 * Batch preload product images for current page
 * Standard ecommerce practice - preload visible + next batch
 */
export function preloadProductImages(products: any[], currentPage: number, productsPerPage: number) {
  // Calculate which images to preload
  const startIndex = 0;
  const endIndex = Math.min((currentPage + 1) * productsPerPage, products.length);
  const visibleProducts = products.slice(startIndex, endIndex);
  
  // Extract image paths
  const imagePaths = visibleProducts
    .map(product => product.images?.[0] || product.defaultImage)
    .filter(Boolean)
    .map(imagePath => getOptimizedImagePath(imagePath, 'medium'));
  
  // Preload with high priority for current page, low for next batch
  const currentPageEnd = currentPage * productsPerPage;
  const currentPageImages = imagePaths.slice(0, currentPageEnd);
  const nextBatchImages = imagePaths.slice(currentPageEnd);
  
  // Preload current page images with high priority
  if (currentPageImages.length > 0) {
    preloadImages(currentPageImages, 'high');
  }
  
  // Preload next batch with low priority
  if (nextBatchImages.length > 0) {
    setTimeout(() => {
      preloadImages(nextBatchImages, 'low');
    }, 1000); // Delay to not block current page rendering
  }
} 