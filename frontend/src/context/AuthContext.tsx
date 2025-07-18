import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import jwtDecode from 'jwt-decode';
import axios from 'axios';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'Customer' | 'Admin';
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        const decoded: any = jwtDecode(storedToken);
        setUser({ id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
      }
    }
    setIsLoaded(true);
  }, []);

  const login = (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    setToken(token);
    const decoded: any = jwtDecode(token);
    setUser({ id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setToken(null);
    setUser(null);
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
