"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/merge', auth_1.auth, async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
            res.status(400).json({
                success: false,
                error: { message: 'Invalid cart items', code: 'INVALID_CART_DATA' }
            });
            return;
        }
        res.json({
            success: true,
            message: 'Cart merged successfully',
            items: items.length
        });
    }
    catch (error) {
        console.error('Error merging cart:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to merge cart', code: 'MERGE_ERROR' }
        });
    }
});
router.get('/', auth_1.auth, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                items: [],
                total: 0,
                count: 0
            }
        });
    }
    catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch cart', code: 'FETCH_ERROR' }
        });
    }
});
router.post('/add', auth_1.auth, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        if (!productId) {
            res.status(400).json({
                success: false,
                error: { message: 'Product ID is required', code: 'MISSING_PRODUCT_ID' }
            });
            return;
        }
        res.json({
            success: true,
            message: 'Item added to cart successfully',
            productId,
            quantity
        });
    }
    catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to add item to cart', code: 'ADD_ERROR' }
        });
    }
});
router.delete('/remove/:productId', auth_1.auth, async (req, res) => {
    try {
        const { productId } = req.params;
        res.json({
            success: true,
            message: 'Item removed from cart successfully',
            productId
        });
    }
    catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to remove item from cart', code: 'REMOVE_ERROR' }
        });
    }
});
router.put('/update/:productId', auth_1.auth, async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        if (!quantity || quantity < 0) {
            res.status(400).json({
                success: false,
                error: { message: 'Valid quantity is required', code: 'INVALID_QUANTITY' }
            });
            return;
        }
        res.json({
            success: true,
            message: 'Cart item updated successfully',
            productId,
            quantity
        });
    }
    catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update cart item', code: 'UPDATE_ERROR' }
        });
    }
});
router.delete('/clear', auth_1.auth, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Cart cleared successfully'
        });
    }
    catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to clear cart', code: 'CLEAR_ERROR' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=cart.js.map