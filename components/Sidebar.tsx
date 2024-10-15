import React from 'react';
import { useRouter } from 'next/router';
import { Upload, Search, Map, List, MessageSquare, Headphones, User, HelpCircle, X } from 'lucide-react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Image from 'next/image'; // Add this import
import Link from 'next/link'; // Add this import
import { useSidebar } from '@/contexts/SidebarContext';

const menuItems = [
  { name: 'Upload Songs', icon: Upload, href: '/upload' },
  { name: 'Advanced Search', icon: Search, href: '/search' },
  { name: 'Progress Map', icon: Map, href: '/progress' },
  { name: 'Playlists', icon: List, href: '/playlists' },
  { name: 'Forum', icon: MessageSquare, href: '/forum' },
  { name: 'Listen', icon: Headphones, href: '/listen' },
  { name: 'Profile', icon: User, href: '/profile' },
  { name: 'How To', icon: HelpCircle, href: '/how-to' },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isMobileOpen: boolean) => void;
}

const Sidebar: React.FC = () => {
  const { isOpen, setIsOpen, isMobileOpen, setIsMobileOpen } = useSidebar();

  const router = useRouter();

  const handleItemClick = (href: string) => {
    router.push(href);
    setIsMobileOpen(false);
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full bg-background text-foreground shadow-lg transition-all duration-300 ease-in-out z-[55] 
          ${isMobileOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'} 
          ${isOpen ? 'lg:w-64' : 'lg:w-16'}
          ${!isMobileOpen && !isOpen ? 'lg:w-0 lg:-translate-x-full' : ''}`}
      >
        <div className={`p-4 h-full overflow-y-auto ${isMobileOpen ? 'block' : 'hidden lg:block'}`}>
          {/* Close button for mobile view */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="absolute top-4 right-4 p-2 text-muted-foreground lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Toggle button for desktop view */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute top-4 right-4 p-2 text-muted-foreground hidden lg:block"
          >
            {isOpen ? <PanelLeftClose className="h-6 w-6" /> : <PanelLeftOpen className="h-6 w-6" />}
          </button>

          {/* Reduced spacer for toggle button */}
          <div className="h-12"></div>
          
          {/* BibleChorus icon and text */}
          <Link href="/" className={`flex items-center py-2 px-2 mb-4 text-foreground hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer
            ${isOpen ? 'lg:px-4' : 'lg:px-2 lg:justify-center'}
            h-10 overflow-hidden whitespace-nowrap`}>
            <div className="w-6 h-6 flex items-center justify-center">
              <Image
                src="/biblechorus-icon.png"
                alt="BibleChorus"
                width={24}
                height={24}
                className="flex-shrink-0"
              />
            </div>
            <span className={`ml-4 font-semibold transition-opacity duration-300
              ${isOpen ? 'opacity-100 lg:inline' : 'opacity-0 lg:hidden'}
              ${isMobileOpen ? 'inline' : 'hidden'}`}>
              BibleChorus
            </span>
          </Link>
          
          {/* Separator line */}
          <div className="border-b border-border mb-4"></div>
          
          {menuItems.map((item) => (
            <div
              key={item.name}
              onClick={() => handleItemClick(item.href)}
              className={`flex items-center py-2 px-2 text-foreground hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer
                ${isOpen ? 'lg:px-4' : 'lg:px-2 lg:justify-center'}
                h-10 overflow-hidden whitespace-nowrap`}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary flex-shrink-0" />
              </div>
              <span className={`ml-4 transition-opacity duration-300
                ${isOpen ? 'opacity-100 lg:inline' : 'opacity-0 lg:hidden'}
                ${isMobileOpen ? 'inline' : 'hidden'}`}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
