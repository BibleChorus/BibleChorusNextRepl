import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import Link from 'next/link'
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { CommentList } from '@/components/SongComments/CommentList' // Adjust the import path as needed
import { ImageCropper } from '@/components/UploadPage/ImageCropper'
import { Pencil } from 'lucide-react'
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

  // Add a function to fetch profile user data
  const fetchProfileUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (profileUserId) {
        const response = await axios.get(`/api/users/${profileUserId}`);
        setProfileUser(response.data);
      } else if (currentUser) {
        // If no ID in query, show current user's profile
        setProfileUser(currentUser);
      }
    } catch (error) {
      console.error('Error fetching profile user:', error);
      setError('Failed to load user profile. Please try again later.');
      toast.error('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  }, [profileUserId, currentUser]);

  // Update fetch functions to use profileUser instead of user
  const fetchUserSongs = useCallback(async () => {
    if (!profileUser) return;
    try {
      const response = await axios.get(`/api/users/${profileUser.id}/songs`);
      setSongs(response.data);
    } catch (error) {
      console.error('Error fetching user songs:', error);
    }
  }, [profileUser]);

  // Update other fetch functions similarly...
  const fetchUserPlaylists = useCallback(async () => {
    if (!profileUser) return;
    try {
      const response = await axios.get(`/api/users/${profileUser.id}/playlists?createdOnly=true`);
      setPlaylists(response.data);
    } catch (error) {
      console.error('Error fetching user playlists:', error);
    }
  }, [profileUser]);

  const fetchUserForumComments = useCallback(async () => {
    if (!profileUser) return;
    try {
      const response = await axios.get(`/api/users/${profileUser.id}/forum-comments`);
      setForumComments(response.data);
    } catch (error) {
      console.error('Error fetching user forum comments:', error);
    }
  }, [profileUser]);

  const fetchUserSongComments = useCallback(async () => {
    if (!profileUser) return;
    try {
      const response = await axios.get(`/api/users/${profileUser.id}/song-comments`);
      setSongComments(response.data);
    } catch (error) {
      console.error('Error fetching user song comments:', error);
    }
  }, [profileUser]);

  // Move fetchUnreadActivitiesCount declaration before it's used
  const fetchUnreadActivitiesCount = useCallback(async () => {
    // Only fetch unread count if it's the user's own profile
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

  // Then declare fetchUserActivities after fetchUnreadActivitiesCount
  const fetchUserActivities = useCallback(async () => {
    // Only fetch activities if it's the user's own profile
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
      // Only show error toast if it's the user's own profile
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

  // Update useEffect to handle profile loading
  useEffect(() => {
    if (!currentUser && !profileUserId) {
      router.push('/login');
    } else {
      fetchProfileUser();
    }
  }, [currentUser, profileUserId, router, fetchProfileUser]);

  // Update useEffect to include activities fetch
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const token = await getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      if (profileUser) {
        // Always fetch songs and playlists
        fetchUserSongs();
        fetchUserPlaylists();
        
        // Only fetch activities if it's the user's own profile
        if (currentUser && profileUser.id === currentUser.id) {
          fetchUserActivities();
        }
      }
    };

    checkAuthAndFetchData();
  }, [profileUser, currentUser, fetchUserSongs, fetchUserPlaylists, fetchUserActivities, getAuthToken, router]);

  // Add useEffect for initial unread count fetch
  useEffect(() => {
    // Only fetch unread count if it's the user's own profile
    if (profileUser && currentUser && profileUser.id === currentUser.id) {
      fetchUnreadActivitiesCount();
    }
  }, [profileUser, currentUser, fetchUnreadActivitiesCount]);

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
    <div className="min-h-screen bg-background">
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

      <main className="container mx-auto px-4 py-8">
        {/* Image banner at the top */}
        <div className="relative h-64 sm:h-80 w-full mb-8">
          <Image
            src={profileUser?.profile_image_url ? `${CDN_URL}${profileUser.profile_image_url}` : DEFAULT_PROFILE_IMAGE}
            alt={`${profileUser?.username} profile banner`}
            layout="fill"
            objectFit="cover"
            className="object-cover"
            priority
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white">{profileUser?.username}</h1>
          </div>
          {/* Only show edit button if it's the user's own profile */}
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:text-primary-300 transition-colors"
              onClick={handleEditProfileImageClick}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Main content */}
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* User Details Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">{`${profileUser.username}'s Profile Details`}</CardTitle>
                {isOwnProfile && (
                  <Button variant="ghost" size="sm">
                    {/* Add edit icon if needed */}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p><strong>Username:</strong> {profileUser.username}</p>
              {isOwnProfile && <p><strong>Email:</strong> {profileUser.email}</p>}
              {/* Add more profile details as needed */}
            </CardContent>
          </Card>

          {/* Playlists Card */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Playlists</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="playlists">
                  <AccordionTrigger>View Playlists</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      {playlists.map((playlist) => (
                        <Link
                          href={`/playlists/${playlist.id}`}
                          key={playlist.id}
                        >
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                            {playlist.cover_art_url && (
                              <Image
                                src={playlist.cover_art_url}
                                alt={playlist.name}
                                width={200}
                                height={200}
                                className="w-full h-32 object-cover rounded-md mb-2"
                              />
                            )}
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{playlist.name}</h3>
                            {playlist.description && (
                              <p className="text-gray-600 dark:text-gray-400">{playlist.description}</p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
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

          {/* Uploaded Songs Card */}
          <Card className="lg:col-span-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Uploaded Songs</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="songs">
                  <AccordionTrigger>View Songs</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {songs.map((song) => (
                        <Link href={`/Songs/${song.id}`} key={song.id}>
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{song.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{song.artist}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">{song.genre}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
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

          {/* Replace the Forum Comments and Song Comments cards with the Activity Card */}
          {isOwnProfile && (
            <Card className="lg:col-span-6" id="activities">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl md:text-2xl font-bold">Recent Activity</CardTitle>
                  {unreadActivitiesCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-sm rounded-full px-3 py-1">
                      {unreadActivitiesCount} new
                    </span>
                  )}
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
          )}
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
      </main>
    </div>
  )
}
