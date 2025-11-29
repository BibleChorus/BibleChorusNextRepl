import React from 'react';
import { Playlist } from '../../types';
import Image from 'next/image';
import { Music2, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
  gradientIndex: number;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick, gradientIndex }) => {
  const hasCoverArt = !!playlist.cover_art_url;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Card
        onClick={onClick}
        className="group relative aspect-square overflow-hidden cursor-pointer transition-all duration-500 rounded-none"
        style={{
          backgroundColor: theme.bgCard,
          border: `1px solid ${theme.border}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.borderHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.border;
        }}
      >
        {hasCoverArt ? (
          <div className="absolute inset-0">
            <Image
              src={playlist.cover_art_url!}
              alt={`${playlist.name} Cover`}
              layout="fill"
              objectFit="cover"
              className="transition-all duration-700 group-hover:scale-105 grayscale-[20%] group-hover:grayscale-0"
            />
            <div 
              className="absolute inset-0 transition-opacity duration-500"
              style={{
                background: `linear-gradient(to top, ${isDark ? 'rgba(5,5,5,0.95)' : 'rgba(0,0,0,0.85)'} 0%, ${isDark ? 'rgba(5,5,5,0.5)' : 'rgba(0,0,0,0.3)'} 40%, transparent 100%)`
              }}
            />
          </div>
        ) : (
          <div 
            className="absolute inset-0 transition-all duration-500"
            style={{ backgroundColor: theme.bgCard }}
          >
            <div 
              className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500"
              style={{
                background: `linear-gradient(135deg, ${theme.accent} 0%, transparent 50%)`
              }}
            />
            <Music2 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 transition-all duration-500 group-hover:scale-110"
              style={{ color: theme.border }}
            />
          </div>
        )}

        <div 
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500"
        >
          <motion.div 
            className="p-4 transform scale-0 group-hover:scale-100 transition-all duration-500"
            style={{
              backgroundColor: theme.accent,
            }}
            whileHover={{ scale: 1.1 }}
          >
            <Play 
              className="w-6 h-6 fill-current translate-x-0.5" 
              style={{ color: isDark ? '#050505' : '#ffffff' }}
            />
          </motion.div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <h3 
            className="font-medium text-sm sm:text-base line-clamp-2 leading-tight mb-1 tracking-wide"
            style={{ 
              fontFamily: "'Italiana', serif",
              color: hasCoverArt ? '#ffffff' : theme.text
            }}
          >
            {playlist.name}
          </h3>
          {playlist.description && (
            <p 
              className="text-xs sm:text-sm mt-1 line-clamp-1 font-light"
              style={{ 
                color: hasCoverArt ? 'rgba(255,255,255,0.8)' : theme.textSecondary
              }}
            >
              {playlist.description}
            </p>
          )}
        </div>

        {playlist.song_count !== undefined && playlist.song_count > 0 && (
          <div 
            className="absolute top-3 right-3 text-[10px] tracking-[0.15em] uppercase px-2.5 py-1.5 font-medium"
            style={{
              backgroundColor: isDark ? 'rgba(5,5,5,0.9)' : 'rgba(255,255,255,0.95)',
              color: theme.accent,
              border: `1px solid ${theme.border}`,
            }}
          >
            {playlist.song_count} {playlist.song_count === 1 ? 'song' : 'songs'}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default PlaylistCard;
