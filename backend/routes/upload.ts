import express from 'express';
import multer from 'multer';
import { uploadImage, deleteImage, listImages, getImageMetadata } from '../utils/fileUpload';
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed!'));
  }
};

// Configure multer for memory storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Upload single image to file system
router.post('/product-image', auth, role('admin'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'No file uploaded', code: 'NO_FILE' } 
      });
    }

    // Upload to file system
    const uploadResult = await uploadImage(req.file);

    // Generate the public URL for the uploaded file
    const imageUrl = `/images/products/${uploadResult.filename}`;

    return res.status(200).json({
      success: true,
      data: {
        filename: uploadResult.filename,
        originalName: uploadResult.originalName,
        url: imageUrl,
        size: uploadResult.size,
        mimetype: uploadResult.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'File upload failed', code: 'UPLOAD_ERROR' }
    });
  }
});

// Delete uploaded image from file system
router.delete('/product-image/:filename', auth, role('admin'), async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: { message: 'Filename is required', code: 'MISSING_FILENAME' }
      });
    }

    await deleteImage(filename);
    
    return res.status(200).json({
      success: true,
      data: { message: 'File deleted successfully' }
    });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'File deletion failed', code: 'DELETE_ERROR' }
    });
  }
});

// Get list of uploaded images from file system
router.get('/product-images', auth, role('admin'), async (req, res) => {
  try {
    const images = await listImages();
    
    const imageFiles = await Promise.all(images.map(async (filename) => {
      const metadata = await getImageMetadata(filename);
      return {
        filename: filename,
        url: `/images/products/${filename}`,
        size: metadata?.size || 0,
        mimetype: metadata?.mimetype || 'application/octet-stream',
        created: metadata?.created || new Date()
      };
    }));

    return res.status(200).json({
      success: true,
      data: imageFiles
    });
  } catch (error) {
    console.error('List images error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to list images', code: 'LIST_ERROR' }
    });
  }
});

// Get image metadata
router.get('/product-image/:filename', auth, role('admin'), async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: { message: 'Filename is required', code: 'MISSING_FILENAME' }
      });
    }

    const metadata = await getImageMetadata(filename);
    
    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: { message: 'Image not found', code: 'IMAGE_NOT_FOUND' }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        filename: metadata.filename,
        url: `/images/products/${metadata.filename}`,
        size: metadata.size,
        mimetype: metadata.mimetype,
        created: metadata.created
      }
    });
  } catch (error) {
    console.error('Get image metadata error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get image metadata', code: 'METADATA_ERROR' }
    });
  }
});

export default router; 