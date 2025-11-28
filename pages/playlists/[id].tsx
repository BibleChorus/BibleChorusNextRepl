import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import db from '@/db'; // Database connection
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Edit, Pencil, Share2, Music, Users2, Clock, Sparkles } from 'lucide-react';
import { formatBibleVerses, parsePostgresArray } from '@/lib/utils'; // Add parsePostgresArray import
import { Playlist, Song } from '@/types'; // Define these types as needed
import SongList from '@/components/PlaylistPage/SongList'; // New SongList component for the playlist page
import EditPlaylistDialog from '@/components/PlaylistPage/EditPlaylistDialog';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth hook
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageCropper, CropResultMetadata } from '@/components/UploadPage/ImageCropper';
import axios from 'axios';
import { toast } from "sonner";
import { uploadFile } from '@/lib/uploadUtils'; // Import the uploadFile function
import { User } from '@/types'; // Ensure User type is imported
import { motion, AnimatePresence } from 'framer-motion';
import { extractFileExtension, getExtensionFromMimeType, stripFileExtension } from '@/lib/imageUtils';

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
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isImageCropperOpen, setIsImageCropperOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperMaxHeight, setCropperMaxHeight] = useState<number>(0);

  useEffect(() => {
    const updateCropperMaxHeight = () => {
      const viewportHeight = window.innerHeight;
      setCropperMaxHeight(Math.floor(viewportHeight * 0.8)); // Set max height to 80% of viewport height
    };

    updateCropperMaxHeight();
    window.addEventListener('resize', updateCropperMaxHeight);

    return () => {
      window.removeEventListener('resize', updateCropperMaxHeight);
    };
  }, []);

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
  const isCreator = playlist.is_auto ? false : (user && user.id.toString() === playlist.user_id?.toString());

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
      setPendingImageFile(file);
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob, metadata?: CropResultMetadata) => {
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
      const mimeType = metadata?.mimeType || croppedImageBlob.type || pendingImageFile?.type || 'image/jpeg';
      const suggestedName = metadata?.suggestedFileName || pendingImageFile?.name;
      const fallbackBase = pendingImageFile?.name ? stripFileExtension(pendingImageFile.name) : `playlist-cover-${Date.now()}`;
      const extension = extractFileExtension(suggestedName) || getExtensionFromMimeType(mimeType);
      const fileName = suggestedName || `${fallbackBase}.${extension}`;
      const file = new File([croppedImageBlob], fileName, { type: mimeType });
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

    setPendingImageFile(null);
  };

  const handleCropCancel = () => {
    setIsImageCropperOpen(false);
    setCropImageUrl(null);
    setPendingImageFile(null);
  };

  const handleShare = useCallback(async () => {
    const playlistUrl = `${window.location.origin}/playlists/${playlist.id}`;
    const shareTitle = `${playlist.name} by ${creatorUsername}`;
    const shareText = `Check out the Playlist: "${playlist.name}" by ${creatorUsername} on BibleChorus`;
    
    const shareData = {
      title: shareTitle,
      text: shareText,
      url: playlistUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success('Playlist shared successfully');
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing playlist:', error);
          toast.error('Failed to share playlist');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${playlistUrl}`);
        toast.success('Playlist link copied to clipboard');
      } catch (error) {
        console.error('Error copying playlist link:', error);
        toast.error('Failed to copy playlist link');
      }
    }
  }, [playlist.id, playlist.name, creatorUsername]);

  // Calculate stats
  const stats = {
    totalSongs: songs.length,
    totalDuration: songs.reduce((acc, song) => acc + (song.duration || 0), 0),
    uniqueArtists: new Set(songs.map(song => song.artist || song.username)).size
  };

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <Head>
        <title>{`${playlist.name} by ${creatorUsername} - BibleChorus`}</title>
        <meta property="og:title" content={`${playlist.name} by ${creatorUsername}`} />
        <meta property="og:description" content={`Listen to "${playlist.name}" by ${creatorUsername} on BibleChorus`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_CDN_URL}${playlist.cover_art_url || '/default-cover.jpg'}`} />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASE_URL}/playlists/${playlist.id}`} />
        <meta property="og:type" content="music.playlist" />
        <meta property="music:creator" content={creatorUsername} />
      </Head>

      {/* Enhanced Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden pb-20 pt-12"
      >
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.08] via-purple-500/[0.06] to-pink-500/[0.08] dark:from-indigo-500/[0.15] dark:via-purple-500/[0.12] dark:to-pink-500/[0.15]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 backdrop-blur-md border border-indigo-500/20 dark:border-indigo-500/30 shadow-lg">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent font-semibold">
                  {playlist.is_auto ? 'Auto Playlist' : 'Curated Playlist'}
                </span>
              </span>
            </motion.div>

            {/* Playlist Cover Art */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-48 h-48 mx-auto mb-8 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative w-full h-full rounded-3xl overflow-hidden border-2 border-white/20 dark:border-slate-700/50 shadow-2xl">
                <Image
                  src={playlist.cover_art_url ? `${CDN_URL}${playlist.cover_art_url}` : '/biblechorus-icon.png'}
                  alt={`${playlist.name} cover art`}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                {!playlist.is_auto && isCreator && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100"
                    onClick={handleEditArtClick}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-4"
            >
              <span className="block relative">
                <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                  {playlist.name}
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full scale-x-0 animate-scale-x"></div>
              </span>
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-4"
            >
              {playlist.description && (
                <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  {playlist.description}
                </p>
              )}
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                Created by{' '}
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-semibold">
                  {creatorUsername}
                </span>
              </p>
              
              {/* Tags */}
              {playlist.tags && playlist.tags.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  {playlist.tags.map((tag: string) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-slate-700 dark:text-slate-300 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all duration-200 rounded-lg px-3 py-1"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap justify-center gap-4 mt-8"
            >
              <Button 
                onClick={handlePlayPlaylist} 
                className="relative h-12 px-8 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group rounded-xl font-semibold"
              >
                <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                <Play className="relative w-5 h-5 mr-2" />
                <span className="relative">Play Playlist</span>
              </Button>
              
              {!playlist.is_auto && isCreator && (
                <Button
                  onClick={handleEditClick}
                  variant="outline"
                  className="h-12 px-6 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 hover:scale-[1.02] rounded-xl font-medium"
                >
                  <Edit className="w-5 h-5 mr-2" />
                  Edit Playlist
                </Button>
              )}
              
              <Button
                onClick={handleShare}
                variant="outline"
                className="h-12 px-6 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 hover:scale-[1.02] rounded-xl font-medium"
                aria-label="Share playlist"
              >
                <Share2 className="w-5 h-5 mr-2" />
                <span>Share</span>
              </Button>
            </motion.div>
          </div>

          {/* Enhanced Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-6 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <Music className="relative w-8 h-8 mx-auto mb-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
              <div className="relative text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent mb-1">{stats.totalSongs}</div>
              <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Songs</div>
            </div>
            
            <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-6 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <Clock className="relative w-8 h-8 mx-auto mb-3 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
              <div className="relative text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-1">{formatDuration(stats.totalDuration)}</div>
              <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Duration</div>
            </div>
            
            <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-6 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-pink-500 to-red-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <Users2 className="relative w-8 h-8 mx-auto mb-3 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform duration-300" />
              <div className="relative text-3xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-1">{stats.uniqueArtists}</div>
              <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Artists</div>
            </div>
          </motion.div>
          
          {/* Enhanced Floating Elements */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="absolute top-16 right-16 hidden xl:block"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl backdrop-blur-sm animate-float shadow-xl"></div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1.0 }}
            className="absolute bottom-16 left-16 hidden xl:block"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl backdrop-blur-sm animate-float animation-delay-2000 shadow-xl"></div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-12 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl p-6 md:p-8"
        >
          {songs.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 pb-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  Playlist Songs
                </h2>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {songs.length} song{songs.length !== 1 ? 's' : ''}
                </div>
              </div>
              <SongList songs={songs} />
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="relative mb-6">
                <Music className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full opacity-20"></div>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-white">No songs found</h3>
              <p className="text-slate-600 dark:text-slate-300 text-lg max-w-md mx-auto">
                This playlist is currently empty. {isCreator && !playlist.is_auto && "Add some songs to get started!"}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <EditPlaylistDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        playlist={playlist}
        songs={songs}
        onEditComplete={handleEditComplete}
      />

      {/* Edit Playlist Cover Art Dialog */}
      <Dialog open={isEditArtDialogOpen} onOpenChange={setIsEditArtDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Edit Playlist Cover Art
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6">
            <div className="relative group">
              <Image
                src={playlist.cover_art_url ? `${CDN_URL}${playlist.cover_art_url}` : '/biblechorus-icon.png'}
                alt="Current Playlist Cover Art"
                width={200}
                height={200}
                className="rounded-2xl shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <Button 
              onClick={handleReplaceClick}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105"
            >
              Replace Image
            </Button>
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
        <DialogContent className="sm:max-w-[600px] p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50">
          <DialogHeader className="p-4">
            <DialogTitle className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Crop Image
            </DialogTitle>
          </DialogHeader>
          {cropImageUrl && (
            <ImageCropper
              imageUrl={cropImageUrl}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
              maxHeight={cropperMaxHeight}
              originalFileName={pendingImageFile?.name}
              originalMimeType={pendingImageFile?.type}
              desiredFileName={pendingImageFile?.name}
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

    // For auto playlists, set a system creator name
    let creatorUsername = 'BibleChorus';
    
    // Only fetch creator username for non-auto playlists
    if (!playlist.is_auto && playlist.user_id) {
      const creator = await db('users')
        .where('id', playlist.user_id)
        .first('username');
      creatorUsername = creator ? creator.username : 'Unknown';
    }

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
