import React from 'react';
import PlaylistCard from './PlaylistCard';
import { Playlist } from '../../types';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

interface PlaylistSectionProps {
  title: string;
  playlists: Playlist[];
  onPlaylistClick: (playlistId: number) => void;
}

const PlaylistSection: React.FC<PlaylistSectionProps> = ({ title, playlists, onPlaylistClick }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const theme = {
    text: isDark ? '#e5e5e5' : '#161616',
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="w-full">
      {title && (
        <h2 
          className="text-xl md:text-2xl mb-8 tracking-wide"
          style={{ fontFamily: "'Italiana', serif", color: theme.text }}
        >
          {title}
        </h2>
      )}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
      >
        {playlists.map((playlist, index) => (
          <motion.div
            key={playlist.id}
            variants={item}
          >
            <PlaylistCard
              playlist={playlist}
              onClick={() => onPlaylistClick(playlist.id)}
              gradientIndex={index}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default PlaylistSection;
