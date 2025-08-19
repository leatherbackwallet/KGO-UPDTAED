"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateToGridFS = migrateToGridFS;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const products_model_1 = require("../models/products.model");
const gridfs_1 = require("../utils/gridfs");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const gridfs_2 = require("../utils/gridfs");
async function migrateToGridFS() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        (0, gridfs_2.initializeGridFS)();
        console.log('GridFS initialized');
        const products = await products_model_1.Product.find({ isDeleted: false });
        console.log(`Found ${products.length} products to migrate`);
        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        for (const product of products) {
            try {
                console.log(`\nProcessing product: ${product.name.en} (${product._id})`);
                const updatedImages = [];
                let hasChanges = false;
                for (const imagePath of product.images || []) {
                    if (!imagePath)
                        continue;
                    if (imagePath.startsWith('/api/images/')) {
                        console.log(`  - Image already in GridFS: ${imagePath}`);
                        updatedImages.push(imagePath);
                        continue;
                    }
                    const filename = imagePath.split('/').pop();
                    if (!filename) {
                        console.log(`  - Invalid image path: ${imagePath}`);
                        updatedImages.push(imagePath);
                        continue;
                    }
                    const filePath = path_1.default.join(__dirname, '../../../public/images/products', filename);
                    if (!fs_1.default.existsSync(filePath)) {
                        console.log(`  - File not found: ${filePath}`);
                        updatedImages.push(imagePath);
                        continue;
                    }
                    const fileBuffer = fs_1.default.readFileSync(filePath);
                    const fileInfo = {
                        originalname: filename,
                        mimetype: getMimeType(filename),
                        size: fileBuffer.length,
                        buffer: fileBuffer
                    };
                    console.log(`  - Uploading ${filename} to GridFS...`);
                    const uploadResult = await (0, gridfs_1.uploadImage)(fileInfo, filename);
                    const gridfsUrl = `/api/images/${uploadResult.fileId}`;
                    updatedImages.push(gridfsUrl);
                    hasChanges = true;
                    console.log(`  - Uploaded to GridFS: ${gridfsUrl}`);
                }
                if (hasChanges) {
                    await products_model_1.Product.updateOne({ _id: product._id }, {
                        $set: {
                            images: updatedImages,
                            defaultImage: updatedImages[0] || product.defaultImage
                        }
                    });
                    migratedCount++;
                    console.log(`  ✓ Product updated successfully`);
                }
                else {
                    skippedCount++;
                    console.log(`  - No changes needed`);
                }
            }
            catch (error) {
                console.error(`  ✗ Error processing product ${product._id}:`, error);
                errorCount++;
            }
        }
        console.log(`\n=== Migration Summary ===`);
        console.log(`Total products: ${products.length}`);
        console.log(`Migrated: ${migratedCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);
    }
    catch (error) {
        console.error('Migration failed:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
function getMimeType(filename) {
    const ext = path_1.default.extname(filename).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}
if (require.main === module) {
    migrateToGridFS();
}
//# sourceMappingURL=migrate-to-gridfs.js.map