'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Season, JourneyWithSeasons, SeasonSong, ImportantDate } from '@/types/journey';
import { JourneySong } from './JourneySong';
import { JourneyImportantDate } from './JourneyImportantDate';
import { ScriptureVerseDialog } from './ScriptureVerseDialog';
import { Music, BookOpen } from 'lucide-react';
import { FaQuoteLeft as Quote } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';

type TimelineItem = 
  | { type: 'song'; data: SeasonSong; date: number }
  | { type: 'important_date'; data: ImportantDate; date: number };

const getDateTimestamp = (dateStr: string | undefined | null): number => {
  if (!dateStr) return 0;
  const datePart = dateStr.split('T')[0].split(' ')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
};

interface JourneyTimelineProps {
  journey: JourneyWithSeasons;
  isPreview?: boolean;
}

const toRomanNumeral = (num: number): string => {
  const romanNumerals: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let result = '';
  let remaining = num;
  for (const [value, numeral] of romanNumerals) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }
  return result;
};

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

const revealVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 1.2, 
      ease: easeOutExpo 
    }
  }
};

const imageRevealVariants = {
  hidden: { scale: 1.1, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      duration: 1.5, 
      ease: easeOutExpo 
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

interface SeasonSectionProps {
  season: Season;
  index: number;
  showPlayCounts?: boolean;
  showDates?: boolean;
  totalSeasons: number;
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
  allJourneySongs: import('@/types/journey').SeasonSong[];
}

const SeasonSection: React.FC<SeasonSectionProps> = ({ 
  season, 
  index, 
  showPlayCounts, 
  showDates,
  totalSeasons,
  theme,
  allJourneySongs
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [showScriptureDialog, setShowScriptureDialog] = useState(false);
  
  const year = season.year || new Date(season.start_date).getFullYear();
  const seasonNumber = index + 1;

  const formatDateRange = () => {
    const start = format(parseISO(season.start_date), 'MMMM yyyy');
    const end = season.end_date ? format(parseISO(season.end_date), 'MMMM yyyy') : 'Present';
    return `${start} — ${end}`;
  };

  const mergedTimelineItems = useMemo(() => {
    const items: TimelineItem[] = [];
    
    if (season.songs) {
      for (const song of season.songs) {
        const songDate = song.song?.journey_date || song.song?.created_at;
        items.push({
          type: 'song',
          data: song,
          date: getDateTimestamp(songDate)
        });
      }
    }
    
    if (season.important_dates) {
      for (const importantDate of season.important_dates) {
        items.push({
          type: 'important_date',
          data: importantDate,
          date: getDateTimestamp(importantDate.event_date)
        });
      }
    }
    
    items.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date - b.date;
      }
      if (a.type === 'important_date' && b.type === 'song') {
        return -1;
      }
      if (a.type === 'song' && b.type === 'important_date') {
        return 1;
      }
      return 0;
    });
    
    return items;
  }, [season.songs, season.important_dates]);

  return (
    <section 
      id={`season-${season.id}`}
      ref={ref}
      className="relative"
      style={{ scrollMarginTop: '64px', borderBottom: `1px solid ${theme.border}` }}
    >
      <div className="py-16 md:py-24 px-6 md:px-24">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          <div className="lg:w-[280px] xl:w-[320px] flex-shrink-0">
            <div className="lg:sticky lg:top-20 lg:self-start">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="relative z-10"
              >
                <motion.div 
                  className="mb-4 select-none"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 1.5, ease: easeOutExpo }}
                >
                  <span 
                    className="text-5xl md:text-7xl lg:text-8xl font-serif"
                    style={{ fontFamily: "'Italiana', serif", color: `${theme.text}26` }}
                  >
                    {year}
                  </span>
                </motion.div>

                <motion.span
                  variants={revealVariants}
                  className="text-[10px] tracking-[0.3em] font-light uppercase block mb-3"
                  style={{ fontFamily: "'Manrope', sans-serif", color: theme.accent }}
                >
                  SEASON {toRomanNumeral(seasonNumber)}
                </motion.span>

                <motion.h2
                  variants={revealVariants}
                  className="text-3xl md:text-4xl lg:text-5xl font-serif italic mb-4"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  {season.title}
                </motion.h2>

                <motion.span
                  variants={revealVariants}
                  className="text-[10px] tracking-widest uppercase block mb-6"
                  style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
                >
                  {formatDateRange()}
                </motion.span>

                {season.description && (
                  <motion.p
                    variants={revealVariants}
                    className="text-sm font-light leading-7 mb-6 max-w-xs"
                    style={{ fontFamily: "'Manrope', sans-serif", color: `${theme.textSecondary}cc` }}
                  >
                    {season.description}
                  </motion.p>
                )}

                {season.scripture_reference && (
                  <>
                    <motion.button
                      variants={revealVariants}
                      onClick={() => setShowScriptureDialog(true)}
                      className="flex items-start gap-3 mb-6 text-left hover:opacity-80 transition-opacity cursor-pointer group"
                    >
                      <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: theme.accent }} />
                      <span 
                        className="text-xs font-light tracking-wide underline underline-offset-2 group-hover:no-underline"
                        style={{ fontFamily: "'Manrope', sans-serif", color: `${theme.accent}b3` }}
                      >
                        {season.scripture_reference}
                      </span>
                    </motion.button>
                    <ScriptureVerseDialog
                      isOpen={showScriptureDialog}
                      onClose={() => setShowScriptureDialog(false)}
                      scriptureReference={season.scripture_reference}
                    />
                  </>
                )}

                {season.cover_image_url && (
                  <motion.div
                    variants={revealVariants}
                    className="relative overflow-hidden rounded-sm group max-w-[280px]"
                  >
                    <motion.img
                      src={season.cover_image_url}
                      alt={season.title}
                      className="w-full h-40 md:h-48 object-cover grayscale hover:grayscale-0 transition-all duration-700"
                      variants={imageRevealVariants}
                    />
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `linear-gradient(to top, ${theme.bg}99, transparent)` }}
                    />
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>

          <motion.div 
            className="flex-1 min-w-0"
            variants={staggerContainer}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {season.reflection && (
              <motion.div
                variants={revealVariants}
                className="relative mb-6 md:mb-10"
              >
                <div 
                  className="relative py-4 md:py-6 px-4 md:px-6"
                  style={{ borderLeft: `2px solid ${theme.accent}33` }}
                >
                  <Quote className="w-4 h-4 md:w-5 md:h-5 mb-2 md:mb-3" style={{ color: `${theme.accent}4d` }} />
                  <p 
                    className="text-base md:text-xl font-serif italic leading-relaxed"
                    style={{ fontFamily: "'Italiana', serif", color: theme.textSecondary }}
                  >
                    {`"${season.reflection}"`}
                  </p>
                </div>
              </motion.div>
            )}

            {mergedTimelineItems.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  let songTrackNumber = 0;
                  return mergedTimelineItems.map((item, itemIndex) => {
                    if (item.type === 'song') {
                      songTrackNumber++;
                      return (
                        <motion.div
                          key={`song-${item.data.id}`}
                          variants={revealVariants}
                          custom={itemIndex}
                          transition={{ 
                            delay: 0.3 + itemIndex * 0.1,
                            duration: 1.2,
                            ease: easeOutExpo
                          }}
                        >
                          <JourneySong
                            seasonSong={item.data}
                            showPlayCount={showPlayCounts}
                            showDate={showDates}
                            themeColor="gold"
                            trackNumber={songTrackNumber}
                            allJourneySongs={allJourneySongs}
                          />
                        </motion.div>
                      );
                    } else {
                      return (
                        <motion.div
                          key={`date-${item.data.id}`}
                          variants={revealVariants}
                          custom={itemIndex}
                          transition={{ 
                            delay: 0.3 + itemIndex * 0.1,
                            duration: 1.2,
                            ease: easeOutExpo
                          }}
                        >
                          <JourneyImportantDate
                            importantDate={item.data}
                            theme={theme}
                          />
                        </motion.div>
                      );
                    }
                  });
                })()}
              </div>
            ) : (
              <motion.div
                variants={revealVariants}
                className="flex items-center justify-center min-h-[200px] rounded-sm"
                style={{ border: `1px solid ${theme.border}` }}
              >
                <div className="text-center px-8 py-10">
                  <Music className="w-8 h-8 mx-auto mb-4" style={{ color: `${theme.textSecondary}4d` }} />
                  <p 
                    className="text-sm italic font-serif"
                    style={{ fontFamily: "'Italiana', serif", color: `${theme.textSecondary}80` }}
                  >
                    {"Songs coming soon..."}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ journey, isPreview }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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

  const sortedSeasons = [...journey.seasons].sort((a, b) => {
    const dateA = new Date(a.start_date).getTime();
    const dateB = new Date(b.start_date).getTime();
    return dateA - dateB;
  });

  const allJourneySongs = sortedSeasons.flatMap(season => season.songs || []);

  if (!mounted) {
    return <div className="relative bg-transparent" />;
  }

  if (sortedSeasons.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: easeOutExpo }}
        className="flex flex-col items-center justify-center py-40 text-center px-6"
      >
        <div className="relative mb-12">
          <span 
            className="text-[8rem] md:text-[12rem] font-serif select-none"
            style={{ fontFamily: "'Italiana', serif", color: `${theme.text}0d` }}
          >
            I
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <Music className="w-12 h-12" style={{ color: `${theme.textSecondary}4d` }} />
          </div>
        </div>
        <h3 
          className="text-3xl md:text-4xl font-serif italic mb-6"
          style={{ fontFamily: "'Italiana', serif", color: theme.text }}
        >
          A New Beginning
        </h3>
        <p 
          className="text-base font-light max-w-md leading-relaxed"
          style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
        >
          {isPreview 
            ? "Begin adding seasons to tell your musical story through scripture."
            : "This journey is just beginning. Beautiful things are coming."}
        </p>
      </motion.div>
    );
  }

  return (
    <div ref={containerRef} className="relative bg-transparent">
      {sortedSeasons.map((season, index) => (
        <SeasonSection
          key={season.id}
          season={season}
          index={index}
          showPlayCounts={journey.show_play_counts}
          showDates={journey.show_song_dates}
          totalSeasons={sortedSeasons.length}
          theme={theme}
          allJourneySongs={allJourneySongs}
        />
      ))}
      
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: easeOutExpo }}
        className="flex justify-center py-24"
        style={{ borderTop: `1px solid ${theme.border}` }}
      >
        <div className="text-center">
          <span 
            className="text-xs tracking-[0.4em] uppercase font-light"
            style={{ fontFamily: "'Manrope', sans-serif", color: theme.accent }}
          >
            The journey continues
          </span>
        </div>
      </motion.div>
    </div>
  );
};
