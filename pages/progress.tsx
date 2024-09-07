import Head from 'next/head'
import Link from 'next/link'

export default function Progress() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <Head>
        <title>BibleChorus - Progress Map</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Progress Map</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">This feature is coming soon!</p>
        <Link href="/" className="text-purple-600 dark:text-purple-400 hover:underline">
          Back to Home
        </Link>
      </main>
    </div>
  )
}