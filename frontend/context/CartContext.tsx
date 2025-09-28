import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { ComboItemConfiguration } from '../utils/comboUtils';

export interface CartItem {
  product: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  // Combo-specific fields
  isCombo?: boolean;
  comboBasePrice?: number;
  comboItemConfigurations?: ComboItemConfiguration[];
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (product: string) => void;
  updateQuantity: (product: string, quantity: number) => void;
  clearCart: () => void;
  refreshCart: () => void;
  isLoaded: boolean;
  error: string | null;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart validation functions
const validateCartItem = (item: CartItem): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!item.product || typeof item.product !== 'string') {
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
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cart');
        if (stored) {
          setCart(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('cart'); // Clear corrupted data
      }
    }
    
    // Add small delay to prevent flashing during hydration
    setTimeout(() => {
      setIsLoaded(true);
      setIsHydrated(true);
    }, 100);
  }, []);

  const saveCart = useCallback((newCart: CartItem[]) => {
    try {
      // Validate all cart items
      const validationErrors: string[] = [];
      newCart.forEach((item, index) => {
        const validation = validateCartItem(item);
        if (!validation.isValid) {
          validationErrors.push(`Item ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });
      
      if (validationErrors.length > 0) {
        setError(`Cart validation failed: ${validationErrors.join('; ')}`);
        console.error('Cart validation errors:', validationErrors);
        return;
      }
      
      setCart(newCart);
      setError(null);
      
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cart', JSON.stringify(newCart));
        } catch (storageError) {
          console.error('Failed to save cart to localStorage:', storageError);
          setError('Failed to save cart data');
        }
      }
    } catch (error) {
      console.error('Error saving cart:', error);
      setError('Failed to save cart');
    }
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    try {
      // Validate the item before adding
      const validation = validateCartItem(item);
      if (!validation.isValid) {
        setError(`Cannot add item to cart: ${validation.errors.join(', ')}`);
        console.error('Add to cart validation failed:', validation.errors);
        return;
      }

      // For combo items, create a unique identifier based on product ID and configuration
      const getItemKey = (cartItem: CartItem) => {
        if (cartItem.isCombo && cartItem.comboItemConfigurations) {
          const configString = JSON.stringify(cartItem.comboItemConfigurations.sort((a, b) => a.name.localeCompare(b.name)));
          return `${cartItem.product}_${btoa(configString)}`;
        }
        return cartItem.product;
      };

      const itemKey = getItemKey(item);
      const existing = cart.find(i => getItemKey(i) === itemKey);
      
      if (existing) {
        const newQuantity = existing.quantity + item.quantity;
        if (newQuantity > item.stock) {
          setError(`Cannot add ${item.quantity} more items. Only ${item.stock - existing.quantity} available.`);
          return;
        }
        saveCart(cart.map(i => getItemKey(i) === itemKey ? { ...i, quantity: newQuantity } : i));
      } else {
        saveCart([...cart, item]);
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      setError('Failed to add item to cart');
    }
  }, [cart, saveCart]);

  const removeFromCart = useCallback((product: string) => {
    try {
      if (!product || typeof product !== 'string') {
        setError('Invalid product ID for removal');
        return;
      }
      saveCart(cart.filter(i => i.product !== product));
    } catch (error) {
      console.error('Error removing item from cart:', error);
      setError('Failed to remove item from cart');
    }
  }, [cart, saveCart]);

  const updateQuantity = useCallback((product: string, quantity: number) => {
    try {
      if (!product || typeof product !== 'string') {
        setError('Invalid product ID for quantity update');
        return;
      }
      
      if (typeof quantity !== 'number' || quantity < 1) {
        setError('Quantity must be at least 1');
        return;
      }
      
      const item = cart.find(i => i.product === product);
      if (!item) {
        setError('Item not found in cart');
        return;
      }
      
      if (quantity > item.stock) {
        setError(`Cannot set quantity to ${quantity}. Only ${item.stock} available.`);
        return;
      }
      
      saveCart(cart.map(i => i.product === product ? { ...i, quantity } : i));
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Failed to update quantity');
    }
  }, [cart, saveCart]);

  const clearCart = useCallback(() => {
    try {
      saveCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart');
    }
  }, [saveCart]);

  const refreshCart = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cart');
        if (stored) {
          const parsedCart = JSON.parse(stored);
          if (Array.isArray(parsedCart)) {
            setCart(parsedCart);
            setError(null);
          } else {
            setError('Invalid cart data format');
            setCart([]);
          }
        } else {
          setCart([]);
          setError(null);
        }
      }
    } catch (error) {
      console.error('Error refreshing cart:', error);
      setError('Failed to refresh cart');
      setCart([]);
    }
  }, []);

  // Computed values
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      refreshCart,
      isLoaded,
      error,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}; 