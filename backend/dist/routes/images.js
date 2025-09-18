"use strict";
/**
 * Image serving routes with proper cache headers
 * Handles image requests with optimized caching for CDN images
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cloudinary_1 = require("../utils/cloudinary");
const router = express_1.default.Router();
/**
 * Serve Cloudinary images with proper cache headers
 * This route acts as a proxy to add cache headers for Cloudinary images
 */
router.get('/cloudinary/:publicId(*)', async (req, res) => {
    try {
        const publicId = req.params.publicId;
        const { w, h, q, f } = req.query;
        // Generate optimized Cloudinary URL
        const imageUrl = (0, cloudinary_1.getOptimizedImageUrl)(publicId, {
            width: w ? Number(w) : undefined,
            height: h ? Number(h) : undefined,
            quality: q ? Number(q) : 'auto',
            format: f || 'auto'
        });
        // Set cache headers for CDN optimization
        res.set({
            'Cache-Control': 'public, max-age=31536000', // 1 year
            'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString(),
            'ETag': `"${publicId}-${w}-${h}-${q}-${f}"`
        });
        // Redirect to Cloudinary URL
        res.redirect(302, imageUrl);
    }
    catch (error) {
        console.error('Error serving image:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to serve image', code: 'IMAGE_SERVE_ERROR' }
        });
    }
});
/**
 * Get image metadata
 */
router.get('/metadata/:publicId(*)', async (req, res) => {
    try {
        const publicId = req.params.publicId;
        // In a real implementation, you would fetch metadata from Cloudinary
        res.json({
            success: true,
            data: {
                publicId,
                url: (0, cloudinary_1.getOptimizedImageUrl)(publicId),
                metadata: {
                    width: 800,
                    height: 600,
                    format: 'jpg',
                    size: 102400
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting image metadata:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get image metadata', code: 'METADATA_ERROR' }
        });
    }
});
exports.default = router;
