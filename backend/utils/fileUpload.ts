/**
 * File Upload Utility - Handles image storage in file system
 * This provides a simple solution for storing product images in the public folder
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Product images directory
const PRODUCT_IMAGES_DIR = path.join(process.cwd(), '../public/images/products');

/**
 * Ensure the product images directory exists
 */
export function ensureProductImagesDir(): void {
  // Skip directory creation in production (Vercel serverless environment)
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping local file system operations in production');
    return;
  }
  
  if (!fs.existsSync(PRODUCT_IMAGES_DIR)) {
    fs.mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });
  }
}

/**
 * Upload image to file system
 * @param file - Multer file object
 * @param customName - Custom filename (optional)
 * @returns Promise with filename and metadata
 */
export async function uploadImage(file: Express.Multer.File, customName?: string): Promise<{
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
}> {
  // Ensure directory exists
  ensureProductImagesDir();

  // Generate unique filename
  const fileExtension = path.extname(file.originalname);
  const uniqueId = uuidv4();
  const filename = customName || `${uniqueId}${fileExtension}`;
  
  // Ensure filename is safe
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Full path for the file
  const filePath = path.join(PRODUCT_IMAGES_DIR, safeFilename);
  
  // Write file to disk
  await fs.promises.writeFile(filePath, file.buffer);
  
  return {
    filename: safeFilename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype
  };
}

/**
 * Delete image from file system
 * @param filename - Filename to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteImage(filename: string): Promise<void> {
  const filePath = path.join(PRODUCT_IMAGES_DIR, filename);
  
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
}

/**
 * Check if image exists in file system
 * @param filename - Filename to check
 * @returns Promise that resolves to true if image exists
 */
export async function imageExists(filename: string): Promise<boolean> {
  const filePath = path.join(PRODUCT_IMAGES_DIR, filename);
  return fs.existsSync(filePath);
}

/**
 * Get list of all product images
 * @returns Promise with array of image filenames
 */
export async function listImages(): Promise<string[]> {
  ensureProductImagesDir();
  
  const files = await fs.promises.readdir(PRODUCT_IMAGES_DIR);
  return files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
  });
}

/**
 * Get image metadata
 * @param filename - Filename to get metadata for
 * @returns Promise with file metadata
 */
export async function getImageMetadata(filename: string): Promise<{
  filename: string;
  size: number;
  mimetype: string;
  created: Date;
} | null> {
  const filePath = path.join(PRODUCT_IMAGES_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const stats = await fs.promises.stat(filePath);
  const ext = path.extname(filename).toLowerCase();
  
  // Determine mimetype from extension
  const mimetypeMap: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  
  return {
    filename,
    size: stats.size,
    mimetype: mimetypeMap[ext] || 'application/octet-stream',
    created: stats.birthtime
  };
}

/**
 * Clean up orphaned images (images not referenced by any product)
 * @param referencedImages - Array of image filenames that are referenced by products
 * @returns Promise with number of deleted files
 */
export async function cleanupOrphanedImages(referencedImages: string[]): Promise<number> {
  const allImages = await listImages();
  const orphanedImages = allImages.filter(img => !referencedImages.includes(img));
  
  let deletedCount = 0;
  for (const filename of orphanedImages) {
    try {
      await deleteImage(filename);
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete orphaned image ${filename}:`, error);
    }
  }
  
  return deletedCount;
}
