import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import db from '@/db'; // Database connection
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Edit, Pencil } from 'lucide-react';
import { formatBibleVerses, parsePostgresArray } from '@/lib/utils'; // Add parsePostgresArray import
import { Playlist, Song } from '@/types'; // Define these types as needed
import SongList from '@/components/PlaylistPage/SongList'; // New SongList component for the playlist page
import EditPlaylistDialog from '@/components/PlaylistPage/EditPlaylistDialog';
import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth hook
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageCropper } from '@/components/UploadPage/ImageCropper';
import axios from 'axios';
import { toast } from "sonner";
import { uploadFile } from '@/lib/uploadUtils'; // Import the uploadFile function
import { User } from '@/types'; // Ensure User type is imported

interface PlaylistPageProps {
  playlist: Playlist;
  songs: Song[];
  creatorUsername: string;
}

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export default function PlaylistPage({ playlist: initialPlaylist, songs: initialSongs, creatorUsername }: PlaylistPageProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [songs, setSongs] = useState(initialSongs);
  const { user } = useAuth(); // Use the useAuth hook
  const [isEditArtDialogOpen, setIsEditArtDialogOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [isImageCropperOpen, setIsImageCropperOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePlayPlaylist = () => {
    router.push(`/listen?playlistId=${playlist.id}`);
  };

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditComplete = (updatedPlaylist: Playlist, updatedSongs: Song[]) => {
    setPlaylist(updatedPlaylist);
    setSongs(updatedSongs);
    setIsEditDialogOpen(false);
  };

  // Change this line to compare string values
  const isCreator = user && user.id.toString() === playlist.user_id.toString();

  const handleEditArtClick = () => {
    setIsEditArtDialogOpen(true);
  };

  const handleReplaceClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_FILE_SIZE) {
        toast.error(`File size exceeds the limit of 5MB`);
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setCropImageUrl(imageUrl);
      setIsImageCropperOpen(true);
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setIsImageCropperOpen(false);
    setIsEditArtDialogOpen(false);

    if (!user) {
      toast.error('You need to be logged in to update the playlist cover art');
      return;
    }

    try {
      // Delete the old cover art
      if (playlist.cover_art_url) {
        const oldFileKey = playlist.cover_art_url.replace(CDN_URL, '');
        await axios.post('/api/delete-file', { fileKey: oldFileKey });
      }

      // Upload the new cover art
      const file = new File([croppedImageBlob], 'cover_art.jpg', { type: 'image/jpeg' });
      const uploadResult = await uploadFile(file, 'image', Number(user.id));

      if (typeof uploadResult === 'string') {
        throw new Error(uploadResult);
      }

      // Use destructuring with type assertion for uploadResult
      const { fileKey } = uploadResult as { fileKey: string };

      // Update the playlist with the new cover art URL
      const response = await axios.put(`/api/playlists/${playlist.id}/update-cover-art`, {
        coverArtUrl: fileKey,
      });

      // Update the local state with the new cover art URL
      setPlaylist({ ...playlist, cover_art_url: response.data.updatedUrl });
      toast.success('Playlist cover art updated successfully');
    } catch (error) {
      console.error('Error updating cover art:', error);
      toast.error('Failed to update cover art');
    }
  };

  const handleCropCancel = () => {
    setIsImageCropperOpen(false);
    setCropImageUrl(null);
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
          src={playlist.cover_art_url ? `${CDN_URL}${playlist.cover_art_url}` : '/biblechorus-icon.png'}
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
          <p className="text-lg">Created by: {creatorUsername}</p>
          <div className="flex flex-wrap items-center justify-center mt-2">
            {playlist.is_auto && (
              <Badge variant="default" className="mr-2">Auto Playlist</Badge>
            )}
            {playlist.tags && playlist.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="mr-2">{tag}</Badge>
            ))}
          </div>
          <div className="flex space-x-4 mt-4">
            <Button 
              onClick={handlePlayPlaylist} 
              className="flex items-center"
              variant="default"
            >
              <Play className="mr-2 h-4 w-4" />
              Play Playlist
            </Button>
            {isCreator && (
              <Button
                onClick={handleEditClick}
                className="flex items-center"
                variant="outline"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Playlist
              </Button>
            )}
          </div>
        </div>
        {isCreator && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-white hover:text-primary-300 transition-colors"
            onClick={handleEditArtClick}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Song List */}
      <main className="container mx-auto px-4 py-6">
        {songs.length > 0 ? (
          <SongList songs={songs} />
        ) : (
          <p className="text-center text-lg">No songs found in this playlist.</p>
        )}
      </main>

      <EditPlaylistDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        playlist={playlist}
        songs={songs}
        onEditComplete={handleEditComplete}
      />

      {/* Edit Playlist Cover Art Dialog */}
      <Dialog open={isEditArtDialogOpen} onOpenChange={setIsEditArtDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Playlist Cover Art</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center">
            <Image
              src={playlist.cover_art_url ? `${CDN_URL}${playlist.cover_art_url}` : '/biblechorus-icon.png'}
              alt="Current Playlist Cover Art"
              width={200}
              height={200}
              className="rounded-lg mb-4"
            />
            <Button onClick={handleReplaceClick}>Replace Image</Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isImageCropperOpen} onOpenChange={setIsImageCropperOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          {cropImageUrl && (
            <ImageCropper
              imageUrl={cropImageUrl}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          )}
        </DialogContent>
      </Dialog>
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
      .first('username');

    const creatorUsername = creator ? creator.username : 'Unknown';

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
        creatorUsername,
      },
    };
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return {
      notFound: true,
    };
  }
};