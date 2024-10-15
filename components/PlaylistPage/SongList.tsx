import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PlayCircle } from 'lucide-react';
import { formatBibleVerses } from '@/lib/utils';
import { Song } from '@/types';

interface SongListProps {
  songs: Song[];
}

export const SongList: React.FC<SongListProps> = ({ songs }) => {
  return (
    <div className="space-y-6">
      {songs.map((song) => (
        <SongListItem key={song.id} song={song} />
      ))}
    </div>
  );
};

const SongListItem: React.FC<{ song: Song }> = ({ song }) => {
  return (
    <div className="p-6 bg-card rounded-lg shadow-md flex flex-col md:flex-row md:items-center">
      {/* Song Art */}
      <div className="flex-shrink-0 w-full md:w-64 h-64 relative mb-4 md:mb-0 md:mr-6">
        <Image
          src={song.song_art_url ? song.song_art_url : '/biblechorus-icon.png'}
          alt={song.title}
          layout="fill"
          objectFit="cover"
          className="rounded-lg"
        />
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <button className="text-white p-2">
            <PlayCircle className="w-16 h-16" />
          </button>
        </div>
      </div>
      {/* Song Details */}
      <div className="flex-grow">
        <Link href={`/Songs/${song.id}`} className="text-3xl font-bold hover:underline">
          {song.title}
        </Link>
        <p className="text-xl text-muted-foreground">{song.username || 'Unknown Artist'}</p>
        {song.bible_verses && song.bible_verses.length > 0 && (
          <p className="mt-2 text-primary-600 dark:text-primary-400 italic">
            {formatBibleVerses(song.bible_verses)}
          </p>
        )}
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {song.genres && song.genres.map((genre) => (
            <Badge key={genre} variant="secondary">{genre}</Badge>
          ))}
          {song.bible_translation_used && (
            <Badge variant="outline">{song.bible_translation_used}</Badge>
          )}
          {song.lyrics_scripture_adherence && (
            <Badge variant="default" className="bg-primary text-primary-foreground">
              {song.lyrics_scripture_adherence.replace(/_/g, ' ')}
            </Badge>
          )}
          {song.is_continuous_passage !== undefined && (
            <Badge variant="outline">
              {song.is_continuous_passage ? 'Continuous' : 'Non-Continuous'}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongList;