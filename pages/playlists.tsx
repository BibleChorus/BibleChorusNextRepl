import Head from 'next/head'
import Link from 'next/link'

export default function Playlists() {
  const playlists = [
    { id: 1, name: 'Worship Songs' },
    { id: 2, name: 'Hymns' },
    { id: 3, name: 'Gospel' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <Head>
        <title>BibleChorus - Playlists</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Your Playlists</h1>
        <ul className="space-y-4">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <Link href={`/playlists/${playlist.id}`}>
                <span className="block p-4 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{playlist.name}</h2>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}