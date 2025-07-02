import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Pause } from 'lucide-react';
import { formatBibleVerses } from '@/lib/utils';
import { Song } from '@/types';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

interface SongListProps {
  songs: Song[];
}

export const SongList: React.FC<SongListProps> = ({ songs }) => {
  return (
    <div className="space-y-6">
      {songs.map((song) => (
        <SongListItem key={song.id} song={song} allSongs={songs} />
      ))}
    </div>
  );
};

const SongListItem: React.FC<{ song: Song; allSongs: Song[] }> = ({ song, allSongs }) => {
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer();

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

  const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

  return (
    <div className="group p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl flex flex-col md:flex-row md:items-center transition-all duration-500 hover:scale-[1.02]">
      {/* Song Art */}
      <div className="flex-shrink-0 w-full md:w-64 h-64 relative mb-4 md:mb-0 md:mr-6">
        <Image
          src={song.song_art_url ? `${CDN_URL}${song.song_art_url}` : '/biblechorus-icon.png'}
          alt={song.title}
          layout="fill"
          objectFit="cover"
          className="rounded-lg"
        />
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <button onClick={handlePlayClick} className="text-white p-2">
            {currentSong?.id === song.id && isPlaying ? (
              <Pause className="w-16 h-16" />
            ) : (
              <PlayCircle className="w-16 h-16" />
            )}
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
