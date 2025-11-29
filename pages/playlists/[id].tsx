import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import db from '@/db';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Edit, Pencil, Share2, Music, Users2, Clock, Sparkles } from 'lucide-react';
import { formatBibleVerses, parsePostgresArray } from '@/lib/utils';
import { Playlist, Song } from '@/types';
import SongList from '@/components/PlaylistPage/SongList';
import EditPlaylistDialog from '@/components/PlaylistPage/EditPlaylistDialog';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageCropper, CropResultMetadata } from '@/components/UploadPage/ImageCropper';
import axios from 'axios';
import { toast } from "sonner";
import { uploadFile } from '@/lib/uploadUtils';
import { User } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { extractFileExtension, getExtensionFromMimeType, stripFileExtension } from '@/lib/imageUtils';
import { useTheme } from 'next-themes';

interface PlaylistPageProps {
  playlist: Playlist;
  songs: Song[];
  creatorUsername: string;
}

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return CDN_URL ? `${CDN_URL}${path}` : `/${path}`;
};

const FilmGrainOverlay: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none opacity-[0.015]"
      style={{
        zIndex: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}
    />
  );
};

interface AmbientOrbsOverlayProps {
  isDark: boolean;
}

const AmbientOrbsOverlay: React.FC<AmbientOrbsOverlayProps> = ({ isDark }) => {
  const orbColors = {
    primary: isDark ? 'rgba(212, 175, 55, 0.06)' : 'rgba(191, 161, 48, 0.05)',
    secondary: isDark ? 'rgba(160, 160, 160, 0.04)' : 'rgba(100, 100, 100, 0.03)',
    tertiary: isDark ? 'rgba(229, 229, 229, 0.02)' : 'rgba(50, 50, 50, 0.02)',
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <motion.div 
        className="absolute top-0 left-0 w-96 h-96 rounded-full"
        style={{
          background: orbColors.primary,
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: orbColors.secondary,
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </div>
  );
};

export default function PlaylistPage({ playlist: initialPlaylist, songs: initialSongs, creatorUsername }: PlaylistPageProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [songs, setSongs] = useState(initialSongs);
  const { user } = useAuth();
  const [isEditArtDialogOpen, setIsEditArtDialogOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isImageCropperOpen, setIsImageCropperOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperMaxHeight, setCropperMaxHeight] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgAlt: isDark ? '#0a0a0a' : '#f0ede6',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    textMuted: isDark ? '#6f6f6f' : '#6f6f6f',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
  };

  useEffect(() => {
    const updateCropperMaxHeight = () => {
      const viewportHeight = window.innerHeight;
      setCropperMaxHeight(Math.floor(viewportHeight * 0.8));
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
      if (playlist.cover_art_url) {
        const oldFileKey = playlist.cover_art_url.replace(CDN_URL, '');
        await axios.post('/api/delete-file', { fileKey: oldFileKey });
      }

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

      const { fileKey } = uploadResult as { fileKey: string };

      const response = await axios.put(`/api/playlists/${playlist.id}/update-cover-art`, {
        coverArtUrl: fileKey,
      });

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

  if (!mounted) {
    return (
      <>
        <Head>
          <title>{`${playlist.name} by ${creatorUsername} - BibleChorus`}</title>
        </Head>
        <div 
          className="min-h-screen opacity-0" 
          style={{ fontFamily: "'Manrope', sans-serif" }} 
        />
      </>
    );
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{ 
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: "'Manrope', sans-serif"
      }}
    >
      <Head>
        <title>{`${playlist.name} by ${creatorUsername} - BibleChorus`}</title>
        <meta property="og:title" content={`${playlist.name} by ${creatorUsername}`} />
        <meta property="og:description" content={`Listen to "${playlist.name}" by ${creatorUsername} on BibleChorus`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_CDN_URL}${playlist.cover_art_url || '/default-cover.jpg'}`} />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASE_URL}/playlists/${playlist.id}`} />
        <meta property="og:type" content="music.playlist" />
        <meta property="music:creator" content={creatorUsername} />
      </Head>

      <style jsx global>{`
        html, body {
          background-color: ${theme.bg} !important;
        }
      `}</style>

      <AmbientOrbsOverlay isDark={isDark} />
      <FilmGrainOverlay />

      <div className="relative" style={{ zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-16 pt-24"
        >
          <div className="container mx-auto px-6 md:px-12">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-8"
              >
                <span 
                  className="inline-flex items-center gap-2.5 text-xs tracking-[0.5em] uppercase"
                  style={{ fontFamily: "'Manrope', sans-serif", color: theme.accent }}
                >
                  <Sparkles className="w-4 h-4" />
                  {playlist.is_auto ? 'Auto Playlist' : 'Curated Playlist'}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative w-48 h-48 mx-auto mb-8 group"
              >
                <div 
                  className="relative w-full h-full overflow-hidden"
                  style={{ border: `1px solid ${theme.border}` }}
                >
                  <Image
                    src={playlist.cover_art_url ? getImageUrl(playlist.cover_art_url) : '/biblechorus-icon.png'}
                    alt={`${playlist.name} cover art`}
                    layout="fill"
                    objectFit="cover"
                    className="transition-all duration-500 group-hover:scale-105 grayscale-[20%] group-hover:grayscale-0"
                  />
                  {!playlist.is_auto && isCreator && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 transition-all duration-300 opacity-0 group-hover:opacity-100"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#ffffff',
                        border: 'none',
                      }}
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
                className="text-4xl md:text-5xl lg:text-6xl mb-4 tracking-tight"
                style={{ fontFamily: "'Italiana', serif", color: theme.text }}
              >
                {playlist.name}
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="space-y-4"
              >
                {playlist.description && (
                  <p 
                    className="text-lg max-w-2xl mx-auto leading-relaxed font-light"
                    style={{ color: theme.textSecondary }}
                  >
                    {playlist.description}
                  </p>
                )}
                <p 
                  className="text-sm font-light"
                  style={{ color: theme.textSecondary }}
                >
                  Created by{' '}
                  <span style={{ color: theme.accent, fontWeight: 500 }}>
                    {creatorUsername}
                  </span>
                </p>
                
                {playlist.tags && playlist.tags.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                    {playlist.tags.map((tag: string) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-none font-medium"
                        style={{
                          backgroundColor: 'transparent',
                          color: theme.textSecondary,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-wrap justify-center gap-4 mt-10"
              >
                <Button 
                  onClick={handlePlayPlaylist} 
                  className="h-12 px-8 rounded-none text-xs tracking-[0.2em] uppercase font-medium transition-all duration-300"
                  style={{
                    backgroundColor: theme.accent,
                    color: isDark ? '#050505' : '#ffffff',
                  }}
                >
                  <Play className="w-4 h-4 mr-3" />
                  Play Playlist
                </Button>
                
                {!playlist.is_auto && isCreator && (
                  <Button
                    onClick={handleEditClick}
                    variant="outline"
                    className="h-12 px-6 rounded-none text-xs tracking-[0.2em] uppercase font-medium transition-all duration-300"
                    style={{
                      borderColor: theme.border,
                      color: theme.text,
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.borderHover;
                      e.currentTarget.style.backgroundColor = theme.hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.border;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Edit className="w-4 h-4 mr-3" />
                    Edit Playlist
                  </Button>
                )}
                
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="h-12 px-6 rounded-none text-xs tracking-[0.2em] uppercase font-medium transition-all duration-300"
                  style={{
                    borderColor: theme.border,
                    color: theme.text,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.borderHover;
                    e.currentTarget.style.backgroundColor = theme.hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Share playlist"
                >
                  <Share2 className="w-4 h-4 mr-3" />
                  Share
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="container mx-auto px-6 md:px-12 pb-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid md:grid-cols-3 gap-px max-w-3xl mx-auto"
            style={{ border: `1px solid ${theme.border}` }}
          >
            <motion.div
              whileHover={{ backgroundColor: theme.hoverBg }}
              className="group relative p-6 md:p-8 text-center transition-all duration-500"
              style={{ borderRight: `1px solid ${theme.border}` }}
            >
              <div className="relative mb-4">
                <div 
                  className="w-12 h-12 mx-auto flex items-center justify-center"
                  style={{ border: `1px solid ${theme.border}` }}
                >
                  <Music className="w-5 h-5" style={{ color: theme.accent }} />
                </div>
              </div>
              <div 
                className="text-2xl font-light mb-1"
                style={{ fontFamily: "'Italiana', serif", color: theme.text }}
              >
                {stats.totalSongs}
              </div>
              <div 
                className="text-xs tracking-[0.15em] uppercase font-light"
                style={{ color: theme.textSecondary }}
              >
                Songs
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ backgroundColor: theme.hoverBg }}
              className="group relative p-6 md:p-8 text-center transition-all duration-500"
              style={{ borderRight: `1px solid ${theme.border}` }}
            >
              <div className="relative mb-4">
                <div 
                  className="w-12 h-12 mx-auto flex items-center justify-center"
                  style={{ border: `1px solid ${theme.border}` }}
                >
                  <Clock className="w-5 h-5" style={{ color: theme.accent }} />
                </div>
              </div>
              <div 
                className="text-2xl font-light mb-1"
                style={{ fontFamily: "'Italiana', serif", color: theme.text }}
              >
                {formatDuration(stats.totalDuration)}
              </div>
              <div 
                className="text-xs tracking-[0.15em] uppercase font-light"
                style={{ color: theme.textSecondary }}
              >
                Duration
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ backgroundColor: theme.hoverBg }}
              className="group relative p-6 md:p-8 text-center transition-all duration-500"
            >
              <div className="relative mb-4">
                <div 
                  className="w-12 h-12 mx-auto flex items-center justify-center"
                  style={{ border: `1px solid ${theme.border}` }}
                >
                  <Users2 className="w-5 h-5" style={{ color: theme.accent }} />
                </div>
              </div>
              <div 
                className="text-2xl font-light mb-1"
                style={{ fontFamily: "'Italiana', serif", color: theme.text }}
              >
                {stats.uniqueArtists}
              </div>
              <div 
                className="text-xs tracking-[0.15em] uppercase font-light"
                style={{ color: theme.textSecondary }}
              >
                Artists
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="container mx-auto px-6 md:px-12 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            {songs.length > 0 ? (
              <div className="space-y-8">
                <div 
                  className="flex items-center justify-between pb-4"
                  style={{ borderBottom: `1px solid ${theme.border}` }}
                >
                  <h2 
                    className="text-xl tracking-wide"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                  >
                    Playlist Songs
                  </h2>
                  <div 
                    className="text-xs tracking-[0.15em] uppercase"
                    style={{ color: theme.textSecondary }}
                  >
                    {songs.length} song{songs.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <SongList songs={songs} />
              </div>
            ) : (
              <div 
                className="text-center py-24"
                style={{ border: `1px solid ${theme.border}` }}
              >
                <div 
                  className="w-16 h-16 mx-auto mb-6 flex items-center justify-center"
                  style={{ border: `1px solid ${theme.border}` }}
                >
                  <Music className="w-6 h-6" style={{ color: theme.textSecondary }} />
                </div>
                <h3 
                  className="text-xl mb-3"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  No Songs Found
                </h3>
                <p 
                  className="text-sm font-light max-w-md mx-auto"
                  style={{ color: theme.textSecondary }}
                >
                  This playlist is currently empty. {isCreator && !playlist.is_auto && "Add some songs to get started!"}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <EditPlaylistDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        playlist={playlist}
        songs={songs}
        onEditComplete={handleEditComplete}
      />

      <Dialog open={isEditArtDialogOpen} onOpenChange={setIsEditArtDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px] rounded-none"
          style={{
            backgroundColor: theme.bgCard,
            border: `1px solid ${theme.border}`,
            color: theme.text,
          }}
        >
          <DialogHeader>
            <DialogTitle 
              className="text-lg tracking-wide"
              style={{ fontFamily: "'Italiana', serif", color: theme.text }}
            >
              Edit Playlist Cover Art
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6">
            <div 
              className="relative group"
              style={{ border: `1px solid ${theme.border}` }}
            >
              <Image
                src={playlist.cover_art_url ? getImageUrl(playlist.cover_art_url) : '/biblechorus-icon.png'}
                alt="Current Playlist Cover Art"
                width={200}
                height={200}
                className="grayscale-[20%] group-hover:grayscale-0 transition-all duration-300"
              />
            </div>
            <Button 
              onClick={handleReplaceClick}
              className="h-12 px-6 rounded-none text-xs tracking-[0.2em] uppercase font-medium"
              style={{
                backgroundColor: theme.accent,
                color: isDark ? '#050505' : '#ffffff',
              }}
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

      <AnimatePresence>
        {isImageCropperOpen && cropImageUrl && (
          <Dialog open={isImageCropperOpen} onOpenChange={handleCropCancel}>
            <DialogContent 
              className="sm:max-w-[600px] p-0 overflow-hidden rounded-none"
              style={{
                backgroundColor: theme.bgCard,
                border: `1px solid ${theme.border}`,
                maxHeight: `${cropperMaxHeight}px`
              }}
            >
              <ImageCropper
                imageUrl={cropImageUrl}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
                aspectRatio={1}
                maxHeight={cropperMaxHeight - 100}
              />
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const playlistId = params?.id;

  if (!playlistId) {
    return { notFound: true };
  }

  try {
    const playlist = await db('playlists')
      .where('playlists.id', playlistId)
      .first();

    if (!playlist) {
      return { notFound: true };
    }

    const creator = await db('users')
      .where('id', playlist.user_id)
      .first();

    const playlistSongs = await db('playlist_songs')
      .join('songs', 'playlist_songs.song_id', 'songs.id')
      .leftJoin('users', 'songs.uploaded_by', 'users.id')
      .where('playlist_songs.playlist_id', playlistId)
      .select(
        'songs.*',
        'users.username',
        'playlist_songs.position'
      )
      .orderBy('playlist_songs.position', 'asc');

    const serializedPlaylist = JSON.parse(JSON.stringify({
      ...playlist,
      tags: parsePostgresArray(playlist.tags),
    }));

    const songs = playlistSongs.map((song) => 
      JSON.parse(JSON.stringify({
        ...song,
        genres: parsePostgresArray(song.genres),
        bible_verses: parsePostgresArray(song.bible_verses),
        tags: parsePostgresArray(song.tags),
      }))
    );

    return {
      props: {
        playlist: serializedPlaylist,
        songs,
        creatorUsername: creator?.username || 'Unknown',
      },
    };
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return { notFound: true };
  }
};
