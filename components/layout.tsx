import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthButtons } from '@/components/AuthButtons';
import { UserDropdown } from '@/components/UserDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Menu } from "lucide-react"

const inter = Inter({ subsets: ['latin'] })

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function RootLayout({ children, className = '' }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsOpen(!isOpen);
    } else {
      setIsMobileOpen(!isMobileOpen);
    }
  };

  return (
    <div className={inter.className}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
      >
        <div className="min-h-screen bg-background text-foreground">
          <Sidebar 
            isOpen={isOpen} 
            setIsOpen={setIsOpen}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
          />
          <div className={`transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
            {/* Fixed top bar */}
            <div className="fixed top-0 right-0 left-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className={`flex justify-between items-center h-16 px-4 ${isOpen ? 'lg:mr-64' : 'lg:mr-16'}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="flex lg:hidden"
                >
                  <Menu className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="hidden lg:flex"
                >
                  {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
                <div className="flex items-center space-x-4">
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
            <div className="container mx-auto px-4 pt-20 pb-8">
              <main className={className}>
                {children}
              </main>
            </div>
          </div>
        </div>
      </ThemeProvider>
    </div>
  )
}