import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { uploadImage, deleteImage, listImages, getImageMetadata } from '../utils/gridfs';
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const router = express.Router();

// Configure multer for memory storage (for GridFS)
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

// Upload single image to GridFS
router.post('/product-image', auth, role('admin'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'No file uploaded', code: 'NO_FILE' } 
      });
    }

    // Generate a unique filename
    const fileExtension = req.file.originalname.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;

    // Upload to GridFS
    const uploadResult = await uploadImage(req.file, uniqueFilename);

    // Generate the public URL for the uploaded file
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
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'File upload failed', code: 'UPLOAD_ERROR' }
    });
  }
});

// Delete uploaded image from GridFS
router.delete('/product-image/:fileId', auth, role('admin'), async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: { message: 'File ID is required', code: 'MISSING_FILE_ID' }
      });
    }

    await deleteImage(fileId);
    
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

// Get list of uploaded images from GridFS
router.get('/product-images', auth, role('admin'), async (req, res) => {
  try {
    const images = await listImages();
    
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
  } catch (error) {
    console.error('List images error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to list images', code: 'LIST_ERROR' }
    });
  }
});

// Get image metadata
router.get('/product-image/:fileId', auth, role('admin'), async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: { message: 'File ID is required', code: 'MISSING_FILE_ID' }
      });
    }

    const metadata = await getImageMetadata(fileId);
    
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
  } catch (error) {
    console.error('Get image metadata error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get image metadata', code: 'METADATA_ERROR' }
    });
  }
});

export default router; 