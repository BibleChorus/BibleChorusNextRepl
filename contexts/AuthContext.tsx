import React, { createContext, useState, useEffect, useContext } from 'react';
import { useSession, signOut } from "next-auth/react";
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      const sessionUser: User = {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email ?? '',
        profile_image_url: session.user.profile_image_url ?? undefined,
        is_admin: session.user.is_admin,
        is_moderator: session.user.is_moderator,
        email_verified: true,
      };
      
      setUser(sessionUser);
      if (session.access_token) {
        setToken(session.access_token);
        localStorage.setItem('token', session.access_token);
      }
    }
  }, [session]);

  const login = (userData: User, authToken: string) => {
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

  const logout = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    await signOut();
  };

  const getAuthToken = async (): Promise<string | null> => {
    const currentToken = token || localStorage.getItem('token');
    console.log("getAuthToken called, returning:", currentToken); // Debug log
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
