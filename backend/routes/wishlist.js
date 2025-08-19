/**
 * Wishlist Routes - User wishlist management
 * Handles adding, removing, and retrieving wishlist items
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Wishlist } = require('../models/wishlists.model');
const { Product } = require('../models/products.model');
const auth = require('../middleware/auth');

// Get user's wishlist with product details
router.get('/', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id })
      .populate({
        path: 'products',
        select: 'name price images slug stock category description',
        model: 'Product'
      });

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        data: { products: [], productCount: 0 }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        products: wishlist.products,
        productCount: wishlist.products.length
      }
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch wishlist', code: 'WISHLIST_FETCH_ERROR' }
    });
  }
});

// Add product to wishlist
router.post('/add/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found', code: 'PRODUCT_NOT_FOUND' }
      });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    
    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.user.id,
        products: [productId]
      });
    } else {
      // Check if product is already in wishlist
      if (wishlist.products.includes(productId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Product already in wishlist', code: 'PRODUCT_ALREADY_IN_WISHLIST' }
        });
      }
      wishlist.products.push(productId);
    }

    await wishlist.save();

    // Populate product details for response
    await wishlist.populate({
      path: 'products',
      select: 'name price images slug stock category description',
      model: 'Product'
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Product added to wishlist',
        wishlist: wishlist.products,
        productCount: wishlist.products.length
      }
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to add product to wishlist', code: 'WISHLIST_ADD_ERROR' }
    });
  }
});

// Remove product from wishlist
router.delete('/remove/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        error: { message: 'Wishlist not found', code: 'WISHLIST_NOT_FOUND' }
      });
    }

    // Remove product from wishlist
    wishlist.products = wishlist.products.filter(
      product => product.toString() !== productId
    );

    await wishlist.save();

    // Populate remaining products
    await wishlist.populate({
      path: 'products',
      select: 'name price images slug stock category description',
      model: 'Product'
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Product removed from wishlist',
        wishlist: wishlist.products,
        productCount: wishlist.products.length
      }
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to remove product from wishlist', code: 'WISHLIST_REMOVE_ERROR' }
    });
  }
});

// Clear entire wishlist
router.delete('/clear', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        error: { message: 'Wishlist not found', code: 'WISHLIST_NOT_FOUND' }
      });
    }

    wishlist.products = [];
    await wishlist.save();

    res.status(200).json({
      success: true,
      data: {
        message: 'Wishlist cleared',
        wishlist: [],
        productCount: 0
      }
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to clear wishlist', code: 'WISHLIST_CLEAR_ERROR' }
    });
  }
});

// Check if product is in wishlist
router.get('/check/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        data: { isInWishlist: false }
      });
    }

    const isInWishlist = wishlist.products.some(
      product => product.toString() === productId
    );

    res.status(200).json({
      success: true,
      data: { isInWishlist }
    });
  } catch (error) {
    console.error('Error checking wishlist status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to check wishlist status', code: 'WISHLIST_CHECK_ERROR' }
    });
  }
});

// Merge guest wishlist data with user account
router.post('/merge', auth, async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid wishlist items', code: 'INVALID_WISHLIST_DATA' }
      });
    }

    // Find or create user's wishlist
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    
    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.user.id,
        products: []
      });
    }

    // Add guest wishlist items to user's wishlist
    const guestProductIds = items.map(item => item.product);
    const existingProductIds = wishlist.products.map(id => id.toString());
    
    // Only add items that don't already exist
    const newProductIds = guestProductIds.filter(id => !existingProductIds.includes(id));
    
    if (newProductIds.length > 0) {
      wishlist.products.push(...newProductIds.map(id => new mongoose.Types.ObjectId(id)));
      await wishlist.save();
    }

    console.log(`Merged ${newProductIds.length} wishlist items for user ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      data: {
        message: `Successfully merged ${newProductIds.length} wishlist items`,
        mergedItems: newProductIds.length,
        totalItems: wishlist.products.length
      }
    });
  } catch (error) {
    console.error('Error merging wishlist:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to merge wishlist data', code: 'WISHLIST_MERGE_ERROR' }
    });
  }
});

module.exports = router; 