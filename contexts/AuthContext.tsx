import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '../types'; // Import User from types.ts

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add this function to validate token expiration
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    console.log("Stored token on init:", storedToken); // Debug log
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Update login function to validate token before storing
  const login = (userData: User, authToken: string) => {
    if (!authToken || isTokenExpired(authToken)) {
      console.error('Invalid or expired token');
      return;
    }

    setUser(userData);
    setToken(authToken);
    try {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', authToken);
      console.log("Token set on login:", authToken); // Debug log
    } catch (error) {
      console.error("Error storing user data:", error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      console.log("Token removed on logout"); // Debug log
    } catch (error) {
      console.error("Error removing user data:", error);
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    const currentToken = token || localStorage.getItem('token');
    
    if (!currentToken) {
      return null;
    }

    // Check if token is expired
    if (isTokenExpired(currentToken)) {
      // Clear expired token
      logout();
      return null;
    }

    return currentToken;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, getAuthToken }}>
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
