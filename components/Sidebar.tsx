import React from 'react';
import { useRouter } from 'next/router';
import { Upload, Map, List, MessageSquare, Headphones, User, HelpCircle, FileText, X } from 'lucide-react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSidebar } from '@/contexts/SidebarContext';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { name: 'Upload Songs', icon: Upload, href: '/upload' },
  { name: 'Progress Map', icon: Map, href: '/progress' },
  { name: 'Playlists', icon: List, href: '/playlists' },
  { name: 'Forum', icon: MessageSquare, href: '/forum' },
  { name: 'Listen', icon: Headphones, href: '/listen' },
  { name: 'Bible Study', icon: FileText, href: '/pdfs' },
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
      <AnimatePresence>
        {(isMobileOpen || isOpen) && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`fixed top-0 left-0 h-full transition-all duration-300 ease-in-out z-[55] 
              ${isMobileOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'} 
              ${isOpen ? 'lg:w-64' : 'lg:w-16'}
              ${!isMobileOpen && !isOpen ? 'lg:w-0 lg:-translate-x-full' : ''}`}
          >
            {/* Glass morphism background with gradient overlay */}
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-r border-white/12 dark:border-slate-700/40"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/[0.08] via-purple-400/[0.06] to-pink-400/[0.08] dark:from-indigo-400/[0.13] dark:via-purple-400/[0.1] dark:to-pink-400/[0.13]"></div>
            
            <div className={`relative p-4 h-full overflow-y-auto ${isMobileOpen ? 'block' : 'hidden lg:block'}`}>
              {/* Close button for mobile view */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-white/12 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 lg:hidden"
              >
                <X className="h-6 w-6" />
              </motion.button>

              {/* Toggle button for desktop view */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="absolute top-4 right-4 p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-white/12 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 hidden lg:block"
              >
                {isOpen ? <PanelLeftClose className="h-6 w-6" /> : <PanelLeftOpen className="h-6 w-6" />}
              </motion.button>

              {/* Reduced spacer for toggle button */}
              <div className="h-12"></div>
              
              {/* BibleChorus icon and text */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/" className={`flex items-center py-3 px-3 mb-6 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-2xl cursor-pointer transition-all duration-300
                  ${isOpen ? 'lg:px-4' : 'lg:px-3 lg:justify-center'}
                  h-12 overflow-hidden whitespace-nowrap bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/12 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-lg hover:shadow-indigo-400/12`}>
                  <div className="w-6 h-6 flex items-center justify-center">
                    <Image
                      src="/biblechorus-icon.png"
                      alt="BibleChorus"
                      width={24}
                      height={24}
                      className="flex-shrink-0"
                    />
                  </div>
                  <span className={`ml-4 font-semibold transition-all duration-300
                    ${isOpen ? 'opacity-100 lg:inline' : 'opacity-0 lg:hidden'}
                    ${isMobileOpen ? 'inline' : 'hidden'} bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400 bg-clip-text text-transparent`}>
                    BibleChorus
                  </span>
                </Link>
              </motion.div>
              
              {/* Enhanced separator line with gradient */}
              <div className="h-px bg-gradient-to-r from-transparent via-slate-200/60 dark:via-slate-600/60 to-transparent mb-6"></div>
              
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="mb-2"
                >
                  <div
                    onClick={() => handleItemClick(item.href)}
                    className={`group flex items-center py-3 px-3 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-2xl cursor-pointer transition-all duration-300
                      ${isOpen ? 'lg:px-4' : 'lg:px-3 lg:justify-center'}
                      h-12 overflow-hidden whitespace-nowrap bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/12 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-lg hover:shadow-indigo-400/12 hover:border-indigo-400/16 dark:hover:border-indigo-300/16 relative`}
                  >
                    {/* Gradient accent line on hover */}
                    <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-80 transition-opacity duration-300 rounded-l-2xl"></div>
                    
                    <div className="w-6 h-6 flex items-center justify-center relative z-10">
                      <item.icon className="h-5 w-5 text-indigo-500 dark:text-indigo-300 flex-shrink-0 group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors duration-300" />
                    </div>
                    <span className={`ml-4 transition-all duration-300 font-medium relative z-10
                      ${isOpen ? 'opacity-100 lg:inline' : 'opacity-0 lg:hidden'}
                      ${isMobileOpen ? 'inline' : 'hidden'}`}>
                      {item.name}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
