import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  isHomePage: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const SIDEBAR_STORAGE_KEY = 'sidebar-user-preference';

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [isOpen, setIsOpenInternal] = useState<boolean>(true);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const previousPathRef = useRef<string | null>(null);
  const userPreferenceRef = useRef<boolean>(true);
  const isInitializedRef = useRef<boolean>(false);
  
  const isHomePage = router.pathname === '/';

  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitializedRef.current) {
      const savedPreference = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (savedPreference !== null) {
        const preference = savedPreference === 'true';
        userPreferenceRef.current = preference;
        if (router.pathname !== '/') {
          setIsOpenInternal(preference);
        }
      }
      isInitializedRef.current = true;
    }
  }, [router.pathname]);

  const setIsOpen = useCallback((value: boolean) => {
    setIsOpenInternal(value);
    userPreferenceRef.current = value;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
    }
  }, []);
  
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    const wasOnHomePage = previousPathRef.current === '/';
    const isNowOnHomePage = router.pathname === '/';
    
    if (isNowOnHomePage && !wasOnHomePage) {
      setIsOpenInternal(false);
    } else if (!isNowOnHomePage && wasOnHomePage) {
      setIsOpenInternal(userPreferenceRef.current);
    }
    
    previousPathRef.current = router.pathname;
  }, [router.pathname]);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobileOpen, setIsMobileOpen, isHomePage }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};