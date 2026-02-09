/**
 * Products Routes - Product management and catalog operations
 * Handles product CRUD, search, filtering, and inventory management
 * 
 * MIGRATION STRATEGY:
 * - Admin requests (admin=true) → MongoDB (existing functionality)
 * - Public requests (items page) → JSON files (no MongoDB dependency)
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/products.model';
import { Category } from '../models/categories.model';
import { ActivityLog } from '../models/activityLogs.model';
import { ProductAttribute } from '../models/productAttributes.model';
import { Wishlist } from '../models/wishlists.model';
// Removed imports for deleted models: VendorProduct, Review, Notification
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { validate } from '../middleware/validation';
import { cacheConfigs, invalidateProductCache } from '../middleware/cache';
import { ensureDatabaseConnection } from '../middleware/database';
import { validateProductData } from '../utils/productValidation';
import { verifyImageExists } from '../utils/cloudinary';
import { jsonDataService } from '../services/jsonDataService';

const router = express.Router();

// Get all products - Route to JSON for public, MongoDB for admin
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, min, max, search, featured, occasions, page = 1, limit = 24, includeDeleted = false, admin = false, sort = 'newest' } = req.query;
    
    // ROUTE DETECTION: Admin vs Public requests
    if (admin === 'true') {
      // ADMIN REQUEST → Use MongoDB (existing functionality)
      console.log('🔧 Admin request detected - using MongoDB');
      return await handleAdminProductsRequest(req, res);
    } else {
      // PUBLIC REQUEST → Use JSON files (no MongoDB dependency)
      console.log('📄 Public request detected - using JSON files');
      return await handlePublicProductsRequest(req, res);
    }
  } catch (error) {
    console.error('❌ Error in products route:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        message: 'Failed to fetch products',
        code: 'PRODUCTS_FETCH_ERROR'
      }
    });
  }
});

/**
 * Handle public products requests using JSON files (items page)
 * NO MongoDB dependency
 */
async function handlePublicProductsRequest(req: Request, res: Response): Promise<void> {
  const { category, min, max, search, featured, occasions, page = 1, limit = 24, sort = 'newest' } = req.query;
  
  try {
    const result = await jsonDataService.getProducts({
      category: category as string,
      occasions: occasions as string,
      search: search as string,
      featured: featured === 'true',
      min: min ? Number(min) : undefined,
      max: max ? Number(max) : undefined,
      page: Number(page),
      limit: Number(limit),
      sort: sort as string,
      includeDeleted: false // Public requests never include deleted products
    });

    res.json({
      success: true,
      data: result.products,
      count: result.products.length,
      total: result.total,
      pages: result.pages,
      currentPage: result.currentPage
    });
  } catch (error) {
    console.error('❌ Error fetching products from JSON:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch products',
        code: 'JSON_PRODUCTS_ERROR'
      }
    });
  }
}

/**
 * Handle admin products requests using MongoDB (admin panel)
 * Preserves existing MongoDB functionality
 */
async function handleAdminProductsRequest(req: Request, res: Response): Promise<void> {
  // Apply caching and database connection for admin requests
  await new Promise<void>((resolve, reject) => {
    cacheConfigs.products(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  await new Promise<void>((resolve, reject) => {
    ensureDatabaseConnection(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const { category, min, max, search, featured, occasions, page = 1, limit = 24, includeDeleted = false, admin = false, sort = 'newest' } = req.query;
  
  try {
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
      const occasionArray = (occasions as string).split(',').map((o: string) => o.trim());
      const occasionIds: string[] = [];
      const occasionNames: string[] = [];
      
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
          
          const allOccasionIds = [...occasionIds, ...occasionsByName.map((o: any) => o._id)];
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
    // Default to price low to high if no sort specified
    const effectiveSort = sort || 'price-low';
    let sortOrder: any = { price: 1, createdAt: -1 }; // Default sort: price low to high
    
    switch (effectiveSort) {
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
        sortOrder = { isFeatured: -1, createdAt: -1 }; // Newest first
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
}

// Get single product by ID - Route to JSON for public, MongoDB for admin
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { admin } = req.query;
    
    if (admin === 'true') {
      // ADMIN REQUEST → Use MongoDB (existing functionality)
      console.log('🔧 Admin single product request - using MongoDB');
      return await handleAdminSingleProductRequest(req, res);
    } else {
      // PUBLIC REQUEST → Use JSON files (no MongoDB dependency)
      console.log('📄 Public single product request - using JSON files');
      return await handlePublicSingleProductRequest(req, res);
    }
  } catch (error) {
    console.error('❌ Error in single product route:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        message: 'Failed to fetch product',
        code: 'PRODUCT_FETCH_ERROR'
      }
    });
  }
});

/**
 * Handle public single product requests using JSON files
 * NO MongoDB dependency
 */
async function handlePublicSingleProductRequest(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : (req.params.id?.[0] ?? '');
    const product = await jsonDataService.getProductById(id);

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('❌ Error fetching product from JSON:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch product',
        code: 'JSON_PRODUCT_ERROR'
      }
    });
  }
}

/**
 * Handle admin single product requests using MongoDB
 * Preserves existing MongoDB functionality
 */
async function handleAdminSingleProductRequest(req: Request, res: Response): Promise<void> {
  // Apply database connection for admin requests
  await new Promise<void>((resolve, reject) => {
    ensureDatabaseConnection(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

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
    console.error('Error fetching product from MongoDB:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
}

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
    
    // Enhanced validation using centralized validation utility
    const validationResult = validateProductData(productData, false);
    
    if (!validationResult.isValid) {
      console.error('❌ Product validation failed:', validationResult.errors);
      res.status(400).json({ 
        success: false, 
        error: validationResult.errors.join('. ')
      });
      return;
    }

    const validatedProductData = validationResult.sanitizedData;

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
    const productData = req.body;
    const productId = req.params.id;
    
    console.log('📦 Updating product with data:', {
      id: productId,
      name: productData.name,
      price: productData.price,
      categories: productData.categories,
      images: productData.images,
      isCombo: productData.isCombo
    });
    
    // Enhanced validation using centralized validation utility
    const validationResult = validateProductData(productData, true);
    
    if (!validationResult.isValid) {
      console.error('❌ Product validation failed:', validationResult.errors);
      res.status(400).json({ 
        success: false, 
        error: validationResult.errors.join('. ')
      });
      return;
    }

    const validatedProductData = validationResult.sanitizedData;

    console.log('✅ Product data validated, updating product...');
    
    const product = await Product.findByIdAndUpdate(
      productId,
      validatedProductData,
      { new: true, runValidators: true }
    ).populate('categories', 'name slug');

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    console.log('✅ Product updated successfully:', {
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

    // Log activity (FIXED: Use correct schema)
    try {
      await ActivityLog.create({
        actorId: (req as any).user?.id,
        actionType: 'UPDATE_PRODUCT',
        target: {
          type: 'Product',
          id: product._id
        },
        details: { productName: product.name }
      });
    } catch (logError) {
      console.warn('Activity logging failed (non-critical):', logError);
    }

    res.json({ 
      success: true, 
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error: any) {
    console.error('❌ Error updating product:', error);
    
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
      error: 'Failed to update product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
