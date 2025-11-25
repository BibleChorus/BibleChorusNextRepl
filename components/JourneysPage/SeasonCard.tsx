'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Season } from '@/types/journey';
import { JourneySong } from './JourneySong';
import { Calendar, Music, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { FaQuoteLeft as Quote } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';

interface SeasonCardProps {
  season: Season;
  showPlayCounts?: boolean;
  showDates?: boolean;
  alignment?: 'left' | 'right';
}

const themeColors: Record<string, { gradient: string; accent: string; bg: string }> = {
  indigo: {
    gradient: 'from-indigo-500 via-indigo-400 to-blue-500',
    accent: 'text-indigo-500 dark:text-indigo-400',
    bg: 'from-indigo-500/10 to-blue-500/10',
  },
  purple: {
    gradient: 'from-purple-500 via-purple-400 to-pink-500',
    accent: 'text-purple-500 dark:text-purple-400',
    bg: 'from-purple-500/10 to-pink-500/10',
  },
  pink: {
    gradient: 'from-pink-500 via-rose-400 to-red-500',
    accent: 'text-pink-500 dark:text-pink-400',
    bg: 'from-pink-500/10 to-red-500/10',
  },
  amber: {
    gradient: 'from-amber-500 via-orange-400 to-yellow-500',
    accent: 'text-amber-500 dark:text-amber-400',
    bg: 'from-amber-500/10 to-yellow-500/10',
  },
  emerald: {
    gradient: 'from-emerald-500 via-green-400 to-teal-500',
    accent: 'text-emerald-500 dark:text-emerald-400',
    bg: 'from-emerald-500/10 to-teal-500/10',
  },
  cyan: {
    gradient: 'from-cyan-500 via-sky-400 to-blue-500',
    accent: 'text-cyan-500 dark:text-cyan-400',
    bg: 'from-cyan-500/10 to-blue-500/10',
  },
};

export const SeasonCard: React.FC<SeasonCardProps> = ({
  season,
  showPlayCounts = false,
  showDates = true,
  alignment = 'left',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const theme = themeColors[season.theme_color || 'indigo'] || themeColors.indigo;

  const formatDateRange = () => {
    const start = format(parseISO(season.start_date), 'MMM yyyy');
    const end = season.end_date ? format(parseISO(season.end_date), 'MMM yyyy') : 'Present';
    return `${start} — ${end}`;
  };

  return (
    <motion.div
      layout
      className="group relative"
    >
      <div className={`absolute -inset-1 bg-gradient-to-r ${theme.gradient} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
      
      <div className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-slate-700/40 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
        {season.cover_image_url && (
          <div className="relative h-48 overflow-hidden">
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
        
        <div className={`p-6 md:p-8 ${season.cover_image_url ? '-mt-12 relative' : ''}`}>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <motion.h3 
                className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent mb-2`}
              >
                {season.title}
              </motion.h3>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
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
            </div>
            
            {season.songs && season.songs.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-700/80 hover:bg-slate-200/80 dark:hover:bg-slate-600/80 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                )}
              </button>
            )}
          </div>
          
          {season.description && (
            <motion.p 
              className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {season.description}
            </motion.p>
          )}
          
          {season.scripture_reference && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r ${theme.bg} mb-6`}
            >
              <BookOpen className={`w-5 h-5 ${theme.accent} mt-0.5 flex-shrink-0`} />
              <span className={`text-sm font-medium ${theme.accent}`}>
                {season.scripture_reference}
              </span>
            </motion.div>
          )}
          
          {season.reflection && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="relative p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 mb-6"
            >
              <Quote className="absolute top-4 left-4 w-8 h-8 text-slate-200 dark:text-slate-700" />
              <p className="relative z-10 text-slate-600 dark:text-slate-300 italic leading-relaxed pl-6">
                {season.reflection}
              </p>
            </motion.div>
          )}
          
          <AnimatePresence mode="wait">
            {isExpanded && season.songs && season.songs.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-6">
                  <div className="space-y-3">
                    {season.songs.map((seasonSong, index) => (
                      <motion.div
                        key={seasonSong.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: index * 0.08,
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
