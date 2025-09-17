"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cloudinary_1 = require("../utils/cloudinary");
const router = express_1.default.Router();
router.get('/cloudinary/:publicId(*)', async (req, res) => {
    try {
        const publicId = req.params.publicId;
        const { w, h, q, f } = req.query;
        const imageUrl = (0, cloudinary_1.getOptimizedImageUrl)(publicId, {
            width: w ? Number(w) : undefined,
            height: h ? Number(h) : undefined,
            quality: q ? Number(q) : 'auto',
            format: f || 'auto'
        });
        res.set({
            'Cache-Control': 'public, max-age=31536000',
            'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString(),
            'ETag': `"${publicId}-${w}-${h}-${q}-${f}"`
        });
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
router.get('/metadata/:publicId(*)', async (req, res) => {
    try {
        const publicId = req.params.publicId;
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
//# sourceMappingURL=images.js.map