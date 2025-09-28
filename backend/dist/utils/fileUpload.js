"use strict";
/**
 * File Upload Utility - Handles image storage in file system
 * This provides a simple solution for storing product images in the public folder
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureProductImagesDir = ensureProductImagesDir;
exports.uploadImage = uploadImage;
exports.deleteImage = deleteImage;
exports.imageExists = imageExists;
exports.listImages = listImages;
exports.getImageMetadata = getImageMetadata;
exports.cleanupOrphanedImages = cleanupOrphanedImages;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
// Product images directory
const PRODUCT_IMAGES_DIR = path_1.default.join(process.cwd(), '../public/images/products');
/**
 * Ensure the product images directory exists
 */
function ensureProductImagesDir() {
    // Skip directory creation in production environments
    if (process.env.NODE_ENV === 'production') {
        console.log('Skipping local file system operations in production');
        return;
    }
    if (!fs_1.default.existsSync(PRODUCT_IMAGES_DIR)) {
        fs_1.default.mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });
    }
}
/**
 * Upload image to file system
 * @param file - Multer file object
 * @param customName - Custom filename (optional)
 * @returns Promise with filename and metadata
 */
async function uploadImage(file, customName) {
    // Ensure directory exists
    ensureProductImagesDir();
    // Generate unique filename
    const fileExtension = path_1.default.extname(file.originalname);
    const uniqueId = (0, uuid_1.v4)();
    const filename = customName || `${uniqueId}${fileExtension}`;
    // Ensure filename is safe
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    // Full path for the file
    const filePath = path_1.default.join(PRODUCT_IMAGES_DIR, safeFilename);
    // Write file to disk
    await fs_1.default.promises.writeFile(filePath, file.buffer);
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
async function deleteImage(filename) {
    const filePath = path_1.default.join(PRODUCT_IMAGES_DIR, filename);
    if (fs_1.default.existsSync(filePath)) {
        await fs_1.default.promises.unlink(filePath);
    }
}
/**
 * Check if image exists in file system
 * @param filename - Filename to check
 * @returns Promise that resolves to true if image exists
 */
async function imageExists(filename) {
    const filePath = path_1.default.join(PRODUCT_IMAGES_DIR, filename);
    return fs_1.default.existsSync(filePath);
}
/**
 * Get list of all product images
 * @returns Promise with array of image filenames
 */
async function listImages() {
    ensureProductImagesDir();
    const files = await fs_1.default.promises.readdir(PRODUCT_IMAGES_DIR);
    return files.filter(file => {
        const ext = path_1.default.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });
}
/**
 * Get image metadata
 * @param filename - Filename to get metadata for
 * @returns Promise with file metadata
 */
async function getImageMetadata(filename) {
    const filePath = path_1.default.join(PRODUCT_IMAGES_DIR, filename);
    if (!fs_1.default.existsSync(filePath)) {
        return null;
    }
    const stats = await fs_1.default.promises.stat(filePath);
    const ext = path_1.default.extname(filename).toLowerCase();
    // Determine mimetype from extension
    const mimetypeMap = {
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
async function cleanupOrphanedImages(referencedImages) {
    const allImages = await listImages();
    const orphanedImages = allImages.filter(img => !referencedImages.includes(img));
    let deletedCount = 0;
    for (const filename of orphanedImages) {
        try {
            await deleteImage(filename);
            deletedCount++;
        }
        catch (error) {
            console.error(`Failed to delete orphaned image ${filename}:`, error);
        }
    }
    return deletedCount;
}
