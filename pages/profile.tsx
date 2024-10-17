import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import Link from 'next/link'
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { CommentList } from '@/components/SongComments/CommentList' // Adjust the import path as needed

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

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter()
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [forumComments, setForumComments] = useState<ForumComment[]>([]);
  const [songComments, setSongComments] = useState<SongComment[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchUserSongs();
      fetchUserPlaylists();
      fetchUserForumComments();
      fetchUserSongComments();
    }
  }, [user, router])

  const fetchUserSongs = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/users/${user.id}/songs`);
      setSongs(response.data);
    } catch (error) {
      console.error('Error fetching user songs:', error);
    }
  };

  const fetchUserPlaylists = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/users/${user.id}/playlists?createdOnly=true`);
      setPlaylists(response.data);
    } catch (error) {
      console.error('Error fetching user playlists:', error);
    }
  };

  const fetchUserForumComments = async () => {
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
  };

  const fetchUserSongComments = async () => {
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
  };

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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>{user.username} - Profile</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Image banner at the top */}
      <div className="relative h-64 sm:h-80 w-full mb-8">
        <Image
          src={user.profile_image_url ? user.profile_image_url : '/default-profile-banner.jpg'}
          alt={`${user.username} profile banner`}
          layout="fill"
          objectFit="cover"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{user.username}</h1>
          {/* Add other user info if desired */}
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
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
      </main>
    </div>
  )
}
