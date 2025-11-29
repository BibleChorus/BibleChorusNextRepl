import React from 'react';
import { useRouter } from 'next/router';
import { Upload, Map, List, MessageSquare, Headphones, User, HelpCircle, FileText, X, TrendingUp } from 'lucide-react';
import { PanelLeftClose } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSidebar } from '@/contexts/SidebarContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

const menuItems = [
  { name: 'Upload Songs', icon: Upload, href: '/upload' },
  { name: 'Progress Map', icon: TrendingUp, href: '/progress' },
  { name: 'Journeys', icon: Map, href: '/journeys' },
  { name: 'Playlists', icon: List, href: '/playlists' },
  { name: 'Forum', icon: MessageSquare, href: '/forum' },
  { name: 'Listen', icon: Headphones, href: '/listen' },
  { name: 'Bible Study', icon: FileText, href: '/pdfs' },
  { name: 'Profile', icon: User, href: '/profile' },
  { name: 'How To', icon: HelpCircle, href: '/how-to' },
];

const Sidebar: React.FC = () => {
  const { isOpen, setIsOpen, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    separator: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(191, 161, 48, 0.2)',
  };

  const handleItemClick = (href: string) => {
    router.push(href);
    setIsMobileOpen(false);
  };

  const isVisible = isMobileOpen || isOpen;

  return (
    <>
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

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 left-0 h-full w-64 z-[55]"
            style={{ backgroundColor: theme.bg }}
          >
            <div 
              className="absolute inset-0 border-r"
              style={{ 
                backgroundColor: theme.bg,
                borderColor: theme.border
              }}
            />
            
            <div className="relative p-4 h-full overflow-y-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsMobileOpen(false);
                  setIsOpen(false);
                }}
                className="absolute top-4 right-4 p-2 rounded-lg transition-all duration-300"
                style={{ 
                  color: theme.textSecondary,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.borderHover;
                  e.currentTarget.style.color = theme.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.color = theme.textSecondary;
                }}
              >
                {isMobileOpen ? <X className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </motion.button>

              <div className="h-12"></div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Link 
                  href="/" 
                  className="flex items-center py-3 px-4 mb-6 rounded-lg cursor-pointer transition-all duration-300 h-12"
                  style={{ 
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.borderHover;
                    e.currentTarget.style.backgroundColor = theme.hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <Image
                      src="/biblechorus-icon.png"
                      alt="BibleChorus"
                      width={24}
                      height={24}
                      className="flex-shrink-0"
                    />
                  </div>
                  <span 
                    className="ml-4 text-lg tracking-wide"
                    style={{ 
                      fontFamily: "'Italiana', serif",
                      color: theme.accent
                    }}
                  >
                    BibleChorus
                  </span>
                </Link>
              </motion.div>
              
              <div 
                className="h-px mb-6"
                style={{ 
                  background: `linear-gradient(to right, transparent, ${theme.separator}, transparent)`
                }}
              />
              
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
                    className="group flex items-center py-3 px-4 rounded-lg cursor-pointer transition-all duration-300 h-12 relative"
                    style={{ 
                      color: theme.text,
                      border: `1px solid ${theme.border}`,
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.borderHover;
                      e.currentTarget.style.backgroundColor = theme.hoverBg;
                      const accent = e.currentTarget.querySelector('.accent-line') as HTMLElement;
                      if (accent) accent.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.border;
                      e.currentTarget.style.backgroundColor = 'transparent';
                      const accent = e.currentTarget.querySelector('.accent-line') as HTMLElement;
                      if (accent) accent.style.opacity = '0';
                    }}
                  >
                    <div 
                      className="accent-line absolute left-0 top-0 w-[2px] h-full rounded-l-lg transition-opacity duration-300"
                      style={{ 
                        backgroundColor: theme.accent,
                        opacity: 0
                      }}
                    />
                    
                    <div className="w-6 h-6 flex items-center justify-center relative z-10">
                      <item.icon 
                        className="h-5 w-5 flex-shrink-0 transition-colors duration-300" 
                        style={{ color: theme.accent }}
                      />
                    </div>
                    <span 
                      className="ml-4 font-medium relative z-10"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
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
