import Head from 'next/head'
import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'
import axios from 'axios'
import { SongList } from '@/components/ListenPage/SongList'
import { Filters, FilterOptions } from '@/components/ListenPage/Filters'
import { motion, AnimatePresence } from "framer-motion"
import { Filter, X, Info } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/useMediaQuery"

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
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    lyricsAdherence: "all",
    isContinuous: "all",
    aiMusic: "all",
  })
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const isSmallScreen = useMediaQuery("(max-width: 768px)")

  const { data: songs, isLoading, error } = useQuery<Song[], Error>(
    ['songs', filterOptions],
    async () => {
      const res = await axios.get('/api/songs', { params: filterOptions })
      return res.data
    }
  )

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsHeaderVisible(scrollPosition < 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getFilterTags = (): string[] => {
    const tags: string[] = []
    if (filterOptions.lyricsAdherence !== "all") {
      tags.push(`Lyrics: ${filterOptions.lyricsAdherence.replace(/_/g, ' ')}`)
    }
    if (filterOptions.isContinuous !== "all") {
      tags.push(`Passage: ${filterOptions.isContinuous === "true" ? "Continuous" : "Non-continuous"}`)
    }
    if (filterOptions.aiMusic !== "all") {
      tags.push(`Music: ${filterOptions.aiMusic === "true" ? "AI" : "Human"}`)
    }
    return tags
  }

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>BibleChorus - Listen</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Header Section */}
        <div className={`container mx-auto px-4 transition-all duration-300 ${isHeaderVisible ? 'h-16' : 'h-12'}`}>
          <div className="flex items-center justify-between h-full">
            <h1 className={`text-2xl font-bold text-foreground transition-opacity duration-300 ${isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}>
              Listen to Songs
            </h1>
          </div>
        </div>

        {/* Filter Group Section */}
        <AnimatePresence>
          {isFilterExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
              <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <Popover>
                      <PopoverTrigger>
                        <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                      </PopoverTrigger>
                      <PopoverContent>
                        <p className="text-sm">
                          Adjust filters to refine your song list.
                        </p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <button
                    onClick={() => setIsFilterExpanded(false)}
                    className="text-sm flex items-center text-muted-foreground hover:text-foreground"
                    aria-label="Close filters"
                  >
                    Close Filters
                    <X className="h-4 w-4 ml-1" />
                  </button>
                </div>
                <Filters filterOptions={filterOptions} setFilterOptions={setFilterOptions} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Toggle Button */}
        {!isFilterExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsFilterExpanded(true)}
            className={`fixed right-4 z-20 p-2 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all duration-300 ${
              isHeaderVisible ? 'top-16' : 'top-12'
            }`}
            aria-label="Expand filters"
          >
            <Filter className="h-5 w-5" />
          </motion.button>
        )}
        <Separator />
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {getFilterTags().map((tag, index) => (
            <Badge key={index} variant="secondary">{tag}</Badge>
          ))}
        </div>

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