import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) {
    return null; // Return null instead of a loading message
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <Head>
        <title>BibleChorus - Profile</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Your Profile</h1>
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
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
        <button className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
          Edit Profile
        </button>
      </main>
    </div>
  )
}