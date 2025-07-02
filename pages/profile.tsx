import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { CommentList } from '@/components/SongComments/CommentList' // Adjust the import path as needed
import { ImageCropper } from '@/components/UploadPage/ImageCropper'
import { Pencil, User } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Music, MessageCircle, Upload, ArrowRight, Heart, ThumbsUp } from 'lucide-react';
import { cn } from "@/lib/utils";
import DOMPurify from 'isomorphic-dompurify';
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

// Update the Activity interface to include all metadata fields
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
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Add this constant near the top of the file
const DEFAULT_PROFILE_IMAGE = '/biblechorus-icon.png'; // Make sure this file exists in your public directory

// Add this function to safely render HTML content
const createMarkup = (content: string) => {
  return { __html: DOMPurify.sanitize(content) };
};

// Add a helper function to format the date and time
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

export default function Profile() {
  const { user: currentUser, login, getAuthToken } = useAuth();
  const router = useRouter();
  const { id: profileUserId } = router.query; // Get the user ID from the URL query
  const [profileUser, setProfileUser] = useState<any>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [forumComments, setForumComments] = useState<ForumComment[]>([]);
  const [songComments, setSongComments] = useState<SongComment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [isEditProfileImageDialogOpen, setIsEditProfileImageDialogOpen] = useState(false)
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null)
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

  // Move all fetch functions before the useEffects that use them
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

  // Now add the useEffects that use these functions
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

  // Authentication check useEffect
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

  // Data fetching useEffect
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

  // Calculate total pages
  const totalPages = Math.ceil(totalActivities / ITEMS_PER_PAGE);

  // Fix the type issue with page numbers array
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []; // Add explicit type
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

  // Add helper function to check if current user is viewing their own profile
  const isOwnProfile = currentUser && profileUser && currentUser.id === profileUser.id;

  useEffect(() => {
    const updateCropperMaxHeight = () => {
      const viewportHeight = window.innerHeight
      setCropperMaxHeight(Math.floor(viewportHeight * 0.8)) // Set max height to 80% of viewport height
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
    }
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setIsImageCropperOpen(false);
    setIsEditProfileImageDialogOpen(false);

    if (!profileUser) {
      toast.error('User not logged in');
      return;
    }

    try {
      // First, delete the old profile image if it exists
      if (profileUser.profile_image_url) {
        const fileKey = profileUser.profile_image_url.replace(CDN_URL, '').replace(/^\/+/, '');
        await axios.post('/api/delete-file', { fileKey });
      }

      const fileExtension = 'jpg';
      const fileType = 'image/jpeg';
      const userId = profileUser.id;
      const fileSize = croppedImageBlob.size.toString();

      // Get signed URL for uploading new profile image
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

      // Upload the image to S3 using the signed URL
      await axios.put(signedUrl, croppedImageBlob, {
        headers: {
          'Content-Type': fileType,
        },
      });

      // Update the user with the new profile image URL
      const updateResponse = await axios.put(`/api/users/${profileUser.id}/update-profile-image`, {
        profileImageUrl: fileKey,
      });

      if (updateResponse.status === 200) {
        // Update the user context with the new profile image URL
        const updatedUser = { ...profileUser, profile_image_url: updateResponse.data.updatedUrl };
        // Get the current auth token
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
  };

  const handleCropCancel = () => {
    setIsImageCropperOpen(false);
    setCropImageUrl(null);
  };

  // Add handleActivityClick inside the component
  const handleActivityClick = async (activityId: string) => {
    try {
      await axios.post(`/api/users/activities/${activityId}/mark-as-read`);
      // Now fetchUserActivities is in scope
      fetchUserActivities();
    } catch (error) {
      console.error('Error marking activity as read:', error);
    }
  };

  // Add this early return for the login prompt
  if (showLoginPrompt) {
    return (
      <div className="min-h-screen bg-background">
        <LoginPromptDialog
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          title="Login Required"
          description="Please login to view and manage your profile."
        />
      </div>
    );
  }

  // Keep the loading state check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-64 sm:h-80 w-full mb-8 bg-gray-200 dark:bg-gray-700" />
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
              <div className="lg:col-span-2 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="lg:col-span-4 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="lg:col-span-6 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">{error}</h2>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
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
        <meta property="og:image" content={profileUser?.profile_image_url ? `${CDN_URL}${profileUser.profile_image_url}` : '/default-profile-banner.jpg'} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 dark:from-blue-950/50 dark:via-slate-900 dark:to-purple-950/30">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-20 pt-12"
        >
          {/* Enhanced Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.08] via-purple-500/[0.06] to-indigo-500/[0.08] dark:from-blue-500/[0.15] dark:via-purple-500/[0.12] dark:to-indigo-500/[0.15]"></div>
            <div className="absolute top-0 -left-8 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
            <div className="absolute top-12 -right-8 w-80 h-80 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-12 left-32 w-96 h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),rgba(255,255,255,0))]"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-indigo-500/20 backdrop-blur-md border border-blue-500/20 dark:border-blue-500/30 shadow-lg">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent font-semibold">
                    {isOwnProfile ? 'Your Profile' : 'User Profile'}
                  </span>
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
              >
                <span className="block text-slate-900 dark:text-white mb-2">{profileUser.username}</span>
                <span className="block relative">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                    Profile
                  </span>
                  <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-full scale-x-0 animate-scale-x"></div>
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-8 text-xl text-slate-600 dark:text-slate-300 sm:text-2xl max-w-3xl mx-auto leading-relaxed"
              >
                {isOwnProfile ? 
                  'Manage your contributions and track your musical journey' :
                  `Explore ${profileUser.username}'s musical contributions and activities`
                }
              </motion.p>
            </div>

            {/* Profile Image Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex justify-center"
            >
              <div className="relative group">
                <div className="w-48 h-48 rounded-full overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-4 border-white/20 dark:border-slate-700/50 shadow-2xl group-hover:shadow-3xl transition-all duration-500">
                  <Image
                    src={profileUser?.profile_image_url ? `${CDN_URL}${profileUser.profile_image_url}` : DEFAULT_PROFILE_IMAGE}
                    alt={`${profileUser?.username} profile`}
                    width={192}
                    height={192}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                {isOwnProfile && (
                  <button
                    onClick={handleEditProfileImageClick}
                    className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
            
            {/* Enhanced Floating Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="absolute top-16 right-16 hidden xl:block"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl backdrop-blur-sm animate-float shadow-xl"></div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="absolute bottom-16 left-16 hidden xl:block"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl backdrop-blur-sm animate-float animation-delay-2000 shadow-xl"></div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="container mx-auto px-4 -mt-12 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl p-8 md:p-10"
          >
            {/* Main content */}
            <Button variant="outline" onClick={() => router.back()} className="mb-6 hover:scale-105 transition-all duration-300">
              Back
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
              {/* Enhanced User Details Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-2"
              >
                <Card className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border border-white/20 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 hover:shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Profile Details
                      </CardTitle>
                      <div className="p-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl backdrop-blur-sm border border-blue-500/20 dark:border-blue-500/30">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-200/30 dark:border-blue-800/30">
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong className="text-blue-600 dark:text-blue-400">Username:</strong> {profileUser.username}
                      </p>
                      {isOwnProfile && (
                        <p className="text-slate-700 dark:text-slate-300 mt-2">
                          <strong className="text-purple-600 dark:text-purple-400">Email:</strong> {profileUser.email}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Enhanced Playlists Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-4"
              >
                <Card className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border border-white/20 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 hover:shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Playlists
                      </CardTitle>
                      <div className="p-2 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl backdrop-blur-sm border border-purple-500/20 dark:border-purple-500/30">
                        <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="playlists" className="border-purple-200/30 dark:border-purple-800/30">
                        <AccordionTrigger className="text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                          View Playlists ({playlists.length})
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {playlists.map((playlist) => (
                              <Link
                                href={`/playlists/${playlist.id}`}
                                key={playlist.id}
                              >
                                <div className="group bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm p-4 rounded-xl border border-white/30 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                                  {playlist.cover_art_url && (
                                    <Image
                                      src={playlist.cover_art_url}
                                      alt={playlist.name}
                                      width={200}
                                      height={200}
                                      className="w-full h-32 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform duration-300"
                                    />
                                  )}
                                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {playlist.name}
                                  </h3>
                                  {playlist.description && (
                                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{playlist.description}</p>
                                  )}
                                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center">
                                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                                    {new Date(playlist.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Enhanced Uploaded Songs Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="lg:col-span-6"
              >
                <Card className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border border-white/20 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 hover:shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                        Uploaded Songs
                      </CardTitle>
                      <div className="p-2 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-xl backdrop-blur-sm border border-indigo-500/20 dark:border-indigo-500/30">
                        <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="songs" className="border-indigo-200/30 dark:border-indigo-800/30">
                        <AccordionTrigger className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          View Songs ({songs.length})
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {songs.map((song) => (
                              <Link href={`/Songs/${song.id}`} key={song.id}>
                                <div className="group bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm p-4 rounded-xl border border-white/30 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                    {song.title}
                                  </h3>
                                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{song.artist}</p>
                                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100/60 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                                      {song.genre}
                                    </span>
                                  </p>
                                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 flex items-center">
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                                    {new Date(song.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Enhanced Activity Card */}
              {isOwnProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="lg:col-span-6"
                  id="activities"
                >
                  <Card className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border border-white/20 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 hover:shadow-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                          Recent Activity
                        </CardTitle>
                        <div className="flex items-center gap-3">
                          {unreadActivitiesCount > 0 && (
                            <span className="bg-gradient-to-r from-green-600 to-teal-600 text-white text-sm rounded-full px-3 py-1 shadow-lg">
                              {unreadActivitiesCount} new
                            </span>
                          )}
                          <div className="p-2 bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl backdrop-blur-sm border border-green-500/20 dark:border-green-500/30">
                            <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="activities">
                    <AccordionTrigger>View Activity</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {activities.length === 0 ? (
                          <p className="text-muted-foreground">No recent activity</p>
                        ) : (
                          <>
                            {activities.map((activity) => (
                              <div
                                key={activity.id}
                                className={cn(
                                  "bg-card p-3 md:p-4 rounded-lg border shadow-sm transition-all",
                                  activity.is_new 
                                    ? "bg-primary/5 border-primary ring-2 ring-primary/20" 
                                    : "hover:border-primary/30",
                                  "relative"
                                )}
                              >
                                {activity.is_new && (
                                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                                    New
                                  </span>
                                )}
                                <div className="space-y-2">
                                  {/* Activity Header */}
                                  <div className="flex items-center gap-2 md:gap-3">
                                    {/* Icons */}
                                    {activity.type === 'song_upload' && (
                                      <Upload className="h-5 w-5 md:h-4 md:w-4 flex-shrink-0 text-blue-500" />
                                    )}
                                    {activity.type === 'song_comment' && (
                                      <Music className="h-5 w-5 md:h-4 md:w-4 flex-shrink-0 text-purple-500" />
                                    )}
                                    {activity.type === 'forum_comment' && (
                                      <MessageCircle className="h-5 w-5 md:h-4 md:w-4 flex-shrink-0 text-green-500" />
                                    )}
                                    {activity.type === 'song_like' && (
                                      <Heart className="h-5 w-5 md:h-4 md:w-4 flex-shrink-0 text-red-500" />
                                    )}
                                    {activity.type === 'song_vote' && (
                                      <ThumbsUp className="h-5 w-5 md:h-4 md:w-4 flex-shrink-0 text-yellow-500" />
                                    )}
                                    
                                    {/* Activity Title */}
                                    <Link href={`/Songs/${activity.metadata.song_id}`} legacyBehavior>
                                      <a
                                        onClick={() => handleActivityClick(activity.id)}
                                        className={cn(
                                          "font-medium hover:underline flex-grow",
                                          activity.is_new && "text-primary font-semibold"
                                        )}
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
                                    {activity.is_new && <ArrowRight className="h-4 w-4 flex-shrink-0" />}
                                  </div>

                                  {/* Timestamp */}
                                  <p className="text-xs text-muted-foreground">
                                    {formatDateTime(activity.created_at)}
                                  </p>

                                  {/* Activity Content */}
                                  {(activity.type === 'song_comment' || activity.type === 'forum_comment') && (
                                    <div 
                                      className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none break-words"
                                      dangerouslySetInnerHTML={createMarkup(activity.content)}
                                    />
                                  )}

                                  {/* Additional Metadata */}
                                  <div className="flex flex-wrap gap-2 text-sm">
                                    {typeof activity.metadata.new_replies === 'number' && 
                                     activity.metadata.new_replies > 0 && (
                                      <p className="text-primary font-medium">
                                        {activity.metadata.new_replies} new {activity.metadata.new_replies === 1 ? 'reply' : 'replies'}
                                      </p>
                                    )}
                                    {typeof activity.metadata.comment_likes === 'number' && 
                                     activity.metadata.comment_likes > 0 && (
                                      <p className="text-muted-foreground flex items-center gap-1">
                                        <span className="text-red-500">♥</span>
                                        {activity.metadata.comment_likes} {activity.metadata.comment_likes === 1 ? 'like' : 'likes'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {/* Pagination */}
                            {totalPages > 1 && (
                              <Pagination className="mt-4">
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                                      }}
                                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                    />
                                  </PaginationItem>
                                  
                                  {getPageNumbers().map((page, index) => (
                                    <PaginationItem key={index}>
                                      {page === 'ellipsis' ? (
                                        <PaginationEllipsis />
                                      ) : (
                                        <PaginationLink
                                          href="#"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage(page as number);
                                          }}
                                          isActive={currentPage === page}
                                        >
                                          {page}
                                        </PaginationLink>
                                      )}
                                    </PaginationItem>
                                  ))}

                                  <PaginationItem>
                                    <PaginationNext
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                      }}
                                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                            )}
                          </>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            </div>
          </motion.div>
        </div>

        {/* Edit Profile Image Dialog */}
        {isOwnProfile && (
          <>
            <Dialog open={isEditProfileImageDialogOpen} onOpenChange={setIsEditProfileImageDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Profile Image</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center">
                  <Image
                    src={profileUser?.profile_image_url ? `${CDN_URL}${profileUser.profile_image_url}` : DEFAULT_PROFILE_IMAGE}
                    alt="Current Profile Image"
                    width={200}
                    height={200}
                    className="rounded-full mb-4"
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
              <DialogContent className="sm:max-w-[600px] p-0">
                <DialogHeader className="p-4">
                  <DialogTitle>Crop Image</DialogTitle>
                </DialogHeader>
                {cropImageUrl && (
                  <ImageCropper
                    imageUrl={cropImageUrl}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                    maxHeight={cropperMaxHeight}
                  />
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </>
  )
}
