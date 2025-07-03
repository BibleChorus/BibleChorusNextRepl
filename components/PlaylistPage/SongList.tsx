import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Pause, Music, Clock, User } from 'lucide-react';
import { formatBibleVerses } from '@/lib/utils';
import { Song } from '@/types';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { motion } from 'framer-motion';

interface SongListProps {
  songs: Song[];
}

export const SongList: React.FC<SongListProps> = ({ songs }) => {
  return (
    <div className="space-y-6">
      {songs.map((song, index) => (
        <motion.div
          key={song.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <SongListItem song={song} allSongs={songs} />
        </motion.div>
      ))}
    </div>
  );
};

const SongListItem: React.FC<{ song: Song; allSongs: Song[] }> = ({ song, allSongs }) => {
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer();

  const handlePlayClick = () => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      playSong(
        {
          id: song.id,
          title: song.title,
          artist: song.artist || song.username,
          audioUrl: song.audio_url,
          audio_url: song.audio_url,
          coverArtUrl: song.song_art_url,
          duration: song.duration || 0,
          lyrics: song.lyrics,
          bible_verses: song.bible_verses,
          bible_translation_used: song.bible_translation_used,
          uploaded_by: song.uploaded_by,
        },
        allSongs.map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.artist || s.username,
          audioUrl: s.audio_url,
          audio_url: s.audio_url,
          coverArtUrl: s.song_art_url,
          duration: s.duration || 0,
          lyrics: s.lyrics,
          bible_verses: s.bible_verses,
          bible_translation_used: s.bible_translation_used,
          uploaded_by: s.uploaded_by,
        }))
      );
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';
  const isCurrentSong = currentSong?.id === song.id;

  return (
    <motion.div 
      className="group relative bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300/80 dark:hover:border-slate-600/80 transition-all duration-500 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/30"
      whileHover={{ scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Currently Playing Indicator */}
      {isCurrentSong && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      )}

      <div className="relative p-6 flex flex-col md:flex-row md:items-center gap-6">
        {/* Song Art with Enhanced Play Button */}
        <div className="flex-shrink-0 w-full md:w-48 h-48 relative group/image">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover/image:blur-2xl transition-all duration-500"></div>
          <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-white/20 dark:border-slate-700/50 shadow-lg">
            <Image
              src={song.song_art_url ? `${CDN_URL}${song.song_art_url}` : '/biblechorus-icon.png'}
              alt={song.title}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-500 group-hover/image:scale-105"
            />
            {/* Enhanced Play Button Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-all duration-300 flex items-center justify-center">
              <motion.button 
                onClick={handlePlayClick}
                className="relative bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-4 text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full"></span>
                {isCurrentSong && isPlaying ? (
                  <Pause className="relative w-8 h-8" />
                ) : (
                  <PlayCircle className="relative w-8 h-8" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Song Details with Enhanced Typography */}
        <div className="flex-grow space-y-4">
          {/* Title and Artist */}
          <div className="space-y-2">
            <Link 
              href={`/Songs/${song.id}`} 
              className="block text-2xl md:text-3xl font-bold text-slate-900 dark:text-white hover:bg-gradient-to-r hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 hover:bg-clip-text hover:text-transparent transition-all duration-300 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
            >
              {song.title}
            </Link>
            <div className="flex items-center gap-2 text-lg text-slate-600 dark:text-slate-300">
              <div className="w-6 h-6 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center">
                <User className="w-3 h-3" />
              </div>
              <span className="font-medium">{song.username || 'Unknown Artist'}</span>
            </div>
          </div>

          {/* Bible Verses */}
          {song.bible_verses && song.bible_verses.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-xl border border-indigo-500/20 dark:border-indigo-500/30">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mt-0.5">
                <Music className="w-3 h-3 text-white" />
              </div>
              <p className="text-indigo-700 dark:text-indigo-300 italic font-medium leading-relaxed">
                {formatBibleVerses(song.bible_verses)}
              </p>
            </div>
          )}

          {/* Meta Information Row */}
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            {song.duration && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center">
                  <Clock className="w-3 h-3" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatDuration(song.duration)}
                </span>
              </div>
            )}
          </div>

          {/* Enhanced Tags */}
          <div className="flex flex-wrap gap-1.5">
            {song.genres && song.genres.slice(0, 3).map((genre, index) => (
              <Badge
                key={`${song.id}-${genre}-${index}`}
                variant="secondary"
                className="text-xs px-2 py-0.5 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 border-0 rounded-md font-medium"
              >
                {genre}
              </Badge>
            ))}
            {song.genres && song.genres.length > 3 && (
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0.5 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 border-0 rounded-md font-medium"
              >
                +{song.genres.length - 3}
              </Badge>
            )}
            {song.bible_translation_used && (
              <Badge
                variant="outline"
                className="text-xs px-2 py-0.5 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-md font-medium"
              >
                {song.bible_translation_used}
              </Badge>
            )}
            {song.lyrics_scripture_adherence && (
              <Badge
                variant="default"
                className="text-xs px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 rounded-md font-medium"
              >
                {song.lyrics_scripture_adherence.replace(/_/g, ' ')}
              </Badge>
            )}
            {song.is_continuous_passage !== undefined && (
              <Badge
                variant="outline"
                className="text-xs px-2 py-0.5 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 rounded-md font-medium"
              >
                {song.is_continuous_passage ? 'Continuous' : 'Non-Continuous'}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SongList;
