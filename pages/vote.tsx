import Head from 'next/head'
import { useState } from 'react'

export default function Vote() {
  const [songs] = useState([
    { id: 1, title: 'Amazing Grace', votes: 0 },
    { id: 2, title: 'How Great Thou Art', votes: 0 },
    { id: 3, title: 'It Is Well With My Soul', votes: 0 },
  ])

  const handleVote = (id: number) => {
    // Handle voting logic here
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <Head>
        <title>BibleChorus - Vote on Songs</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Vote on Songs</h1>
        <ul className="space-y-4">
          {songs.map((song) => (
            <li key={song.id} className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
              <span className="text-lg font-medium text-gray-800 dark:text-gray-100">{song.title}</span>
              <div>
                <span className="mr-4 text-gray-600 dark:text-gray-400">Votes: {song.votes}</span>
                <button
                  onClick={() => handleVote(song.id)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                  Vote
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}