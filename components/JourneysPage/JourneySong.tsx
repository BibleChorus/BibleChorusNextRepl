'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SeasonSong } from '@/types/journey';
import { Play, Pause, Clock, Headphones, Star, Sparkles, MessageCircle, Heart } from 'lucide-react';
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

const themeColors: Record<string, { gradient: string; accent: string; glow: string; ring: string }> = {
  indigo: {
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    accent: 'text-indigo-600 dark:text-indigo-400',
    glow: 'shadow-indigo-500/30',
    ring: 'ring-indigo-500/50',
  },
  purple: {
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    accent: 'text-purple-600 dark:text-purple-400',
    glow: 'shadow-purple-500/30',
    ring: 'ring-purple-500/50',
  },
  pink: {
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    accent: 'text-pink-600 dark:text-pink-400',
    glow: 'shadow-pink-500/30',
    ring: 'ring-pink-500/50',
  },
  amber: {
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    accent: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-amber-500/30',
    ring: 'ring-amber-500/50',
  },
  emerald: {
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    accent: 'text-emerald-600 dark:text-emerald-400',
    glow: 'shadow-emerald-500/30',
    ring: 'ring-emerald-500/50',
  },
  cyan: {
    gradient: 'from-cyan-500 via-sky-500 to-blue-500',
    accent: 'text-cyan-600 dark:text-cyan-400',
    glow: 'shadow-cyan-500/30',
    ring: 'ring-cyan-500/50',
  },
};

const significanceStyles: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  favorite: {
    icon: <Heart className="w-3 h-3" />,
    label: 'Favorite',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  milestone: {
    icon: <Star className="w-3 h-3" />,
    label: 'Milestone',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  breakthrough: {
    icon: <Sparkles className="w-3 h-3" />,
    label: 'Breakthrough',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 border-rose-500/20',
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
  const theme = themeColors[themeColor] || themeColors.indigo;
  
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
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative flex items-center gap-5 p-4 rounded-2xl cursor-pointer transition-all duration-500 ${
        isCurrentSong 
          ? `bg-gradient-to-r from-white/90 to-white/70 dark:from-slate-800/90 dark:to-slate-800/70 shadow-xl ${theme.glow}` 
          : 'bg-white/60 dark:bg-slate-800/40 hover:bg-white/90 dark:hover:bg-slate-800/70 hover:shadow-xl'
      } backdrop-blur-xl border border-white/30 dark:border-slate-700/30`}
      onClick={handlePlay}
    >
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
      />
      
      <div className="relative flex-shrink-0">
        <motion.div 
          animate={isCurrentSong && isPlaying ? { 
            boxShadow: ['0 0 0 0 rgba(99, 102, 241, 0.4)', '0 0 0 12px rgba(99, 102, 241, 0)', '0 0 0 0 rgba(99, 102, 241, 0.4)']
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={`relative w-16 h-16 rounded-xl overflow-hidden shadow-lg ${
            isCurrentSong ? `ring-2 ${theme.ring} ring-offset-2 ring-offset-white dark:ring-offset-slate-900` : ''
          }`}
        >
          <Image
            src={artUrl}
            alt={song.title}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-110"
          />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: isCurrentSong ? 1 : 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1 }}
              className={`w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-center shadow-lg`}
            >
              {isCurrentSong && isPlaying ? (
                <Pause className="w-4 h-4 text-slate-900 dark:text-white" />
              ) : (
                <Play className="w-4 h-4 text-slate-900 dark:text-white ml-0.5" />
              )}
            </motion.div>
          </motion.div>
        </motion.div>
        
        {significance && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-full ${significance.bg} border ${significance.color} shadow-sm`}
          >
            {significance.icon}
          </motion.div>
        )}
      </div>
      
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 
              className={`font-medium text-base truncate transition-colors duration-300 ${
                isCurrentSong 
                  ? theme.accent
                  : 'text-slate-800 dark:text-slate-100'
              }`}
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {song.title}
            </h4>
            <p 
              className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {song.artist}
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
            {showDate && song.created_at && (
              <span className="hidden sm:inline tracking-wide">
                {format(parseISO(song.created_at), 'MMM d, yyyy')}
              </span>
            )}
            {showPlayCount && song.play_count !== undefined && (
              <span className="flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5" />
                <span className="tabular-nums">{song.play_count.toLocaleString()}</span>
              </span>
            )}
            {song.duration > 0 && (
              <span className="flex items-center gap-1.5 tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(song.duration)}
              </span>
            )}
          </div>
        </div>
        
        {seasonSong.personal_note && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 flex items-start gap-2"
          >
            <MessageCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <p 
              className="text-sm text-slate-500 dark:text-slate-400 italic line-clamp-2"
              style={{ fontFamily: "'Crimson Text', Georgia, serif" }}
            >
              "{seasonSong.personal_note}"
            </p>
          </motion.div>
        )}
      </div>
      
      {isCurrentSong && isPlaying && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute right-5 top-1/2 -translate-y-1/2 flex items-end gap-0.5 h-5"
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                height: ['40%', '100%', '60%', '80%', '40%'],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 0.8 + i * 0.1,
                ease: "easeInOut",
                delay: i * 0.1
              }}
              className={`w-0.5 rounded-full bg-gradient-to-t ${theme.gradient}`}
              style={{ height: '40%' }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};
