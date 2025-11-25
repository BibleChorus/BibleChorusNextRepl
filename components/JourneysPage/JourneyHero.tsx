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
  glow: string;
}> = {
  indigo: {
    gradient: 'from-indigo-500 via-violet-500 to-purple-500',
    accent: 'text-indigo-600 dark:text-indigo-300',
    lightBg: 'from-indigo-400/[0.06] via-purple-400/[0.04] to-pink-400/[0.06]',
    darkBg: 'dark:from-indigo-400/[0.1] dark:via-purple-400/[0.08] dark:to-pink-400/[0.1]',
    blob1: 'bg-indigo-300/30 dark:bg-indigo-400/20',
    blob2: 'bg-purple-300/30 dark:bg-purple-400/20',
    blob3: 'bg-pink-300/30 dark:bg-pink-400/20',
    glow: 'shadow-indigo-500/20',
  },
  purple: {
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    accent: 'text-purple-600 dark:text-purple-300',
    lightBg: 'from-purple-400/[0.06] via-fuchsia-400/[0.04] to-pink-400/[0.06]',
    darkBg: 'dark:from-purple-400/[0.1] dark:via-fuchsia-400/[0.08] dark:to-pink-400/[0.1]',
    blob1: 'bg-purple-300/30 dark:bg-purple-400/20',
    blob2: 'bg-fuchsia-300/30 dark:bg-fuchsia-400/20',
    blob3: 'bg-pink-300/30 dark:bg-pink-400/20',
    glow: 'shadow-purple-500/20',
  },
  pink: {
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    accent: 'text-pink-600 dark:text-pink-300',
    lightBg: 'from-pink-400/[0.06] via-rose-400/[0.04] to-red-400/[0.06]',
    darkBg: 'dark:from-pink-400/[0.1] dark:via-rose-400/[0.08] dark:to-red-400/[0.1]',
    blob1: 'bg-pink-300/30 dark:bg-pink-400/20',
    blob2: 'bg-rose-300/30 dark:bg-rose-400/20',
    blob3: 'bg-red-300/30 dark:bg-red-400/20',
    glow: 'shadow-pink-500/20',
  },
  amber: {
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    accent: 'text-amber-600 dark:text-amber-300',
    lightBg: 'from-amber-400/[0.06] via-orange-400/[0.04] to-yellow-400/[0.06]',
    darkBg: 'dark:from-amber-400/[0.1] dark:via-orange-400/[0.08] dark:to-yellow-400/[0.1]',
    blob1: 'bg-amber-300/30 dark:bg-amber-400/20',
    blob2: 'bg-orange-300/30 dark:bg-orange-400/20',
    blob3: 'bg-yellow-300/30 dark:bg-yellow-400/20',
    glow: 'shadow-amber-500/20',
  },
  emerald: {
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    accent: 'text-emerald-600 dark:text-emerald-300',
    lightBg: 'from-emerald-400/[0.06] via-green-400/[0.04] to-teal-400/[0.06]',
    darkBg: 'dark:from-emerald-400/[0.1] dark:via-green-400/[0.08] dark:to-teal-400/[0.1]',
    blob1: 'bg-emerald-300/30 dark:bg-emerald-400/20',
    blob2: 'bg-green-300/30 dark:bg-green-400/20',
    blob3: 'bg-teal-300/30 dark:bg-teal-400/20',
    glow: 'shadow-emerald-500/20',
  },
  cyan: {
    gradient: 'from-cyan-500 via-sky-500 to-blue-500',
    accent: 'text-cyan-600 dark:text-cyan-300',
    lightBg: 'from-cyan-400/[0.06] via-sky-400/[0.04] to-blue-400/[0.06]',
    darkBg: 'dark:from-cyan-400/[0.1] dark:via-sky-400/[0.08] dark:to-blue-400/[0.1]',
    blob1: 'bg-cyan-300/30 dark:bg-cyan-400/20',
    blob2: 'bg-sky-300/30 dark:bg-sky-400/20',
    blob3: 'bg-blue-300/30 dark:bg-blue-400/20',
    glow: 'shadow-cyan-500/20',
  },
};

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export const JourneyHero: React.FC<JourneyHeroProps> = ({ journey }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.6, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const blur = useTransform(scrollYProgress, [0, 1], [0, 10]);
  
  const smoothY = useSpring(y, { stiffness: 80, damping: 25 });
  const smoothOpacity = useSpring(opacity, { stiffness: 80, damping: 25 });
  const smoothScale = useSpring(scale, { stiffness: 80, damping: 25 });
  const smoothTitleY = useSpring(titleY, { stiffness: 80, damping: 25 });

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

  const titleWords = journey.title.split(' ');
  const lastWord = titleWords.pop() || '';
  const restOfTitle = titleWords.join(' ');

  return (
    <motion.div 
      ref={heroRef}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
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
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/85 to-white dark:from-slate-900/70 dark:via-slate-900/85 dark:to-slate-900" />
        </motion.div>
      )}
      
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.lightBg} ${theme.darkBg}`} />
        
        <motion.div 
          animate={{ 
            x: [0, 50, 0],
            y: [0, -80, 0],
            scale: [1, 1.2, 1],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -top-40 -left-40 w-[700px] h-[700px] ${theme.blob1} rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px]`}
        />
        <motion.div 
          animate={{ 
            x: [0, -40, 0],
            y: [0, 60, 0],
            scale: [1, 1.3, 1],
            rotate: [0, -15, 0]
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className={`absolute top-20 -right-40 w-[600px] h-[600px] ${theme.blob2} rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px]`}
        />
        <motion.div 
          animate={{ 
            x: [0, 70, 0],
            y: [0, 50, 0],
            scale: [1, 1.25, 1],
            rotate: [0, 20, 0]
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "easeInOut", delay: 8 }}
          className={`absolute -bottom-40 left-1/4 w-[800px] h-[800px] ${theme.blob3} rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px]`}
        />
        
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(255,255,255,0.4)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.5)_100%)]" />
      </div>
      
      <motion.div 
        style={{ y: smoothTitleY, opacity: smoothOpacity }}
        className="relative z-10 container mx-auto px-6"
      >
        <div className="text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center mb-10"
          >
            <div className="relative group">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute -inset-4 bg-gradient-to-r ${theme.gradient} rounded-full blur-2xl`}
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className={`absolute -inset-2 bg-gradient-to-r ${theme.gradient} rounded-full opacity-30 blur-lg`}
              />
              <div className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-white/80 dark:ring-slate-800/80 shadow-2xl ${theme.glow}`}>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <span 
              className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-full text-sm bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 shadow-lg`}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className={`w-4 h-4 ${theme.accent}`} />
              </motion.div>
              <span 
                className="text-slate-600 dark:text-slate-300 tracking-wide"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                {journey.username}'s Journey
              </span>
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            {restOfTitle && (
              <span 
                className="block text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-slate-800 dark:text-slate-100 mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {restOfTitle}
              </span>
            )}
            <span className="block relative inline-block">
              <span 
                className={`text-5xl md:text-7xl lg:text-8xl font-light tracking-tight bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {lastWord || journey.title}
              </span>
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.5, delay: 1, ease: [0.16, 1, 0.3, 1] }}
                className={`absolute -bottom-3 left-0 right-0 h-[3px] bg-gradient-to-r ${theme.gradient} rounded-full origin-left`}
              />
            </span>
          </motion.h1>
          
          {journey.subtitle && (
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-14"
              style={{ fontFamily: "'Crimson Text', Georgia, serif" }}
            >
              {journey.subtitle}
            </motion.p>
          )}
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center justify-center gap-8"
          >
            {[
              { icon: Music, value: totalSongs, label: 'Songs', show: true },
              { icon: Sparkles, value: journey.seasons.length, label: 'Seasons', show: true },
              { icon: Calendar, value: yearsSpan, label: yearsSpan !== 1 ? 'Years' : 'Year', show: yearsSpan > 0 },
            ].filter(s => s.show).map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.lightBg} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
                <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/30 dark:border-slate-700/30 rounded-2xl px-8 py-5 text-center shadow-lg hover:shadow-xl transition-all duration-500">
                  <stat.icon className={`w-5 h-5 mx-auto mb-2 ${theme.accent}`} />
                  <div 
                    className={`text-3xl font-light bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent mb-1`}
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {stat.value}
                  </div>
                  <div 
                    className="text-sm text-slate-500 dark:text-slate-400 tracking-wide"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {journey.bio && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mt-16 max-w-2xl mx-auto"
            >
              <p 
                className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed italic"
                style={{ fontFamily: "'Crimson Text', Georgia, serif" }}
              >
                {journey.bio}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1.5 }}
        className="absolute bottom-16 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-3"
        >
          <span 
            className="text-sm text-slate-400 dark:text-slate-500 tracking-widest uppercase"
            style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '11px', letterSpacing: '0.2em' }}
          >
            Scroll to explore
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-slate-300 dark:border-slate-600 flex justify-center pt-2"
          >
            <motion.div
              animate={{ 
                y: [0, 12, 0],
                opacity: [1, 0.3, 1]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className={`w-1.5 h-1.5 rounded-full bg-gradient-to-b ${theme.gradient}`}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
