import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: string;
  roleName: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
}

type AuthContextType = {
  user: User | null;
  tokens: TokenPair | null;
  login: (tokens: TokenPair, userData: User) => void;
  logout: () => void;
  refreshTokens: () => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cross-browser compatible localStorage functions
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error('localStorage getItem error:', error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('localStorage setItem error:', error);
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('localStorage removeItem error:', error);
      return false;
    }
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<TokenPair | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if token is expired
  const isTokenExpired = (expiry: number): boolean => {
    return Date.now() >= expiry * 1000;
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedTokens = safeLocalStorage.getItem('tokens');
        const storedUser = safeLocalStorage.getItem('user');
        
        if (storedTokens && storedUser) {
          try {
            const tokenPair: TokenPair = JSON.parse(storedTokens);
            const userData: User = JSON.parse(storedUser);
            
            // Check if access token is expired
            if (isTokenExpired(tokenPair.accessTokenExpiry)) {
              // Check if refresh token is also expired
              if (isTokenExpired(tokenPair.refreshTokenExpiry)) {
                // Both tokens expired, clear storage
                safeLocalStorage.removeItem('tokens');
                safeLocalStorage.removeItem('user');
                setTokens(null);
                setUser(null);
              } else {
                // Access token expired but refresh token is valid
                setTokens(tokenPair);
                setUser(userData);
                // Try to refresh tokens
                refreshTokens();
              }
            } else {
              // Tokens are still valid
              setTokens(tokenPair);
              setUser(userData);
            }
          } catch (e) {
            console.error('Error parsing stored auth data:', e);
            safeLocalStorage.removeItem('tokens');
            safeLocalStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        safeLocalStorage.removeItem('tokens');
        safeLocalStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (tokenPair: TokenPair, userData: User) => {
    try {
      const tokensStored = safeLocalStorage.setItem('tokens', JSON.stringify(tokenPair));
      const userStored = safeLocalStorage.setItem('user', JSON.stringify(userData));
      
      if (!tokensStored || !userStored) {
        console.warn('Failed to store auth data in localStorage, but continuing with session');
      }
      
      setTokens(tokenPair);
      setUser(userData);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = () => {
    try {
      safeLocalStorage.removeItem('tokens');
      safeLocalStorage.removeItem('user');
      setTokens(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refreshTokens = async (): Promise<boolean> => {
    try {
      if (!tokens?.refreshToken) {
        return false;
      }

      const response = await api.post('/auth/refresh', {
        refreshToken: tokens.refreshToken
      });

      if (response.data.success) {
        const newTokens = response.data.data.tokens;
        const tokensStored = safeLocalStorage.setItem('tokens', JSON.stringify(newTokens));
        
        if (!tokensStored) {
          console.warn('Failed to store new tokens in localStorage');
        }
        
        setTokens(newTokens);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      // If refresh fails, logout the user
      logout();
      return false;
    }
  };

  const isAuthenticated = !!user && !!tokens && !isTokenExpired(tokens.accessTokenExpiry);

  return (
    <AuthContext.Provider value={{ 
      user, 
      tokens, 
      login, 
      logout, 
      refreshTokens, 
      isAuthenticated, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
