"use strict";
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
const PRODUCT_IMAGES_DIR = path_1.default.join(process.cwd(), '../public/images/products');
function ensureProductImagesDir() {
    if (!fs_1.default.existsSync(PRODUCT_IMAGES_DIR)) {
        fs_1.default.mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });
    }
}
async function uploadImage(file, customName) {
    ensureProductImagesDir();
    const fileExtension = path_1.default.extname(file.originalname);
    const uniqueId = (0, uuid_1.v4)();
    const filename = customName || `${uniqueId}${fileExtension}`;
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path_1.default.join(PRODUCT_IMAGES_DIR, safeFilename);
    await fs_1.default.promises.writeFile(filePath, file.buffer);
    return {
        filename: safeFilename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
    };
}
async function deleteImage(filename) {
    const filePath = path_1.default.join(PRODUCT_IMAGES_DIR, filename);
    if (fs_1.default.existsSync(filePath)) {
        await fs_1.default.promises.unlink(filePath);
    }
}
async function imageExists(filename) {
    const filePath = path_1.default.join(PRODUCT_IMAGES_DIR, filename);
    return fs_1.default.existsSync(filePath);
}
async function listImages() {
    ensureProductImagesDir();
    const files = await fs_1.default.promises.readdir(PRODUCT_IMAGES_DIR);
    return files.filter(file => {
        const ext = path_1.default.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });
}
async function getImageMetadata(filename) {
    const filePath = path_1.default.join(PRODUCT_IMAGES_DIR, filename);
    if (!fs_1.default.existsSync(filePath)) {
        return null;
    }
    const stats = await fs_1.default.promises.stat(filePath);
    const ext = path_1.default.extname(filename).toLowerCase();
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
//# sourceMappingURL=fileUpload.js.map