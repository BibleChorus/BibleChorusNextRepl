import React from 'react';
import PlaylistCard from './PlaylistCard';
import { Playlist } from '../../types';
import { motion } from 'framer-motion';

interface PlaylistSectionProps {
  title: string;
  playlists: Playlist[];
  onPlaylistClick: (playlistId: number) => void;
}

const PlaylistSection: React.FC<PlaylistSectionProps> = ({ title, playlists, onPlaylistClick }) => {
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
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full">
      {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5"
      >
        {playlists.map((playlist, index) => (
          <motion.div
            key={playlist.id}
            variants={item}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
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
