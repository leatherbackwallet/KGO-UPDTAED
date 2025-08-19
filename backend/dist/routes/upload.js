"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const gridfs_1 = require("../utils/gridfs");
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const router = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed!'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: fileFilter
});
router.post('/product-image', auth, role('admin'), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'No file uploaded', code: 'NO_FILE' }
            });
        }
        const fileExtension = req.file.originalname.split('.').pop();
        const uniqueFilename = `${(0, uuid_1.v4)()}.${fileExtension}`;
        const uploadResult = await (0, gridfs_1.uploadImage)(req.file, uniqueFilename);
        const imageUrl = `/api/images/${uploadResult.fileId}`;
        return res.status(200).json({
            success: true,
            data: {
                fileId: uploadResult.fileId,
                filename: uploadResult.filename,
                originalName: req.file.originalname,
                url: imageUrl,
                size: uploadResult.size,
                mimetype: uploadResult.contentType
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
router.delete('/product-image/:fileId', auth, role('admin'), async (req, res) => {
    try {
        const { fileId } = req.params;
        if (!fileId) {
            return res.status(400).json({
                success: false,
                error: { message: 'File ID is required', code: 'MISSING_FILE_ID' }
            });
        }
        await (0, gridfs_1.deleteImage)(fileId);
        return res.status(200).json({
            success: true,
            data: { message: 'File deleted successfully' }
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
        const images = await (0, gridfs_1.listImages)();
        const imageFiles = images.map(image => ({
            fileId: image._id,
            filename: image.filename,
            url: `/api/images/${image._id}`,
            size: image.length,
            mimetype: image.contentType,
            uploadDate: image.uploadDate,
            metadata: image.metadata
        }));
        return res.status(200).json({
            success: true,
            data: imageFiles
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
router.get('/product-image/:fileId', auth, role('admin'), async (req, res) => {
    try {
        const { fileId } = req.params;
        if (!fileId) {
            return res.status(400).json({
                success: false,
                error: { message: 'File ID is required', code: 'MISSING_FILE_ID' }
            });
        }
        const metadata = await (0, gridfs_1.getImageMetadata)(fileId);
        if (!metadata) {
            return res.status(404).json({
                success: false,
                error: { message: 'Image not found', code: 'IMAGE_NOT_FOUND' }
            });
        }
        return res.status(200).json({
            success: true,
            data: {
                fileId: metadata._id,
                filename: metadata.filename,
                url: `/api/images/${metadata._id}`,
                size: metadata.length,
                mimetype: metadata.contentType,
                uploadDate: metadata.uploadDate,
                metadata: metadata.metadata
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
exports.default = router;
//# sourceMappingURL=upload.js.map