'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SeasonSong } from '@/types/journey';
import { Play, Clock, Headphones, Star, MessageCircle } from 'lucide-react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';

interface JourneySongProps {
  seasonSong: SeasonSong;
  showPlayCount?: boolean;
  showDate?: boolean;
  themeColor?: string;
}

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

const significanceStyles: Record<string, { icon: React.ReactNode; color: string }> = {
  favorite: {
    icon: <Star className="w-3.5 h-3.5" />,
    color: 'text-amber-500 bg-amber-500/10',
  },
  milestone: {
    icon: <Star className="w-3.5 h-3.5" />,
    color: 'text-purple-500 bg-purple-500/10',
  },
  breakthrough: {
    icon: <Star className="w-3.5 h-3.5" />,
    color: 'text-emerald-500 bg-emerald-500/10',
  },
};

export const JourneySong: React.FC<JourneySongProps> = ({
  seasonSong,
  showPlayCount = false,
  showDate = true,
  themeColor = 'indigo',
}) => {
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer();
  const song = seasonSong.song;
  
  if (!song) return null;

  const isCurrentSong = currentSong?.id === song.id;
  const artUrl = song.song_art_url ? `${CDN_URL}${song.song_art_url}` : '/default-song-art.png';

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => {
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

  const significance = seasonSong.significance ? significanceStyles[seasonSong.significance] : null;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={`group relative flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 cursor-pointer ${
        isCurrentSong 
          ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 shadow-lg' 
          : 'hover:bg-slate-100/80 dark:hover:bg-slate-700/50'
      }`}
      onClick={handlePlay}
    >
      <div className="relative flex-shrink-0">
        <div className={`relative w-14 h-14 rounded-xl overflow-hidden ${isCurrentSong ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-800' : ''}`}>
          <Image
            src={artUrl}
            alt={song.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
            isCurrentSong && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <motion.div
              initial={false}
              animate={isCurrentSong && isPlaying ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{ repeat: isCurrentSong && isPlaying ? Infinity : 0, duration: 1 }}
            >
              <Play className={`w-6 h-6 text-white ${isCurrentSong && isPlaying ? 'fill-white' : ''}`} />
            </motion.div>
          </div>
        </div>
        
        {significance && (
          <div className={`absolute -top-1 -right-1 p-1 rounded-full ${significance.color}`}>
            {significance.icon}
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className={`font-semibold truncate transition-colors ${
              isCurrentSong 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-800 dark:text-slate-200'
            }`}>
              {song.title}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {song.artist}
            </p>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
            {showDate && song.created_at && (
              <span className="hidden sm:inline">
                {format(parseISO(song.created_at), 'MMM d, yyyy')}
              </span>
            )}
            {showPlayCount && song.play_count !== undefined && (
              <span className="flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5" />
                {song.play_count.toLocaleString()}
              </span>
            )}
            {song.duration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(song.duration)}
              </span>
            )}
          </div>
        </div>
        
        {seasonSong.personal_note && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 flex items-start gap-2"
          >
            <MessageCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">
              "{seasonSong.personal_note}"
            </p>
          </motion.div>
        )}
      </div>
      
      {isCurrentSong && isPlaying && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <motion.div
            animate={{ scaleY: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 0.5, delay: 0 }}
            className="w-0.5 h-3 bg-indigo-500 rounded-full"
          />
          <motion.div
            animate={{ scaleY: [1, 1.8, 1] }}
            transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }}
            className="w-0.5 h-3 bg-purple-500 rounded-full"
          />
          <motion.div
            animate={{ scaleY: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }}
            className="w-0.5 h-3 bg-pink-500 rounded-full"
          />
        </div>
      )}
    </motion.div>
  );
};
