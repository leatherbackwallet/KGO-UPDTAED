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
    const { category, min, max, search, featured, occasions, page = 1, limit = 24, includeDeleted = false, admin = false, sort = 'newest' } = req.query;
    
    // For admin requests, use a high limit to get all products
    const effectiveLimit = admin === 'true' ? 1000 : Number(limit);
    
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
      
      // Optimize: Only make one database call for occasion lookups
      if (occasionNames.length > 0) {
        try {
          const { Occasion } = await import('../models/occasions.model');
          const occasionsByName = await Occasion.find({ 
            name: { $in: occasionNames },
            isActive: true,
            isDeleted: false
          }).select('_id');
          
          const allOccasionIds = [...occasionIds, ...occasionsByName.map(o => o._id)];
          if (allOccasionIds.length > 0) {
            filter.occasions = { $in: allOccasionIds };
          }
        } catch (error) {
          console.error('Error fetching occasions:', error);
          // If occasion lookup fails, skip occasion filtering
        }
      } else if (occasionIds.length > 0) {
        filter.occasions = { $in: occasionIds };
      }
    }
    
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [
        { 'name': searchRegex },
        { 'description': searchRegex }
      ];
    }

    // Calculate skip only for non-admin requests
    const skip = admin !== 'true' ? (Number(page) - 1) * Number(limit) : 0;
    
    // Determine sort order based on sort parameter
    let sortOrder: any = { isFeatured: -1, createdAt: -1 }; // Default sort
    
    switch (sort) {
      case 'name':
        sortOrder = { name: 1 }; // A-Z
        break;
      case 'price-low':
        // Filter out products without price when sorting by price
        filter.price = { $exists: true, $ne: null, $gt: 0 };
        sortOrder = { price: 1, createdAt: -1 }; // Low to High, then newest
        break;
      case 'price-high':
        // Filter out products without price when sorting by price
        filter.price = { $exists: true, $ne: null, $gt: 0 };
        sortOrder = { price: -1, createdAt: -1 }; // High to Low, then newest
        break;
      case 'newest':
      default:
        sortOrder = { isFeatured: -1, createdAt: -1 }; // Newest first (default)
        break;
    }
    
    // Optimize: Select only needed fields for better performance
    let query = Product.find(filter)
      .select('name description price stock images isFeatured categories occasions createdAt updatedAt')
      .populate({
        path: 'categories',
        select: 'name slug',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'occasions',
        select: 'name slug dateRange priority seasonalFlags',
        options: { strictPopulate: false }
      })
      .sort(sortOrder);
    
    // Apply pagination logic correctly
    if (admin === 'true') {
      // For admin requests, return all products without pagination
      console.log('Admin request: returning all products without pagination');
    } else {
      // For regular requests, apply pagination
      query = query.skip(skip).limit(effectiveLimit);
    }
    
    // Optimize: Run count query in parallel with main query for better performance
    const [products, total] = await Promise.all([
      query,
      Product.countDocuments(filter)
    ]).catch(error => {
      console.error('Error in parallel queries:', error);
      // Fallback to sequential queries if parallel fails
      return Promise.all([
        query.catch(() => []),
        Product.countDocuments(filter).catch(() => 0)
      ]);
    });

    res.json({
      success: true,
      data: products,
      count: products.length,
      total,
      page: Number(page),
      pages: effectiveLimit >= 100 ? 1 : Math.ceil(total / effectiveLimit),
      allProductsLoaded: effectiveLimit >= 100 || admin === 'true' || products.length === total
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
      .populate({
        path: 'categories',
        select: 'name slug',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'attributes',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'reviews',
        options: { strictPopulate: false },
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
    
    console.log('📦 Creating product with data:', {
      name: productData.name,
      price: productData.price,
      categories: productData.categories,
      images: productData.images,
      isCombo: productData.isCombo
    });
    
    // Enhanced validation
    const validationErrors = [];
    
    // Validate required fields
    if (!productData.name || productData.name.trim() === '') {
      validationErrors.push('Product name is required');
    }
    
    if (!productData.description || productData.description.trim() === '') {
      validationErrors.push('Product description is required');
    }
    
    if (!productData.price || productData.price <= 0) {
      validationErrors.push('Valid price is required');
    }
    
    if (!productData.categories || !Array.isArray(productData.categories) || productData.categories.length === 0) {
      validationErrors.push('At least one category is required');
    }
    
    // Validate images if provided
    if (productData.images && Array.isArray(productData.images)) {
      for (const image of productData.images) {
        if (image && !image.startsWith('keralagiftsonline/products/') && !/^[a-zA-Z0-9._-]+$/.test(image)) {
          validationErrors.push(`Invalid image format: ${image}`);
        }
      }
    }
    
    // Validate defaultImage if provided
    if (productData.defaultImage && !productData.defaultImage.startsWith('keralagiftsonline/products/') && !/^[a-zA-Z0-9._-]+$/.test(productData.defaultImage)) {
      validationErrors.push(`Invalid default image format: ${productData.defaultImage}`);
    }
    
    if (validationErrors.length > 0) {
      console.error('❌ Product validation failed:', validationErrors);
      res.status(400).json({ 
        success: false, 
        error: validationErrors.join('. ')
      });
      return;
    }

    // Ensure required fields have defaults
    const validatedProductData = {
      ...productData,
      stock: productData.stock || 200,
      costPrice: productData.costPrice || 0,
      isFeatured: productData.isFeatured || false,
      isDeleted: false,
      isCombo: productData.isCombo || false,
      comboBasePrice: productData.comboBasePrice || 0,
      comboItems: productData.comboItems || []
    };

    console.log('✅ Product data validated, creating product...');
    
    const product = new Product(validatedProductData);
    await product.save();

    console.log('✅ Product created successfully:', {
      id: product._id,
      name: product.name,
      price: product.price,
      categories: product.categories.length,
      images: product.images?.length || 0
    });

    // Invalidate cache
    try {
      await invalidateProductCache();
    } catch (cacheError) {
      console.warn('Cache invalidation failed (non-critical):', cacheError);
    }

    // Log activity (non-critical)
    try {
      await ActivityLog.create({
        actorId: (req as any).user?.id,
        actionType: 'CREATE_PRODUCT',
        target: {
          type: 'Product',
          id: product._id
        },
        details: { productName: product.name }
      });
    } catch (logError) {
      console.warn('Activity logging failed (non-critical):', logError);
    }

    res.status(201).json({ 
      success: true, 
      data: product,
      message: 'Product created successfully'
    });
  } catch (error: any) {
    console.error('❌ Error creating product:', error);
    
    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        success: false, 
        error: `Validation failed: ${validationErrors.join(', ')}`
      });
      return;
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false, 
        error: 'Product with this name already exists'
      });
      return;
    }
    
    // Handle other errors
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    const products = await Product.find({ isFeatured: true, isDeleted: false })
      .populate({
        path: 'categories',
        select: 'name slug',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'vendors',
        select: 'storeName',
        options: { strictPopulate: false }
      })
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
    const { q, category, min, max, page = 1, limit = 24 } = req.query;
    
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
      .populate({
        path: 'categories',
        select: 'name slug',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'occasions',
        select: 'name slug dateRange priority seasonalFlags',
        options: { strictPopulate: false }
      })
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
