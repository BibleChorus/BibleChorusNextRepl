import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/router";

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isHomePage: boolean;
}
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isOpen, setOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar-user-preference");
      if (saved !== null) setOpen(saved === "true");
    } catch {
      /* Keep the default navigation when storage is unavailable. */
    }
  }, []);
  useEffect(() => {
    setIsMobileOpen(false);
  }, [router.asPath]);
  const setIsOpen = useCallback((value: boolean) => {
    setOpen(value);
    try {
      localStorage.setItem("sidebar-user-preference", String(value));
    } catch {
      /* Preference remains in memory. */
    }
  }, []);
  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        setIsOpen,
        isMobileOpen,
        setIsMobileOpen,
        isHomePage: router.pathname === "/",
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context)
    throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
}
