import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleId: string;
  roleName?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string, userData?: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cross-browser compatible JWT decode function
const safeJwtDecode = (token: string): any => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    
    // Handle different JWT formats
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    
    // Cross-browser compatible base64 decode
    let decodedPayload: string;
    try {
      // Try native atob first (modern browsers)
      decodedPayload = atob(payload);
    } catch (e) {
      // Fallback for older browsers or special characters
      try {
        // Handle URL-safe base64
        const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
        decodedPayload = atob(normalizedPayload);
      } catch (e2) {
        console.error('Failed to decode JWT payload:', e2);
        return null;
      }
    }
    
    // Parse the JSON payload
    try {
      return JSON.parse(decodedPayload);
    } catch (e) {
      console.error('Failed to parse JWT payload:', e);
      return null;
    }
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
};

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

// Helper function to validate token and extract user data
const extractUserFromToken = (token: string): User | null => {
  try {
    const decoded = safeJwtDecode(token);
    if (!decoded) {
      return null;
    }
    
    // Handle different token formats
    const userId = decoded.id || decoded.userId || decoded.sub || '';
    const firstName = decoded.firstName || decoded.given_name || '';
    const lastName = decoded.lastName || decoded.family_name || '';
    const email = decoded.email || '';
    const phone = decoded.phone || '';
    const roleId = decoded.roleId || decoded.role_id || '';
    const roleName = decoded.roleName || decoded.role_name || '';
    
    return {
      id: userId,
      firstName,
      lastName,
      email,
      phone,
      roleId,
      roleName
    };
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = safeLocalStorage.getItem('token');
        const storedUser = safeLocalStorage.getItem('user');
        
        if (storedToken && storedToken.trim() !== '') {
          let userData: User | null = null;
          
          // Try to load user data from localStorage first
          if (storedUser) {
            try {
              userData = JSON.parse(storedUser);
            } catch (e) {
              console.error('Error parsing stored user data:', e);
            }
          }
          
          // If no stored user data, try to extract from token
          if (!userData) {
            userData = extractUserFromToken(storedToken);
          }
          
          if (userData) {
            setToken(storedToken);
            setUser(userData);
          } else {
            // Invalid token, remove it
            safeLocalStorage.removeItem('token');
            safeLocalStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear invalid token
        safeLocalStorage.removeItem('token');
        safeLocalStorage.removeItem('user');
      }
    };

    // Initialize auth state
    initializeAuth();
    setIsLoaded(true);
  }, []);

  const login = (token: string, userData?: User) => {
    try {
      if (!token || typeof token !== 'string') {
        console.error('Invalid token provided to login');
        return;
      }

      let finalUserData = userData;
      
      // If no user data provided, try to extract from token
      if (!finalUserData) {
        const extractedUser = extractUserFromToken(token);
        if (!extractedUser) {
          console.error('Failed to extract user data from token');
          return;
        }
        finalUserData = extractedUser;
      }

      // Store in localStorage with error handling
      const tokenStored = safeLocalStorage.setItem('token', token);
      const userStored = safeLocalStorage.setItem('user', JSON.stringify(finalUserData));
      
      if (!tokenStored || !userStored) {
        console.warn('Failed to store auth data in localStorage, but continuing with session');
      }
      
      setToken(token);
      setUser(finalUserData);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = () => {
    try {
      safeLocalStorage.removeItem('token');
      safeLocalStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
