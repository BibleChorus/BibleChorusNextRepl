import React from 'react';
// Import types for TypeScript
import { Playlist } from '../types';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
}

// Component for displaying an individual playlist card
const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick }) => {
  // Determine if the playlist has cover art
  const hasCoverArt = !!playlist.cover_art_url;

  // Generate a gradient background if no cover art is available
  const gradientBackground = `bg-gradient-to-br from-purple-500 to-indigo-600`;

  return (
    <div
      onClick={onClick}
      className="w-48 flex-shrink-0 cursor-pointer"
    >
      {/* Playlist image or gradient background */}
      <div
        className={`h-48 w-full rounded-lg mb-2 overflow-hidden ${!hasCoverArt && gradientBackground}`}
      >
        {hasCoverArt ? (
          // Display the cover art image
          <img
            src={playlist.cover_art_url}
            alt={`${playlist.name} Cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          // Display the initials of the playlist name if no cover art
          <div className="h-full w-full flex items-center justify-center text-white text-4xl font-bold">
            {playlist.name.charAt(0)}
          </div>
        )}
      </div>
      {/* Playlist name */}
      <p className="text-sm font-semibold truncate">{playlist.name}</p>
    </div>
  );
};

export default PlaylistCard;
