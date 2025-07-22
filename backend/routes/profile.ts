/**
 * Profile Routes - User profile management including avatar, password reset, and address management
 */

import express from 'express';
import multer from 'multer';
import { User } from '../models/index';
import { hashPassword, comparePassword } from '../utils/hash';
import { initializeGridFS, uploadImage, deleteImage } from '../utils/gridfs';

const router = express.Router();

// Import auth middleware with proper typing
const auth = require('../middleware/auth') as express.RequestHandler;

// Initialize GridFS
initializeGridFS();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Extend Express Request interface to include user
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

// Get user profile
router.get('/', auth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
      });
    }

    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('roleId', 'name description');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Server error', code: 'SERVER_ERROR' }
    });
  }
});

// Update user profile
router.put('/', auth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
      });
    }

    const { firstName, lastName, phone } = req.body;
    
    if (!firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        error: { message: 'First name, last name, and phone are required', code: 'MISSING_FIELDS' }
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone },
      { new: true }
    ).select('-password').populate('roleId', 'name description');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Server error', code: 'SERVER_ERROR' }
    });
  }
});

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded', code: 'NO_FILE' }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    // Delete old avatar if exists
    if (user.avatar) {
      try {
        await deleteImage(user.avatar);
      } catch (deleteErr) {
        console.warn('Failed to delete old avatar:', deleteErr);
      }
    }

    // Upload new avatar
    const uploadResult = await uploadImage(req.file);
    user.avatar = uploadResult.fileId.toString();
    await user.save();

    return res.json({
      success: true,
      data: { avatar: uploadResult.fileId.toString() }
    });
  } catch (err) {
    console.error('Upload avatar error:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Server error', code: 'SERVER_ERROR' }
    });
  }
});

// Delete avatar
router.delete('/avatar', auth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    if (user.avatar) {
      try {
        await deleteImage(user.avatar);
      } catch (deleteErr) {
        console.warn('Failed to delete avatar:', deleteErr);
      }
      user.avatar = undefined as any;
      await user.save();
    }

    return res.json({
      success: true,
      data: { message: 'Avatar deleted successfully' }
    });
  } catch (err) {
    console.error('Delete avatar error:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Server error', code: 'SERVER_ERROR' }
    });
  }
});

// Change password
router.put('/password', auth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
      });
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Current password and new password are required', code: 'MISSING_FIELDS' }
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'New password must be at least 6 characters long', code: 'INVALID_PASSWORD' }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: { message: 'Current password is incorrect', code: 'INVALID_PASSWORD' }
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return res.json({
      success: true,
      data: { message: 'Password changed successfully' }
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Server error', code: 'SERVER_ERROR' }
    });
  }
});

// Get user addresses
router.get('/addresses', auth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
      });
    }

    const user = await User.findById(req.user.id).select('recipientAddresses');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    return res.json({
      success: true,
      data: user.recipientAddresses || []
    });
  } catch (err) {
    console.error('Get addresses error:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Server error', code: 'SERVER_ERROR' }
    });
  }
});

// Add new address
router.post('/addresses', auth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
      });
    }

    const { name, phone, address, city, state, pincode, isDefault = false } = req.body;
    
    if (!name || !phone || !address || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        error: { message: 'All address fields are required', code: 'MISSING_FIELDS' }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    // Initialize recipientAddresses array if it doesn't exist
    if (!user.recipientAddresses) {
      user.recipientAddresses = [];
    }

    // If this is the first address or isDefault is true, unset all other defaults
    if (isDefault || user.recipientAddresses.length === 0) {
      user.recipientAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Add new address
    user.recipientAddresses.push({
      name,
      phone,
      address: {
        streetName: address,
        houseNumber: '',
        postalCode: pincode,
        city,
        countryCode: 'IN'
      },
      isDefault: isDefault || user.recipientAddresses.length === 0
    });

    await user.save();

    return res.json({
      success: true,
      data: { message: 'Address added successfully' }
    });
  } catch (err) {
    console.error('Add address error:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Server error', code: 'SERVER_ERROR' }
    });
  }
});

// Update address
router.put('/addresses/:index', auth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
      });
    }

    const { index } = req.params;
    if (!index) {
      return res.status(400).json({
        success: false,
        error: { message: 'Index parameter is required', code: 'MISSING_PARAMETER' }
      });
    }
    const { name, phone, address, city, state, pincode, isDefault = false } = req.body;
    
    if (!name || !phone || !address || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        error: { message: 'All address fields are required', code: 'MISSING_FIELDS' }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    const addressIndex = parseInt(index);
    if (!user.recipientAddresses || addressIndex < 0 || addressIndex >= user.recipientAddresses.length) {
      return res.status(404).json({
        success: false,
        error: { message: 'Address not found', code: 'ADDRESS_NOT_FOUND' }
      });
    }

    // If setting as default, unset all other defaults
    if (isDefault) {
      user.recipientAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Update the address
    user.recipientAddresses[addressIndex] = {
      name,
      phone,
      address: {
        streetName: address,
        houseNumber: '',
        postalCode: pincode,
        city,
        countryCode: 'IN'
      },
      isDefault
    };

    await user.save();

    return res.json({
      success: true,
      data: { message: 'Address updated successfully' }
    });
  } catch (err) {
    console.error('Update address error:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Server error', code: 'SERVER_ERROR' }
    });
  }
});

// Delete address
router.delete('/addresses/:index', auth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
      });
    }

    const { index } = req.params;
    if (!index) {
      return res.status(400).json({
        success: false,
        error: { message: 'Index parameter is required', code: 'MISSING_PARAMETER' }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    const addressIndex = parseInt(index);
    if (!user.recipientAddresses || addressIndex < 0 || addressIndex >= user.recipientAddresses.length) {
      return res.status(404).json({
        success: false,
        error: { message: 'Address not found', code: 'ADDRESS_NOT_FOUND' }
      });
    }

    // Remove the address
    user.recipientAddresses.splice(addressIndex, 1);

    // If we deleted the default address and there are other addresses, set the first one as default
    if (user.recipientAddresses && user.recipientAddresses.length > 0 && !user.recipientAddresses.some(addr => addr.isDefault)) {
      if (user.recipientAddresses[0]) {
        user.recipientAddresses[0].isDefault = true;
      }
    }

    await user.save();

    return res.json({
      success: true,
      data: { message: 'Address deleted successfully' }
    });
  } catch (err) {
    console.error('Delete address error:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Server error', code: 'SERVER_ERROR' }
    });
  }
});

// Set default address
router.put('/addresses/:index/default', auth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
      });
    }

    const { index } = req.params;
    if (!index) {
      return res.status(400).json({
        success: false,
        error: { message: 'Index parameter is required', code: 'MISSING_PARAMETER' }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    const addressIndex = parseInt(index);
    if (!user.recipientAddresses || addressIndex < 0 || addressIndex >= user.recipientAddresses.length) {
      return res.status(404).json({
        success: false,
        error: { message: 'Address not found', code: 'ADDRESS_NOT_FOUND' }
      });
    }

    // Unset all defaults
    user.recipientAddresses.forEach(addr => {
      addr.isDefault = false;
    });

    // Set the specified address as default
    if (user.recipientAddresses && user.recipientAddresses[addressIndex]) {
      user.recipientAddresses[addressIndex].isDefault = true;
    }
    await user.save();

    return res.json({
      success: true,
      data: { message: 'Default address updated successfully' }
    });
  } catch (err) {
    console.error('Set default address error:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Server error', code: 'SERVER_ERROR' }
    });
  }
});

export default router; 