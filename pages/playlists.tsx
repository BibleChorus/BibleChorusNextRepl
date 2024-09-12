import Head from 'next/head'
import Link from 'next/link'

export default function Playlists() {
  const playlists = [
    { id: 1, name: 'Worship Songs' },
    { id: 2, name: 'Hymns' },
    { id: 3, name: 'Gospel' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>BibleChorus - Playlists</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-8 pt-4 sm:pt-6 md:pt-8 lg:pt-10 xl:pt-12">Your Playlists</h1>
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