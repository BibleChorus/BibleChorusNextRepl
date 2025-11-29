import React from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from 'next-themes'
import axios from 'axios'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { CommentList } from '@/components/SongComments/CommentList'
import { ImageCropper, CropResultMetadata } from '@/components/UploadPage/ImageCropper'
import { Pencil, User, ArrowLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Music, MessageCircle, Upload, ArrowRight, Heart, ThumbsUp } from 'lucide-react';
import { cn } from "@/lib/utils";
import DOMPurify from 'isomorphic-dompurify';
import { extractFileExtension, getExtensionFromMimeType } from '@/lib/imageUtils'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { LoginPromptDialog } from '@/components/LoginPromptDialog'

interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  created_at: string;
}

interface Playlist {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  cover_art_url?: string;
}

interface ForumComment {
  id: number;
  content: string;
  created_at: string;
  topic_id: number;
  topic_title: string;
}

interface SongComment {
  id: number;
  content: string;
  created_at: string;
}

interface Activity {
  id: string;
  type: 'song_comment' | 'forum_comment' | 'song_upload' | 'song_like' | 'song_vote';
  content: string;
  created_at: string;
  is_new?: boolean;
  metadata: {
    song_title?: string;
    song_id?: number;
    topic_title?: string;
    topic_id?: number;
    comment_likes?: number;
    new_replies?: number;
    liker_username?: string;
    voter_username?: string;
    vote_type?: string;
    vote_value?: number;
    commenter_username?: string;
    uploader_username?: string;
    parent_comment_id?: number;
  };
}

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return CDN_URL ? `${CDN_URL}${path}` : `/${path}`;
};
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;

const DEFAULT_PROFILE_IMAGE = '/biblechorus-icon.png';

const createMarkup = (content: string) => {
  return { __html: DOMPurify.sanitize(content) };
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
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
      <motion.div 
        className="absolute top-1/2 right-1/4 w-72 h-72 rounded-full"
        style={{
          background: orbColors.tertiary,
          filter: 'blur(100px)'
        }}
        animate={{
          y: [0, 20, 0],
          x: [0, -15, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />
    </div>
  );
};

export default function Profile() {
  const { user: currentUser, login, getAuthToken } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const { id: profileUserId } = router.query;
  const [profileUser, setProfileUser] = useState<any>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [forumComments, setForumComments] = useState<ForumComment[]>([]);
  const [songComments, setSongComments] = useState<SongComment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [mounted, setMounted] = useState(false);

  const [isEditProfileImageDialogOpen, setIsEditProfileImageDialogOpen] = useState(false)
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [isImageCropperOpen, setIsImageCropperOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropperMaxHeight, setCropperMaxHeight] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const [unreadActivitiesCount, setUnreadActivitiesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

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
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderLight: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    borderHover: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    accentBorder: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    accentBg: isDark ? 'rgba(212, 175, 55, 0.1)' : 'rgba(191, 161, 48, 0.1)',
  };

  const fetchUserSongs = useCallback(async () => {
    if (!profileUser) return;
    try {
      const response = await axios.get(`/api/users/${profileUser.id}/songs`);
      setSongs(response.data);
    } catch (error) {
      console.error('Error fetching user songs:', error);
    }
  }, [profileUser]);

  const fetchUserPlaylists = useCallback(async () => {
    if (!profileUser) return;
    try {
      const response = await axios.get(`/api/users/${profileUser.id}/playlists?createdOnly=true`);
      setPlaylists(response.data);
    } catch (error) {
      console.error('Error fetching user playlists:', error);
    }
  }, [profileUser]);

  const fetchUnreadActivitiesCount = useCallback(async () => {
    if (!profileUser || !currentUser || profileUser.id !== currentUser.id) return;
    
    try {
      const token = await getAuthToken();
      const response = await axios.get(`/api/users/${profileUser.id}/unread-activities-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUnreadActivitiesCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread activities count:', error);
    }
  }, [profileUser, currentUser, getAuthToken]);

  const fetchUserActivities = useCallback(async () => {
    if (!profileUser || !currentUser || profileUser.id !== currentUser.id) return;
    
    try {
      const token = await getAuthToken();
      
      if (!token) {
        console.error('No auth token available');
        toast.error('Authentication required');
        router.push('/login');
        return;
      }

      const response = await axios.get(`/api/users/${profileUser.id}/activities`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          limit: ITEMS_PER_PAGE
        }
      });

      setActivities(response.data.activities);
      setTotalActivities(response.data.total);
      await fetchUnreadActivitiesCount();
    } catch (error: any) {
      if (profileUser.id === currentUser?.id) {
        console.error('Error fetching user activities:', error);
        
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again');
          router.push('/login');
        } else {
          toast.error('Failed to load activities');
        }
      }
    }
  }, [profileUser, currentUser, currentPage, ITEMS_PER_PAGE, fetchUnreadActivitiesCount, getAuthToken, router]);

  const handleUnauthorizedAccess = useCallback(() => {
    setIsLoading(false);
    setShowLoginPrompt(true);
  }, []);

  const fetchProfileUser = useCallback(async () => {
    try {
      if (profileUserId) {
        const response = await axios.get(`/api/users/${profileUserId}`);
        setProfileUser(response.data);
      } else if (currentUser) {
        setProfileUser(currentUser);
      } else {
        handleUnauthorizedAccess();
        return;
      }
    } catch (error) {
      console.error('Error fetching profile user:', error);
      setError('Failed to load user profile. Please try again later.');
      toast.error('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  }, [profileUserId, currentUser, handleUnauthorizedAccess]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!currentUser && !profileUserId) {
        handleUnauthorizedAccess();
      } else {
        setIsLoading(true);
        await fetchProfileUser();
      }
    };

    checkAuth();
  }, [currentUser, profileUserId, fetchProfileUser, handleUnauthorizedAccess]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profileUser) return;

      try {
        const token = await getAuthToken();
        
        if (!token && !profileUserId) {
          handleUnauthorizedAccess();
          return;
        }

        await Promise.all([
          fetchUserSongs(),
          fetchUserPlaylists(),
          currentUser && profileUser.id === currentUser.id && token ? fetchUserActivities() : Promise.resolve(),
        ]);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      }
    };

    fetchData();
  }, [profileUser, currentUser, fetchUserSongs, fetchUserPlaylists, fetchUserActivities, getAuthToken, profileUserId, handleUnauthorizedAccess]);

  const totalPages = Math.ceil(totalActivities / ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push('ellipsis');
      }
    }
    return pages;
  };

  const isOwnProfile = currentUser && profileUser && currentUser.id === profileUser.id;

  useEffect(() => {
    const updateCropperMaxHeight = () => {
      const viewportHeight = window.innerHeight
      setCropperMaxHeight(Math.floor(viewportHeight * 0.8))
    }

    updateCropperMaxHeight()
    window.addEventListener('resize', updateCropperMaxHeight)

    return () => {
      window.removeEventListener('resize', updateCropperMaxHeight)
    }
  }, [])

  const groupCommentsByTopic = (comments: ForumComment[]) => {
    return comments.reduce((acc, comment) => {
      if (!acc[comment.topic_id]) {
        acc[comment.topic_id] = {
          topic_title: comment.topic_title,
          comments: []
        };
      }
      acc[comment.topic_id].comments.push(comment);
      return acc;
    }, {} as Record<number, { topic_title: string; comments: ForumComment[] }>);
  };

  const handleEditProfileImageClick = () => {
    setIsEditProfileImageDialogOpen(true)
  }

  const handleReplaceClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > MAX_IMAGE_FILE_SIZE) {
        toast.error(`File size exceeds the limit of 5MB`)
        return
      }
      const imageUrl = URL.createObjectURL(file)
      setCropImageUrl(imageUrl)
      setIsImageCropperOpen(true)
      setPendingImageFile(file)
    }
  }

  const handleCropComplete = async (croppedImageBlob: Blob, metadata?: CropResultMetadata) => {
    setIsImageCropperOpen(false);
    setIsEditProfileImageDialogOpen(false);

    if (!profileUser) {
      toast.error('User not logged in');
      return;
    }

    try {
      if (profileUser.profile_image_url) {
        const fileKey = profileUser.profile_image_url.replace(CDN_URL, '').replace(/^\/+/, '');
        await axios.post('/api/delete-file', { fileKey });
      }

      const fileType = metadata?.mimeType || croppedImageBlob.type || pendingImageFile?.type || 'image/jpeg';
      const suggestedName = metadata?.suggestedFileName || pendingImageFile?.name;
      const fileExtension = extractFileExtension(suggestedName) || getExtensionFromMimeType(fileType);
      const userId = profileUser.id;
      const fileSize = croppedImageBlob.size.toString();

      const uploadUrlResponse = await axios.post('/api/upload-url', {
        fileType,
        fileExtension,
        userId,
        fileSize,
        uploadType: 'profile_image',
      });

      if (uploadUrlResponse.status !== 200) {
        throw new Error('Failed to get upload URL');
      }

      const { signedUrl, fileKey } = uploadUrlResponse.data;

      await axios.put(signedUrl, croppedImageBlob, {
        headers: {
          'Content-Type': fileType,
        },
      });

      const updateResponse = await axios.put(`/api/users/${profileUser.id}/update-profile-image`, {
        profileImageUrl: fileKey,
      });

      if (updateResponse.status === 200) {
        const updatedUser = { ...profileUser, profile_image_url: updateResponse.data.updatedUrl };
        const currentToken = await getAuthToken();
        if (currentToken) {
          login(updatedUser, currentToken);
          toast.success('Profile image updated successfully');
        } else {
          throw new Error('No auth token available');
        }
      } else {
        throw new Error('Failed to update profile image URL');
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      toast.error('Failed to update profile image');
    }

    setPendingImageFile(null);
  };

  const handleCropCancel = () => {
    setIsImageCropperOpen(false);
    setCropImageUrl(null);
    setPendingImageFile(null);
  };

  const handleActivityClick = async (activityId: string) => {
    try {
      await axios.post(`/api/users/activities/${activityId}/mark-as-read`);
      fetchUserActivities();
    } catch (error) {
      console.error('Error marking activity as read:', error);
    }
  };

  if (showLoginPrompt) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.bg }}>
        <LoginPromptDialog
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          title="Login Required"
          description="Please login to view and manage your profile."
        />
      </div>
    );
  }

  if (!mounted) {
    return (
      <div 
        className="min-h-screen opacity-0" 
        style={{ fontFamily: "'Manrope', sans-serif" }} 
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.bg }}>
        <div className="flex justify-center items-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full"
            style={{ 
              border: `1px solid ${theme.border}`,
              borderTopColor: theme.accent
            }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <div className="text-center space-y-4">
          <h2 
            className="text-2xl"
            style={{ fontFamily: "'Italiana', serif", color: theme.accent }}
          >
            {error}
          </h2>
          <button
            onClick={() => window.location.reload()}
            className="h-10 px-6 text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300"
            style={{
              backgroundColor: theme.accent,
              color: isDark ? '#050505' : '#ffffff',
              fontFamily: "'Manrope', sans-serif"
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{`${profileUser.username}'s Profile | BibleChorus`}</title>
        <meta name="description" content={`View ${profileUser.username}'s profile, songs, playlists, and activities on BibleChorus`} />
        <meta property="og:title" content={`${profileUser.username}'s Profile | BibleChorus`} />
        <meta property="og:description" content={`View ${profileUser.username}'s profile, songs, playlists, and activities on BibleChorus`} />
        <meta property="og:image" content={profileUser?.profile_image_url ? getImageUrl(profileUser.profile_image_url) : '/default-profile-banner.jpg'} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div 
        className="min-h-screen relative"
        style={{ 
          backgroundColor: theme.bg,
          color: theme.text,
          fontFamily: "'Manrope', sans-serif"
        }}
      >
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
              <div className="flex justify-start mb-12">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  onClick={() => router.back()}
                  className="flex items-center gap-2 h-10 px-6 text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300"
                  style={{
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.accentBorder;
                    e.currentTarget.style.backgroundColor = theme.hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </motion.button>
              </div>

              <div className="text-center max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="mb-8"
                >
                  <span 
                    className="text-xs tracking-[0.5em] uppercase"
                    style={{ fontFamily: "'Manrope', sans-serif", color: theme.accent }}
                  >
                    {isOwnProfile ? 'Your Profile' : 'User Profile'}
                  </span>
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="mb-8"
                >
                  <span 
                    className="block text-6xl md:text-7xl lg:text-8xl tracking-tight mb-2"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                  >
                    {profileUser.username}
                  </span>
                  <span 
                    className="block text-4xl md:text-5xl lg:text-6xl italic font-light"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text, opacity: 0.9 }}
                  >
                    Profile
                  </span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light mb-12"
                  style={{ color: theme.textSecondary }}
                >
                  {isOwnProfile ? 
                    'Manage your contributions and track your musical journey' :
                    `Explore ${profileUser.username}'s musical contributions and activities`
                  }
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="flex justify-center"
                >
                  <div className="relative group">
                    <div 
                      className="w-40 h-40 md:w-48 md:h-48 overflow-hidden transition-all duration-500"
                      style={{ 
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <Image
                        src={profileUser?.profile_image_url ? getImageUrl(profileUser.profile_image_url) : DEFAULT_PROFILE_IMAGE}
                        alt={`${profileUser?.username} profile`}
                        width={192}
                        height={192}
                        className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500"
                        priority
                      />
                    </div>
                    {isOwnProfile && (
                      <button
                        onClick={handleEditProfileImageClick}
                        className="absolute bottom-2 right-2 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
                        style={{
                          backgroundColor: theme.accent,
                          color: isDark ? '#050505' : '#ffffff',
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-center justify-center gap-8 mt-8"
                  style={{ fontFamily: "'Manrope', sans-serif", color: theme.textSecondary }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <div className="flex items-center gap-2">
                    <motion.span 
                      className="text-sm" 
                      style={{ color: theme.accent }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7, type: "spring", stiffness: 300, damping: 20 }}
                    >
                      {songs.length}
                    </motion.span>
                    <span className="text-xs tracking-[0.2em] uppercase">Songs</span>
                  </div>
                  <div className="w-px h-4" style={{ backgroundColor: `${theme.textSecondary}4d` }} />
                  <div className="flex items-center gap-2">
                    <motion.span 
                      className="text-sm" 
                      style={{ color: theme.accent }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 20 }}
                    >
                      {playlists.length}
                    </motion.span>
                    <span className="text-xs tracking-[0.2em] uppercase">Playlists</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <div className="container mx-auto px-6 md:px-12 pb-32">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-px" style={{ backgroundColor: theme.border }}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="lg:col-span-2 p-6 md:p-8"
                  style={{ backgroundColor: theme.bgCard }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="w-10 h-10 flex items-center justify-center"
                      style={{ border: `1px solid ${theme.border}` }}
                    >
                      <User className="w-5 h-5" style={{ color: theme.accent }} />
                    </div>
                    <h3 
                      className="text-lg tracking-wide"
                      style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                    >
                      Profile Details
                    </h3>
                  </div>
                  <div 
                    className="p-4 space-y-3"
                    style={{ 
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.hoverBg
                    }}
                  >
                    <p style={{ color: theme.textSecondary }}>
                      <span style={{ color: theme.accent }} className="text-xs tracking-[0.15em] uppercase">Username</span>
                      <br />
                      <span style={{ color: theme.text }}>{profileUser.username}</span>
                    </p>
                    {isOwnProfile && (
                      <p style={{ color: theme.textSecondary }}>
                        <span style={{ color: theme.accent }} className="text-xs tracking-[0.15em] uppercase">Email</span>
                        <br />
                        <span style={{ color: theme.text }}>{profileUser.email}</span>
                      </p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="lg:col-span-4 p-6 md:p-8"
                  style={{ backgroundColor: theme.bgCard }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="w-10 h-10 flex items-center justify-center"
                      style={{ border: `1px solid ${theme.border}` }}
                    >
                      <Music className="w-5 h-5" style={{ color: theme.accent }} />
                    </div>
                    <h3 
                      className="text-lg tracking-wide"
                      style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                    >
                      Playlists
                    </h3>
                  </div>
                  
                  <details className="group">
                    <summary 
                      className="flex items-center justify-between cursor-pointer p-3 transition-colors duration-300"
                      style={{ 
                        border: `1px solid ${theme.border}`,
                        color: theme.text
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.accentBorder;
                        e.currentTarget.style.backgroundColor = theme.hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme.border;
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span className="text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                        View Playlists ({playlists.length})
                      </span>
                      <ArrowRight className="w-4 h-4 transition-transform group-open:rotate-90" style={{ color: theme.accent }} />
                    </summary>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-px" style={{ backgroundColor: theme.border }}>
                      {playlists.map((playlist) => (
                        <Link href={`/playlists/${playlist.id}`} key={playlist.id}>
                          <div 
                            className="group/item p-4 transition-all duration-300 cursor-pointer"
                            style={{ backgroundColor: theme.bgCard }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = theme.hoverBg;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = theme.bgCard;
                            }}
                          >
                            {playlist.cover_art_url && (
                              <div 
                                className="w-full h-32 mb-3 overflow-hidden"
                                style={{ border: `1px solid ${theme.border}` }}
                              >
                                <Image
                                  src={playlist.cover_art_url}
                                  alt={playlist.name}
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover grayscale opacity-80 group-hover/item:opacity-100 group-hover/item:grayscale-0 transition-all duration-500"
                                />
                              </div>
                            )}
                            <h4 
                              className="text-base mb-1 transition-colors"
                              style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                            >
                              {playlist.name}
                            </h4>
                            {playlist.description && (
                              <p className="text-sm font-light line-clamp-2" style={{ color: theme.textSecondary }}>
                                {playlist.description}
                              </p>
                            )}
                            <p className="text-xs mt-2 flex items-center gap-2" style={{ color: theme.textMuted }}>
                              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.accent }}></span>
                              {new Date(playlist.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </details>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="lg:col-span-6 p-6 md:p-8"
                  style={{ backgroundColor: theme.bgCard }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="w-10 h-10 flex items-center justify-center"
                      style={{ border: `1px solid ${theme.border}` }}
                    >
                      <Upload className="w-5 h-5" style={{ color: theme.accent }} />
                    </div>
                    <h3 
                      className="text-lg tracking-wide"
                      style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                    >
                      Uploaded Songs
                    </h3>
                  </div>
                  
                  <details className="group">
                    <summary 
                      className="flex items-center justify-between cursor-pointer p-3 transition-colors duration-300"
                      style={{ 
                        border: `1px solid ${theme.border}`,
                        color: theme.text
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.accentBorder;
                        e.currentTarget.style.backgroundColor = theme.hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme.border;
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span className="text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                        View Songs ({songs.length})
                      </span>
                      <ArrowRight className="w-4 h-4 transition-transform group-open:rotate-90" style={{ color: theme.accent }} />
                    </summary>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ backgroundColor: theme.border }}>
                      {songs.map((song) => (
                        <Link href={`/Songs/${song.id}`} key={song.id}>
                          <div 
                            className="group/item p-4 transition-all duration-300 cursor-pointer"
                            style={{ backgroundColor: theme.bgCard }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = theme.hoverBg;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = theme.bgCard;
                            }}
                          >
                            <h4 
                              className="text-base mb-1 line-clamp-2 transition-colors"
                              style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                            >
                              {song.title}
                            </h4>
                            <p className="text-sm font-light" style={{ color: theme.textSecondary }}>
                              {song.artist}
                            </p>
                            <span 
                              className="inline-block mt-2 px-2 py-1 text-[10px] tracking-[0.1em] uppercase"
                              style={{ 
                                border: `1px solid ${theme.accentBorder}`,
                                color: theme.accent,
                                backgroundColor: theme.accentBg
                              }}
                            >
                              {song.genre}
                            </span>
                            <p className="text-xs mt-3 flex items-center gap-2" style={{ color: theme.textMuted }}>
                              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.accent }}></span>
                              {new Date(song.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </details>
                </motion.div>

                {isOwnProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="lg:col-span-6 p-6 md:p-8"
                    id="activities"
                    style={{ backgroundColor: theme.bgCard }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 flex items-center justify-center"
                          style={{ border: `1px solid ${theme.border}` }}
                        >
                          <MessageCircle className="w-5 h-5" style={{ color: theme.accent }} />
                        </div>
                        <h3 
                          className="text-lg tracking-wide"
                          style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                        >
                          Recent Activity
                        </h3>
                      </div>
                      {unreadActivitiesCount > 0 && (
                        <span 
                          className="px-3 py-1 text-[10px] tracking-[0.1em] uppercase"
                          style={{ 
                            backgroundColor: theme.accent,
                            color: isDark ? '#050505' : '#ffffff'
                          }}
                        >
                          {unreadActivitiesCount} new
                        </span>
                      )}
                    </div>
                    
                    <details className="group">
                      <summary 
                        className="flex items-center justify-between cursor-pointer p-3 transition-colors duration-300"
                        style={{ 
                          border: `1px solid ${theme.border}`,
                          color: theme.text
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = theme.accentBorder;
                          e.currentTarget.style.backgroundColor = theme.hoverBg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = theme.border;
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span className="text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                          View Activity
                        </span>
                        <ArrowRight className="w-4 h-4 transition-transform group-open:rotate-90" style={{ color: theme.accent }} />
                      </summary>
                      <div className="mt-4 space-y-2">
                        {activities.length === 0 ? (
                          <p 
                            className="text-center py-8"
                            style={{ color: theme.textSecondary }}
                          >
                            No recent activity
                          </p>
                        ) : (
                          <>
                            {activities.map((activity) => (
                              <div
                                key={activity.id}
                                className="relative p-4 transition-all duration-300"
                                style={{ 
                                  border: activity.is_new 
                                    ? `1px solid ${theme.accentBorder}` 
                                    : `1px solid ${theme.border}`,
                                  backgroundColor: activity.is_new ? theme.accentBg : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  if (!activity.is_new) {
                                    e.currentTarget.style.backgroundColor = theme.hoverBg;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!activity.is_new) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                {activity.is_new && (
                                  <span 
                                    className="absolute -top-2 -right-2 px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase"
                                    style={{ 
                                      backgroundColor: theme.accent,
                                      color: isDark ? '#050505' : '#ffffff'
                                    }}
                                  >
                                    New
                                  </span>
                                )}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    {activity.type === 'song_upload' && (
                                      <Upload className="h-4 w-4 flex-shrink-0" style={{ color: theme.accent }} />
                                    )}
                                    {activity.type === 'song_comment' && (
                                      <Music className="h-4 w-4 flex-shrink-0" style={{ color: theme.accent }} />
                                    )}
                                    {activity.type === 'forum_comment' && (
                                      <MessageCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.accent }} />
                                    )}
                                    {activity.type === 'song_like' && (
                                      <Heart className="h-4 w-4 flex-shrink-0" style={{ color: theme.accent }} />
                                    )}
                                    {activity.type === 'song_vote' && (
                                      <ThumbsUp className="h-4 w-4 flex-shrink-0" style={{ color: theme.accent }} />
                                    )}
                                    
                                    <Link href={`/Songs/${activity.metadata.song_id}`} legacyBehavior>
                                      <a
                                        onClick={() => handleActivityClick(activity.id)}
                                        className="text-sm font-medium flex-grow transition-colors hover:underline"
                                        style={{ 
                                          color: activity.is_new ? theme.accent : theme.text,
                                          fontFamily: "'Manrope', sans-serif"
                                        }}
                                      >
                                        <span className="line-clamp-2">
                                          {activity.type === 'song_upload' && (
                                            <>Uploaded new song: {activity.metadata.song_title}</>
                                          )}
                                          {activity.type === 'song_comment' && (
                                            <>{activity.metadata.commenter_username} commented on song: {activity.metadata.song_title}</>
                                          )}
                                          {activity.type === 'forum_comment' && (
                                            <>{activity.metadata.commenter_username} commented on topic: {activity.metadata.topic_title}</>
                                          )}
                                          {activity.type === 'song_like' && (
                                            <>{activity.metadata.liker_username} liked your song: {activity.metadata.song_title}</>
                                          )}
                                          {activity.type === 'song_vote' && (
                                            <>{activity.metadata.voter_username} voted {typeof activity.metadata.vote_value === 'number' && 
                                              (activity.metadata.vote_value > 0 ? 'up' : 'down')} your song for {activity.metadata.vote_type}: {activity.metadata.song_title}</>
                                          )}
                                        </span>
                                      </a>
                                    </Link>
                                    {activity.is_new && <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: theme.accent }} />}
                                  </div>

                                  <p className="text-xs" style={{ color: theme.textMuted }}>
                                    {formatDateTime(activity.created_at)}
                                  </p>

                                  {(activity.type === 'song_comment' || activity.type === 'forum_comment') && (
                                    <div 
                                      className="text-sm font-light"
                                      style={{ color: theme.textSecondary }}
                                      dangerouslySetInnerHTML={createMarkup(activity.content)}
                                    />
                                  )}

                                  <div className="flex flex-wrap gap-3 text-sm">
                                    {typeof activity.metadata.new_replies === 'number' && 
                                     activity.metadata.new_replies > 0 && (
                                      <p style={{ color: theme.accent }}>
                                        {activity.metadata.new_replies} new {activity.metadata.new_replies === 1 ? 'reply' : 'replies'}
                                      </p>
                                    )}
                                    {typeof activity.metadata.comment_likes === 'number' && 
                                     activity.metadata.comment_likes > 0 && (
                                      <p className="flex items-center gap-1" style={{ color: theme.textSecondary }}>
                                        <Heart className="w-3 h-3" style={{ color: theme.accent }} />
                                        {activity.metadata.comment_likes} {activity.metadata.comment_likes === 1 ? 'like' : 'likes'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {totalPages > 1 && (
                              <div className="flex items-center justify-center gap-2 mt-6 pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
                                <button
                                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                                  disabled={currentPage === 1}
                                  className="p-2 transition-colors disabled:opacity-50"
                                  style={{ 
                                    border: `1px solid ${theme.border}`,
                                    color: theme.text
                                  }}
                                  onMouseEnter={(e) => {
                                    if (currentPage > 1) {
                                      e.currentTarget.style.borderColor = theme.accentBorder;
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = theme.border;
                                  }}
                                >
                                  <ArrowLeft className="w-4 h-4" />
                                </button>
                                
                                {getPageNumbers().map((page, index) => (
                                  <React.Fragment key={index}>
                                    {page === 'ellipsis' ? (
                                      <span style={{ color: theme.textSecondary }}>...</span>
                                    ) : (
                                      <button
                                        onClick={() => setCurrentPage(page as number)}
                                        className="w-8 h-8 text-xs transition-colors"
                                        style={{ 
                                          border: `1px solid ${currentPage === page ? theme.accent : theme.border}`,
                                          backgroundColor: currentPage === page ? theme.accent : 'transparent',
                                          color: currentPage === page ? (isDark ? '#050505' : '#ffffff') : theme.text
                                        }}
                                      >
                                        {page}
                                      </button>
                                    )}
                                  </React.Fragment>
                                ))}

                                <button
                                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                                  disabled={currentPage === totalPages}
                                  className="p-2 transition-colors disabled:opacity-50"
                                  style={{ 
                                    border: `1px solid ${theme.border}`,
                                    color: theme.text
                                  }}
                                  onMouseEnter={(e) => {
                                    if (currentPage < totalPages) {
                                      e.currentTarget.style.borderColor = theme.accentBorder;
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = theme.border;
                                  }}
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </details>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {isOwnProfile && (
          <>
            <Dialog open={isEditProfileImageDialogOpen} onOpenChange={setIsEditProfileImageDialogOpen}>
              <DialogContent 
                className="sm:max-w-[425px]"
                style={{ 
                  backgroundColor: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 0
                }}
              >
                <DialogHeader>
                  <DialogTitle 
                    style={{ 
                      fontFamily: "'Italiana', serif",
                      color: theme.text
                    }}
                  >
                    Edit Profile Image
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center">
                  <div 
                    className="w-[200px] h-[200px] mb-6 overflow-hidden"
                    style={{ border: `1px solid ${theme.border}` }}
                  >
                    <Image
                      src={profileUser?.profile_image_url ? getImageUrl(profileUser.profile_image_url) : DEFAULT_PROFILE_IMAGE}
                      alt="Current Profile Image"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={handleReplaceClick}
                    className="h-10 px-6 text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300"
                    style={{
                      backgroundColor: theme.accent,
                      color: isDark ? '#050505' : '#ffffff',
                      fontFamily: "'Manrope', sans-serif"
                    }}
                  >
                    Replace Image
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isImageCropperOpen} onOpenChange={setIsImageCropperOpen}>
              <DialogContent 
                className="sm:max-w-2xl max-h-[90vh] overflow-auto"
                style={{ 
                  backgroundColor: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 0
                }}
              >
                <DialogHeader>
                  <DialogTitle 
                    style={{ 
                      fontFamily: "'Italiana', serif",
                      color: theme.text
                    }}
                  >
                    Crop Image
                  </DialogTitle>
                </DialogHeader>
                {cropImageUrl && (
                  <ImageCropper
                    imageUrl={cropImageUrl}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                    aspectRatio={1}
                    maxHeight={cropperMaxHeight}
                  />
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </>
  );
}
