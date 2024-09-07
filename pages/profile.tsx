import Head from 'next/head'
import { useState } from 'react'

export default function Profile() {
  const [user] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    joinDate: 'January 1, 2023',
  })

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
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Name</h2>
            <p className="text-gray-800 dark:text-gray-100">{user.name}</p>
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Email</h2>
            <p className="text-gray-800 dark:text-gray-100">{user.email}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Member Since</h2>
            <p className="text-gray-800 dark:text-gray-100">{user.joinDate}</p>
          </div>
        </div>
        <button className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
          Edit Profile
        </button>
      </main>
    </div>
  )
}