'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { Season, JourneyWithSeasons } from '@/types/journey';
import { SeasonCard } from './SeasonCard';
import { Music, Sparkles, Calendar } from 'lucide-react';

interface JourneyTimelineProps {
  journey: JourneyWithSeasons;
  isPreview?: boolean;
}

const YearMarker = ({ year, index }: { year: number; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-24 z-20 flex items-center justify-center py-8"
    >
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse-subtle" />
        <div className="relative px-8 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl">
          <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {year}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const TimelineLine = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div ref={ref} className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden lg:block">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-700 to-transparent opacity-50" />
      <motion.div
        style={{ scaleY, transformOrigin: 'top' }}
        className="absolute inset-0 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500"
      />
    </div>
  );
};

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ journey, isPreview }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const seasonsByYear = journey.seasons.reduce((acc, season) => {
    const year = season.year || new Date(season.start_date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(season);
    return acc;
  }, {} as Record<number, Season[]>);

  const sortedYears = Object.keys(seasonsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  if (journey.seasons.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center justify-center py-32 text-center"
      >
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-2xl animate-pulse-subtle" />
          <div className="relative p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50">
            <Music className="w-16 h-16 text-slate-400 dark:text-slate-500" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-4">
          No Seasons Yet
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          {isPreview 
            ? "Start adding seasons to tell your musical story."
            : "This journey is just beginning. Check back soon for updates."}
        </p>
      </motion.div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <TimelineLine />
      
      <div className="relative z-10 space-y-16 lg:space-y-24">
        {sortedYears.map((year, yearIndex) => (
          <div key={year} className="relative">
            <YearMarker year={year} index={yearIndex} />
            
            <div className="space-y-12 lg:space-y-16 mt-8">
              {seasonsByYear[year].map((season, seasonIndex) => (
                <motion.div
                  key={season.id}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.8,
                    delay: seasonIndex * 0.15,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className={`relative ${
                    seasonIndex % 2 === 0 ? 'lg:pr-[52%]' : 'lg:pl-[52%]'
                  }`}
                >
                  <div className="absolute left-1/2 top-12 w-4 h-4 -translate-x-1/2 hidden lg:block">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" />
                    <div className="absolute inset-1 bg-white dark:bg-slate-900 rounded-full" />
                    <div className="absolute inset-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                  </div>
                  
                  <SeasonCard 
                    season={season} 
                    showPlayCounts={journey.show_play_counts}
                    showDates={journey.show_song_dates}
                    alignment={seasonIndex % 2 === 0 ? 'left' : 'right'}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.5 }}
        className="flex justify-center pt-24 pb-12"
      >
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl" />
          <div className="relative flex items-center gap-3 px-6 py-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-full border border-white/20 dark:border-slate-700/50">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              The journey continues...
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
