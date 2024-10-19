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

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export default function Profile() {
  const { user, login, getAuthToken } = useAuth();
  const router = useRouter()
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [forumComments, setForumComments] = useState<ForumComment[]>([]);
  const [songComments, setSongComments] = useState<SongComment[]>([]);

  const [isEditProfileImageDialogOpen, setIsEditProfileImageDialogOpen] = useState(false)
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null)
  const [isImageCropperOpen, setIsImageCropperOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropperMaxHeight, setCropperMaxHeight] = useState<number>(0)

  // Wrap fetch functions with useCallback to include them in useEffect dependencies
  const fetchUserSongs = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/users/${user.id}/songs`);
      setSongs(response.data);
    } catch (error) {
      console.error('Error fetching user songs:', error);
    }
  }, [user]);

  const fetchUserPlaylists = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/users/${user.id}/playlists?createdOnly=true`);
      setPlaylists(response.data);
    } catch (error) {
      console.error('Error fetching user playlists:', error);
    }
  }, [user]);

  const fetchUserForumComments = useCallback(async () => {
    if (!user) return;
    try {
      console.log('Fetching forum comments for user:', user.id);
      const response = await axios.get(`/api/users/${user.id}/forum-comments`);
      console.log('Forum comments response:', response.data);
      setForumComments(response.data);
    } catch (error) {
      console.error('Error fetching user forum comments:', error.response?.data || error.message);
      // Optionally, you can set an error state here to display to the user
    }
  }, [user]);

  const fetchUserSongComments = useCallback(async () => {
    if (!user) return;
    try {
      console.log('Fetching song comments for user:', user.id);
      const response = await axios.get(`/api/users/${user.id}/song-comments`);
      console.log('Song comments response:', response.data);
      setSongComments(response.data);
    } catch (error) {
      console.error('Error fetching user song comments:', error.response?.data || error.message);
      // Optionally, you can set an error state here to display to the user
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchUserSongs();
      fetchUserPlaylists();
      fetchUserForumComments();
      fetchUserSongComments();
    }
  }, [user, router, fetchUserSongs, fetchUserPlaylists, fetchUserForumComments, fetchUserSongComments]); // Added fetch functions to dependencies

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

    if (!user) {
      toast.error('User not logged in');
      return;
    }

    try {
      // First, delete the old profile image if it exists
      if (user.profile_image_url) {
        const fileKey = user.profile_image_url.replace(CDN_URL, '').replace(/^\/+/, '');
        await axios.post('/api/delete-file', { fileKey });
      }

      const fileExtension = 'jpg';
      const fileType = 'image/jpeg';
      const userId = user.id;
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
      const updateResponse = await axios.put(`/api/users/${user.id}/update-profile-image`, {
        profileImageUrl: fileKey,
      });

      if (updateResponse.status === 200) {
        // Update the user context with the new profile image URL
        const updatedUser = { ...user, profile_image_url: updateResponse.data.updatedUrl };
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>{user ? `${user.username}'s Profile` : 'Profile'} | BibleChorus</title>
        <meta name="description" content="User profile page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        {/* Image banner at the top */}
        <div className="relative h-64 sm:h-80 w-full mb-8">
          <Image
            src={user?.profile_image_url ? `${CDN_URL}${user.profile_image_url}` : '/default-profile-banner.jpg'}
            alt={`${user?.username} profile banner`}
            layout="fill"
            objectFit="cover"
            className="object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white">{user?.username}</h1>
            {/* Add other user info if desired */}
          </div>
          {user && (
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
                <CardTitle className="text-2xl font-bold">Profile Details</CardTitle>
                <Button variant="ghost" size="sm">
                  {/* Add an edit icon if needed */}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              {/* Add more user details as needed */}
            </CardContent>
          </Card>

          {/* Playlists Card */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Your Playlists</CardTitle>
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
              <CardTitle className="text-2xl font-bold">Your Uploaded Songs</CardTitle>
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

          {/* Forum Comments Card */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Your Forum Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="forum-comments">
                  <AccordionTrigger>View Comments</AccordionTrigger>
                  <AccordionContent>
                    {forumComments.length === 0 ? (
                      <p>No forum comments yet.</p>
                    ) : (
                      Object.entries(groupCommentsByTopic(forumComments)).map(([topicId, { topic_title, comments }]) => (
                        <div key={topicId} className="mb-6">
                          <Link href={`/forum/topics/${topicId}`}>
                            <h3 className="text-lg font-semibold mb-2 hover:underline cursor-pointer">{topic_title}</h3>
                          </Link>
                          <ul>
                            {comments.map((comment) => (
                              <li key={comment.id} className="mb-2">
                                <p>{comment.content}</p>
                                <small>{new Date(comment.created_at).toLocaleString()}</small>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Song Comments Card */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Your Song Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="song-comments">
                  <AccordionTrigger>View Comments</AccordionTrigger>
                  <AccordionContent>
                    {songComments.length === 0 ? (
                      <p>No song comments yet.</p>
                    ) : (
                      <ul>
                        {songComments.map((comment) => (
                          <li key={comment.id} className="mb-2">
                            <p>{comment.content}</p>
                            <small>{new Date(comment.created_at).toLocaleString()}</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile Image Dialog */}
        <Dialog open={isEditProfileImageDialogOpen} onOpenChange={setIsEditProfileImageDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Profile Image</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center">
              <Image
                src={user?.profile_image_url ? `${CDN_URL}${user.profile_image_url}` : '/default-profile-image.jpg'}
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
      </main>
    </div>
  )
}
