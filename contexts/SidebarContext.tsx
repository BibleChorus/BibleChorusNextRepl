import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  isHomePage: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const previousPathRef = useRef<string | null>(null);
  
  const isHomePage = router.pathname === '/';
  
  useEffect(() => {
    const wasOnHomePage = previousPathRef.current === '/';
    const isNowOnHomePage = router.pathname === '/';
    
    if (isNowOnHomePage && !wasOnHomePage) {
      setIsOpen(false);
    } else if (!isNowOnHomePage && wasOnHomePage) {
      setIsOpen(true);
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