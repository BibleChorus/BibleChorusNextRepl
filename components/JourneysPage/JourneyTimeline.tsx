'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Season, JourneyWithSeasons } from '@/types/journey';
import { JourneySong } from './JourneySong';
import { Music, BookOpen } from 'lucide-react';
import { FaQuoteLeft as Quote } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';

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
}

const SeasonSection: React.FC<SeasonSectionProps> = ({ 
  season, 
  index, 
  showPlayCounts, 
  showDates,
  totalSeasons 
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const year = season.year || new Date(season.start_date).getFullYear();
  const seasonNumber = index + 1;

  const formatDateRange = () => {
    const start = format(parseISO(season.start_date), 'MMMM yyyy');
    const end = season.end_date ? format(parseISO(season.end_date), 'MMMM yyyy') : 'Present';
    return `${start} — ${end}`;
  };

  return (
    <section 
      id={`season-${season.id}`}
      ref={ref}
      className="relative min-h-screen border-b border-white/5 py-24 md:py-32 px-6 md:px-24"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-3 relative">
          <div className="lg:sticky lg:top-32">
            <motion.div 
              className="absolute -left-4 md:-left-12 top-0 select-none pointer-events-none"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 0.1 } : { opacity: 0 }}
              transition={{ duration: 1.5, ease: easeOutExpo }}
            >
              <span 
                className="text-8xl md:text-[10rem] font-serif text-silk"
                style={{ fontFamily: "'Italiana', serif" }}
              >
                {year}
              </span>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="relative z-10 pt-20 md:pt-28"
            >
              <motion.span
                variants={revealVariants}
                className="text-gold text-xs tracking-[0.3em] font-light uppercase block mb-4"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                SEASON {toRomanNumeral(seasonNumber)}
              </motion.span>

              <motion.h2
                variants={revealVariants}
                className="text-4xl md:text-5xl font-serif italic text-silk mb-6"
                style={{ fontFamily: "'Italiana', serif" }}
              >
                {season.title}
              </motion.h2>

              <motion.span
                variants={revealVariants}
                className="text-mist text-xs tracking-widest uppercase block mb-6"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {formatDateRange()}
              </motion.span>

              {season.description && (
                <motion.p
                  variants={revealVariants}
                  className="text-sm font-light text-mist leading-7 mb-8"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  {season.description}
                </motion.p>
              )}

              {season.scripture_reference && (
                <motion.div
                  variants={revealVariants}
                  className="flex items-start gap-3 mb-8"
                >
                  <BookOpen className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                  <span 
                    className="text-sm font-light text-gold/80 tracking-wide"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    {season.scripture_reference}
                  </span>
                </motion.div>
              )}

              {season.cover_image_url && (
                <motion.div
                  variants={revealVariants}
                  className="relative overflow-hidden rounded-sm group"
                >
                  <motion.img
                    src={season.cover_image_url}
                    alt={season.title}
                    className="w-full h-48 md:h-64 object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    variants={imageRevealVariants}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        <motion.div 
          className="lg:col-span-9 lg:pl-8"
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {season.reflection && (
            <motion.div
              variants={revealVariants}
              className="relative mb-12"
            >
              <div className="relative py-8 px-6 border-l-2 border-gold/20">
                <Quote className="w-5 h-5 text-gold/30 mb-4" />
                <p 
                  className="text-lg md:text-xl font-serif italic text-mist leading-relaxed"
                  style={{ fontFamily: "'Italiana', serif" }}
                >
                  "{season.reflection}"
                </p>
              </div>
            </motion.div>
          )}

          {season.songs && season.songs.length > 0 ? (
            <div className="space-y-3">
              {season.songs.map((seasonSong, songIndex) => (
                <motion.div
                  key={seasonSong.id}
                  variants={revealVariants}
                  custom={songIndex}
                  transition={{ 
                    delay: 0.3 + songIndex * 0.1,
                    duration: 1.2,
                    ease: easeOutExpo
                  }}
                >
                  <JourneySong
                    seasonSong={seasonSong}
                    showPlayCount={showPlayCounts}
                    showDate={showDates}
                    themeColor="gold"
                    trackNumber={songIndex + 1}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={revealVariants}
              className="flex items-center justify-center min-h-[200px] border border-white/5 rounded-sm"
            >
              <div className="text-center px-8 py-10">
                <Music className="w-8 h-8 text-mist/30 mx-auto mb-4" />
                <p 
                  className="text-sm text-mist/50 italic font-serif"
                  style={{ fontFamily: "'Italiana', serif" }}
                >
                  Songs coming soon...
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ journey, isPreview }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const sortedSeasons = [...journey.seasons].sort((a, b) => {
    const dateA = new Date(a.start_date).getTime();
    const dateB = new Date(b.start_date).getTime();
    return dateA - dateB;
  });

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
            className="text-[8rem] md:text-[12rem] font-serif text-silk/5 select-none"
            style={{ fontFamily: "'Italiana', serif" }}
          >
            I
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <Music className="w-12 h-12 text-mist/30" />
          </div>
        </div>
        <h3 
          className="text-3xl md:text-4xl font-serif italic text-silk mb-6"
          style={{ fontFamily: "'Italiana', serif" }}
        >
          A New Beginning
        </h3>
        <p 
          className="text-mist text-base font-light max-w-md leading-relaxed"
          style={{ fontFamily: "'Manrope', sans-serif" }}
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
        />
      ))}
      
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: easeOutExpo }}
        className="flex justify-center py-24 border-t border-white/5"
      >
        <div className="text-center">
          <span 
            className="text-gold text-xs tracking-[0.4em] uppercase font-light"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            The journey continues
          </span>
        </div>
      </motion.div>
    </div>
  );
};
