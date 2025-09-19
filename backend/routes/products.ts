/**
 * Products Routes - Product management and catalog operations
 * Handles product CRUD, search, filtering, and inventory management
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/products.model';
import { Category } from '../models/categories.model';
import { ActivityLog } from '../models/activityLogs.model';
import { ProductAttribute } from '../models/productAttributes.model';
import { VendorProduct } from '../models/vendorProducts.model';
import { Review } from '../models/reviews.model';
import { Wishlist } from '../models/wishlists.model';
import { Notification } from '../models/notifications.model';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { validate } from '../middleware/validation';
import { cacheConfigs, invalidateProductCache } from '../middleware/cache';
import { ensureDatabaseConnection } from '../middleware/database';
import { verifyImageExists } from '../utils/cloudinary';

const router = express.Router();

// Get all products with SMART caching (re-enabled with proper invalidation)
router.get('/', cacheConfigs.products, ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 [Products API] Fetching products with smart caching...');
    console.log('🔍 [Products API] Database name:', mongoose.connection.db?.databaseName);
    console.log('🔍 [Products API] Connection state:', mongoose.connection.readyState);
    console.log('🔍 [Products API] Connection URI:', mongoose.connection.host, mongoose.connection.port);
    console.log('🔍 [Products API] Collections:', await mongoose.connection.db?.listCollections().toArray());
    
    const { category, min, max, search, featured, occasions, page = 1, limit = 20, includeDeleted = false, admin = false } = req.query;
    
    let filter: any = includeDeleted === 'true' ? {} : { isDeleted: { $ne: true } };
    
    // Apply filters
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category as string)) {
        filter.categories = category;
      } else {
        const categoryDoc = await Category.findOne({ slug: category });
        if (categoryDoc) {
          filter.categories = categoryDoc._id;
        } else {
          res.json({ success: true, data: [], count: 0 });
          return;
        }
      }
    }
    
    if (featured === 'true') filter.isFeatured = true;
    
    if (min || max) filter.price = {};
    if (min) filter.price.$gte = Number(min);
    if (max) filter.price.$lte = Number(max);
    
    if (occasions) {
      // Handle both ObjectId and name-based filtering
      const occasionArray = (occasions as string).split(',').map(o => o.trim());
      const occasionIds = [];
      const occasionNames = [];
      
      for (const occasion of occasionArray) {
        if (mongoose.Types.ObjectId.isValid(occasion)) {
          occasionIds.push(occasion);
        } else {
          occasionNames.push(occasion);
        }
      }
      
      if (occasionIds.length > 0 && occasionNames.length > 0) {
        // Mixed filtering - need to find occasion IDs by name first
        const { Occasion } = await import('../models/occasions.model');
        const occasionsByName = await Occasion.find({ 
          name: { $in: occasionNames },
          isActive: true,
          isDeleted: false
        }).select('_id');
        const allOccasionIds = [...occasionIds, ...occasionsByName.map(o => o._id)];
        filter.occasions = { $in: allOccasionIds };
      } else if (occasionIds.length > 0) {
        filter.occasions = { $in: occasionIds };
      } else if (occasionNames.length > 0) {
        const { Occasion } = await import('../models/occasions.model');
        const occasionsByName = await Occasion.find({ 
          name: { $in: occasionNames },
          isActive: true,
          isDeleted: false
        }).select('_id');
        filter.occasions = { $in: occasionsByName.map(o => o._id) };
      }
    }
    
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [
        { 'name': searchRegex },
        { 'description': searchRegex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    let query = Product.find(filter)
      .populate('categories', 'name slug')
      .populate('vendors', 'storeName')
      .populate('occasions', 'name slug dateRange priority seasonalFlags')
      .sort({ isFeatured: -1, createdAt: -1 });
    
    // For admin requests or when limit is high (>=100), don't apply pagination limits
    // This ensures all products are returned when requested
    if (admin !== 'true' && Number(limit) < 100) {
      query = query.skip(skip).limit(Number(limit));
    }
    
    const products = await query;

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      count: products.length,
      total,
      page: Number(page),
      pages: Number(limit) >= 100 ? 1 : Math.ceil(total / Number(limit)),
      allProductsLoaded: Number(limit) >= 100 || admin === 'true' || products.length === total
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// Get single product by ID
router.get('/:id', ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categories', 'name slug')
      .populate('vendors', 'storeName')
      .populate('attributes')
      .populate({
        path: 'reviews',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      });

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

// Create new product (admin only)
router.post('/', auth, requireRole('admin'), ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
  try {
    const productData = req.body;
    
    // Validate required fields
    if (!productData.name || !productData.price || !productData.categories) {
      res.status(400).json({ 
        success: false, 
        error: 'Name, price, and categories are required' 
      });
      return;
    }

    const product = new Product(productData);
    await product.save();

    // Invalidate cache
    await invalidateProductCache();

    // Log activity
    await ActivityLog.create({
      userId: (req as any).user?.id,
      action: 'CREATE_PRODUCT',
      details: { productId: product._id, productName: product.name }
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// Update product (admin only)
router.put('/:id', auth, requireRole('admin'), ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('categories', 'name slug');

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    // Invalidate cache
    await invalidateProductCache();

    // Log activity
    await ActivityLog.create({
      userId: (req as any).user?.id,
      action: 'UPDATE_PRODUCT',
      details: { productId: product._id, productName: product.name }
    });

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// Delete product (admin only)
router.delete('/:id', auth, requireRole('admin'), ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    // Invalidate cache
    await invalidateProductCache();

    // Log activity
    await ActivityLog.create({
      userId: (req as any).user?.id,
      action: 'DELETE_PRODUCT',
      details: { productId: product._id, productName: product.name }
    });

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

// Get featured products
router.get('/featured/list', ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true, isDeleted: false })
      .populate('categories', 'name slug')
      .populate('vendors', 'storeName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch featured products' });
  }
});

// Search products
router.get('/search/query', ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, category, min, max, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      res.status(400).json({ success: false, error: 'Search query is required' });
      return;
    }

    let filter: any = {
      isDeleted: false,
      $or: [
        { name: new RegExp(q as string, 'i') },
        { description: new RegExp(q as string, 'i') }
      ]
    };

    if (category) {
      filter.categories = category;
    }

    if (min || max) {
      filter.price = {};
      if (min) filter.price.$gte = Number(min);
      if (max) filter.price.$lte = Number(max);
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const products = await Product.find(filter)
      .populate('categories', 'name slug')
      .populate('vendors', 'storeName')
      .populate('occasions', 'name slug dateRange priority seasonalFlags')
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ success: false, error: 'Failed to search products' });
  }
});

export default router;
