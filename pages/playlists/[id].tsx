import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import db from '@/db'; // Database connection
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { formatBibleVerses, parsePostgresArray } from '@/lib/utils'; // Add parsePostgresArray import
import { Playlist, Song } from '@/types'; // Define these types as needed
import SongList from '@/components/PlaylistPage/SongList'; // New SongList component for the playlist page

interface PlaylistPageProps {
  playlist: Playlist;
  songs: Song[];
}

export default function PlaylistPage({ playlist, songs }: PlaylistPageProps) {
  const router = useRouter();

  const handlePlayPlaylist = () => {
    router.push(`/listen?playlistId=${playlist.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>{playlist.name} - BibleChorus</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Playlist Banner */}
      <div className="relative h-64 sm:h-80 w-full mb-8">
        <Image
          src={playlist.cover_art_url ? playlist.cover_art_url : '/biblechorus-icon.png'}
          alt={`${playlist.name} cover art`}
          layout="fill"
          objectFit="cover"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-xl sm:text-2xl mb-4">{playlist.description}</p>
          )}
          <p className="text-lg">Created by: {playlist.creator_username}</p>
          <div className="flex flex-wrap items-center justify-center mt-2">
            {playlist.is_auto && (
              <Badge variant="default" className="mr-2">Auto Playlist</Badge>
            )}
            {playlist.tags && playlist.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="mr-2">{tag}</Badge>
            ))}
          </div>
          <Button 
            onClick={handlePlayPlaylist} 
            className="mt-4 flex items-center"
            variant="default"
          >
            <Play className="mr-2 h-4 w-4" />
            Play Playlist
          </Button>
        </div>
      </div>

      {/* Song List */}
      <main className="container mx-auto px-4 py-6">
        {songs.length > 0 ? (
          <SongList songs={songs} />
        ) : (
          <p className="text-center text-lg">No songs found in this playlist.</p>
        )}
      </main>
    </div>
  );
}

// Server-side data fetching
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };

  try {
    // Fetch the playlist
    const playlist = await db('playlists')
      .where('id', id)
      .first();

    if (!playlist) {
      return {
        notFound: true,
      };
    }

    // Fetch songs in the playlist
    const songs = await db('playlist_songs')
      .join('songs', 'playlist_songs.song_id', 'songs.id')
      .join('users', 'songs.uploaded_by', 'users.id')
      .where('playlist_songs.playlist_id', id)
      .select(
        'songs.*',
        'users.username', // Include uploader's username
        'playlist_songs.position' // Include position in the playlist
      )
      .orderBy('playlist_songs.position');

    // Fetch creator's username
    const creator = await db('users')
      .where('id', playlist.user_id)
      .first();

    // Add creator_username to playlist
    playlist.creator_username = creator ? creator.username : 'Unknown';

    // Parse genres for each song
    songs.forEach((song: any) => {
      song.genres = song.genres ? parsePostgresArray(song.genres) : [];
    });

    // Fetch Bible verses for each song
    const songIds = songs.map((song: any) => song.id);
    const verses = await db('song_verses')
      .join('bible_verses', 'song_verses.verse_id', 'bible_verses.id')
      .whereIn('song_verses.song_id', songIds)
      .select('song_verses.song_id', 'bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse');

    // Attach verses to songs
    const versesBySongId = verses.reduce((acc: any, verse: any) => {
      if (!acc[verse.song_id]) {
        acc[verse.song_id] = [];
      }
      acc[verse.song_id].push({ book: verse.book, chapter: verse.chapter, verse: verse.verse });
      return acc;
    }, {});

    songs.forEach((song: any) => {
      song.bible_verses = versesBySongId[song.id] || [];
    });

    return {
      props: {
        playlist: JSON.parse(JSON.stringify(playlist)),
        songs: JSON.parse(JSON.stringify(songs)),
      },
    };
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return {
      notFound: true,
    };
  }
};
