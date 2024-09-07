import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { ModeToggle } from './ModeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar 
        isOpen={isOpen} 
        setIsOpen={setIsOpen}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div className={`transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-16'} p-4`}>
        <div className="flex justify-end mb-4">
          <ModeToggle />
        </div>
        {children}
      </div>
    </div>
  );
};

export default Layout;