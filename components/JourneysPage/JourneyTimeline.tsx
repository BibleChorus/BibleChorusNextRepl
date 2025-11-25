'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useInView } from 'framer-motion';
import { Season, JourneyWithSeasons } from '@/types/journey';
import { JourneySong } from './JourneySong';
import { Music, Sparkles, Calendar, BookOpen } from 'lucide-react';
import { FaQuoteLeft as Quote } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';

interface JourneyTimelineProps {
  journey: JourneyWithSeasons;
  isPreview?: boolean;
}

const themeColors: Record<string, { gradient: string; accent: string; bg: string; line: string }> = {
  indigo: {
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    accent: 'text-indigo-500 dark:text-indigo-400',
    bg: 'from-indigo-500/10 to-purple-500/10',
    line: 'from-indigo-500 via-purple-500 to-pink-500',
  },
  purple: {
    gradient: 'from-purple-500 via-purple-400 to-pink-500',
    accent: 'text-purple-500 dark:text-purple-400',
    bg: 'from-purple-500/10 to-pink-500/10',
    line: 'from-purple-500 via-fuchsia-500 to-pink-500',
  },
  pink: {
    gradient: 'from-pink-500 via-rose-400 to-red-500',
    accent: 'text-pink-500 dark:text-pink-400',
    bg: 'from-pink-500/10 to-red-500/10',
    line: 'from-pink-500 via-rose-500 to-red-500',
  },
  amber: {
    gradient: 'from-amber-500 via-orange-400 to-yellow-500',
    accent: 'text-amber-500 dark:text-amber-400',
    bg: 'from-amber-500/10 to-yellow-500/10',
    line: 'from-amber-500 via-orange-500 to-yellow-500',
  },
  emerald: {
    gradient: 'from-emerald-500 via-green-400 to-teal-500',
    accent: 'text-emerald-500 dark:text-emerald-400',
    bg: 'from-emerald-500/10 to-teal-500/10',
    line: 'from-emerald-500 via-green-500 to-teal-500',
  },
  cyan: {
    gradient: 'from-cyan-500 via-sky-400 to-blue-500',
    accent: 'text-cyan-500 dark:text-cyan-400',
    bg: 'from-cyan-500/10 to-blue-500/10',
    line: 'from-cyan-500 via-sky-500 to-blue-500',
  },
};

const YearMarker = ({ year, index, theme }: { year: number; index: number; theme: typeof themeColors.indigo }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-center py-8 mb-8"
    >
      <div className="relative">
        <div className={`absolute -inset-4 bg-gradient-to-r ${theme.gradient} rounded-full blur-xl opacity-30 animate-pulse-subtle`} />
        <div className="relative px-8 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl">
          <span className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
            {year}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

interface SeasonRowProps {
  season: Season;
  index: number;
  showPlayCounts?: boolean;
  showDates?: boolean;
  journeyTheme: typeof themeColors.indigo;
}

const SeasonRow: React.FC<SeasonRowProps> = ({ season, index, showPlayCounts, showDates, journeyTheme }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const seasonTheme = themeColors[season.theme_color || 'indigo'] || journeyTheme;

  const formatDateRange = () => {
    const start = format(parseISO(season.start_date), 'MMM yyyy');
    const end = season.end_date ? format(parseISO(season.end_date), 'MMM yyyy') : 'Present';
    return `${start} — ${end}`;
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{
        duration: 0.8,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="relative"
    >
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
        <div className="hidden lg:flex lg:col-span-1 justify-center relative">
          <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
          <div className="sticky top-32 h-fit">
            <div className="relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${seasonTheme.gradient} rounded-full animate-pulse blur-md opacity-50`} />
              <div className="relative w-5 h-5 bg-white dark:bg-slate-900 rounded-full border-4 border-current" style={{ borderColor: 'rgb(99, 102, 241)' }}>
                <div className={`absolute inset-1 bg-gradient-to-r ${seasonTheme.gradient} rounded-full`} />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="group relative h-full">
            <div className={`absolute -inset-1 bg-gradient-to-r ${seasonTheme.gradient} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
            
            <div className="relative h-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-slate-700/40 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
              {season.cover_image_url && (
                <div className="relative h-40 overflow-hidden">
                  <motion.img
                    src={season.cover_image_url}
                    alt={season.title}
                    className="w-full h-full object-cover"
                    initial={{ scale: 1.1 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 dark:from-slate-800/90 via-transparent to-transparent" />
                </div>
              )}
              
              <div className={`p-6 ${season.cover_image_url ? '-mt-8 relative' : ''}`}>
                <motion.h3 
                  className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${seasonTheme.gradient} bg-clip-text text-transparent mb-3`}
                >
                  {season.title}
                </motion.h3>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateRange()}</span>
                  </div>
                  {season.songs && season.songs.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Music className="w-4 h-4" />
                      <span>{season.songs.length} song{season.songs.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                
                {season.description && (
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm mb-4">
                    {season.description}
                  </p>
                )}
                
                {season.scripture_reference && (
                  <div className={`flex items-start gap-2 p-3 rounded-xl bg-gradient-to-r ${seasonTheme.bg} mb-4`}>
                    <BookOpen className={`w-4 h-4 ${seasonTheme.accent} mt-0.5 flex-shrink-0`} />
                    <span className={`text-sm font-medium ${seasonTheme.accent}`}>
                      {season.scripture_reference}
                    </span>
                  </div>
                )}
                
                {season.reflection && (
                  <div className="relative p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/50">
                    <Quote className="absolute top-3 left-3 w-6 h-6 text-slate-200 dark:text-slate-700" />
                    <p className="relative z-10 text-slate-600 dark:text-slate-300 italic leading-relaxed pl-5 text-sm">
                      {season.reflection}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          {season.songs && season.songs.length > 0 ? (
            <div className="space-y-3">
              {season.songs.map((seasonSong, songIndex) => (
                <motion.div
                  key={seasonSong.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                  transition={{ 
                    delay: 0.3 + songIndex * 0.1,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                >
                  <JourneySong
                    seasonSong={seasonSong}
                    showPlayCount={showPlayCounts}
                    showDate={showDates}
                    themeColor={season.theme_color || 'indigo'}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[120px] rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
              <div className="text-center px-6 py-8">
                <Music className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  No songs in this season yet
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ journey, isPreview }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = themeColors[journey.theme_color || 'indigo'] || themeColors.indigo;

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
          <div className={`absolute -inset-4 bg-gradient-to-r ${theme.gradient} rounded-full blur-2xl opacity-30 animate-pulse-subtle`} />
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
      <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ left: 'calc(8.333% + 0.5rem)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-700 to-transparent opacity-50" />
      </div>
      
      <div className="relative z-10 space-y-20">
        {sortedYears.map((year, yearIndex) => (
          <div key={year} className="relative">
            <YearMarker year={year} index={yearIndex} theme={theme} />
            
            <div className="space-y-12">
              {seasonsByYear[year].map((season, seasonIndex) => (
                <SeasonRow
                  key={season.id}
                  season={season}
                  index={seasonIndex}
                  showPlayCounts={journey.show_play_counts}
                  showDates={journey.show_song_dates}
                  journeyTheme={theme}
                />
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
          <div className={`absolute -inset-4 bg-gradient-to-r ${theme.gradient} rounded-full blur-xl opacity-30`} />
          <div className="relative flex items-center gap-3 px-6 py-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-full border border-white/20 dark:border-slate-700/50">
            <Sparkles className={`w-5 h-5 ${theme.accent}`} />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              The journey continues...
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
