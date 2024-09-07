import Head from 'next/head'
import { useState } from 'react'

export default function Listen() {
  const [songs] = useState([
    { id: 1, title: 'Amazing Grace', artist: 'John Newton' },
    { id: 2, title: 'How Great Thou Art', artist: 'Carl Boberg' },
    { id: 3, title: 'It Is Well With My Soul', artist: 'Horatio Spafford' },
  ])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <Head>
        <title>BibleChorus - Listen</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Listen to Songs</h1>
        <ul className="space-y-4">
          {songs.map((song) => (
            <li key={song.id} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{song.title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{song.artist}</p>
              <button className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-sm">
                Play
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}