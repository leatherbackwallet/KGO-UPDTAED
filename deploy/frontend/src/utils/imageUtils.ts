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
    return `https://res.cloudinary.com/deojqbepy/image/upload/${imagePath}`;
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
  // If it's not a Cloudinary public ID, return as is
  if (!publicId.startsWith('keralagiftsonline/products/')) {
    return publicId;
  }
  
  const sizeConfig = PRODUCT_IMAGE_SIZES[size];
  const transformations = `w_${sizeConfig.width},h_${sizeConfig.height},c_fill,q_auto`;
  
  return `https://res.cloudinary.com/deojqbepy/image/upload/${transformations}/${publicId}`;
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