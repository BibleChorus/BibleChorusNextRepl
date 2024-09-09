import React from 'react';
import { useRouter } from 'next/router';
import { FaUpload, FaSearch, FaMap, FaList, FaVoteYea, FaBars, FaTimes, FaChevronLeft, FaChevronRight, FaHeadphones, FaUser, FaQuestionCircle } from 'react-icons/fa';
import Image from 'next/image'; // Add this import
import Link from 'next/link'; // Add this import

const menuItems = [
  { name: 'Upload Songs', icon: FaUpload, href: '/upload' },
  { name: 'Advanced Search', icon: FaSearch, href: '/search' },
  { name: 'Progress Map', icon: FaMap, href: '/progress' },
  { name: 'Playlists', icon: FaList, href: '/playlists' },
  { name: 'Vote on Songs', icon: FaVoteYea, href: '/vote' },
  { name: 'Listen', icon: FaHeadphones, href: '/listen' },
  { name: 'Profile', icon: FaUser, href: '/profile' },
  { name: 'How To', icon: FaQuestionCircle, href: '/how-to' },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isMobileOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isMobileOpen, setIsMobileOpen }) => {
  const router = useRouter();

  const handleItemClick = (href: string) => {
    router.push(href);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-purple-600 text-white rounded-md lg:hidden"
      >
        {isMobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Desktop toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-purple-600 text-white rounded-md hidden lg:block"
      >
        {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
      </button>

      <div
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out z-40 
          ${isMobileOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'} 
          ${isOpen ? 'lg:w-64' : 'lg:w-16'}
          ${!isMobileOpen && !isOpen ? 'lg:w-0 lg:-translate-x-full' : ''}`}
      >
        <div className={`p-4 h-full overflow-y-auto ${isMobileOpen ? 'block' : 'hidden lg:block'}`}>
          {/* Reduced spacer for toggle button */}
          <div className="h-12"></div>
          
          {/* BibleChorus icon and text */}
          <Link href="/" className={`flex items-center py-2 px-2 mb-4 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-md cursor-pointer
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
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4"></div>
          
          {menuItems.map((item) => (
            <div
              key={item.name}
              onClick={() => handleItemClick(item.href)}
              className={`flex items-center py-2 px-2 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-md cursor-pointer
                ${isOpen ? 'lg:px-4' : 'lg:px-2 lg:justify-center'}
                h-10 overflow-hidden whitespace-nowrap`}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <item.icon className="text-xl text-purple-600 dark:text-purple-400 flex-shrink-0" />
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