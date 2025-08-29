import express from 'express';
import { upload, uploadImageToCloudinary, deleteImageFromCloudinary, listImages, getImageMetadata, getOptimizedImageUrl } from '../utils/cloudinary';
const auth = require('../middleware/auth.js');
const role = require('../middleware/role.js');

const router = express.Router();

// Upload single image to Cloudinary CDN (memory upload + direct Cloudinary stream)
router.post('/product-image', auth, role('admin'), (req, res) => {
  const multer = require('multer');
  const memoryStorage = multer.memoryStorage();
  const memoryUpload = multer({ storage: memoryStorage });

  memoryUpload.single('image')(req, res, async (err: any) => {
    try {
      if (err) {
        console.error('Memory upload error:', err);
        return res.status(400).json({
          success: false,
          error: { message: 'File upload failed', code: 'UPLOAD_ERROR' }
        });
      }

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({
          success: false,
          error: { message: 'No file uploaded', code: 'NO_FILE' }
        });
      }

      const result = await uploadImageToCloudinary(req.file);

      return res.status(200).json({
        success: true,
        data: {
          public_id: result.public_id,
          filename: req.file.originalname,
          url: result.url,
          secure_url: result.secure_url,
          size: result.size,
          mimetype: req.file.mimetype,
          width: result.width,
          height: result.height,
          format: result.format
        }
      });
    } catch (uploadError) {
      console.error('Direct Cloudinary upload failed:', uploadError);
      return res.status(500).json({
        success: false,
        error: { message: 'Cloudinary upload failed', code: 'CLOUDINARY_ERROR' }
      });
    }
  });
});

// Upload image with direct Cloudinary upload (alternative endpoint)
router.post('/product-image-direct', auth, role('admin'), (req, res) => {
  // Use multer memory storage to get the file buffer
  const multer = require('multer');
  const memoryStorage = multer.memoryStorage();
  const memoryUpload = multer({ storage: memoryStorage });
  
  // Handle the file upload to memory first
  memoryUpload.single('image')(req, res, async (err: any) => {
    if (err) {
      console.error('Memory upload error:', err);
      return res.status(400).json({
        success: false,
        error: { message: 'File upload failed', code: 'UPLOAD_ERROR' }
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded', code: 'NO_FILE' }
      });
    }
    
    try {
      console.log('Attempting direct Cloudinary upload...');
      const result = await uploadImageToCloudinary(req.file);
      console.log('Direct upload successful:', result);
      
      return res.status(200).json({
        success: true,
        data: {
          public_id: result.public_id,
          filename: req.file.originalname,
          url: result.url,
          secure_url: result.secure_url,
          size: result.size,
          mimetype: req.file.mimetype,
          width: result.width,
          height: result.height,
          format: result.format
        }
      });
    } catch (uploadError) {
      console.error('Direct upload failed:', uploadError);
      return res.status(500).json({
        success: false,
        error: { message: 'Cloudinary upload failed', code: 'CLOUDINARY_ERROR' }
      });
    }
  });
});

// Delete uploaded image from Cloudinary
router.delete('/product-image/:public_id', auth, role('admin'), async (req, res) => {
  try {
    const { public_id } = req.params;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Public ID is required', code: 'MISSING_PUBLIC_ID' }
      });
    }

    const result = await deleteImageFromCloudinary(public_id);
    
    return res.status(200).json({
      success: true,
      data: { 
        message: 'File deleted successfully',
        result: result
      }
    });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'File deletion failed', code: 'DELETE_ERROR' }
    });
  }
});

// Get list of uploaded images from Cloudinary
router.get('/product-images', auth, role('admin'), async (req, res) => {
  try {
    const { folder, max_results, next_cursor } = req.query;
    
    const images = await listImages(
      folder as string || 'keralagiftsonline/products',
      {
        max_results: max_results ? parseInt(max_results as string) : 100,
        next_cursor: next_cursor as string
      }
    );
    
    const imageFiles = images.resources.map((resource: any) => ({
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
  } catch (error) {
    console.error('List images error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to list images', code: 'LIST_ERROR' }
    });
  }
});

// Get image metadata from Cloudinary
router.get('/product-image/:public_id', auth, role('admin'), async (req, res) => {
  try {
    const { public_id } = req.params;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Public ID is required', code: 'MISSING_PUBLIC_ID' }
      });
    }

    const metadata = await getImageMetadata(public_id);
    
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
  } catch (error) {
    console.error('Get image metadata error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to get image metadata', code: 'METADATA_ERROR' }
    });
  }
});

// Get optimized image URL with transformations
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

    const optimizedUrl = getOptimizedImageUrl(public_id, {
      width: width ? parseInt(width as string) : undefined,
      height: height ? parseInt(height as string) : undefined,
      crop: crop as string || undefined,
      quality: quality as string || undefined,
      format: format as string || undefined
    });

    return res.status(200).json({
      success: true,
      data: {
        public_id,
        optimized_url: optimizedUrl
      }
    });
  } catch (error) {
    console.error('Get optimized URL error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to generate optimized URL', code: 'OPTIMIZATION_ERROR' }
    });
  }
});

export default router; 