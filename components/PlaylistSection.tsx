import React from 'react';
// Import the PlaylistCard component to display individual playlists
import PlaylistCard from './PlaylistCard';
// Import types for TypeScript
import { Playlist } from '../types';

interface PlaylistSectionProps {
  title: string;
  playlists: Playlist[];
  onPlaylistClick: (playlistId: number) => void;
}

// Component for displaying a section of playlists (e.g., Auto Playlists)
const PlaylistSection: React.FC<PlaylistSectionProps> = ({ title, playlists, onPlaylistClick }) => {
  return (
    <div className="mb-8">
      {/* Section title */}
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {/* Horizontally scrollable row of playlist cards */}
      <div className="flex space-x-4 overflow-x-auto">
        {/* Loop through each playlist and render a PlaylistCard */}
        {playlists.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            onClick={() => onPlaylistClick(playlist.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default PlaylistSection;
