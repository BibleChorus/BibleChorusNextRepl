'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SeasonSong } from '@/types/journey';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { format, parseISO } from 'date-fns';
import { BookOpen } from 'lucide-react';
import JourneyLyricsDialog from './JourneyLyricsDialog';

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
  const song = seasonSong.song;
  
  if (!song) return null;
  
  const songAny = song as any;
  const hasLyricsOrVerses = (songAny.lyrics && songAny.lyrics.trim().length > 0) || 
                            (songAny.bible_verses && songAny.bible_verses.length > 0);

  const isCurrentSong = currentSong?.id === song.id;
  const isCurrentlyPlaying = isCurrentSong && isPlaying;

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
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: easeOutExpo }}
      whileHover={{ x: -4, backgroundColor: 'rgba(255,255,255,0.03)' }}
      className={`track-row group flex items-center gap-4 md:gap-6 py-6 border-b border-white/10 cursor-pointer transition-all duration-300 ${
        isCurrentSong ? 'bg-white/[0.02]' : ''
      }`}
      onClick={handlePlay}
      style={{ fontFamily: "'Manrope', sans-serif" }}
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
          {showDate && song.created_at && (
            <span className="text-[10px] text-mist uppercase tracking-widest">
              {format(parseISO(song.created_at), 'MMMM do, yyyy')}
            </span>
          )}
          {seasonSong.personal_note && (
            <>
              {showDate && song.created_at && (
                <span className="text-mist/30">·</span>
              )}
              <span className="text-[10px] text-mist/60 italic truncate max-w-[200px]">
                "{seasonSong.personal_note}"
              </span>
            </>
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

      <JourneyLyricsDialog
        isOpen={showLyrics}
        onClose={() => setShowLyrics(false)}
        song={song}
      />
    </motion.div>
  );
};
