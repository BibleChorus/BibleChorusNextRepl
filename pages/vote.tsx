import Head from 'next/head'
import { useState } from 'react'

export default function Vote() {
  const [songs] = useState([
    { id: 1, title: 'Amazing Grace', artist: 'John Newton', votes: 0 },
    { id: 2, title: 'How Great Thou Art', artist: 'Carl Boberg', votes: 0 },
    { id: 3, title: 'It Is Well With My Soul', artist: 'Horatio Spafford', votes: 0 },
  ])

  const handleVote = (id: number) => {
    // Handle voting logic here
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>BibleChorus - Vote</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-8 pt-4 sm:pt-6 md:pt-8 lg:pt-10 xl:pt-12">Vote for Songs</h1>
        <ul className="space-y-4">
          {songs.map((song) => (
            <li key={song.id} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{song.title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{song.artist}</p>
              <p className="text-gray-600 dark:text-gray-400">Votes: {song.votes}</p>
              <button
                onClick={() => handleVote(song.id)}
                className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Vote
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}