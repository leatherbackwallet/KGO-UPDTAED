"use strict";
/**
 * Cloudinary Configuration - CDN Image Management
 * Handles image uploads, transformations, and CDN delivery
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.uploadImageToCloudinary = uploadImageToCloudinary;
exports.deleteImageFromCloudinary = deleteImageFromCloudinary;
exports.getOptimizedImageUrl = getOptimizedImageUrl;
exports.getImageMetadata = getImageMetadata;
exports.listImages = listImages;
exports.verifyImageExists = verifyImageExists;
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Configure Cloudinary storage for multer
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'keralagiftsonline/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        transformation: [
            { width: 800, height: 800, crop: 'limit' }, // Resize large images
            { quality: 'auto:good' }, // Optimize quality
            { fetch_format: 'auto' } // Convert to best format
        ],
        public_id: (req, file) => {
            // Generate unique filename
            const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return `product-${uniqueId}`;
        }
    },
});
// Multer configuration for Cloudinary
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed!'));
        }
    }
});
/**
 * Upload image to Cloudinary
 * @param file - Multer file object
 * @param options - Upload options
 * @returns Promise with upload result
 */
async function uploadImageToCloudinary(file, options = {}) {
    const uploadOptions = {
        folder: options.folder || 'keralagiftsonline/products',
        transformation: options.transformation || [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
        ],
        public_id: options.public_id || `product-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
    };
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) {
                reject(error);
            }
            else if (result) {
                resolve({
                    public_id: result.public_id,
                    url: result.url,
                    secure_url: result.secure_url,
                    width: result.width,
                    height: result.height,
                    format: result.format,
                    size: result.bytes
                });
            }
        });
        uploadStream.end(file.buffer);
    });
}
/**
 * Delete image from Cloudinary
 * @param public_id - Cloudinary public ID
 * @returns Promise with deletion result
 */
async function deleteImageFromCloudinary(public_id) {
    return cloudinary_1.v2.uploader.destroy(public_id);
}
/**
 * Generate optimized image URL with transformations
 * @param public_id - Cloudinary public ID
 * @param options - Transformation options
 * @returns Optimized image URL
 */
function getOptimizedImageUrl(public_id, options = {}) {
    const transformation = [];
    if (options.width || options.height) {
        transformation.push({
            width: options.width,
            height: options.height,
            crop: options.crop || 'limit'
        });
    }
    if (options.quality) {
        transformation.push({ quality: options.quality });
    }
    if (options.format) {
        transformation.push({ fetch_format: options.format });
    }
    return cloudinary_1.v2.url(public_id, {
        transformation,
        secure: true
    });
}
/**
 * Get image metadata from Cloudinary
 * @param public_id - Cloudinary public ID
 * @returns Promise with image metadata
 */
async function getImageMetadata(public_id) {
    return cloudinary_1.v2.api.resource(public_id);
}
/**
 * List images in a folder
 * @param folder - Folder path
 * @param options - List options
 * @returns Promise with list of images
 */
async function listImages(folder = 'keralagiftsonline/products', options = {}) {
    return cloudinary_1.v2.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: options.max_results || 100,
        next_cursor: options.next_cursor
    });
}
/**
 * Verify that an image exists and is accessible on Cloudinary
 * @param public_id - Cloudinary public ID
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise with verification result
 */
async function verifyImageExists(public_id, maxRetries = 3) {
    // First, check if the image exists in Cloudinary
    console.log(`🔍 [Backend] Checking if image exists in Cloudinary: ${public_id}`);
    try {
        const resource = await cloudinary_1.v2.api.resource(public_id);
        if (!resource) {
            console.log(`❌ [Backend] Image not found in Cloudinary: ${public_id}`);
            return {
                exists: false,
                accessible: false,
                error: 'Image not found in Cloudinary'
            };
        }
        console.log(`✅ [Backend] Image exists in Cloudinary: ${public_id}`);
    }
    catch (apiError) {
        console.error(`❌ [Backend] Cloudinary API error for ${public_id}:`, apiError);
        return {
            exists: false,
            accessible: false,
            error: `Cloudinary API error: ${apiError}`
        };
    }
    // Now verify the image URL is accessible with retry logic
    const imageUrl = cloudinary_1.v2.url(public_id, { secure: true });
    console.log(`🌐 [Backend] Verifying image URL accessibility: ${imageUrl}`);
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 [Backend] Attempt ${attempt}/${maxRetries} - Checking URL accessibility...`);
            const response = await fetch(imageUrl, {
                method: 'HEAD',
                // Add timeout to prevent hanging
                signal: AbortSignal.timeout(10000)
            });
            if (response.ok) {
                console.log(`✅ [Backend] Image ${public_id} verified successfully on attempt ${attempt}`);
                return {
                    exists: true,
                    accessible: true
                };
            }
            console.log(`⚠️ [Backend] Image ${public_id} not accessible on attempt ${attempt}: HTTP ${response.status}`);
            // If not the last attempt, wait before retrying
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
                console.log(`⏳ [Backend] Retrying image verification in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        catch (fetchError) {
            console.log(`❌ [Backend] Image ${public_id} verification attempt ${attempt} failed:`, fetchError);
            // If not the last attempt, wait before retrying
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
                console.log(`⏳ [Backend] Retrying image verification in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    return {
        exists: true,
        accessible: false,
        error: `Image exists but not accessible after ${maxRetries} attempts`
    };
}
exports.default = cloudinary_1.v2;
