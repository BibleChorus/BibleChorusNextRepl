import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import React, { useState, ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import { ThemeToggle } from '@/components/theme-toggle';

const inter = Inter({ subsets: ['latin'] })

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function RootLayout({ children, className = '' }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
            <div className="container mx-auto px-4 py-8">
              <div className="flex justify-end items-center mb-4">
                <ThemeToggle />
              </div>
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