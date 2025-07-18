import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface CartItem {
  product: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (product: string) => void;
  updateQuantity: (product: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      setCart(JSON.parse(stored));
    }
    setIsLoaded(true);
  }, []);

  const saveCart = (cart: CartItem[]) => {
    setCart(cart);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  };

  const addToCart = (item: CartItem) => {
    const existing = cart.find(i => i.product === item.product);
    if (existing) {
      saveCart(cart.map(i => i.product === item.product ? { ...i, quantity: i.quantity + item.quantity } : i));
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

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}; 