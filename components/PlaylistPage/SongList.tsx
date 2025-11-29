import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Pause, Music, Clock, User } from 'lucide-react';
import { formatBibleVerses } from '@/lib/utils';
import { Song } from '@/types';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '/biblechorus-icon.png';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return CDN_URL ? `${CDN_URL}${path}` : `/${path}`;
};

interface SongListProps {
  songs: Song[];
}

export const SongList: React.FC<SongListProps> = ({ songs }) => {
  return (
    <div className="space-y-4">
      {songs.map((song, index) => (
        <motion.div
          key={song.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
        >
          <SongListItem song={song} allSongs={songs} />
        </motion.div>
      ))}
    </div>
  );
};

const SongListItem: React.FC<{ song: Song; allSongs: Song[] }> = ({ song, allSongs }) => {
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    textMuted: isDark ? '#6f6f6f' : '#6f6f6f',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
  };

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

  const isCurrentSong = currentSong?.id === song.id;

  return (
    <motion.div 
      className="group relative transition-all duration-500 overflow-hidden"
      style={{
        backgroundColor: theme.bgCard,
        border: `1px solid ${isCurrentSong ? theme.borderHover : theme.border}`,
      }}
      whileHover={{ y: -2 }}
      onMouseEnter={(e) => {
        if (!isCurrentSong) {
          e.currentTarget.style.borderColor = theme.borderHover;
          e.currentTarget.style.backgroundColor = theme.hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        if (!isCurrentSong) {
          e.currentTarget.style.borderColor = theme.border;
          e.currentTarget.style.backgroundColor = theme.bgCard;
        }
      }}
    >
      {isCurrentSong && (
        <div 
          className="absolute top-0 left-0 w-1 h-full"
          style={{ backgroundColor: theme.accent }}
        />
      )}

      <div className="relative p-5 flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex-shrink-0 w-full md:w-32 h-32 relative group/image">
          <div 
            className="relative w-full h-full overflow-hidden"
            style={{ border: `1px solid ${theme.border}` }}
          >
            <Image
              src={getImageUrl(song.song_art_url)}
              alt={song.title}
              layout="fill"
              objectFit="cover"
              className="transition-all duration-500 group-hover/image:scale-105 grayscale-[20%] group-hover/image:grayscale-0"
            />
            <div 
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all duration-300"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              <motion.button 
                onClick={handlePlayClick}
                className="p-3 transition-all duration-300"
                style={{
                  backgroundColor: theme.accent,
                  color: isDark ? '#050505' : '#ffffff',
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCurrentSong && isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <PlayCircle className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        <div className="flex-grow space-y-3">
          <div className="space-y-1.5">
            <Link 
              href={`/Songs/${song.id}`} 
              className="block text-lg md:text-xl tracking-wide transition-colors duration-300"
              style={{ 
                fontFamily: "'Italiana', serif",
                color: theme.text
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.text;
              }}
            >
              {song.title}
            </Link>
            <div 
              className="flex items-center gap-2 text-sm font-light"
              style={{ color: theme.textSecondary }}
            >
              <User className="w-3 h-3" />
              <span>{song.username || 'Unknown Artist'}</span>
            </div>
          </div>

          {song.bible_verses && song.bible_verses.length > 0 && (
            <div 
              className="flex items-start gap-3 p-3"
              style={{ 
                backgroundColor: theme.hoverBg,
                border: `1px solid ${theme.border}`
              }}
            >
              <Music className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.accent }} />
              <p 
                className="text-sm italic font-light leading-relaxed"
                style={{ color: theme.textSecondary }}
              >
                {formatBibleVerses(song.bible_verses)}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {song.duration && (
              <div 
                className="flex items-center gap-2 text-xs tracking-[0.1em] uppercase"
                style={{ color: theme.textMuted }}
              >
                <Clock className="w-3 h-3" />
                <span>{formatDuration(song.duration)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {song.genres && song.genres.slice(0, 3).map((genre, index) => (
              <Badge
                key={`${song.id}-${genre}-${index}`}
                variant="secondary"
                className="text-[10px] tracking-[0.1em] uppercase px-2 py-1 rounded-none font-medium"
                style={{
                  backgroundColor: 'transparent',
                  color: theme.textSecondary,
                  border: `1px solid ${theme.border}`,
                }}
              >
                {genre}
              </Badge>
            ))}
            {song.genres && song.genres.length > 3 && (
              <Badge 
                variant="secondary" 
                className="text-[10px] tracking-[0.1em] uppercase px-2 py-1 rounded-none font-medium"
                style={{
                  backgroundColor: 'transparent',
                  color: theme.textSecondary,
                  border: `1px solid ${theme.border}`,
                }}
              >
                +{song.genres.length - 3}
              </Badge>
            )}
            {song.bible_translation_used && (
              <Badge 
                variant="outline" 
                className="text-[10px] tracking-[0.1em] uppercase px-2 py-1 rounded-none font-medium"
                style={{
                  backgroundColor: 'transparent',
                  color: theme.accent,
                  border: `1px solid ${theme.borderHover}`,
                }}
              >
                {song.bible_translation_used}
              </Badge>
            )}
            {song.lyrics_scripture_adherence && (
              <Badge 
                className="text-[10px] tracking-[0.1em] uppercase px-2 py-1 rounded-none font-medium"
                style={{
                  backgroundColor: theme.accent,
                  color: isDark ? '#050505' : '#ffffff',
                  border: 'none',
                }}
              >
                {song.lyrics_scripture_adherence.replace(/_/g, ' ')}
              </Badge>
            )}
            {song.is_continuous_passage !== undefined && (
              <Badge 
                variant="outline" 
                className="text-[10px] tracking-[0.1em] uppercase px-2 py-1 rounded-none font-medium"
                style={{
                  backgroundColor: 'transparent',
                  color: theme.textSecondary,
                  border: `1px solid ${theme.border}`,
                }}
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
