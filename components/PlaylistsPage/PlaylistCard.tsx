import React from 'react';
import { Playlist } from '../../types';
import Image from 'next/image';
import { Music2, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
  gradientIndex: number;
}

const gradients = [
  'from-purple-500 to-indigo-600',
  'from-blue-500 to-cyan-500',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-red-500 to-pink-500',
  'from-violet-500 to-purple-500',
  'from-sky-500 to-blue-500',
];

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick, gradientIndex }) => {
  const hasCoverArt = !!playlist.cover_art_url;
  const gradientBackground = `bg-gradient-to-br ${gradients[gradientIndex % gradients.length]}`;

  return (
    <Card
      onClick={onClick}
      className="group relative aspect-square overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl border-0 bg-card/50 backdrop-blur-sm"
    >
      {/* Background Image or Gradient */}
      {hasCoverArt ? (
        <div className="absolute inset-0">
          <Image
            src={playlist.cover_art_url}
            alt={`${playlist.name} Cover`}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      ) : (
        <div className={`absolute inset-0 ${gradientBackground} transition-transform duration-300 group-hover:scale-110`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <Music2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 text-white/20" />
        </div>
      )}

      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-white/90 dark:bg-black/90 rounded-full p-3 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
          <Play className="w-6 h-6 text-black dark:text-white fill-current" />
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-2 drop-shadow-lg">
          {playlist.name}
        </h3>
        {playlist.description && (
          <p className="text-white/80 text-xs mt-1 line-clamp-1 drop-shadow-md">
            {playlist.description}
          </p>
        )}
      </div>

      {/* Song Count Badge */}
      {playlist.song_count !== undefined && playlist.song_count > 0 && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
          {playlist.song_count} {playlist.song_count === 1 ? 'song' : 'songs'}
        </div>
      )}
    </Card>
  );
};

export default PlaylistCard;
