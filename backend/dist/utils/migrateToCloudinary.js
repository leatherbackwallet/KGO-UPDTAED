"use strict";
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
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const PRODUCT_IMAGES_DIR = path_1.default.join(process.cwd(), '../public/images/products');
async function migrateSingleImage(localPath, filename) {
    try {
        const fileBuffer = await fs_1.default.promises.readFile(localPath);
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
async function migrateAllImages(options = {}) {
    const { deleteLocalAfterUpload = false, updateProductReferences = false, batchSize = 10 } = options;
    const results = [];
    let total = 0;
    let successful = 0;
    let failed = 0;
    try {
        const files = await fs_1.default.promises.readdir(PRODUCT_IMAGES_DIR);
        const imageFiles = files.filter(file => {
            const ext = path_1.default.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
        });
        total = imageFiles.length;
        console.log(`Found ${total} images to migrate`);
        for (let i = 0; i < imageFiles.length; i += batchSize) {
            const batch = imageFiles.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(imageFiles.length / batchSize)}`);
            const batchPromises = batch.map(async (filename) => {
                const localPath = path_1.default.join(PRODUCT_IMAGES_DIR, filename);
                const result = await migrateSingleImage(localPath, filename);
                if (result.success) {
                    successful++;
                    if (deleteLocalAfterUpload) {
                        try {
                            await fs_1.default.promises.unlink(localPath);
                            console.log(`Deleted local file: ${filename}`);
                        }
                        catch (deleteError) {
                            console.error(`Failed to delete local file ${filename}:`, deleteError);
                        }
                    }
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
async function updateProductImageReference(oldFilename, public_id, url) {
    try {
        const products = await products_model_1.Product.find({
            $or: [
                { images: { $in: [oldFilename] } },
                { defaultImage: oldFilename }
            ]
        });
        for (const product of products) {
            const updates = {};
            if (product.images && product.images.includes(oldFilename)) {
                updates.images = product.images.map((img) => img === oldFilename ? public_id : img);
            }
            if (product.defaultImage === oldFilename) {
                updates.defaultImage = public_id;
            }
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
//# sourceMappingURL=migrateToCloudinary.js.map