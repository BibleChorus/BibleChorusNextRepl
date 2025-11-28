'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { SeasonSong } from '@/types/journey';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { format, parseISO } from 'date-fns';
import { BookOpen, Music } from 'lucide-react';
import LyricsBibleComparisonDialog from '@/components/ListenPage/LyricsBibleComparisonDialog';
import Image from 'next/image';

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

interface JourneySongProps {
  seasonSong: SeasonSong;
  showPlayCount?: boolean;
  showDate?: boolean;
  themeColor?: string;
  trackNumber?: number;
}

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];
const springTransition = { type: "spring" as const, stiffness: 400, damping: 30 };

export const JourneySong: React.FC<JourneySongProps> = ({
  seasonSong,
  showDate = true,
  trackNumber = 1,
}) => {
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const song = seasonSong.song;

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
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
    activeBg: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
  };
  
  if (!song) return null;
  
  const songAny = song as any;
  const hasLyricsOrVerses = (songAny.lyrics && songAny.lyrics.trim().length > 0) || 
                            (songAny.bible_verses && songAny.bible_verses.length > 0);

  const isCurrentSong = currentSong?.id === song.id;
  const isCurrentlyPlaying = isCurrentSong && isPlaying;
  const hasPersonalNote = seasonSong.personal_note && seasonSong.personal_note.trim().length > 0;
  const journeySongOrigin = songAny.journey_song_origin;
  
  const showArt = isHovered || isTouched || isCurrentSong;
  const songArtUrl = song.song_art_url ? `${CDN_URL}${song.song_art_url}` : null;
  
  const formatJourneySongOrigin = (origin: string): string => {
    const originMap: { [key: string]: string } = {
      'prior_recording': 'Previously Written Song',
      'prophetic_word': 'Prayer or Prophetic Utterance',
      'personal_experience': 'Personal Experience',
      'scripture_meditation': 'Scripture Meditation',
      'worship_session': 'Worship Session',
      'dream_vision': 'Dream or Vision',
      'testimony': 'Testimony',
      'prayer': 'Prayer',
      'other': 'Other',
    };
    return originMap[origin] || origin?.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || '';
  };

  const hasOrigin = journeySongOrigin && journeySongOrigin.trim().length > 0;
  const showNote = hasPersonalNote && (isHovered || isTouched || isCurrentSong);
  const showOrigin = hasOrigin && (isHovered || isTouched || isCurrentSong);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTrackNumber = (num: number) => {
    return num.toString().padStart(2, '0');
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentSong) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      playSong({
        id: song.id,
        title: song.title,
        artist: song.artist,
        audioUrl: song.audio_url,
        audio_url: song.audio_url,
        coverArtUrl: song.song_art_url || undefined,
        duration: song.duration,
        uploaded_by: 0,
        lyrics: songAny.lyrics,
        bible_verses: songAny.bible_verses,
        bible_translation_used: songAny.bible_translation_used,
      });
    }
  };

  const handleTouchStart = () => {
    setIsTouched(true);
  };

  const handleTouchEnd = () => {
    setTimeout(() => setIsTouched(false), 3000);
  };

  if (!mounted) {
    return <div className="py-6 px-3" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: easeOutExpo }}
      className="track-row group cursor-pointer relative overflow-hidden"
      style={{ 
        borderBottom: `1px solid ${theme.border}`,
        fontFamily: "'Manrope', sans-serif"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handlePlay}
    >
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0, x: '-100%' }}
        animate={{ 
          opacity: isHovered ? 1 : isCurrentSong ? 0.5 : 0,
          x: isHovered ? '0%' : isCurrentSong ? '0%' : '-100%'
        }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        style={{ 
          background: `linear-gradient(90deg, ${theme.accent}08 0%, ${theme.accent}03 50%, transparent 100%)`
        }}
      />
      
      <motion.div 
        className="absolute left-0 top-0 bottom-0 w-[2px] pointer-events-none"
        initial={{ scaleY: 0 }}
        animate={{ 
          scaleY: isHovered || isCurrentSong ? 1 : 0,
          backgroundColor: isCurrentSong ? theme.accent : `${theme.accent}80`
        }}
        transition={{ duration: 0.3, ease: easeOutExpo }}
        style={{ originY: 0.5 }}
      />

      <AnimatePresence>
        {showArt && songArtUrl && (
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-24 md:w-32 pointer-events-none overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
          >
            <div className="absolute inset-0 z-10" style={{ 
              background: `linear-gradient(to right, ${theme.bg}, transparent 30%)` 
            }} />
            <motion.div
              className="absolute inset-0"
              initial={{ filter: 'grayscale(100%)' }}
              animate={{ filter: isCurrentlyPlaying ? 'grayscale(0%)' : 'grayscale(100%)' }}
              whileHover={{ filter: 'grayscale(0%)' }}
              transition={{ duration: 0.8, ease: easeOutExpo }}
            >
              <Image
                src={songArtUrl}
                alt={song.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 96px, 128px"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showArt && !songArtUrl && (
        <motion.div
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-lg pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: easeOutExpo }}
          style={{ backgroundColor: theme.bgAlt, border: `1px solid ${theme.border}` }}
        >
          <Music className="w-5 h-5 md:w-6 md:h-6" style={{ color: theme.textMuted }} />
        </motion.div>
      )}

      <motion.div 
        className="flex items-center gap-4 md:gap-6 py-6 px-3 relative z-10"
        animate={{ 
          x: isHovered ? 8 : 0,
          paddingRight: showArt && songArtUrl ? '140px' : '12px',
          transition: springTransition
        }}
      >
        <motion.span 
          className="text-xs font-mono w-6 flex-shrink-0"
          animate={{ 
            color: isCurrentSong ? theme.accent : isHovered ? theme.text : theme.textSecondary 
          }}
          transition={{ duration: 0.3 }}
        >
          {formatTrackNumber(trackNumber)}
        </motion.span>

        <motion.button
          onClick={handlePlay}
          className="w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0"
          animate={{
            borderColor: isCurrentlyPlaying ? theme.accent : isHovered ? theme.accent : theme.borderHover,
            backgroundColor: isCurrentlyPlaying ? `${theme.accent}1a` : isHovered ? `${theme.accent}0d` : 'rgba(0, 0, 0, 0)',
            scale: isHovered && !isCurrentlyPlaying ? 1.1 : 1
          }}
          transition={{ duration: 0.3, ease: easeOutExpo }}
          whileTap={{ scale: 0.95 }}
          aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
        >
          {isCurrentlyPlaying ? (
            <div className="flex items-end gap-[2px] h-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: ['8px', '16px', '10px', '20px', '8px'],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.8 + i * 0.15,
                    ease: "easeInOut",
                    delay: i * 0.1
                  }}
                  className="w-[2px] rounded-full"
                  style={{ height: '8px', backgroundColor: theme.accent }}
                />
              ))}
            </div>
          ) : (
            <motion.svg 
              className="w-3 h-3 ml-0.5"
              animate={{ color: isCurrentSong ? theme.accent : isHovered ? theme.accent : theme.text }}
              transition={{ duration: 0.3 }}
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </motion.svg>
          )}
        </motion.button>

        <div className="flex-1 min-w-0">
          <motion.h4 
            className="text-lg md:text-xl font-light tracking-wide truncate"
            animate={{ 
              color: isCurrentSong ? theme.accent : isHovered ? theme.accent : theme.text 
            }}
            transition={{ duration: 0.3, ease: easeOutExpo }}
          >
            {song.title}
          </motion.h4>
          
          <div className="flex items-center gap-3 mt-1">
            {showDate && (song.journey_date || song.created_at) && (
              <motion.span 
                className="text-[10px] uppercase tracking-widest"
                animate={{ 
                  color: isHovered ? theme.text : theme.textSecondary 
                }}
                transition={{ duration: 0.3 }}
              >
                {(() => {
                  const dateStr = song.journey_date || song.created_at!;
                  const datePart = dateStr.split('T')[0].split(' ')[0];
                  const [year, month, day] = datePart.split('-').map(Number);
                  return format(new Date(year, month - 1, day), 'MMMM do, yyyy');
                })()}
              </motion.span>
            )}
          </div>
        </div>

        {hasLyricsOrVerses && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLyrics(true);
            }}
            className="w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
            style={{ 
              borderColor: theme.border,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${theme.accent}80`;
              e.currentTarget.style.backgroundColor = `${theme.accent}0d`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="View lyrics and scripture"
          >
            <BookOpen 
              className="w-3.5 h-3.5 transition-colors" 
              style={{ color: theme.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
              onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
            />
          </button>
        )}

        <motion.span 
          className="text-xs font-mono flex-shrink-0"
          animate={{ 
            color: isCurrentSong ? theme.accent : isHovered ? theme.text : theme.textSecondary 
          }}
          transition={{ duration: 0.3 }}
        >
          {song.duration > 0 ? formatDuration(song.duration) : '--:--'}
        </motion.span>
      </motion.div>

      <AnimatePresence>
        {showOrigin && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              duration: 0.5, 
              ease: easeOutExpo,
              opacity: { duration: 0.3 }
            }}
            className="overflow-hidden"
          >
            <motion.div 
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.4, ease: easeOutExpo }}
              className="pt-2 pb-2 pl-[52px] md:pl-[68px]"
              style={{ paddingRight: showArt && songArtUrl ? '140px' : '16px' }}
            >
              <span 
                className="text-[11px] uppercase tracking-widest"
                style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, color: `${theme.accent}99` }}
              >
                Origin: {formatJourneySongOrigin(journeySongOrigin)}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNote && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              duration: 0.5, 
              ease: easeOutExpo,
              opacity: { duration: 0.3 }
            }}
            className="overflow-hidden"
          >
            <motion.div 
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.4, ease: easeOutExpo }}
              className="pt-2 pb-6 pl-[52px] md:pl-[68px]"
              style={{ paddingRight: showArt && songArtUrl ? '140px' : '16px' }}
            >
              <div 
                className="relative pl-6"
                style={{ borderLeft: `1px solid ${theme.accent}33` }}
              >
                <span 
                  className="absolute -left-3 -top-1 text-xl select-none"
                  style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 300, color: `${theme.accent}66` }}
                >
                  "
                </span>
                <p 
                  className="text-[13px] leading-relaxed tracking-wide"
                  style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 300, fontStyle: 'italic', color: `${theme.textSecondary}b3` }}
                >
                  {seasonSong.personal_note}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <LyricsBibleComparisonDialog
          isOpen={showLyrics}
          onClose={() => setShowLyrics(false)}
          song={songAny}
        />
      </div>
    </motion.div>
  );
};
