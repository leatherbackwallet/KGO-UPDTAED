import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cart');
      if (stored) {
        setCart(JSON.parse(stored));
      }
      setIsLoaded(true);
    } else {
      setIsLoaded(true);
    }
    setIsHydrated(true);
  }, []);

  const saveCart = (cart: CartItem[]) => {
    setCart(cart);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  };

  const addToCart = (item: CartItem) => {
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
      saveCart(cart.map(i => getItemKey(i) === itemKey ? { ...i, quantity: i.quantity + item.quantity } : i));
    } else {
      saveCart([...cart, item]);
    }
  };

  const removeFromCart = (product: string) => {
    saveCart(cart.filter(i => i.product !== product));
  };

  const updateQuantity = (product: string, quantity: number) => {
    saveCart(cart.map(i => i.product === product ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    saveCart([]);
  };

  const refreshCart = () => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      setCart(JSON.parse(stored));
    } else {
      setCart([]);
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}; 