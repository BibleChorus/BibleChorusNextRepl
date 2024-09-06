import Head from 'next/head'
import Link from 'next/link'

export default function Search() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-8">
      <Head>
        <title>BibleChorus - Advanced Search</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Advanced Search</h1>
        <p className="text-gray-600 mb-4">This feature is coming soon!</p>
        <Link href="/" className="text-purple-600 hover:underline">
          Back to Home
        </Link>
      </main>
    </div>
  )
}