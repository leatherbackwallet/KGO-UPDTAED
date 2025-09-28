/**
 * Cart Service - Business logic for cart operations
 * Handles cart CRUD operations, validation, and guest cart merging
 */

import { Cart, ICart, ICartItem } from '../models/cart.model';
import { Product } from '../models/products.model';
import { Types } from 'mongoose';

export interface CartServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export class CartService {
  /**
   * Get user's cart
   */
  static async getUserCart(userId: string, isGuest: boolean = false, sessionId?: string): Promise<CartServiceResponse<ICart>> {
    try {
      const cart = await Cart.findOrCreateCart(userId, isGuest, sessionId);
      
      // Populate product details for each item
      const populatedItems = await Promise.all(
        cart.items.map(async (item) => {
          try {
            const product = await Product.findById(item.productId);
            if (product) {
              return {
                ...item,
                product: {
                  _id: product._id,
                  name: product.name,
                  price: product.price,
                  images: product.images,
                  stock: product.stock,
                  isActive: product.isActive
                }
              };
            }
            return item;
          } catch (error) {
            console.error(`Error populating product ${item.productId}:`, error);
            return item;
          }
        })
      );

      return {
        success: true,
        data: cart as any
      };
    } catch (error) {
      console.error('Error getting user cart:', error);
      return {
        success: false,
        error: {
          message: 'Failed to fetch cart',
          code: 'FETCH_ERROR'
        }
      };
    }
  }

  /**
   * Add item to cart
   */
  static async addItemToCart(
    userId: string, 
    item: ICartItem, 
    isGuest: boolean = false, 
    sessionId?: string
  ): Promise<CartServiceResponse<ICart>> {
    try {
      // Validate item data
      const validation = this.validateCartItem(item);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            message: `Invalid item data: ${validation.errors.join(', ')}`,
            code: 'INVALID_ITEM_DATA'
          }
        };
      }

      // Check if product exists and is active
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return {
          success: false,
          error: {
            message: 'Product not found or inactive',
            code: 'PRODUCT_NOT_FOUND'
          }
        };
      }

      // Check stock availability
      if (item.quantity > product.stock) {
        return {
          success: false,
          error: {
            message: `Only ${product.stock} items available`,
            code: 'INSUFFICIENT_STOCK'
          }
        };
      }

      // Get or create cart
      const cart = await Cart.findOrCreateCart(userId, isGuest, sessionId);
      
      // Check if item already exists in cart
      const existingItem = cart.items.find(cartItem => cartItem.productId === item.productId);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + item.quantity;
        if (newQuantity > product.stock) {
          return {
            success: false,
            error: {
              message: `Cannot add ${item.quantity} more items. Only ${product.stock - existingItem.quantity} available.`,
              code: 'INSUFFICIENT_STOCK'
            }
          };
        }
        existingItem.quantity = newQuantity;
      } else {
        cart.items.push(item);
      }

      await cart.save();

      return {
        success: true,
        data: cart
      };
    } catch (error) {
      console.error('Error adding item to cart:', error);
      return {
        success: false,
        error: {
          message: 'Failed to add item to cart',
          code: 'ADD_ERROR'
        }
      };
    }
  }

  /**
   * Remove item from cart
   */
  static async removeItemFromCart(
    userId: string, 
    productId: string, 
    isGuest: boolean = false, 
    sessionId?: string
  ): Promise<CartServiceResponse<ICart>> {
    try {
      const cart = await Cart.findOrCreateCart(userId, isGuest, sessionId);
      cart.items = cart.items.filter((cartItem: ICartItem) => cartItem.productId !== productId);
      await cart.save();

      return {
        success: true,
        data: cart
      };
    } catch (error) {
      console.error('Error removing item from cart:', error);
      return {
        success: false,
        error: {
          message: 'Failed to remove item from cart',
          code: 'REMOVE_ERROR'
        }
      };
    }
  }

  /**
   * Update item quantity in cart
   */
  static async updateItemQuantity(
    userId: string, 
    productId: string, 
    quantity: number, 
    isGuest: boolean = false, 
    sessionId?: string
  ): Promise<CartServiceResponse<ICart>> {
    try {
      if (quantity < 0) {
        return {
          success: false,
          error: {
            message: 'Quantity must be non-negative',
            code: 'INVALID_QUANTITY'
          }
        };
      }

      const cart = await Cart.findOrCreateCart(userId, isGuest, sessionId);
      
      // Check product stock if quantity > 0
      if (quantity > 0) {
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
          return {
            success: false,
            error: {
              message: 'Product not found or inactive',
              code: 'PRODUCT_NOT_FOUND'
            }
          };
        }

        if (quantity > product.stock) {
          return {
            success: false,
            error: {
              message: `Only ${product.stock} items available`,
              code: 'INSUFFICIENT_STOCK'
            }
          };
        }
      }

      const item = cart.items.find((cartItem: ICartItem) => cartItem.productId === productId);
      if (item) {
        if (quantity <= 0) {
          cart.items = cart.items.filter((cartItem: ICartItem) => cartItem.productId !== productId);
        } else {
          item.quantity = quantity;
        }
        await cart.save();
      }

      return {
        success: true,
        data: cart
      };
    } catch (error) {
      console.error('Error updating item quantity:', error);
      return {
        success: false,
        error: {
          message: 'Failed to update item quantity',
          code: 'UPDATE_ERROR'
        }
      };
    }
  }

  /**
   * Clear user's cart
   */
  static async clearCart(
    userId: string, 
    isGuest: boolean = false, 
    sessionId?: string
  ): Promise<CartServiceResponse<ICart>> {
    try {
      const cart = await Cart.findOrCreateCart(userId, isGuest, sessionId);
      cart.items = [];
      await cart.save();

      return {
        success: true,
        data: cart
      };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return {
        success: false,
        error: {
          message: 'Failed to clear cart',
          code: 'CLEAR_ERROR'
        }
      };
    }
  }

  /**
   * Merge guest cart with user cart
   */
  static async mergeGuestCart(
    userId: string, 
    guestCartItems: ICartItem[], 
    sessionId?: string
  ): Promise<CartServiceResponse<ICart>> {
    try {
      if (!guestCartItems || !Array.isArray(guestCartItems)) {
        return {
          success: false,
          error: {
            message: 'Invalid guest cart data',
            code: 'INVALID_GUEST_CART'
          }
        };
      }

      // Get user's cart
      const userCart = await Cart.findOrCreateCart(userId, false);
      
      // Get guest cart if sessionId provided
      let guestCart = null;
      if (sessionId) {
        guestCart = await Cart.findOne({ sessionId, isGuest: true });
      }

      // Merge items
      for (const item of guestCartItems) {
        const validation = this.validateCartItem(item);
        if (validation.isValid) {
          const existingItemIndex = userCart.items.findIndex(
            (cartItem: ICartItem) => cartItem.productId === item.productId
          );
          
          if (existingItemIndex >= 0) {
            userCart.items[existingItemIndex].quantity += item.quantity;
          } else {
            userCart.items.push(item);
          }
        }
      }

      // If guest cart exists, merge it and delete it
      if (guestCart) {
        guestCart.items.forEach((item: ICartItem) => {
          const existingItemIndex = userCart.items.findIndex(
            (cartItem: ICartItem) => cartItem.productId === item.productId
          );
          
          if (existingItemIndex >= 0) {
            userCart.items[existingItemIndex].quantity += item.quantity;
          } else {
            userCart.items.push(item);
          }
        });
        await userCart.save();
        await Cart.findByIdAndDelete(guestCart._id);
      }

      return {
        success: true,
        data: userCart
      };
    } catch (error) {
      console.error('Error merging guest cart:', error);
      return {
        success: false,
        error: {
          message: 'Failed to merge guest cart',
          code: 'MERGE_ERROR'
        }
      };
    }
  }

  /**
   * Validate cart item
   */
  private static validateCartItem(item: ICartItem): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!item.productId || typeof item.productId !== 'string') {
      errors.push('Product ID is required');
    }

    if (!item.name || typeof item.name !== 'string') {
      errors.push('Product name is required');
    }

    if (typeof item.price !== 'number' || item.price < 0) {
      errors.push('Price must be a non-negative number');
    }

    if (typeof item.quantity !== 'number' || item.quantity < 1) {
      errors.push('Quantity must be at least 1');
    }

    if (typeof item.stock !== 'number' || item.stock < 0) {
      errors.push('Stock must be a non-negative number');
    }

    if (item.quantity > item.stock) {
      errors.push('Quantity cannot exceed available stock');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get cart statistics
   */
  static async getCartStats(userId: string, isGuest: boolean = false, sessionId?: string): Promise<CartServiceResponse<{
    totalItems: number;
    totalPrice: number;
    itemCount: number;
  }>> {
    try {
      const cart = await Cart.findOrCreateCart(userId, isGuest, sessionId);
      
      return {
        success: true,
        data: {
          totalItems: cart.totalItems,
          totalPrice: cart.totalPrice,
          itemCount: cart.items.length
        }
      };
    } catch (error) {
      console.error('Error getting cart stats:', error);
      return {
        success: false,
        error: {
          message: 'Failed to get cart statistics',
          code: 'STATS_ERROR'
        }
      };
    }
  }
}
