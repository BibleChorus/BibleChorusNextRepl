'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SeasonSong } from '@/types/journey';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { format, parseISO } from 'date-fns';
import { BookOpen } from 'lucide-react';
import LyricsBibleComparisonDialog from '@/components/ListenPage/LyricsBibleComparisonDialog';

interface JourneySongProps {
  seasonSong: SeasonSong;
  showPlayCount?: boolean;
  showDate?: boolean;
  themeColor?: string;
  trackNumber?: number;
}

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const JourneySong: React.FC<JourneySongProps> = ({
  seasonSong,
  showDate = true,
  trackNumber = 1,
}) => {
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer();
  const [showLyrics, setShowLyrics] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const song = seasonSong.song;
  
  if (!song) return null;
  
  const songAny = song as any;
  const hasLyricsOrVerses = (songAny.lyrics && songAny.lyrics.trim().length > 0) || 
                            (songAny.bible_verses && songAny.bible_verses.length > 0);

  const isCurrentSong = currentSong?.id === song.id;
  const isCurrentlyPlaying = isCurrentSong && isPlaying;
  const hasPersonalNote = seasonSong.personal_note && seasonSong.personal_note.trim().length > 0;
  const journeySongOrigin = songAny.journey_song_origin;
  
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: easeOutExpo }}
      className={`track-row group border-b border-white/10 cursor-pointer transition-all duration-300 ${
        isCurrentSong ? 'bg-white/[0.02]' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handlePlay}
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <motion.div 
        className="flex items-center gap-4 md:gap-6 py-6"
        whileHover={{ x: -4, backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <span 
          className={`text-xs font-mono w-6 flex-shrink-0 transition-colors duration-300 ${
            isCurrentSong ? 'text-gold' : 'text-mist'
          }`}
        >
          {formatTrackNumber(trackNumber)}
        </span>

        <button
          onClick={handlePlay}
          className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            isCurrentlyPlaying 
              ? 'border-gold bg-gold/10' 
              : 'border-white/20 hover:border-white bg-transparent'
          }`}
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
                  className="w-[2px] bg-gold rounded-full"
                  style={{ height: '8px' }}
                />
              ))}
            </div>
          ) : (
            <svg 
              className={`w-3 h-3 ml-0.5 transition-colors duration-300 ${
                isCurrentSong ? 'text-gold' : 'text-silk'
              }`}
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h4 
            className={`text-lg md:text-xl font-light tracking-wide truncate transition-all duration-300 group-hover:translate-x-2 ${
              isCurrentSong ? 'text-gold' : 'text-silk'
            }`}
          >
            {song.title}
          </h4>
          
          <div className="flex items-center gap-3 mt-1">
            {showDate && (song.journey_date || song.created_at) && (
              <span className="text-[10px] text-mist uppercase tracking-widest">
                {(() => {
                  const dateStr = song.journey_date || song.created_at!;
                  const datePart = dateStr.split('T')[0].split(' ')[0];
                  const [year, month, day] = datePart.split('-').map(Number);
                  return format(new Date(year, month - 1, day), 'MMMM do, yyyy');
                })()}
              </span>
            )}
          </div>
        </div>

        {hasLyricsOrVerses && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLyrics(true);
            }}
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:border-gold/50 hover:bg-gold/5"
            aria-label="View lyrics and scripture"
          >
            <BookOpen className="w-3.5 h-3.5 text-mist group-hover:text-gold transition-colors" />
          </button>
        )}

        <span 
          className={`text-xs font-mono flex-shrink-0 transition-colors duration-300 ${
            isCurrentSong ? 'text-gold' : 'text-mist'
          }`}
        >
          {song.duration > 0 ? formatDuration(song.duration) : '--:--'}
        </span>
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
              className="pt-2 pb-2 pl-[52px] md:pl-[68px] pr-4"
            >
              <span 
                className="text-[11px] text-gold/60 uppercase tracking-widest"
                style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400 }}
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
              className="pt-2 pb-6 pl-[52px] md:pl-[68px] pr-4"
            >
              <div className="relative pl-6 border-l border-gold/20">
                <span 
                  className="absolute -left-3 -top-1 text-xl text-gold/40 select-none"
                  style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 300 }}
                >
                  "
                </span>
                <p 
                  className="text-[13px] text-mist/70 leading-relaxed tracking-wide"
                  style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 300, fontStyle: 'italic' }}
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
