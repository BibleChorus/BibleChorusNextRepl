'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';
import { JourneyWithSeasons } from '@/types/journey';
import Image from 'next/image';

interface JourneyHeroProps {
  journey: JourneyWithSeasons;
}

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const JourneyHero: React.FC<JourneyHeroProps> = ({ journey }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgAlt: isDark ? '#0a0a0a' : '#f0ede6',
    bgCard: isDark ? '#0f0f0f' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    textMuted: isDark ? '#6f6f6f' : '#6f6f6f',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderHover: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
  };

  const totalSongs = journey.seasons.reduce((acc, season) => acc + (season.songs?.length || 0), 0);
  const totalSeasons = journey.seasons.length;

  const backgroundImageUrl = journey.cover_image_url 
    ? journey.cover_image_url 
    : null;

  const titleWords = journey.title.split(' ');
  const firstWord = titleWords.length > 1 ? titleWords[0] : 'The';
  const restWords = titleWords.length > 1 ? titleWords.slice(1).join(' ') : journey.title;

  if (!mounted) {
    return (
      <div 
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundColor: '#050505' }}
      />
    );
  }

  return (
    <motion.div 
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: theme.bg }}
    >
      {backgroundImageUrl && (
        <div className="absolute inset-0">
          <Image
            src={backgroundImageUrl}
            alt={journey.title}
            fill
            className="object-cover grayscale opacity-30"
            priority
          />
        </div>
      )}
      
      <div 
        className="absolute inset-0" 
        style={{ background: `linear-gradient(to top, ${theme.bg}, transparent, transparent)` }} 
      />
      <div 
        className="absolute inset-0" 
        style={{ background: `linear-gradient(to bottom, ${theme.bg}80, transparent, transparent)` }} 
      />
      
      <motion.div 
        className="relative z-10 container mx-auto px-6 text-center pt-24"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.1 }}
        >
          <span 
            className="text-xs md:text-sm tracking-[0.5em] uppercase transition-colors duration-300"
            style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
          >
            A Sonic Archive
          </span>
        </motion.div>
        
        <motion.h1 
          className="mb-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: easeOutExpo, delay: 0.2 }}
        >
          <span 
            className="block text-6xl md:text-9xl tracking-tight transition-colors duration-300"
            style={{ fontFamily: "'Italiana', serif", color: theme.text }}
          >
            {firstWord}
          </span>
          <span 
            className="block text-6xl md:text-9xl tracking-tight italic transition-colors duration-300"
            style={{ fontFamily: "'Italiana', serif", color: theme.text }}
          >
            {restWords}
          </span>
        </motion.h1>
        
        {journey.subtitle && (
          <motion.p 
            className="text-sm md:text-base font-light max-w-xl mx-auto leading-relaxed mb-10 transition-colors duration-300"
            style={{ fontFamily: "'Manrope', sans-serif", color: `${theme.text}cc` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.4 }}
          >
            {journey.subtitle}
          </motion.p>
        )}
        
        <motion.div 
          className="flex items-center justify-center gap-8 transition-colors duration-300"
          style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <motion.span 
              className="text-sm" 
              style={{ color: theme.accent }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 300, damping: 20 }}
            >
              {totalSongs}
            </motion.span>
            <span className="text-xs tracking-[0.2em] uppercase">Songs</span>
          </div>
          <div className="w-px h-4" style={{ backgroundColor: `${theme.textSecondary}4d` }} />
          <div className="flex items-center gap-2">
            <motion.span 
              className="text-sm" 
              style={{ color: theme.accent }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 20 }}
            >
              {totalSeasons}
            </motion.span>
            <span className="text-xs tracking-[0.2em] uppercase">Seasons</span>
          </div>
          <div className="w-px h-4" style={{ backgroundColor: `${theme.textSecondary}4d` }} />
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-[0.2em] uppercase">By {journey.username}</span>
          </div>
        </motion.div>
        
        {journey.bio && (
          <motion.p
            className="mt-12 text-sm max-w-md mx-auto leading-relaxed transition-colors duration-300"
            style={{ fontFamily: "'Manrope', sans-serif", color: `${theme.textSecondary}b3` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.6 }}
          >
            {journey.bio}
          </motion.p>
        )}
      </motion.div>
      
      <motion.div 
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center"
        style={{ opacity: contentOpacity }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5 transition-colors duration-300"
          style={{ border: `1px solid ${theme.border}` }}
        >
          <motion.div 
            className="w-1 h-1.5 rounded-full transition-colors duration-300"
            style={{ backgroundColor: `${theme.text}66` }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
