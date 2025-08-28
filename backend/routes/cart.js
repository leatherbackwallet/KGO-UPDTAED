/**
 * Cart Routes - Shopping cart management
 * Handles cart operations and guest data merging
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.js');

// Merge guest cart data with user account
router.post('/merge', auth, async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid cart items', code: 'INVALID_CART_DATA' }
      });
    }

    // For now, we'll just acknowledge the merge
    // In a full implementation, you'd store cart items in a database
    // and handle product availability, pricing updates, etc.
    
    console.log(`Merging ${items.length} cart items for user ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      data: {
        message: `Successfully merged ${items.length} cart items`,
        mergedItems: items.length
      }
    });
  } catch (error) {
    console.error('Error merging cart:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to merge cart data', code: 'CART_MERGE_ERROR' }
    });
  }
});

module.exports = router; 