/**
 * Image Utilities - Product images are now stored in the file system
 * This utility handles image paths for products stored in the public folder
 */

// Backend API base URL for API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Backend base URL for static files - remove /api suffix
const STATIC_BASE_URL = API_BASE_URL.replace('/api', '') || 'http://localhost:5001';

export const PRODUCT_IMAGES_PATH = `${STATIC_BASE_URL}/images/products`;
export const DEFAULT_PRODUCT_IMAGE = `${PRODUCT_IMAGES_PATH}/placeholder.svg`;

/**
 * Get product image path - handles file system stored images
 * @param imagePath - Image filename (e.g., "product-123.jpg") or full path
 * @param slug - Product slug for fallback image filename
 * @returns Image path string
 */
export function getProductImage(imagePath?: string, slug?: string): string {
  // If no image path provided, use default
  if (!imagePath) {
    return DEFAULT_PRODUCT_IMAGE;
  }

  // If we have a full URL (uploaded image), use it directly
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If we have a relative path starting with /images/products/ (from database)
  if (imagePath.startsWith('/images/products/')) {
    return `${STATIC_BASE_URL}${imagePath}`;
  }
  
  // If we have a relative path starting with /images/ (from database)
  if (imagePath.startsWith('/images/')) {
    return `${STATIC_BASE_URL}${imagePath}`;
  }
  
  // If we have just a filename, assume it's in the products directory
  if (imagePath && !imagePath.includes('/')) {
    return `${PRODUCT_IMAGES_PATH}/${imagePath}`;
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
 * Get optimized image path with size suffix (for future use)
 * @param basePath - Base image path
 * @param size - Size suffix (thumb, small, medium, large)
 * @returns Optimized image path
 */
export function getOptimizedImagePath(basePath: string, size: 'thumb' | 'small' | 'medium' | 'large' = 'medium'): string {
  const pathParts = basePath.split('.');
  const extension = pathParts.pop();
  const baseName = pathParts.join('.');
  
  return `${baseName}-${size}.${extension}`;
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