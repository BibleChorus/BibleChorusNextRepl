'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { JourneyWithSeasons } from '@/types/journey';
import Image from 'next/image';

interface JourneyHeroProps {
  journey: JourneyWithSeasons;
}

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export const JourneyHero: React.FC<JourneyHeroProps> = ({ journey }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], ['0%', '15%']);
  
  const smoothBackgroundY = useSpring(backgroundY, { stiffness: 100, damping: 30 });
  const smoothContentOpacity = useSpring(contentOpacity, { stiffness: 100, damping: 30 });
  const smoothContentY = useSpring(contentY, { stiffness: 100, damping: 30 });

  const totalSongs = journey.seasons.reduce((acc, season) => acc + (season.songs?.length || 0), 0);
  const totalSeasons = journey.seasons.length;

  const backgroundImageUrl = journey.cover_image_url 
    ? journey.cover_image_url 
    : null;

  const titleWords = journey.title.split(' ');
  const firstWord = titleWords.length > 1 ? titleWords[0] : 'The';
  const restWords = titleWords.length > 1 ? titleWords.slice(1).join(' ') : journey.title;

  return (
    <motion.div 
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#050505]"
    >
      {backgroundImageUrl && (
        <motion.div 
          style={{ y: smoothBackgroundY }}
          className="absolute inset-0"
        >
          <Image
            src={backgroundImageUrl}
            alt={journey.title}
            fill
            className="object-cover grayscale opacity-30"
            priority
          />
        </motion.div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-transparent to-transparent" />
      
      <motion.div 
        style={{ y: smoothContentY, opacity: smoothContentOpacity }}
        className="relative z-10 container mx-auto px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <span 
            className="text-xs md:text-sm tracking-[0.5em] uppercase text-mist"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            A Sonic Archive
          </span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <span 
            className="block text-6xl md:text-9xl text-silk tracking-tight"
            style={{ fontFamily: "'Italiana', serif" }}
          >
            {firstWord}
          </span>
          <span 
            className="block text-6xl md:text-9xl text-silk tracking-tight italic"
            style={{ fontFamily: "'Italiana', serif" }}
          >
            {restWords}
          </span>
        </motion.h1>
        
        {journey.subtitle && (
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm md:text-base font-light text-silk/80 max-w-xl mx-auto leading-relaxed mb-10"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {journey.subtitle}
          </motion.p>
        )}
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center gap-8 text-mist"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-gold text-sm">{totalSongs}</span>
            <span className="text-xs tracking-[0.2em] uppercase">Songs</span>
          </div>
          <div className="w-px h-4 bg-mist/30" />
          <div className="flex items-center gap-2">
            <span className="text-gold text-sm">{totalSeasons}</span>
            <span className="text-xs tracking-[0.2em] uppercase">Seasons</span>
          </div>
          <div className="w-px h-4 bg-mist/30" />
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-[0.2em] uppercase">By {journey.username}</span>
          </div>
        </motion.div>
        
        {journey.bio && (
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 text-sm text-mist/70 max-w-md mx-auto leading-relaxed"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {journey.bio}
          </motion.p>
        )}
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
      >
        <span 
          className="text-[10px] tracking-[0.3em] uppercase text-silk/60"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Begin
        </span>
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white to-transparent opacity-50"
        />
      </motion.div>
    </motion.div>
  );
};
