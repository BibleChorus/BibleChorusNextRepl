import Head from 'next/head'
import { useState } from 'react'

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Handle file upload logic here
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <Head>
        <title>BibleChorus - Upload Songs</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Upload Songs</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Choose a file
            </label>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-50 file:text-purple-700
                hover:file:bg-purple-100
                dark:file:bg-purple-900 dark:file:text-purple-300
                dark:hover:file:bg-purple-800"
            />
          </div>
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Upload
          </button>
        </form>
      </main>
    </div>
  )
}