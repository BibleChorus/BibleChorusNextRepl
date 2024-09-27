import Head from 'next/head'
import { useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'
import axios from 'axios'

// Remove imports related to DataTable and columns
// import { columns, getColumns, ColumnSelector } from './listen/columns'
// import { VisibilityState } from '@tanstack/react-table'

// Add import for the SongList component
import { SongList } from '@/components/ListenPage/SongList'

// Define the Song type based on your data structure
export type Song = {
  id: number;
  title: string;
  artist: string;
  genre: string;
  created_at: string;
  audio_url: string;
  song_art_url?: string;
  bible_translation_used?: string;
  lyrics_scripture_adherence?: string;
  is_continuous_passage?: boolean;
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
  // We no longer need the visibleColumns state since we're using SongList instead of DataTable
  // Remove or comment out the following code:

  // const [visibleColumns, setVisibleColumns] = useState<VisibilityState>(
  //   columns.reduce((acc, column) => {
  //     if (column.id) {
  //       acc[column.id] = true
  //     }
  //     return acc
  //   }, {} as VisibilityState)
  // )

  // Update the useQuery hook to use the new API endpoint
  const { data: songs, isLoading, error } = useQuery<Song[], Error>('songs', async () => {
    const res = await axios.get('/api/songs')
    console.log('API response:', res.data) // Add this line for debugging
    return res.data
  })

  // Since we are no longer adjusting column visibility, remove the handleColumnVisibilityChange function
  // Remove or comment out the following code:

  // const handleColumnVisibilityChange = (updatedColumns: VisibilityState) => {
  //   setVisibleColumns(updatedColumns)
  // }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>BibleChorus - Listen</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6">
          Listen to Songs
        </h1>

        {/* Display loading, error, or the SongList */}
        {isLoading ? (
          <p>Loading songs...</p>
        ) : error ? (
          <p>Error loading songs: {error.message}</p>
        ) : (
          // Use the SongList component to display the songs
          <SongList songs={songs || []} />
        )}
      </main>
    </div>
  )
}