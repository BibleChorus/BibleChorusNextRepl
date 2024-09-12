import Head from 'next/head'
import Link from 'next/link'

export default function Progress() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>BibleChorus - Progress Map</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-8 pt-4 sm:pt-6 md:pt-8 lg:pt-10 xl:pt-12">Progress Map</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">This feature is coming soon!</p>
        <Link href="/" className="text-purple-600 dark:text-purple-400 hover:underline">
          Back to Home
        </Link>
      </main>
    </div>
  )
}