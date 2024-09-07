import React, { useState } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 overflow-x-hidden">
      <Sidebar 
        isOpen={isOpen} 
        setIsOpen={setIsOpen}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div className={`transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-16'} p-4`}>
        {children}
      </div>
    </div>
  );
};

export default Layout;