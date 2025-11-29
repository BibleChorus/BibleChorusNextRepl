import React, { useState, useEffect } from 'react';
import { Inter } from 'next/font/google'
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { SearchInput } from '@/components/SearchInput';
import { AuthButtons } from '@/components/AuthButtons';
import { UserDropdown } from '@/components/UserDropdown';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from 'next-themes';

const inter = Inter({ subsets: ['latin'] })

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function RootLayout({ children, className = '' }: LayoutProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
  };

  const { isOpen, setIsOpen, isMobileOpen, setIsMobileOpen } = useSidebar();

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsOpen(!isOpen);
    } else {
      setIsMobileOpen(!isMobileOpen);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const topBarHeight = isScrolled ? '3rem' : '4rem'

  return (
    <div
      className={inter.className}
      style={{ '--top-bar-height': topBarHeight } as React.CSSProperties}
    >
      <div 
        className="min-h-screen transition-colors duration-300"
        style={{ 
          backgroundColor: theme.bg,
          color: theme.text
        }}
      >
        <Sidebar />
        <div className={`transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
          <div 
            className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-all duration-300 ${isScrolled ? 'h-12' : 'h-16'}`}
            style={{ 
              backgroundColor: isDark ? 'rgba(5, 5, 5, 0.95)' : 'rgba(248, 245, 240, 0.95)',
              borderBottom: `1px solid ${theme.border}`
            }}
          >
            <div className={`flex items-center justify-between h-full transition-all duration-300 ${isScrolled ? 'px-2' : 'px-4'}`}>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size={isScrolled ? "sm" : "icon"}
                  onClick={toggleSidebar}
                  className={`transition-colors duration-300 hover:bg-transparent ${isOpen ? "lg:hidden" : ""}`}
                  style={{ 
                    color: theme.textSecondary,
                  }}
                >
                  <Menu 
                    className={`transition-all duration-300 ${isScrolled ? 'h-4 w-4' : 'h-6 w-6'}`}
                    style={{ color: 'inherit' }}
                  />
                </Button>
              </div>
              <div className="flex-1 flex items-center justify-center px-2">
                <SearchInput />
              </div>
              <div className={`flex items-center space-x-4 transition-all duration-300 ${isScrolled ? 'scale-90' : 'scale-100'}`}>
                {user ? (
                  <UserDropdown user={user} />
                ) : (
                  <AuthButtons />
                )}
                <ThemeToggle />
              </div>
            </div>
          </div>
          <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 pt-20 pb-8">
            <main className={`${className} max-w-full mx-auto`}>
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
