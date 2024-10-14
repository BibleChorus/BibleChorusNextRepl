import React from 'react';
import { Playlist } from '../types';
import Image from 'next/image';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
  gradientIndex: number;
}

const gradients = [
  'from-purple-500 to-indigo-600',
  'from-blue-500 to-teal-400',
  'from-red-500 to-pink-500',
  'from-yellow-400 to-orange-500',
  'from-green-400 to-cyan-500',
];

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick, gradientIndex }) => {
  const hasCoverArt = !!playlist.cover_art_url;
  const gradientBackground = `bg-gradient-to-br ${gradients[gradientIndex % gradients.length]}`;

  return (
    <div
      onClick={onClick}
      className="aspect-square rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 relative"
    >
      {hasCoverArt ? (
        <>
          <Image
            src={playlist.cover_art_url || '/default-playlist-cover.jpg'}
            alt={`${playlist.name} Cover`}
            layout="fill"
            objectFit="cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black to-transparent opacity-70"></div>
          <p className="absolute bottom-2 left-2 right-2 text-white text-sm sm:text-base font-semibold truncate shadow-sm">
            {playlist.name}
          </p>
        </>
      ) : (
        <div className={`h-full w-full flex items-center justify-center text-white ${gradientBackground}`}>
          <p className="text-sm sm:text-base font-semibold text-center px-2">{playlist.name}</p>
        </div>
      )}
    </div>
  );
};

export default PlaylistCard;
