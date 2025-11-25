'use client';

import React, { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, MotionValue } from 'framer-motion';
import { Season, JourneyWithSeasons } from '@/types/journey';
import { JourneySong } from './JourneySong';
import { Music, Sparkles, Calendar, BookOpen } from 'lucide-react';
import { FaQuoteLeft as Quote } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';

interface JourneyTimelineProps {
  journey: JourneyWithSeasons;
  isPreview?: boolean;
}

const themeColors: Record<string, { 
  gradient: string; 
  accent: string; 
  bg: string; 
  line: string;
  glow: string;
  soft: string;
}> = {
  indigo: {
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    accent: 'text-indigo-600 dark:text-indigo-400',
    bg: 'from-indigo-500/8 to-purple-500/8',
    line: 'from-indigo-400 via-purple-400 to-pink-400',
    glow: 'shadow-indigo-500/25',
    soft: 'bg-indigo-50 dark:bg-indigo-950/30',
  },
  purple: {
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    accent: 'text-purple-600 dark:text-purple-400',
    bg: 'from-purple-500/8 to-pink-500/8',
    line: 'from-purple-400 via-fuchsia-400 to-pink-400',
    glow: 'shadow-purple-500/25',
    soft: 'bg-purple-50 dark:bg-purple-950/30',
  },
  pink: {
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    accent: 'text-pink-600 dark:text-pink-400',
    bg: 'from-pink-500/8 to-rose-500/8',
    line: 'from-pink-400 via-rose-400 to-red-400',
    glow: 'shadow-pink-500/25',
    soft: 'bg-pink-50 dark:bg-pink-950/30',
  },
  amber: {
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    accent: 'text-amber-600 dark:text-amber-400',
    bg: 'from-amber-500/8 to-orange-500/8',
    line: 'from-amber-400 via-orange-400 to-yellow-400',
    glow: 'shadow-amber-500/25',
    soft: 'bg-amber-50 dark:bg-amber-950/30',
  },
  emerald: {
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    accent: 'text-emerald-600 dark:text-emerald-400',
    bg: 'from-emerald-500/8 to-teal-500/8',
    line: 'from-emerald-400 via-green-400 to-teal-400',
    glow: 'shadow-emerald-500/25',
    soft: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  cyan: {
    gradient: 'from-cyan-500 via-sky-500 to-blue-500',
    accent: 'text-cyan-600 dark:text-cyan-400',
    bg: 'from-cyan-500/8 to-blue-500/8',
    line: 'from-cyan-400 via-sky-400 to-blue-400',
    glow: 'shadow-cyan-500/25',
    soft: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
};

const YearMarker = ({ year, index, theme, scrollProgress }: { 
  year: number; 
  index: number; 
  theme: typeof themeColors.indigo;
  scrollProgress: MotionValue<number>;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const opacity = useTransform(scrollProgress, [0, 0.1], [0.3, 1]);
  const scale = useTransform(scrollProgress, [0, 0.1], [0.95, 1]);
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-center py-16 mb-12"
    >
      <motion.div 
        style={{ opacity, scale }}
        className="relative"
      >
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -inset-8 bg-gradient-to-r ${theme.gradient} rounded-full blur-3xl`} 
        />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute -inset-4 bg-gradient-to-r ${theme.gradient} rounded-full opacity-20 blur-xl`}
        />
        <div className="relative">
          <div className="px-12 py-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-2xl">
            <span 
              className={`text-6xl md:text-7xl font-light tracking-tight bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {year}
            </span>
          </div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute -bottom-2 left-8 right-8 h-0.5 bg-gradient-to-r ${theme.gradient} rounded-full origin-left`}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

interface SeasonRowProps {
  season: Season;
  index: number;
  showPlayCounts?: boolean;
  showDates?: boolean;
  journeyTheme: typeof themeColors.indigo;
  totalSeasons: number;
}

const SeasonRow: React.FC<SeasonRowProps> = ({ season, index, showPlayCounts, showDates, journeyTheme, totalSeasons }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const seasonTheme = themeColors[season.theme_color || 'indigo'] || journeyTheme;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.5]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.95, 1, 1, 0.98]);
  
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });

  const formatDateRange = () => {
    const start = format(parseISO(season.start_date), 'MMMM yyyy');
    const end = season.end_date ? format(parseISO(season.end_date), 'MMMM yyyy') : 'Present';
    return `${start} — ${end}`;
  };

  return (
    <motion.div
      ref={ref}
      style={{ opacity: smoothOpacity, scale: smoothScale }}
      className="relative"
    >
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        <div className="hidden lg:flex lg:col-span-1 justify-center relative">
          <motion.div 
            initial={{ height: 0 }}
            animate={isInView ? { height: '100%' } : { height: 0 }}
            transition={{ duration: 1.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute top-0 w-px bg-gradient-to-b ${seasonTheme.line} opacity-40`}
          />
          
          <div className="sticky top-1/3 h-fit z-10">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute -inset-3 bg-gradient-to-r ${seasonTheme.gradient} rounded-full blur-xl`}
              />
              <div className={`relative w-5 h-5 rounded-full bg-gradient-to-r ${seasonTheme.gradient} shadow-lg ${seasonTheme.glow}`}>
                <div className="absolute inset-1 bg-white dark:bg-slate-900 rounded-full" />
                <div className={`absolute inset-2 bg-gradient-to-r ${seasonTheme.gradient} rounded-full`} />
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div 
          style={{ y: smoothY }}
          className="lg:col-span-5"
        >
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="group relative h-full"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={`absolute -inset-4 bg-gradient-to-r ${seasonTheme.gradient} rounded-[2rem] opacity-0 blur-2xl`}
            />
            
            <div className="relative h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[2rem] border border-white/30 dark:border-slate-700/30 shadow-xl hover:shadow-2xl transition-all duration-700 overflow-hidden group-hover:border-white/50 dark:group-hover:border-slate-600/50">
              {season.cover_image_url && (
                <div className="relative h-52 overflow-hidden">
                  <motion.img
                    src={season.cover_image_url}
                    alt={season.title}
                    className="w-full h-full object-cover"
                    initial={{ scale: 1.2 }}
                    whileInView={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-white/50 dark:via-slate-900/50 to-transparent" />
                </div>
              )}
              
              <div className={`p-8 ${season.cover_image_url ? '-mt-16 relative z-10' : ''}`}>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="tracking-wide">{formatDateRange()}</span>
                </motion.span>
                
                <motion.h3 
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="text-2xl md:text-3xl font-light tracking-tight text-slate-900 dark:text-white mb-4"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  <span className={`bg-gradient-to-r ${seasonTheme.gradient} bg-clip-text text-transparent`}>
                    {season.title}
                  </span>
                </motion.h3>
                
                {season.description && (
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 text-[15px]"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    {season.description}
                  </motion.p>
                )}
                
                {season.scripture_reference && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className={`flex items-start gap-3 p-4 rounded-2xl ${seasonTheme.soft} border border-slate-100 dark:border-slate-800 mb-6`}
                  >
                    <BookOpen className={`w-5 h-5 ${seasonTheme.accent} mt-0.5 flex-shrink-0`} />
                    <span className={`text-sm font-medium ${seasonTheme.accent} tracking-wide`}>
                      {season.scripture_reference}
                    </span>
                  </motion.div>
                )}
                
                {season.reflection && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    className="relative p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-100 dark:border-slate-800"
                  >
                    <Quote className="absolute top-4 left-4 w-8 h-8 text-slate-200 dark:text-slate-700" />
                    <p 
                      className="relative z-10 text-slate-600 dark:text-slate-300 italic leading-relaxed pl-8 text-[15px]"
                      style={{ fontFamily: "'Crimson Text', Georgia, serif" }}
                    >
                      {season.reflection}
                    </p>
                  </motion.div>
                )}
                
                {season.songs && season.songs.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Music className="w-4 h-4" />
                      <span>{season.songs.length} song{season.songs.length !== 1 ? 's' : ''}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="lg:col-span-6">
          {season.songs && season.songs.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="space-y-4"
            >
              {season.songs.map((seasonSong, songIndex) => (
                <motion.div
                  key={seasonSong.id}
                  initial={{ opacity: 0, x: 40, y: 20 }}
                  animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: 40, y: 20 }}
                  transition={{ 
                    delay: 0.6 + songIndex * 0.12,
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1]
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
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center justify-center h-full min-h-[160px] rounded-[2rem] bg-gradient-to-br from-slate-50/80 to-slate-100/50 dark:from-slate-800/30 dark:to-slate-900/30 border border-dashed border-slate-200 dark:border-slate-700/50"
            >
              <div className="text-center px-8 py-10">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Music className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                </motion.div>
                <p 
                  className="text-sm text-slate-400 dark:text-slate-500 italic"
                  style={{ fontFamily: "'Crimson Text', Georgia, serif" }}
                >
                  Songs coming soon...
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ journey, isPreview }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = themeColors[journey.theme_color || 'indigo'] || themeColors.indigo;
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const seasonsByYear = useMemo(() => {
    return journey.seasons.reduce((acc, season) => {
      const year = season.year || new Date(season.start_date).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(season);
      return acc;
    }, {} as Record<number, Season[]>);
  }, [journey.seasons]);

  const sortedYears = useMemo(() => {
    return Object.keys(seasonsByYear)
      .map(Number)
      .sort((a, b) => b - a);
  }, [seasonsByYear]);

  if (journey.seasons.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-center py-40 text-center"
      >
        <motion.div 
          className="relative mb-10"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute -inset-8 bg-gradient-to-r ${theme.gradient} rounded-full blur-3xl`}
          />
          <div className="relative p-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] border border-white/30 dark:border-slate-700/30 shadow-2xl">
            <Music className="w-16 h-16 text-slate-300 dark:text-slate-600" />
          </div>
        </motion.div>
        <h3 
          className="text-3xl font-light text-slate-700 dark:text-slate-300 mb-4"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          A New Beginning
        </h3>
        <p 
          className="text-slate-500 dark:text-slate-400 max-w-md text-lg"
          style={{ fontFamily: "'Crimson Text', Georgia, serif" }}
        >
          {isPreview 
            ? "Begin adding seasons to tell your musical story through scripture."
            : "This journey is just beginning. Beautiful things are coming."}
        </p>
      </motion.div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="hidden lg:block absolute top-0 bottom-0" style={{ left: 'calc(8.333% + 0.625rem)' }}>
        <motion.div 
          style={{ scaleY: scrollYProgress }}
          className={`absolute inset-0 w-px bg-gradient-to-b ${theme.line} origin-top opacity-30`}
        />
      </div>
      
      <div className="relative z-10 space-y-32">
        {sortedYears.map((year, yearIndex) => (
          <motion.div 
            key={year} 
            className="relative"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
          >
            <YearMarker year={year} index={yearIndex} theme={theme} scrollProgress={scrollYProgress} />
            
            <div className="space-y-24">
              {seasonsByYear[year].map((season, seasonIndex) => (
                <SeasonRow
                  key={season.id}
                  season={season}
                  index={seasonIndex}
                  showPlayCounts={journey.show_play_counts}
                  showDates={journey.show_song_dates}
                  journeyTheme={theme}
                  totalSeasons={journey.seasons.length}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex justify-center pt-32 pb-16"
      >
        <div className="relative">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute -inset-6 bg-gradient-to-r ${theme.gradient} rounded-full blur-2xl`}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className={`absolute -inset-3 bg-gradient-to-r ${theme.gradient} rounded-full opacity-20 blur-xl`}
          />
          <div className="relative flex items-center gap-4 px-8 py-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-full border border-white/40 dark:border-slate-700/50 shadow-xl">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className={`w-6 h-6 ${theme.accent}`} />
            </motion.div>
            <span 
              className="text-base text-slate-600 dark:text-slate-300 tracking-wide"
              style={{ fontFamily: "'Crimson Text', Georgia, serif" }}
            >
              The journey continues...
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
