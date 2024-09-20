import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import Link from 'next/link'

interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  created_at: string;
}

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter()
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchUserSongs();
    }
  }, [user, router])

  const fetchUserSongs = async () => {
    if (!user) return; // Add this check
    try {
      const response = await axios.get(`/api/users/${user.id}/songs`);
      setSongs(response.data);
    } catch (error) {
      console.error('Error fetching user songs:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>BibleChorus - Profile</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-8 pt-4 sm:pt-6 md:pt-8 lg:pt-10 xl:pt-12">Your Profile</h1>
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Username</h2>
            <p className="text-gray-800 dark:text-gray-100">{user.username}</p>
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Email</h2>
            <p className="text-gray-800 dark:text-gray-100">{user.email}</p>
          </div>
          {/* Add more user details as needed */}
        </div>
        <button className="mb-8 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
          Edit Profile
        </button>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Your Uploaded Songs</h2>
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
      </main>
    </div>
  )
}