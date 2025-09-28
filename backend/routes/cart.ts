/**
 * Cart Routes - Shopping cart management
 * Handles cart operations and guest data merging
 */

import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { CartService } from '../services/cartService';
import { optionalAuth } from '../middleware/optionalAuth';

const router = express.Router();

// Get user's cart (supports both authenticated and guest users)
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.sessionID || 'guest';
    const isGuest = !req.user;
    const sessionId = req.sessionID;

    const result = await CartService.getUserCart(userId, isGuest, sessionId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch cart', code: 'FETCH_ERROR' }
    });
  }
});

// Add item to cart (supports both authenticated and guest users)
router.post('/add', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, name, price, image, quantity, stock, isCombo, comboBasePrice, comboItemConfigurations } = req.body;
    
    if (!productId || !name || typeof price !== 'number' || !quantity) {
      res.status(400).json({
        success: false,
        error: { message: 'Missing required fields', code: 'MISSING_FIELDS' }
      });
      return;
    }

    const userId = req.user?.id || req.sessionID || 'guest';
    const isGuest = !req.user;
    const sessionId = req.sessionID;

    const cartItem = {
      productId,
      name,
      price,
      image: image || '/images/products/placeholder.svg',
      quantity: Math.max(1, quantity),
      stock: stock || 0,
      isCombo: isCombo || false,
      comboBasePrice: comboBasePrice || 0,
      comboItemConfigurations: comboItemConfigurations || []
    };

    const result = await CartService.addItemToCart(userId, cartItem, isGuest, sessionId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Item added to cart successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to add item to cart', code: 'ADD_ERROR' }
    });
  }
});

// Remove item from cart (supports both authenticated and guest users)
router.delete('/remove/:productId', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      res.status(400).json({
        success: false,
        error: { message: 'Product ID is required', code: 'MISSING_PRODUCT_ID' }
      });
      return;
    }

    const userId = req.user?.id || req.sessionID || 'guest';
    const isGuest = !req.user;
    const sessionId = req.sessionID;

    const result = await CartService.removeItemFromCart(userId, productId, isGuest, sessionId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Item removed from cart successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to remove item from cart', code: 'REMOVE_ERROR' }
    });
  }
});

// Update item quantity in cart (supports both authenticated and guest users)
router.put('/update/:productId', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (!productId) {
      res.status(400).json({
        success: false,
        error: { message: 'Product ID is required', code: 'MISSING_PRODUCT_ID' }
      });
      return;
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      res.status(400).json({
        success: false,
        error: { message: 'Valid quantity is required', code: 'INVALID_QUANTITY' }
      });
      return;
    }

    const userId = req.user?.id || req.sessionID || 'guest';
    const isGuest = !req.user;
    const sessionId = req.sessionID;

    const result = await CartService.updateItemQuantity(userId, productId, quantity, isGuest, sessionId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Cart item updated successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update cart item', code: 'UPDATE_ERROR' }
    });
  }
});

// Clear cart (supports both authenticated and guest users)
router.delete('/clear', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.sessionID || 'guest';
    const isGuest = !req.user;
    const sessionId = req.sessionID;

    const result = await CartService.clearCart(userId, isGuest, sessionId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Cart cleared successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to clear cart', code: 'CLEAR_ERROR' }
    });
  }
});

// Merge guest cart with user cart (authenticated users only)
router.post('/merge', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { items } = req.body;
    const userId = req.user?.id;
    const sessionId = req.sessionID;
    
    if (!items || !Array.isArray(items)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid cart items', code: 'INVALID_CART_DATA' }
      });
      return;
    }

    const result = await CartService.mergeGuestCart(userId, items, sessionId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Cart merged successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error merging cart:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to merge cart', code: 'MERGE_ERROR' }
    });
  }
});

// Get cart statistics (supports both authenticated and guest users)
router.get('/stats', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.sessionID || 'guest';
    const isGuest = !req.user;
    const sessionId = req.sessionID;

    const result = await CartService.getCartStats(userId, isGuest, sessionId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error getting cart stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get cart statistics', code: 'STATS_ERROR' }
    });
  }
});

export default router;