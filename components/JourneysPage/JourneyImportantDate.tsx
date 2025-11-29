'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { ImportantDate } from '@/types/journey';
import { format } from 'date-fns';
import { Star, Calendar, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Image from 'next/image';

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return CDN_URL ? `${CDN_URL}${path}` : (path.startsWith('/') ? path : `/${path}`);
};

interface JourneyImportantDateProps {
  importantDate: ImportantDate;
  theme: {
    bg: string;
    bgAlt: string;
    bgCard: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    border: string;
    borderHover: string;
  };
}

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];
const springTransition = { type: "spring" as const, stiffness: 400, damping: 30 };

export const JourneyImportantDate: React.FC<JourneyImportantDateProps> = ({
  importantDate,
  theme,
}) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';
  
  const hasDescription = importantDate.description && importantDate.description.trim().length > 0;
  const hasPhoto = importantDate.photo_url && importantDate.photo_url.trim().length > 0;
  const photoUrl = hasPhoto ? getImageUrl(importantDate.photo_url) : null;
  
  const showDetails = isHovered || isTouched;
  const showPhoto = hasPhoto && (isHovered || isTouched);

  const formatEventDate = () => {
    const dateStr = importantDate.event_date;
    const datePart = dateStr.split('T')[0].split(' ')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return format(new Date(year, month - 1, day), 'MMMM do, yyyy');
  };

  const handleTouchStart = () => {
    setIsTouched(true);
  };

  const handleTouchEnd = () => {
    setTimeout(() => setIsTouched(false), 3000);
  };

  const handleClick = () => {
    if (hasPhoto) {
      setShowPhotoDialog(true);
    }
  };

  if (!mounted) {
    return <div className="py-6 px-3" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: easeOutExpo }}
      className={`important-date-row group relative overflow-hidden ${hasPhoto ? 'cursor-pointer' : ''}`}
      style={{ 
        borderBottom: `1px solid ${theme.border}`,
        fontFamily: "'Manrope', sans-serif"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0, x: '-100%' }}
        animate={{ 
          opacity: isHovered ? 1 : 0.3,
          x: isHovered ? '0%' : '-100%'
        }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        style={{ 
          background: `linear-gradient(90deg, ${theme.accent}0a 0%, ${theme.accent}05 50%, transparent 100%)`
        }}
      />
      
      <motion.div 
        className="absolute left-0 top-0 bottom-0 w-[3px] pointer-events-none"
        initial={{ scaleY: 1, opacity: 0.6 }}
        animate={{ 
          scaleY: 1,
          opacity: isHovered ? 1 : 0.6,
          backgroundColor: theme.accent
        }}
        transition={{ duration: 0.3, ease: easeOutExpo }}
        style={{ originY: 0.5 }}
      />

      <AnimatePresence>
        {showPhoto && photoUrl && (
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-24 md:w-32 pointer-events-none overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
          >
            <div className="absolute inset-0 z-10" style={{ 
              background: `linear-gradient(to right, ${theme.bg}, transparent 30%)` 
            }} />
            <motion.div
              className="absolute inset-0"
              initial={{ filter: 'grayscale(100%)' }}
              animate={{ filter: isHovered ? 'grayscale(0%)' : 'grayscale(100%)' }}
              transition={{ duration: 0.8, ease: easeOutExpo }}
            >
              <Image
                src={photoUrl}
                alt={importantDate.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 96px, 128px"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showDetails && !hasPhoto && (
        <motion.div
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-lg pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: easeOutExpo }}
          style={{ backgroundColor: theme.bgAlt, border: `1px solid ${theme.border}` }}
        >
          <Calendar className="w-5 h-5 md:w-6 md:h-6" style={{ color: theme.accent }} />
        </motion.div>
      )}

      <motion.div 
        className="flex items-center gap-4 md:gap-6 py-6 px-3 relative z-10"
        animate={{ 
          x: isHovered ? 8 : 0,
          transition: springTransition
        }}
      >
        <motion.div
          className="w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0"
          animate={{
            borderColor: isHovered ? theme.accent : `${theme.accent}80`,
            backgroundColor: isHovered ? `${theme.accent}1a` : `${theme.accent}0d`,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.3, ease: easeOutExpo }}
        >
          <motion.div
            animate={{ color: theme.accent }}
            transition={{ duration: 0.2 }}
          >
            <Star className="w-3.5 h-3.5" fill={isHovered ? theme.accent : 'transparent'} />
          </motion.div>
        </motion.div>

        <div className="flex-1 min-w-0 pr-2">
          <motion.h4 
            className={`font-serif italic font-light tracking-wide break-words ${
              importantDate.title.length > 30 ? 'text-base sm:text-lg md:text-xl' : 'text-lg md:text-xl'
            }`}
            style={{ fontFamily: "'Italiana', serif" }}
            animate={{ 
              color: isHovered ? theme.accent : theme.text 
            }}
            transition={{ duration: 0.3, ease: easeOutExpo }}
          >
            {importantDate.title}
          </motion.h4>
          
          <div className="flex items-center gap-3 mt-1">
            <motion.span 
              className="text-[10px] uppercase tracking-widest flex items-center gap-1.5"
              animate={{ 
                color: theme.accent 
              }}
              transition={{ duration: 0.3 }}
            >
              <Calendar className="w-3 h-3" />
              {formatEventDate()}
            </motion.span>
          </div>
        </div>

        {hasPhoto && (
          <motion.span
            className="text-[9px] uppercase tracking-widest flex-shrink-0"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: isHovered || isTouched ? 1 : 0,
              marginRight: showPhoto && photoUrl ? '100px' : '0px',
            }}
            transition={{ duration: 0.3 }}
            style={{ color: theme.textMuted }}
          >
            Click to view
          </motion.span>
        )}
      </motion.div>

      <AnimatePresence>
        {hasDescription && showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              duration: 0.5, 
              ease: easeOutExpo,
              opacity: { duration: 0.3 }
            }}
            className="overflow-hidden"
          >
            <motion.div 
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.4, ease: easeOutExpo }}
              className="pt-2 pb-6 pl-[52px] md:pl-[68px] pr-28 md:pr-36"
            >
              <div 
                className="relative pl-6"
                style={{ borderLeft: `1px solid ${theme.accent}33` }}
              >
                <p 
                  className="text-[13px] leading-relaxed tracking-wide"
                  style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 300, color: `${theme.textSecondary}b3` }}
                >
                  {importantDate.description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent 
          className="sm:max-w-2xl p-0 overflow-hidden border-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowPhotoDialog(false)}
            className="absolute right-3 top-3 z-20 p-2 rounded-full transition-all hover:scale-110"
            style={{ 
              backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
              color: theme.text
            }}
            aria-label="Close photo"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative">
            {photoUrl && (
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={photoUrl}
                  alt={importantDate.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                />
              </div>
            )}
            <div 
              className="absolute bottom-0 left-0 right-0 p-6"
              style={{ 
                background: `linear-gradient(to top, ${isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)'}, transparent)` 
              }}
            >
              <h3 
                className="text-xl md:text-2xl font-serif italic mb-2"
                style={{ fontFamily: "'Italiana', serif", color: theme.text }}
              >
                {importantDate.title}
              </h3>
              <span 
                className="text-[11px] uppercase tracking-widest flex items-center gap-1.5"
                style={{ color: theme.accent }}
              >
                <Calendar className="w-3 h-3" />
                {formatEventDate()}
              </span>
              {hasDescription && (
                <p 
                  className="mt-3 text-sm leading-relaxed"
                  style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
                >
                  {importantDate.description}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
