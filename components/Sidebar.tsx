import React from 'react';
import { useRouter } from 'next/router';
import { Upload, Map, List, MessageSquare, Headphones, User, HelpCircle, FileText, X } from 'lucide-react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSidebar } from '@/contexts/SidebarContext';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { name: 'Upload Songs', icon: Upload, href: '/upload', gradient: 'from-blue-500 to-purple-500' },
  { name: 'Progress Map', icon: Map, href: '/progress', gradient: 'from-emerald-500 to-teal-500' },
  { name: 'Playlists', icon: List, href: '/playlists', gradient: 'from-violet-500 to-fuchsia-500' },
  { name: 'Forum', icon: MessageSquare, href: '/forum', gradient: 'from-indigo-500 to-purple-500' },
  { name: 'Listen', icon: Headphones, href: '/listen', gradient: 'from-pink-500 to-rose-500' },
  { name: 'Bible Study', icon: FileText, href: '/pdfs', gradient: 'from-orange-500 to-amber-500' },
  { name: 'Profile', icon: User, href: '/profile', gradient: 'from-blue-500 to-indigo-500' },
  { name: 'How To', icon: HelpCircle, href: '/how-to', gradient: 'from-emerald-500 to-cyan-500' },
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
      {/* Enhanced Background Overlay for Mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[54] lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Enhanced Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: isMobileOpen ? 256 : (isOpen ? 256 : 64),
          x: isMobileOpen ? 0 : (!isOpen && !isMobileOpen ? -256 : 0)
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed top-0 left-0 h-full z-[55] lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Enhanced Background with Glassmorphism */}
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-r border-white/20 dark:border-slate-700/50 shadow-2xl">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.08] via-purple-500/[0.06] to-pink-500/[0.08] dark:from-indigo-500/[0.15] dark:via-purple-500/[0.12] dark:to-pink-500/[0.15]"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute top-0 -left-4 w-32 h-32 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob"></div>
          <div className="absolute bottom-20 -right-4 w-24 h-24 bg-purple-400/10 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob animation-delay-2000"></div>
        </div>

        {/* Content Container */}
        <div className={`relative z-10 p-4 h-full overflow-y-auto ${isMobileOpen ? 'block' : 'hidden lg:block'}`}>
          {/* Enhanced Close/Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => isMobileOpen ? setIsMobileOpen(false) : setIsOpen(!isOpen)}
            className="absolute top-4 right-4 p-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 hover:shadow-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            {isMobileOpen ? (
              <X className="h-5 w-5" />
            ) : isOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </motion.button>

          {/* Spacer for button */}
          <div className="h-14"></div>
          
          {/* Enhanced BibleChorus Brand */}
          <Link href="/" className="block mb-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-xl transition-all duration-300 cursor-pointer group
                ${isOpen ? 'lg:px-4' : 'lg:px-3 lg:justify-center'}
                ${isMobileOpen ? 'px-4' : ''}`}
            >
              <div className="relative">
                <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl backdrop-blur-sm border border-indigo-500/20 dark:border-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Image
                    src="/biblechorus-icon.png"
                    alt="BibleChorus"
                    width={20}
                    height={20}
                    className="flex-shrink-0"
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              </div>
              <span className={`ml-4 font-bold text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent transition-opacity duration-300
                ${isOpen ? 'opacity-100 lg:inline' : 'opacity-0 lg:hidden'}
                ${isMobileOpen ? 'inline' : 'hidden'}`}>
                BibleChorus
              </span>
            </motion.div>
          </Link>
          
          {/* Enhanced Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200/60 dark:via-slate-700/60 to-transparent mb-6"></div>
          
          {/* Enhanced Menu Items */}
          <nav className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = router.pathname === item.href;
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleItemClick(item.href)}
                    className={`group flex items-center p-3 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden
                      ${isOpen ? 'lg:px-4' : 'lg:px-3 lg:justify-center'}
                      ${isMobileOpen ? 'px-4' : ''}
                      ${isActive 
                        ? 'bg-gradient-to-r from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 shadow-xl border border-white/30 dark:border-slate-700/30' 
                        : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white/70 dark:hover:bg-slate-800/70 border border-white/20 dark:border-slate-700/20 hover:border-white/40 dark:hover:border-slate-700/40'
                      }`}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${item.gradient} rounded-r-full`}></div>
                    )}
                    
                    {/* Hover effect overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}></div>
                    
                    <div className="relative z-10 flex items-center w-full">
                      <div className={`relative p-2 rounded-xl backdrop-blur-sm transition-all duration-300 group-hover:scale-110
                        ${isActive 
                          ? `bg-gradient-to-br ${item.gradient}` 
                          : 'bg-white/60 dark:bg-slate-700/60 group-hover:bg-white/80 dark:group-hover:bg-slate-700/80'
                        }`}>
                        <item.icon className={`h-5 w-5 transition-colors duration-300
                          ${isActive 
                            ? 'text-white' 
                            : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                          }`} />
                        {isActive && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/40 rounded-full"></div>
                        )}
                      </div>
                      
                      <span className={`ml-4 font-medium transition-all duration-300
                        ${isOpen ? 'opacity-100 lg:inline' : 'opacity-0 lg:hidden'}
                        ${isMobileOpen ? 'inline' : 'hidden'}
                        ${isActive 
                          ? 'text-slate-900 dark:text-white font-semibold' 
                          : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                        }`}>
                        {item.name}
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </nav>

          {/* Enhanced Footer Element */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="absolute bottom-4 left-4 right-4"
          >
            <div className={`p-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl transition-all duration-300
              ${isOpen ? 'lg:block' : 'lg:hidden'}
              ${isMobileOpen ? 'block' : 'hidden'}`}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Community Platform
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
