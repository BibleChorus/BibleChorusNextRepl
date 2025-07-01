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
  'from-violet-600 via-purple-600 to-indigo-600',
  'from-blue-600 via-cyan-600 to-teal-600',
  'from-pink-600 via-rose-600 to-red-600',
  'from-amber-600 via-orange-600 to-red-600',
  'from-emerald-600 via-green-600 to-teal-600',
  'from-indigo-600 via-blue-600 to-purple-600',
  'from-purple-600 via-pink-600 to-rose-600',
  'from-cyan-600 via-blue-600 to-indigo-600',
  'from-slate-600 via-gray-600 to-zinc-600',
  'from-fuchsia-600 via-violet-600 to-purple-600',
];

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick, gradientIndex }) => {
  const hasCoverArt = !!playlist.cover_art_url;
  const gradientBackground = `bg-gradient-to-br ${gradients[gradientIndex % gradients.length]}`;

  return (
    <Card
      onClick={onClick}
      className="group relative aspect-square overflow-hidden cursor-pointer transition-all duration-700 hover:scale-[1.03] hover:shadow-2xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl hover:rotate-1"
    >
      {/* Background Image or Gradient */}
      {hasCoverArt ? (
        <div className="absolute inset-0">
          <Image
            src={playlist.cover_art_url!}
            alt={`${playlist.name} Cover`}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-700 group-hover:scale-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        </div>
      ) : (
        <div className={`absolute inset-0 ${gradientBackground} transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_50%)]" />
          <Music2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-20 sm:h-20 text-white/30 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12" />
        </div>
      )}

      {/* Enhanced Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
        <div className="bg-white/95 dark:bg-black/95 rounded-full p-4 shadow-2xl transform scale-0 group-hover:scale-100 transition-all duration-500 backdrop-blur-sm border border-white/30 dark:border-white/20">
          <Play className="w-8 h-8 text-black dark:text-white fill-current translate-x-0.5" />
        </div>
      </div>

      {/* Enhanced Glow Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <h3 className="text-white font-bold text-sm sm:text-base line-clamp-2 drop-shadow-2xl leading-tight mb-1">
          {playlist.name}
        </h3>
        {playlist.description && (
          <p className="text-white/90 text-xs sm:text-sm mt-1 line-clamp-1 drop-shadow-lg font-medium">
            {playlist.description}
          </p>
        )}
      </div>

      {/* Enhanced Song Count Badge */}
      {playlist.song_count !== undefined && playlist.song_count > 0 && (
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs sm:text-sm px-3 py-1.5 rounded-full border border-white/20 font-medium shadow-lg">
          {playlist.song_count} {playlist.song_count === 1 ? 'song' : 'songs'}
        </div>
      )}

      {/* Subtle Corner Accent */}
      <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-white/20 to-transparent rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </Card>
  );
};

export default PlaylistCard;
