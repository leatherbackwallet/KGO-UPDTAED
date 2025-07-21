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

// Helper function to safely decode JWT token
const safeJwtDecode = (token: string): any => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    // Simple JWT decode - just split and get the payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
};

// Helper function to validate token and extract user data
const extractUserFromToken = (token: string): User | null => {
  try {
    const decoded = safeJwtDecode(token);
    if (!decoded) {
      return null;
    }
    
    return {
      id: decoded.id || '',
      firstName: decoded.firstName || '',
      lastName: decoded.lastName || '',
      email: decoded.email || '',
      phone: decoded.phone || '',
      roleId: decoded.roleId || '',
      roleName: decoded.roleName || ''
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
    if (typeof window !== 'undefined') {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
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

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(finalUserData));
      }
      setToken(token);
      setUser(finalUserData);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
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
