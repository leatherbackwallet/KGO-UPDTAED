"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cloudinary_1 = require("../utils/cloudinary");
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const router = express_1.default.Router();
router.post('/product-image', auth, role('admin'), cloudinary_1.upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'No file uploaded', code: 'NO_FILE' }
            });
        }
        const uploadResult = req.file;
        return res.status(200).json({
            success: true,
            data: {
                public_id: uploadResult.public_id,
                filename: uploadResult.originalname,
                url: uploadResult.url,
                secure_url: uploadResult.secure_url,
                size: uploadResult.size,
                mimetype: uploadResult.mimetype,
                width: uploadResult.width,
                height: uploadResult.height,
                format: uploadResult.format
            }
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'File upload failed', code: 'UPLOAD_ERROR' }
        });
    }
});
router.post('/product-image-custom', auth, role('admin'), async (req, res) => {
    try {
        return res.status(501).json({
            success: false,
            error: { message: 'Custom upload not implemented yet', code: 'NOT_IMPLEMENTED' }
        });
    }
    catch (error) {
        console.error('Custom upload error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'File upload failed', code: 'UPLOAD_ERROR' }
        });
    }
});
router.delete('/product-image/:public_id', auth, role('admin'), async (req, res) => {
    try {
        const { public_id } = req.params;
        if (!public_id) {
            return res.status(400).json({
                success: false,
                error: { message: 'Public ID is required', code: 'MISSING_PUBLIC_ID' }
            });
        }
        const result = await (0, cloudinary_1.deleteImageFromCloudinary)(public_id);
        return res.status(200).json({
            success: true,
            data: {
                message: 'File deleted successfully',
                result: result
            }
        });
    }
    catch (error) {
        console.error('Delete error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'File deletion failed', code: 'DELETE_ERROR' }
        });
    }
});
router.get('/product-images', auth, role('admin'), async (req, res) => {
    try {
        const { folder, max_results, next_cursor } = req.query;
        const images = await (0, cloudinary_1.listImages)(folder || 'keralagiftsonline/products', {
            max_results: max_results ? parseInt(max_results) : 100,
            next_cursor: next_cursor
        });
        const imageFiles = images.resources.map((resource) => ({
            public_id: resource.public_id,
            filename: resource.public_id.split('/').pop(),
            url: resource.url,
            secure_url: resource.secure_url,
            size: resource.bytes,
            mimetype: `image/${resource.format}`,
            width: resource.width,
            height: resource.height,
            format: resource.format,
            created: resource.created_at
        }));
        return res.status(200).json({
            success: true,
            data: {
                images: imageFiles,
                next_cursor: images.next_cursor,
                total_count: images.total_count
            }
        });
    }
    catch (error) {
        console.error('List images error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to list images', code: 'LIST_ERROR' }
        });
    }
});
router.get('/product-image/:public_id', auth, role('admin'), async (req, res) => {
    try {
        const { public_id } = req.params;
        if (!public_id) {
            return res.status(400).json({
                success: false,
                error: { message: 'Public ID is required', code: 'MISSING_PUBLIC_ID' }
            });
        }
        const metadata = await (0, cloudinary_1.getImageMetadata)(public_id);
        if (!metadata) {
            return res.status(404).json({
                success: false,
                error: { message: 'Image not found', code: 'IMAGE_NOT_FOUND' }
            });
        }
        return res.status(200).json({
            success: true,
            data: {
                public_id: metadata.public_id,
                filename: metadata.public_id.split('/').pop(),
                url: metadata.url,
                secure_url: metadata.secure_url,
                size: metadata.bytes,
                mimetype: `image/${metadata.format}`,
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                created: metadata.created_at
            }
        });
    }
    catch (error) {
        console.error('Get image metadata error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get image metadata', code: 'METADATA_ERROR' }
        });
    }
});
router.get('/product-image/:public_id/optimized', async (req, res) => {
    try {
        const { public_id } = req.params;
        const { width, height, crop, quality, format } = req.query;
        if (!public_id) {
            return res.status(400).json({
                success: false,
                error: { message: 'Public ID is required', code: 'MISSING_PUBLIC_ID' }
            });
        }
        const optimizedUrl = (0, cloudinary_1.getOptimizedImageUrl)(public_id, {
            width: width ? parseInt(width) : undefined,
            height: height ? parseInt(height) : undefined,
            crop: crop || undefined,
            quality: quality || undefined,
            format: format || undefined
        });
        return res.status(200).json({
            success: true,
            data: {
                public_id,
                optimized_url: optimizedUrl
            }
        });
    }
    catch (error) {
        console.error('Get optimized URL error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to generate optimized URL', code: 'OPTIMIZATION_ERROR' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=upload.js.map