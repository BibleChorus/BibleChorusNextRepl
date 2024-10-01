import Head from 'next/head'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { SongList } from '@/components/ListenPage/SongList'
import { Filters, FilterOptions } from '@/components/ListenPage/Filters'
import { motion, AnimatePresence } from "framer-motion"
import { Filter, X, Info } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import qs from 'qs'
import { SongListSkeleton } from '@/components/ListenPage/SongListSkeleton'
import { useInView } from 'react-intersection-observer';
import useSWRInfinite from 'swr/infinite';
import { useRouter } from 'next/router'

const fetcher = (url: string) => fetch(url).then(res => res.json()).then(data => ({
  songs: data.songs || [],
  total: data.total || 0,
}));

// Updated Song type definition
export type Song = {
  id: number;
  title: string;
  username: string;
  uploaded_by: number;
  artist: string;
  // Remove 'genre: string;'
  genres: string[]; // Add this line
  created_at: string;
  audio_url: string;
  song_art_url?: string;
  bible_translation_used?: string;
  lyrics_scripture_adherence?: string;
  is_continuous_passage?: boolean;
  bible_verses?: { book: string; chapter: number; verse: number }[];
};

export default function Listen() {
  return (
    <ListenContent />
  )
}

function ListenContent() {
  const router = useRouter()
  const querySearch = router.query.search as string || ''

  // Initialize filterOptions with URL query
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    lyricsAdherence: [],
    isContinuous: "all",
    aiMusic: "all",
    genres: [],
    aiUsedForLyrics: 'all',  // Updated from false
    musicModelUsed: "",
    title: "",
    artist: "",
    bibleTranslation: "",
    bibleBooks: [],
    search: querySearch,
    bibleChapters: {},
    bibleVerses: [],
  })

  useEffect(() => {
    // Update filters if search query changes
    if (querySearch) {
      setFilterOptions((prev) => ({ ...prev, search: querySearch }))
    }
  }, [querySearch])

  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const isSmallScreen = useMediaQuery("(max-width: 768px)")
  const [page, setPage] = useState(1)

  // Debounce filter changes
  const [debouncedFilters, setDebouncedFilters] = useState(filterOptions)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedFilters(filterOptions), 500)
    return () => clearTimeout(handler)
  }, [filterOptions])

  // Build query string for filters
  const buildQueryString = (filters: FilterOptions, page: number) => {
    const params = new URLSearchParams()

    // Add filters to params
    filters.lyricsAdherence.forEach(value => params.append('lyricsAdherence', value))
    if (filters.isContinuous !== 'all') {
      params.append('isContinuous', filters.isContinuous)
    }
    if (filters.aiMusic !== 'all') {
      params.append('aiMusic', filters.aiMusic)
    }
    filters.genres.forEach(genre => params.append('genres', genre))
    if (filters.aiUsedForLyrics !== 'all') {
      params.append('aiUsedForLyrics', filters.aiUsedForLyrics)
    }
    if (filters.musicModelUsed) {
      params.append('musicModelUsed', filters.musicModelUsed)
    }
    if (filters.title) {
      params.append('title', filters.title)
    }
    if (filters.artist) {
      params.append('artist', filters.artist)
    }
    if (filters.bibleTranslation) {
      params.append('bibleTranslation', filters.bibleTranslation)
    }
    filters.bibleBooks.forEach(book => params.append('bibleBooks', book))

    if (filters.search) {
      params.append('search', filters.search)
    }

    // Add bibleChapters to params
    Object.entries(filters.bibleChapters || {}).forEach(([book, chapters]) => {
      chapters.forEach(chapter => {
        params.append('bibleChapters', `${book}:${chapter}`)
      })
    })

    // Add bibleVerses to params
    filters.bibleVerses.forEach(verse => params.append('bibleVerses', verse))

    params.append('page', page.toString())
    params.append('limit', '20')

    return params.toString()
  }

  // State to track if more songs are available
  const [hasMore, setHasMore] = useState(true);

  // Use SWRInfinite for infinite loading
  const {
    data,
    error,
    isValidating,
    size,
    setSize,
  } = useSWRInfinite(
    (index) => `/api/songs?${buildQueryString(debouncedFilters, index + 1)}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false, // Add this line
      // Add onSuccess callback to update hasMore state
      onSuccess: (data) => {
        const total = data?.[0]?.total || 0;
        const loadedSongs = data ? data.flatMap((page) => page.songs).length : 0;
        // Determine if there are more songs to load
        if (loadedSongs >= total) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      },
    }
  );

  // Merge the paginated data
  const songs = data ? data.flatMap((page) => page.songs) : [];

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  // Infinite scroll logic
  useEffect(() => {
    if (inView && hasMore && !isValidating) {
      setSize(size + 1);
    }
  }, [inView, hasMore, isValidating, setSize, size]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsHeaderVisible(scrollPosition < 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const removeFilter = (filterType: keyof FilterOptions, value?: string) => {
    setFilterOptions((prev) => {
      if (filterType === 'aiUsedForLyrics') {
        return {
          ...prev,
          aiUsedForLyrics: 'all'  // Reset to 'all' when the tag is removed
        }
      } else if (filterType === 'aiMusic') {
        return {
          ...prev,
          aiMusic: 'all'  // Reset to 'all' when the tag is removed
        }
      } else if (filterType === 'lyricsAdherence' && value) {
        return {
          ...prev,
          lyricsAdherence: prev.lyricsAdherence.filter(v => v !== value)
        };
      } else if (filterType === 'genres' && value) {
        return {
          ...prev,
          genres: prev.genres.filter(v => v !== value)
        };
      } else if (filterType === 'bibleBooks' && value) {
        // Remove the book from bibleBooks
        const newBibleBooks = prev.bibleBooks.filter(v => v !== value);

        // Remove chapters associated with the removed book
        const newBibleChapters = { ...prev.bibleChapters };
        delete newBibleChapters[value]; // Remove the key for the removed book

        // Remove verses associated with the removed book's chapters
        const versesToKeep = prev.bibleVerses.filter(verse => {
          // Keep verses that are not in the removed book
          return !verse.startsWith(`${value} `);
        });

        return {
          ...prev,
          bibleBooks: newBibleBooks,
          bibleChapters: newBibleChapters,
          bibleVerses: versesToKeep,
        };
      } else if (filterType === 'bibleChapters' && value) {
        // Remove selected chapter
        const [book, chapter] = value.split(':');
        const chapters = prev.bibleChapters[book] || [];
        const newChapters = chapters.filter((ch) => ch !== Number(chapter));
        const newBibleChapters = { ...prev.bibleChapters, [book]: newChapters };

        // Remove book key if no chapters are left
        if (newChapters.length === 0) {
          delete newBibleChapters[book];
        }

        // Remove verses associated with the removed chapter
        const versesToKeep = prev.bibleVerses.filter(verse => {
          // Keep verses that are not in the removed chapter
          return !verse.startsWith(`${book} ${chapter}:`);
        });

        return {
          ...prev,
          bibleChapters: newBibleChapters,
          bibleVerses: versesToKeep,
        };
      } else if (filterType === 'bibleVerses' && value) {
        // Remove selected verse
        return {
          ...prev,
          bibleVerses: prev.bibleVerses.filter((v) => v !== value),
        };
      } else if (filterType === 'search') {
        return {
          ...prev,
          search: ''
        };
      } else {
        return {
          ...prev,
          [filterType]: typeof prev[filterType] === 'boolean' ? false : ''
        };
      }
    });
  };

  const getFilterTags = (): { type: keyof FilterOptions; label: string; value?: string }[] => {
    const tags: { type: keyof FilterOptions; label: string; value?: string }[] = []

    if (filterOptions.search) {
      tags.push({
        type: 'search',
        label: `Search: "${filterOptions.search}"`,
        value: filterOptions.search,
      })
    }

    if (filterOptions.lyricsAdherence.length > 0) {
      filterOptions.lyricsAdherence.forEach(value => {
        tags.push({
          type: 'lyricsAdherence',
          label: `Lyrics: ${value.replace(/_/g, ' ')}`,
          value
        })
      })
    }

    if (filterOptions.isContinuous !== "all") {
      tags.push({
        type: 'isContinuous',
        label: `Passage: ${filterOptions.isContinuous === "true" ? "Continuous" : "Non-continuous"}`
      })
    }

    if (filterOptions.aiMusic !== "all") {
      tags.push({
        type: 'aiMusic',
        label: `Music: ${filterOptions.aiMusic === "true" ? "AI Generated" : "Human Composed"}`
      })
    }

    if (filterOptions.genres.length > 0) {
      filterOptions.genres.forEach(genre => {
        tags.push({
          type: 'genres',
          label: `Genre: ${genre}`,
          value: genre
        })
      })
    }

    if (filterOptions.aiUsedForLyrics !== 'all') {
      tags.push({
        type: 'aiUsedForLyrics',
        label: `Lyrics: ${filterOptions.aiUsedForLyrics === 'true' ? 'AI Generated' : 'Human Written'}`
      })
    }

    if (filterOptions.musicModelUsed) {
      tags.push({
        type: 'musicModelUsed',
        label: `Music Model: ${filterOptions.musicModelUsed}`
      })
    }

    if (filterOptions.bibleTranslation) {
      tags.push({
        type: 'bibleTranslation',
        label: `Translation: ${filterOptions.bibleTranslation}`
      })
    }

    if (filterOptions.bibleBooks.length > 0) {
      filterOptions.bibleBooks.forEach((book) => {
        tags.push({
          type: 'bibleBooks',
          label: `Book: ${book}`,
          value: book,
        });
      });
    }

    if (filterOptions.bibleChapters && Object.keys(filterOptions.bibleChapters).length > 0) {
      Object.entries(filterOptions.bibleChapters).forEach(([book, chapters]) => {
        chapters.forEach((chapter) => {
          tags.push({
            type: 'bibleChapters',
            label: `Chapter: ${book} ${chapter}`,
            value: `${book}:${chapter}`,
          });
        });
      });
    }

    if (filterOptions.bibleVerses.length > 0) {
      filterOptions.bibleVerses.forEach((verse) => {
        tags.push({
          type: 'bibleVerses',
          label: `Verse: ${verse}`,
          value: verse,
        });
      });
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
                <Filters 
                  filterOptions={filterOptions} 
                  setFilterOptions={setFilterOptions}
                  setIsFilterExpanded={setIsFilterExpanded}
                />
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
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {tag.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter(tag.type, tag.value)}
              />
            </Badge>
          ))}
        </div>

        {songs.length > 0 ? (
          <>
            <SongList songs={songs} />
            {hasMore && (
              <>
                {isValidating && <SongListSkeleton />}
                {/* Sentinel for infinite scroll */}
                <div ref={loadMoreRef} className="h-1" />
              </>
            )}
          </>
        ) : isValidating ? (
          // Show skeletons while loading
          <SongListSkeleton />
        ) : (
          // Show 'No songs found' when no songs are available after loading
          <p>No songs found.</p>
        )}
      </main>
    </div>
  )
}