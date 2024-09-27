import Head from 'next/head'
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'
import axios from 'axios'

import { columns } from './listen/columns' // Import columns definition
import { DataTable } from './listen/data-table' // Import DataTable component

// Define the Song type based on your data structure
export type Song = {
  id: number;
  title: string;
  artist: string;
  genre: string;
  created_at: string;
  audio_url: string;
  // Add more fields as necessary
}

// Create a React Query client
const queryClient = new QueryClient()

export default function Listen() {
  return (
    // Provide the QueryClient to your app
    <QueryClientProvider client={queryClient}>
      <ListenContent />
    </QueryClientProvider>
  )
}

function ListenContent() {
  // Use React Query's useQuery hook to fetch songs
  const { data: songs, isLoading, error } = useQuery<Song[], Error>('songs', async () => {
    const res = await axios.get('/api/songs')
    return res.data
  })

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>BibleChorus - Listen</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 pt-4">
          Listen to Songs
        </h1>

        {/* Display loading, error, or the DataTable */}
        {isLoading ? (
          <p>Loading songs...</p>
        ) : error ? (
          <p>Error loading songs: {error.message}</p>
        ) : (
          // Render the DataTable with the fetched songs
          <DataTable columns={columns} data={songs || []} />
        )}
      </main>
    </div>
  )
}