"use strict";
/**
 * Migration Utility - Move Local Images to Cloudinary CDN
 * This utility helps migrate existing local images to Cloudinary
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateSingleImage = migrateSingleImage;
exports.migrateAllImages = migrateAllImages;
exports.generateMigrationReport = generateMigrationReport;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = require("cloudinary");
const cloudinary_2 = require("./cloudinary");
const products_model_1 = require("../models/products.model");
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Product images directory
const PRODUCT_IMAGES_DIR = path_1.default.join(process.cwd(), '../public/images/products');
/**
 * Migrate a single local image to Cloudinary
 * @param localPath - Local file path
 * @param filename - Original filename
 * @returns Promise with migration result
 */
async function migrateSingleImage(localPath, filename) {
    try {
        // Read the file
        const fileBuffer = await fs_1.default.promises.readFile(localPath);
        // Create a mock multer file object
        const mockFile = {
            fieldname: 'image',
            originalname: filename,
            encoding: '7bit',
            mimetype: getMimeType(filename),
            buffer: fileBuffer,
            size: fileBuffer.length,
            stream: null,
            destination: '',
            filename: filename,
            path: localPath
        };
        // Upload to Cloudinary
        const result = await (0, cloudinary_2.uploadImageToCloudinary)(mockFile);
        return {
            success: true,
            public_id: result.public_id,
            url: result.secure_url
        };
    }
    catch (error) {
        console.error(`Failed to migrate image ${filename}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Get MIME type from filename
 * @param filename - Filename
 * @returns MIME type
 */
function getMimeType(filename) {
    const ext = path_1.default.extname(filename).toLowerCase();
    const mimeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
    };
    return mimeMap[ext] || 'image/jpeg';
}
/**
 * Migrate all local images to Cloudinary
 * @param options - Migration options
 * @returns Promise with migration results
 */
async function migrateAllImages(options = {}) {
    const { deleteLocalAfterUpload = false, updateProductReferences = false, batchSize = 10 } = options;
    const results = [];
    let total = 0;
    let successful = 0;
    let failed = 0;
    try {
        // Get all local image files
        const files = await fs_1.default.promises.readdir(PRODUCT_IMAGES_DIR);
        const imageFiles = files.filter(file => {
            const ext = path_1.default.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
        });
        total = imageFiles.length;
        console.log(`Found ${total} images to migrate`);
        // Process images in batches
        for (let i = 0; i < imageFiles.length; i += batchSize) {
            const batch = imageFiles.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(imageFiles.length / batchSize)}`);
            const batchPromises = batch.map(async (filename) => {
                const localPath = path_1.default.join(PRODUCT_IMAGES_DIR, filename);
                const result = await migrateSingleImage(localPath, filename);
                if (result.success) {
                    successful++;
                    // Delete local file if requested
                    if (deleteLocalAfterUpload) {
                        try {
                            await fs_1.default.promises.unlink(localPath);
                            console.log(`Deleted local file: ${filename}`);
                        }
                        catch (deleteError) {
                            console.error(`Failed to delete local file ${filename}:`, deleteError);
                        }
                    }
                    // Update product references if requested
                    if (updateProductReferences && result.public_id) {
                        try {
                            await updateProductImageReference(filename, result.public_id, result.url);
                            console.log(`Updated product reference for: ${filename}`);
                        }
                        catch (updateError) {
                            console.error(`Failed to update product reference for ${filename}:`, updateError);
                        }
                    }
                }
                else {
                    failed++;
                }
                return {
                    filename,
                    ...result
                };
            });
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            // Add a small delay between batches to avoid rate limiting
            if (i + batchSize < imageFiles.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        console.log(`Migration completed: ${successful} successful, ${failed} failed`);
        return {
            total,
            successful,
            failed,
            results
        };
    }
    catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}
/**
 * Update product image references in database
 * @param oldFilename - Old local filename
 * @param public_id - Cloudinary public ID
 * @param url - Cloudinary URL
 * @returns Promise that resolves when update is complete
 */
async function updateProductImageReference(oldFilename, public_id, url) {
    try {
        // Find products that reference this image
        const products = await products_model_1.Product.find({
            $or: [
                { images: { $in: [oldFilename] } },
                { defaultImage: oldFilename }
            ]
        });
        for (const product of products) {
            const updates = {};
            // Update images array
            if (product.images && product.images.includes(oldFilename)) {
                updates.images = product.images.map((img) => img === oldFilename ? public_id : img);
            }
            // Update defaultImage
            if (product.defaultImage === oldFilename) {
                updates.defaultImage = public_id;
            }
            // Update the product
            if (Object.keys(updates).length > 0) {
                await products_model_1.Product.findByIdAndUpdate(product._id, updates);
            }
        }
    }
    catch (error) {
        console.error(`Failed to update product references for ${oldFilename}:`, error);
        throw error;
    }
}
/**
 * Generate a migration report
 * @param results - Migration results
 * @returns Formatted report string
 */
function generateMigrationReport(results) {
    const { total, successful, failed, results: details } = results;
    let report = `\n=== Cloudinary Migration Report ===\n`;
    report += `Total images: ${total}\n`;
    report += `Successful: ${successful}\n`;
    report += `Failed: ${failed}\n`;
    report += `Success rate: ${((successful / total) * 100).toFixed(2)}%\n\n`;
    if (failed > 0) {
        report += `Failed images:\n`;
        details.filter(r => !r.success).forEach(r => {
            report += `- ${r.filename}: ${r.error}\n`;
        });
        report += `\n`;
    }
    if (successful > 0) {
        report += `Successfully migrated images:\n`;
        details.filter(r => r.success).forEach(r => {
            report += `- ${r.filename} → ${r.public_id}\n`;
        });
    }
    return report;
}
