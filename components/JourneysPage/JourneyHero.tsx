'use client';

import React, { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { JourneyWithSeasons } from '@/types/journey';
import { Music, Calendar, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface JourneyHeroProps {
  journey: JourneyWithSeasons;
}

const themeColors: Record<string, { 
  gradient: string; 
  accent: string; 
  lightBg: string;
  darkBg: string;
  blob1: string;
  blob2: string;
  blob3: string;
}> = {
  indigo: {
    gradient: 'from-indigo-500 via-violet-500 to-purple-500',
    accent: 'text-indigo-500 dark:text-indigo-300',
    lightBg: 'from-indigo-400/[0.08] via-purple-400/[0.06] to-pink-400/[0.08]',
    darkBg: 'dark:from-indigo-400/[0.13] dark:via-purple-400/[0.1] dark:to-pink-400/[0.13]',
    blob1: 'bg-indigo-400/20',
    blob2: 'bg-purple-400/20',
    blob3: 'bg-pink-400/20',
  },
  purple: {
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    accent: 'text-purple-500 dark:text-purple-300',
    lightBg: 'from-purple-400/[0.08] via-fuchsia-400/[0.06] to-pink-400/[0.08]',
    darkBg: 'dark:from-purple-400/[0.13] dark:via-fuchsia-400/[0.1] dark:to-pink-400/[0.13]',
    blob1: 'bg-purple-400/20',
    blob2: 'bg-fuchsia-400/20',
    blob3: 'bg-pink-400/20',
  },
  pink: {
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    accent: 'text-pink-500 dark:text-pink-300',
    lightBg: 'from-pink-400/[0.08] via-rose-400/[0.06] to-red-400/[0.08]',
    darkBg: 'dark:from-pink-400/[0.13] dark:via-rose-400/[0.1] dark:to-red-400/[0.13]',
    blob1: 'bg-pink-400/20',
    blob2: 'bg-rose-400/20',
    blob3: 'bg-red-400/20',
  },
  amber: {
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    accent: 'text-amber-500 dark:text-amber-300',
    lightBg: 'from-amber-400/[0.08] via-orange-400/[0.06] to-yellow-400/[0.08]',
    darkBg: 'dark:from-amber-400/[0.13] dark:via-orange-400/[0.1] dark:to-yellow-400/[0.13]',
    blob1: 'bg-amber-400/20',
    blob2: 'bg-orange-400/20',
    blob3: 'bg-yellow-400/20',
  },
  emerald: {
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    accent: 'text-emerald-500 dark:text-emerald-300',
    lightBg: 'from-emerald-400/[0.08] via-green-400/[0.06] to-teal-400/[0.08]',
    darkBg: 'dark:from-emerald-400/[0.13] dark:via-green-400/[0.1] dark:to-teal-400/[0.13]',
    blob1: 'bg-emerald-400/20',
    blob2: 'bg-green-400/20',
    blob3: 'bg-teal-400/20',
  },
  cyan: {
    gradient: 'from-cyan-500 via-sky-500 to-blue-500',
    accent: 'text-cyan-500 dark:text-cyan-300',
    lightBg: 'from-cyan-400/[0.08] via-sky-400/[0.06] to-blue-400/[0.08]',
    darkBg: 'dark:from-cyan-400/[0.13] dark:via-sky-400/[0.1] dark:to-blue-400/[0.13]',
    blob1: 'bg-cyan-400/20',
    blob2: 'bg-sky-400/20',
    blob3: 'bg-blue-400/20',
  },
};

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export const JourneyHero: React.FC<JourneyHeroProps> = ({ journey }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });
  const smoothTitleY = useSpring(titleY, { stiffness: 100, damping: 30 });

  const theme = useMemo(() => {
    return themeColors[journey.theme_color || 'indigo'] || themeColors.indigo;
  }, [journey.theme_color]);

  const totalSongs = journey.seasons.reduce((acc, season) => acc + (season.songs?.length || 0), 0);
  const yearsSpan = journey.seasons.length > 0 
    ? Math.abs(
        Math.max(...journey.seasons.map(s => s.year || new Date(s.start_date).getFullYear())) -
        Math.min(...journey.seasons.map(s => s.year || new Date(s.start_date).getFullYear()))
      ) + 1
    : 0;

  const profileImageUrl = journey.profile_image_url 
    ? `${CDN_URL}${journey.profile_image_url}` 
    : '/biblechorus-icon.png';

  return (
    <motion.div 
      ref={heroRef}
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
    >
      {journey.cover_image_url && (
        <motion.div 
          style={{ y: smoothY, scale: smoothScale }}
          className="absolute inset-0"
        >
          <Image
            src={journey.cover_image_url}
            alt={journey.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-white dark:from-slate-900/60 dark:via-slate-900/80 dark:to-slate-900" />
        </motion.div>
      )}
      
      <div className="absolute inset-0">
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.lightBg} ${theme.darkBg}`} />
        <motion.div 
          animate={{ 
            x: [0, 30, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute top-20 -left-20 w-[500px] h-[500px] ${theme.blob1} rounded-full mix-blend-multiply filter blur-3xl`}
        />
        <motion.div 
          animate={{ 
            x: [0, -20, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 5 }}
          className={`absolute top-40 -right-20 w-[400px] h-[400px] ${theme.blob2} rounded-full mix-blend-multiply filter blur-3xl`}
        />
        <motion.div 
          animate={{ 
            x: [0, 40, 0],
            y: [0, 40, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear", delay: 10 }}
          className={`absolute -bottom-20 left-1/3 w-[600px] h-[600px] ${theme.blob3} rounded-full mix-blend-multiply filter blur-3xl`}
        />
      </div>
      
      <motion.div 
        style={{ y: smoothTitleY, opacity: smoothOpacity }}
        className="relative z-10 container mx-auto px-4"
      >
        <div className="text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="relative group">
              <div className={`absolute -inset-2 bg-gradient-to-r ${theme.gradient} rounded-full opacity-75 blur-lg group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-2xl">
                <Image
                  src={profileImageUrl}
                  alt={journey.username}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6"
          >
            <span className={`inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${theme.lightBg} backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg`}>
              <Sparkles className={theme.accent} style={{ width: '1rem', height: '1rem' }} />
              <span className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent font-semibold`}>
                {journey.username}'s Journey
              </span>
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
          >
            <span className="block text-slate-900 dark:text-white mb-2">{journey.title.split(' ').slice(0, -1).join(' ')}</span>
            <span className="block relative">
              <span className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x`}>
                {journey.title.split(' ').slice(-1)[0]}
              </span>
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient} rounded-full origin-left`}
              />
            </span>
          </motion.h1>
          
          {journey.subtitle && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-12"
            >
              {journey.subtitle}
            </motion.p>
          )}
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/12 dark:border-slate-700/40 rounded-2xl px-6 py-4 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${theme.lightBg} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <Music className={`relative w-6 h-6 mx-auto mb-2 ${theme.accent}`} />
              <div className={`relative text-2xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>{totalSongs}</div>
              <div className="relative text-sm text-slate-500 dark:text-slate-400">Songs</div>
            </div>
            
            <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/12 dark:border-slate-700/40 rounded-2xl px-6 py-4 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${theme.lightBg} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <Sparkles className={`relative w-6 h-6 mx-auto mb-2 ${theme.accent}`} />
              <div className={`relative text-2xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>{journey.seasons.length}</div>
              <div className="relative text-sm text-slate-500 dark:text-slate-400">Seasons</div>
            </div>
            
            {yearsSpan > 0 && (
              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/12 dark:border-slate-700/40 rounded-2xl px-6 py-4 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl">
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.lightBg} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <Calendar className={`relative w-6 h-6 mx-auto mb-2 ${theme.accent}`} />
                <div className={`relative text-2xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>{yearsSpan}</div>
                <div className="relative text-sm text-slate-500 dark:text-slate-400">Year{yearsSpan !== 1 ? 's' : ''}</div>
              </div>
            )}
          </motion.div>
          
          {journey.bio && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-12 max-w-2xl mx-auto"
            >
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {journey.bio}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500"
        >
          <span className="text-sm font-medium">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-current flex justify-center p-2">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 bg-current rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
