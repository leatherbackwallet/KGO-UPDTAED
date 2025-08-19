/**
 * Image Utilities - Product images are now served from MongoDB GridFS via the backend API.
 * This utility handles both GridFS images (with ObjectId URLs) and legacy images (with slug names).
 */

// Backend API base URL for API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Backend base URL for static files (legacy images) - remove /api suffix
const STATIC_BASE_URL = API_BASE_URL.replace('/api', '');

export const PRODUCT_IMAGES_PATH = `${STATIC_BASE_URL}/images/products`;
export const DEFAULT_PRODUCT_IMAGE = `${PRODUCT_IMAGES_PATH}/placeholder.svg`;

/**
 * Get product image path - handles both GridFS images and legacy images
 * @param imagePath - GridFS URL (/api/images/fileId) or relative path from database
 * @param slug - Product slug for fallback image filename
 * @returns Image path string
 */
export function getProductImage(imagePath?: string, slug?: string): string {
  // If we have a GridFS URL (starts with /api/images/), use it directly
  if (imagePath && imagePath.startsWith('/api/images/')) {
    return `${STATIC_BASE_URL}${imagePath}`;
  }
  
  // If we have a full URL (uploaded image), use it directly
  if (imagePath && imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If we have a relative path starting with /images/products/ (from database)
  if (imagePath && imagePath.startsWith('/images/products/')) {
    return `${STATIC_BASE_URL}${imagePath}`;
  }
  
  // Fallback to slug-based naming (legacy images)
  if (slug) {
    // Try SVG first (since we have SVG placeholders), then JPG as fallback
    return `${PRODUCT_IMAGES_PATH}/${slug}.svg`;
  }
  
  return DEFAULT_PRODUCT_IMAGE;
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