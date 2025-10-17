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

const inter = Inter({ subsets: ['latin'] })

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function RootLayout({ children, className = '' }: LayoutProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();

  // Use sidebar context
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
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className={`transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
          {/* Fixed top bar */}
          <div className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${isScrolled ? 'h-12' : 'h-16'}`}>
            <div className={`flex items-center justify-between h-full transition-all duration-300 ${isScrolled ? 'px-2' : 'px-4'}`}>
              {/* Left Section */}
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size={isScrolled ? "sm" : "icon"}
                  onClick={toggleSidebar}
                  className={isOpen ? "lg:hidden" : ""}
                >
                  <Menu className={`transition-all duration-300 ${isScrolled ? 'h-4 w-4' : 'h-6 w-6'}`} />
                </Button>
              </div>
              {/* Center Section */}
              <div className="flex-1 flex items-center justify-center px-2">
                <SearchInput />
              </div>
              {/* Right Section */}
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
          {/* Main content */}
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