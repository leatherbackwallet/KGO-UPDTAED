/**
 * Image Utilities - Local image management for products
 * Handles image paths, fallbacks, and validation for local image storage
 */

// Base path for product images
export const PRODUCT_IMAGES_PATH = '/images/products';

// Default placeholder image
export const DEFAULT_PRODUCT_IMAGE = `${PRODUCT_IMAGES_PATH}/placeholder.svg`;

/**
 * Generate product image path from product slug
 * @param slug - Product slug
 * @param extension - Image extension (default: svg)
 * @returns Full path to the product image
 */
export function getProductImagePath(slug: string, extension: string = 'svg'): string {
  return `${PRODUCT_IMAGES_PATH}/${slug}.${extension}`;
}

/**
 * Get product image with fallback to placeholder
 * @param imagePath - Image path from database
 * @param slug - Product slug for fallback
 * @returns Valid image path
 */
export function getProductImage(imagePath?: string, slug?: string): string {
  if (imagePath && imagePath.startsWith('http')) {
    // External URL (AWS, etc.)
    return imagePath;
  }
  
  if (imagePath && imagePath.startsWith('/')) {
    // Local path - return as is, don't convert to SVG
    return imagePath;
  }
  
  if (slug) {
    // Try to generate path from slug
    return getProductImagePath(slug);
  }
  
  // Fallback to placeholder
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
 * Get optimized image path with size suffix
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