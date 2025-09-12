import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface WishlistItem {
  product: string;
  name: string;
  price: number;
  image: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (product: string) => void;
  isInWishlist: (product: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wishlist');
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
      setIsLoaded(true);
    } else {
      setIsLoaded(true);
    }
    setIsHydrated(true);
  }, []);

  const saveWishlist = (wishlist: WishlistItem[]) => {
    setWishlist(wishlist);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  };

  const addToWishlist = (item: WishlistItem) => {
    const existing = wishlist.find(i => i.product === item.product);
    if (!existing) {
      const newWishlist = [...wishlist, item];
      saveWishlist(newWishlist);
    }
  };

  const removeFromWishlist = (product: string) => {
    saveWishlist(wishlist.filter(i => i.product !== product));
  };

  const isInWishlist = (product: string) => {
    return wishlist.some(i => i.product === product);
  };

  const clearWishlist = () => {
    saveWishlist([]);
  };

  return (
    <WishlistContext.Provider value={{ 
      wishlist, 
      addToWishlist, 
      removeFromWishlist, 
      isInWishlist, 
      clearWishlist 
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
}; 