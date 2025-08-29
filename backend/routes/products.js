const express = require('express');
const router = express.Router();
const { Product } = require('../models/products.model.js');
const { Category } = require('../models/categories.model.js');
const { ActivityLog } = require('../models/activityLogs.model.js');
const { ProductAttribute } = require('../models/productAttributes.model.js');
const { VendorProduct } = require('../models/vendorProducts.model.js');
const { Review } = require('../models/reviews.model.js');
const { Wishlist } = require('../models/wishlists.model.js');
const { Notification } = require('../models/notifications.model.js');
const auth = require('../middleware/auth.js');
const role = require('../middleware/role.js');
const { validate } = require('../middleware/validation.js');
const mongoose = require('mongoose');
const { cacheConfigs, invalidateProductCache } = require('../middleware/cache.js');
const { ensureDatabaseConnection } = require('../middleware/database.js');

// Get all products with caching
router.get('/', cacheConfigs.products, ensureDatabaseConnection, async (req, res) => {
  try {
    const { category, min, max, search, featured, occasions } = req.query;
    let filter = {};
    
    // Validate and sanitize query parameters
    if (category && typeof category !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Invalid category parameter', code: 'INVALID_CATEGORY' } 
      });
    }
    
    if (min && (isNaN(Number(min)) || Number(min) < 0)) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Invalid minimum price', code: 'INVALID_MIN_PRICE' } 
      });
    }
    
    if (max && (isNaN(Number(max)) || Number(max) < 0)) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Invalid maximum price', code: 'INVALID_MAX_PRICE' } 
      });
    }
    
    if (category) {
      // Handle category filtering - could be ObjectId or slug
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.categories = category;
      } else {
        // Try to find category by slug
        const categoryDoc = await Category.findOne({ slug: category });
        if (categoryDoc) {
          filter.categories = categoryDoc._id;
        } else {
          // If category not found, return empty results
          return res.json([]);
        }
      }
    }
    
    if (featured === 'true') filter.isFeatured = true;
    
    if (min || max) filter.price = {};
    if (min) filter.price.$gte = Number(min);
    if (max) filter.price.$lte = Number(max);
    
    // Handle occasions filtering
    if (occasions) {
      const occasionArray = occasions.split(',').map(o => o.trim().toUpperCase());
      filter.occasions = { $in: occasionArray };
    }
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { 'name': searchRegex },
        { 'description': searchRegex },
        { occasions: searchRegex }
      ];
    }
    
    const products = await Product.find(filter)
      .populate('categories', 'name slug')
      .populate('vendors', 'storeName')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(100); // Limit results for performance
    
    // Set cache headers for product responses
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Prevent browser caching
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('ETag', `"products-${products.length}-${Date.now()}"`);
    
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (err) {
    console.error('Products fetch error:', err);
    res.status(500).json({ 
      success: false,
      error: { message: 'Failed to fetch products', code: 'FETCH_ERROR' } 
    });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categories', 'name slug').populate('vendors', 'storeName');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create product (admin only)
router.post('/', auth, role('admin'), async (req, res) => {
  try {
    const { name, description, price, categories, stock, images, occasions, vendors, isFeatured, slug, defaultImage } = req.body;
    
    // Handle categories - could be array of ObjectIds or slugs
    let categoryIds = categories;
    if (categories && Array.isArray(categories)) {
      categoryIds = await Promise.all(categories.map(async (category) => {
        if (mongoose.Types.ObjectId.isValid(category)) {
          return category;
        } else {
          const categoryDoc = await Category.findOne({ slug: category });
          if (!categoryDoc) {
            throw new Error(`Category not found: ${category}`);
          }
          return categoryDoc._id;
        }
      }));
    } else if (categories && !Array.isArray(categories)) {
      // Handle single category for backward compatibility
      if (mongoose.Types.ObjectId.isValid(categories)) {
        categoryIds = [categories];
      } else {
        const categoryDoc = await Category.findOne({ slug: categories });
        if (!categoryDoc) {
          return res.status(400).json({ message: 'Category not found' });
        }
        categoryIds = [categoryDoc._id];
      }
    }
    
    const product = await Product.create({ 
      name, 
      description, 
      price, 
      categories: categoryIds, 
      stock: stock || 200, // Set default stock to 200 if not provided
      images, 
      occasions, 
      vendors,
      isFeatured,
      slug,
      defaultImage
    });
    
    // Log the product creation activity
    await ActivityLog.logUserAction(
      req.user.id,
      'product_created',
      { type: 'Product', id: product._id },
      { 
        productName: product.name,
        productId: product._id,
        categories: categoryIds,
        price: product.price,
        stock: product.stock
      }
    );
    
    // Create notification for product creation
    try {
      await Notification.create({
        userId: req.user.id,
        title: 'Product Created Successfully',
        message: `Product "${product.name}" has been created successfully`,
        type: 'success',
        relatedEntity: { type: 'Product', id: product._id }
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the operation if notification fails
    }
    
    res.status(201).json(product);
  } catch (err) {
    console.error('Product creation error:', err);
    
    // Log the error for debugging
    await ActivityLog.logSystemAction(
      'product_creation_failed',
      { type: 'Product', id: 'unknown' },
      { 
        error: err.message,
        stack: err.stack,
        requestData: req.body,
        userId: req.user.id
      }
    );
    
    // Return appropriate error response
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: { 
          message: 'Validation failed', 
          code: 'VALIDATION_ERROR',
          details: Object.values(err.errors).map(e => e.message)
        } 
      });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        error: { 
          message: 'Product with this name or slug already exists', 
          code: 'DUPLICATE_ERROR' 
        } 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: { 
        message: 'Failed to create product', 
        code: 'SERVER_ERROR' 
      } 
    });
  }
});

// Update product (admin only)
router.put('/:id', auth, role('admin'), async (req, res) => {
  try {
    const { name, description, price, category, categories, stock, occasions, isFeatured, images, defaultImage } = req.body;
    
    // Prepare update data
    const updateData = {};
    
    // Handle name
    if (name) {
      updateData.name = name;
    }
    
    // Handle description
    if (description) {
      updateData.description = description;
    }
    
    // Handle other fields
    if (price !== undefined) updateData.price = price;
    if (stock !== undefined) updateData.stock = stock;
    if (occasions !== undefined) updateData.occasions = occasions;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    // Handle images update (supports Cloudinary public IDs)
    if (Array.isArray(images)) {
      updateData.images = images;
    }
    if (typeof defaultImage === 'string' && defaultImage.length > 0) {
      updateData.defaultImage = defaultImage;
    }
    
    // Handle category update - support both 'category' and 'categories'
    const categoryData = categories || category;
    if (categoryData) {
      if (typeof categoryData === 'string') {
        // If category is a string (ObjectId), convert to array
        updateData.categories = [categoryData];
      } else if (categoryData._id) {
        // If category is an object with _id, extract the _id
        updateData.categories = [categoryData._id];
      } else if (Array.isArray(categoryData)) {
        // If category is already an array
        updateData.categories = categoryData;
      }
    }
    
    console.log('Updating product with data:', updateData);
    
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('categories', 'name slug');
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: { message: 'Product not found', code: 'PRODUCT_NOT_FOUND' } 
      });
    }
    
    // Invalidate cache
    invalidateProductCache();
    
    // Log the product update activity
    await ActivityLog.logUserAction(
      req.user.id,
      'product_updated',
      { type: 'Product', id: product._id },
      { 
        productName: product.name,
        productId: product._id,
        changes: updateData,
        previousData: {
          name: product?.name,
          price: product?.price,
          stock: product?.stock
        }
      }
    );
    
    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (err) {
    console.error('Product update error:', err);
    res.status(500).json({ 
      success: false,
      error: { message: err.message || 'Server error', code: 'UPDATE_ERROR' } 
    });
  }
});

// Delete product (admin only)
router.delete('/:id', auth, role('admin'), async (req, res) => {
  try {
    console.log(`[DELETE] Attempting to delete product with ID: ${req.params.id}`);
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log(`[DELETE] Invalid ObjectId format: ${req.params.id}`);
      return res.status(400).json({ 
        success: false,
        error: { message: 'Invalid product ID format', code: 'INVALID_ID' } 
      });
    }
    
    // First check if product exists
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      console.log(`[DELETE] Product not found with ID: ${req.params.id}`);
      return res.status(404).json({ 
        success: false,
        error: { message: 'Product not found', code: 'PRODUCT_NOT_FOUND' } 
      });
    }
    
    console.log(`[DELETE] Found product: ${existingProduct.name} (ID: ${existingProduct._id})`);
    
    // Delete the product
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      console.log(`[DELETE] Failed to delete product with ID: ${req.params.id}`);
      return res.status(500).json({ 
        success: false,
        error: { message: 'Failed to delete product', code: 'DELETE_ERROR' } 
      });
    }
    
    console.log(`Successfully deleted product: ${deletedProduct.name} (ID: ${deletedProduct._id})`);
    
    // Cascade cleanup - remove related records
    try {
      console.log(`[DELETE] Starting cascade cleanup for product: ${deletedProduct._id}`);
      
      // Cleanup product attributes
      const deletedAttributes = await ProductAttribute.deleteMany({ productId: req.params.id });
      console.log(`[DELETE] Deleted ${deletedAttributes.deletedCount} product attributes`);
      
      // Cleanup vendor products
      const deletedVendorProducts = await VendorProduct.deleteMany({ productId: req.params.id });
      console.log(`[DELETE] Deleted ${deletedVendorProducts.deletedCount} vendor products`);
      
      // Cleanup reviews
      const deletedReviews = await Review.deleteMany({ productId: req.params.id });
      console.log(`[DELETE] Deleted ${deletedReviews.deletedCount} reviews`);
      
      // Remove from wishlists
      const updatedWishlists = await Wishlist.updateMany(
        { products: req.params.id },
        { $pull: { products: req.params.id } }
      );
      console.log(`[DELETE] Updated ${updatedWishlists.modifiedCount} wishlists`);
      
      console.log(`[DELETE] Cascade cleanup completed successfully`);
    } catch (cleanupError) {
      console.error('[DELETE] Error during cascade cleanup:', cleanupError);
      // Don't fail the delete operation if cleanup fails
    }
    
    // Log the product deletion activity
    await ActivityLog.logUserAction(
      req.user.id,
      'product_deleted',
      { type: 'Product', id: req.params.id },
      { 
        productName: deletedProduct.name,
        productId: deletedProduct._id,
        deletedAt: new Date()
      }
    );
    
    // Invalidate cache
    invalidateProductCache();
    
    res.json({ 
      success: true,
      data: { 
        message: 'Product deleted successfully',
        deletedProduct: {
          id: deletedProduct._id,
          name: deletedProduct.name
        }
      }
    });
  } catch (err) {
    console.error('[DELETE] Error deleting product:', err);
    res.status(500).json({ 
      success: false,
      error: { message: 'Server error', code: 'SERVER_ERROR' } 
    });
  }
});

// Clear product cache (admin only)
router.post('/clear-cache', auth, role('admin'), async (req, res) => {
  try {
    invalidateProductCache();
    res.json({
      success: true,
      message: 'Product cache cleared successfully'
    });
  } catch (err) {
    console.error('Cache clear error:', err);
    res.status(500).json({ 
      success: false,
      error: { message: 'Failed to clear cache', code: 'CACHE_CLEAR_ERROR' } 
    });
  }
});

module.exports = router; 