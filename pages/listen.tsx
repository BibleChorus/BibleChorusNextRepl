import React, { useState, useEffect, useCallback, useRef, useMemo, Dispatch, SetStateAction } from 'react';
import Head from 'next/head'
import useSWR from 'swr'
import { SongList } from '@/components/ListenPage/SongList'
import { Filters } from '@/components/ListenPage/Filters'
import { motion, AnimatePresence } from "framer-motion"
import { Filter, X, Info, Save, Search, Check, ListMusic, ArrowUpDown, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Expand, Shrink, Music2, Headphones, TrendingUp, Sparkles } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import qs from 'qs'
import { SongListSkeleton } from '@/components/ListenPage/SongListSkeleton'
import { useInView } from 'react-intersection-observer';
import useSWRInfinite from 'swr/infinite';
import { useRouter } from 'next/router'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from "sonner"
import { parsePostgresArray } from '@/lib/utils'; // Import the utility function
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { TooltipProvider } from '@/components/ui/tooltip'; // Ensure the correct import path
import SavePlaylistDialog from '@/components/ListenPage/SavePlaylistDialog'
import { ImageCropper } from '@/components/UploadPage/ImageCropper';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { uploadFile } from '@/lib/uploadUtils';
import { useForm, UseFormReturn } from 'react-hook-form'; // Add this import
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { SortOptions } from '@/components/ListenPage/SortOptions';
import { useSidebar } from '@/contexts/SidebarContext';  // Import useSidebar
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Import User from types.ts
import { User, Song } from '@/types'; // Ensure correct path based on your project structure

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      console.log('Raw API response data:', data);
      return {
        songs: data.songs.map((song: any) => ({
          ...song,
          duration: song.duration, // Explicitly include duration
          genres: parsePostgresArray(song.genres), // Parse genres to an array
        })),
        total: data.total || 0,
      };
    });

// Updated Song type definition

export type FilterOptions = {
  lyricsAdherence: string[];
  isContinuous: "all" | "true" | "false";
  aiMusic: "all" | "true" | "false";
  genres: string[];
  aiUsedForLyrics: "all" | "true" | "false";
  musicModelUsed: string;
  title: string;
  artist: string;
  bibleTranslation: string;
  bibleBooks: string[];
  search: string;
  bibleChapters: { [book: string]: number[] };
  bibleVerses: string[];
  showLikedSongs: boolean;
  showBestMusically: boolean;
  showBestLyrically: boolean;
  showBestOverall: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  showMySongs: boolean; // Add this line
};

export default function Listen() {
  const router = useRouter()
  const { playlistId } = router.query

  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)
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
    search: "",
    bibleChapters: {},
    bibleVerses: [],
    showLikedSongs: false,
    showBestMusically: false,
    showBestLyrically: false,
    showBestOverall: false,
    sortBy: 'mostRecent',     // Default sorting criterion
    sortOrder: 'desc',        // Default sorting order
    showMySongs: false, // Add this line
  })

  useEffect(() => {
    if (playlistId && typeof playlistId === 'string' && initialLoad) {
      setSelectedPlaylist(playlistId)
      setFilterOptions(prev => ({ ...prev, playlist_id: playlistId }))
      setInitialLoad(false)
    }
  }, [playlistId, initialLoad])

  return (
    <TooltipProvider>
      <ListenContent 
        selectedPlaylist={selectedPlaylist} 
        setSelectedPlaylist={setSelectedPlaylist}
        filterOptions={filterOptions}
        setFilterOptions={setFilterOptions}
      />
    </TooltipProvider>
  );
}

// Update the FormValues type to match SavePlaylistDialog
type FormValues = {
  action: 'create' | 'add';
  playlistId?: string;
  name?: string;
  description?: string;
  isPublic: boolean;
  coverArtFile?: File;
  cover_art_url?: string;
};

function ListenContent({ 
  selectedPlaylist: initialSelectedPlaylist,
  setSelectedPlaylist: setParentSelectedPlaylist,
  filterOptions: initialFilterOptions,
  setFilterOptions: setParentFilterOptions
}: { 
  selectedPlaylist: string | null,
  setSelectedPlaylist: (playlistId: string | null) => void,
  filterOptions: FilterOptions,
  setFilterOptions: Dispatch<SetStateAction<FilterOptions>>
}) {
  const router = useRouter()
  const querySearch = router.query.search as string || ''
  const { user } = useAuth(); // useAuth already provides User | null with correct type
  const { currentSong, isMinimized, isShuffling, queue, updateQueue, registerShuffleLoader } = useMusicPlayer();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const { isOpen: isSidebarOpen } = useSidebar(); // Get sidebar state
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(initialSelectedPlaylist)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(initialFilterOptions)

  // Apply filters from query parameters on initial load
  useEffect(() => {
    if (!router.isReady) return;
    const parseArray = (val: string | string[] | undefined) =>
      Array.isArray(val) ? val : val ? [val] : [];

    const books = parseArray(router.query.bibleBooks);
    const chaptersArr = parseArray(router.query.bibleChapters);
    const verses = parseArray(router.query.bibleVerses);

    const chapterObj: { [book: string]: number[] } = {};
    chaptersArr.forEach((c) => {
      const [book, chapter] = c.split(':');
      const ch = Number(chapter);
      if (book && !Number.isNaN(ch)) {
        if (!chapterObj[book]) chapterObj[book] = [];
        if (!chapterObj[book].includes(ch)) chapterObj[book].push(ch);
      }
    });

    if (books.length || chaptersArr.length || verses.length) {
      setFilterOptions((prev) => ({
        ...prev,
        bibleBooks: books.length ? (books as string[]) : prev.bibleBooks,
        bibleChapters:
          Object.keys(chapterObj).length > 0 ? chapterObj : prev.bibleChapters,
        bibleVerses: verses.length ? (verses as string[]) : prev.bibleVerses,
      }));
    }
  }, [router.isReady, router.query.bibleBooks, router.query.bibleChapters, router.query.bibleVerses]);

  // Adjust bottom offset for filter button
  const filterButtonBottomClass = useMemo(() => {
    // Adjusted values to ensure both buttons align correctly
    if (currentSong) {
      if (isSmallScreen) {
        return isMinimized ? 'bottom-16' : 'bottom-40';
      } else {
        return 'bottom-20';
      }
    } else {
      return 'bottom-4';
    }
  }, [currentSong, isSmallScreen, isMinimized]);

  // Adjust the left offset for the sort button
  const sortButtonLeftClass = useMemo(() => {
    if (isMobile) {
      return 'left-4';
    } else {
      return isSidebarOpen ? 'left-[260px]' : 'left-16';
    }
  }, [isMobile, isSidebarOpen]);

  // Initialize filterOptions with URL query
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [page, setPage] = useState(1)

  // Debounce filter changes
  const [debouncedFilters, setDebouncedFilters] = useState(filterOptions)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedFilters(filterOptions), 500)
    return () => clearTimeout(handler)
  }, [filterOptions])

  // Build query string for filters
  const buildQueryString = (
    filters: FilterOptions,
    page: number,
    user: User | null,
    selectedPlaylist: string | null,
    limit?: number
  ) => {
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

    if (selectedPlaylist) {
      params.append('playlist_id', selectedPlaylist);
    }

    if (filters.showLikedSongs) {
      params.append('showLikedSongs', 'true');
    }

    if (filters.showBestMusically) {
      params.append('showBestMusically', 'true');
    }

    if (filters.showBestLyrically) {
      params.append('showBestLyrically', 'true');
    }

    if (filters.showBestOverall) {
      params.append('showBestOverall', 'true');
    }

    if (user) {
      params.append('userId', user.id.toString());
    }

    params.append('page', page.toString())
    params.append('limit', (limit || 20).toString())

    // Add sort options
    if (filters.sortBy) {
      params.append('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params.append('sortOrder', filters.sortOrder);
    }

    if (filters.showMySongs && user) {
      params.append('showMySongs', 'true');
    }

    return params.toString()
  }

  // State to track if more songs are available
  const [hasMore, setHasMore] = useState(true);

  // Fetch playlists
  const { data: userPlaylists } = useSWR(
    user ? `/api/users/${user.id}/playlists` : null,
    (url) => axios.get(url).then(res => res.data)
  );

  const { data: publicPlaylists } = useSWR(
    `/api/playlists`,
    (url) => axios.get(url).then(res => res.data.playlists)
  );

  // Merge user playlists and public playlists and sort them
  const playlists = React.useMemo(() => {
    let combinedPlaylists: typeof userPlaylists = [];

    if (user && userPlaylists) {
      // If user is logged in, merge user playlists and public playlists
      const mergedPlaylists = [...userPlaylists];
      publicPlaylists?.forEach(publicPlaylist => {
        if (!mergedPlaylists.some(userPlaylist => userPlaylist.id === publicPlaylist.id)) {
          mergedPlaylists.push(publicPlaylist);
        }
      });
      combinedPlaylists = mergedPlaylists;
    } else {
      // If user is logged out, return only public playlists
      combinedPlaylists = publicPlaylists || [];
    }

    // Sort the combined playlists in descending order of playlist ID
    combinedPlaylists.sort((a, b) => b.id - a.id);

    return combinedPlaylists;
  }, [user, userPlaylists, publicPlaylists]);

  const [playlistSearch, setPlaylistSearch] = useState('')
  const [isPlaylistPopoverOpen, setIsPlaylistPopoverOpen] = useState(false)

  const filteredPlaylists = playlists?.filter(playlist =>
    playlist.name.toLowerCase().includes(playlistSearch.toLowerCase())
  ) || []

  // Infinite scroll data fetching
  const {
    data,
    error,
    isValidating,
    size,
    setSize,
    mutate,
  } = useSWRInfinite(
    (index) =>
      `/api/songs?${buildQueryString(
        debouncedFilters,
        index + 1,
        user,
        selectedPlaylist,
        20
      )}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
      onSuccess: (data) => {
        const total = data?.[0]?.total || 0;
        const loadedSongs = data ? data.flatMap((page) => page.songs).length : 0;
        setHasMore(loadedSongs < total);
      },
    }
  )

  // Handle playlist selection
  const handlePlaylistSelect = (playlistId: string) => {
    handlePlaylistChange(playlistId);
    setIsPlaylistPopoverOpen(false);
  }

  // Memoize handlePlaylistChange to prevent unnecessary re-renders and fix linter warning
  const handlePlaylistChange = useCallback((playlistId: string | null) => {
    setSelectedPlaylist(playlistId);
    setParentSelectedPlaylist(playlistId);
    setFilterOptions(prev => ({ ...prev, playlist_id: playlistId }));
    setSize(1); // Reset pagination
    mutate();   // Re-fetch data with new playlist selection
  }, [mutate, setSize, setParentSelectedPlaylist]);

  // Clear playlist selection
  const clearPlaylistSelection = useCallback(() => {
    handlePlaylistChange(null);
  }, [handlePlaylistChange]);

  // Songs are derived from the data fetched by SWRInfinite
  const songs = data ? data.flatMap((page) => page.songs) : []
  const totalSongs = data?.[0]?.total || 0

  const fetchAllSongs = useCallback(async (): Promise<Song[]> => {
    // First fetch to get the total count
    const countQuery = buildQueryString(debouncedFilters, 1, user, selectedPlaylist, 1)
    const countResult = await fetcher(`/api/songs?${countQuery}`)
    const total = countResult.total || 0
    
    // If there are songs, fetch all of them
    if (total > 0) {
      const allQuery = buildQueryString(debouncedFilters, 1, user, selectedPlaylist, total)
      const result = await fetcher(`/api/songs?${allQuery}`)
      return result.songs || []
    }
    return []
  }, [debouncedFilters, user, selectedPlaylist])


  const toPlayerSong = useCallback((s: Song) => ({
    id: s.id,
    title: s.title,
    artist: s.artist || s.username,
    audioUrl: s.audio_url,
    audio_url: s.audio_url,
    coverArtUrl: s.song_art_url,
    duration: s.duration,
    lyrics: s.lyrics,
    bible_verses: s.bible_verses,
    bible_translation_used: s.bible_translation_used,
    uploaded_by: s.uploaded_by,
  }), [])

  // Use refs to avoid dependency issues
  const fetchAllSongsRef = useRef(fetchAllSongs)
  const toPlayerSongRef = useRef(toPlayerSong)
  const updateQueueRef = useRef(updateQueue)
  
  useEffect(() => {
    fetchAllSongsRef.current = fetchAllSongs
  }, [fetchAllSongs])
  
  useEffect(() => {
    toPlayerSongRef.current = toPlayerSong
  }, [toPlayerSong])
  
  useEffect(() => {
    updateQueueRef.current = updateQueue
  }, [updateQueue])

  useEffect(() => {
    registerShuffleLoader(async () => {
      const all = await fetchAllSongsRef.current()
      return all.map(toPlayerSongRef.current)
    })
  }, [registerShuffleLoader])

  // Update shuffle queue when filters or playlist change while shuffle is active
  useEffect(() => {
    if (!isShuffling) return
    
    // Use AbortController for proper cleanup
    const abortController = new AbortController()
    let timeoutId: NodeJS.Timeout
    
    const updateShuffleQueue = async () => {
      // Check if already aborted
      if (abortController.signal.aborted) return
      
      try {
        const all = await fetchAllSongsRef.current()
        
        // Check again after async operation
        if (abortController.signal.aborted) return
        
        const shuffledSongs = all.map(toPlayerSongRef.current)
        // Only update if we actually have songs that match the current criteria
        if (shuffledSongs.length > 0) {
          updateQueueRef.current(shuffledSongs)
        }
      } catch (err) {
        // Don't log if it's an abort error
        if (!abortController.signal.aborted) {
          console.error('Error updating shuffle queue after filter/playlist change:', err)
        }
      }
    }
    
    // Debounce the update to avoid rapid successive calls
    timeoutId = setTimeout(updateShuffleQueue, 500)
    
    return () => {
      clearTimeout(timeoutId)
      abortController.abort()
    }
  }, [isShuffling, debouncedFilters, selectedPlaylist])

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
      if (
        filterType === 'showLikedSongs' ||
        filterType === 'showBestMusically' ||
        filterType === 'showBestLyrically' ||
        filterType === 'showBestOverall' ||
        filterType === 'showMySongs' // Add this line
      ) {
        return {
          ...prev,
          [filterType]: false,
        };
      } else if (filterType === 'aiUsedForLyrics') {
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

    if (filterOptions.showLikedSongs) {
      tags.push({
        type: 'showLikedSongs',
        label: 'Liked Songs',
      });
    }

    if (filterOptions.showBestMusically) {
      tags.push({
        type: 'showBestMusically',
        label: 'Voted Best Musically',
      });
    }

    if (filterOptions.showBestLyrically) {
      tags.push({
        type: 'showBestLyrically',
        label: 'Voted Best Lyrically',
      });
    }

    if (filterOptions.showBestOverall) {
      tags.push({
        type: 'showBestOverall',
        label: 'Voted Best Overall',
      });
    }

    if (filterOptions.showMySongs) {
      tags.push({
        type: 'showMySongs',
        label: 'My Songs',
      });
    }

    return tags
  }

  const [isSavePlaylistDialogOpen, setIsSavePlaylistDialogOpen] = useState(false);

  // New state variables for image cropping
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);

  // Handler to open the ImageCropper
  const openImageCropper = () => {
    setIsCropperOpen(true);
  };

  // Handler when cropping is complete
  const onImageCropComplete = async (croppedFile: File) => {
    // Handle the cropped image file
    // Upload the cropped file and update the form value in SavePlaylistDialog
    await uploadCoverArt(croppedFile);
    setIsCropperOpen(false);
  };

  // Function to upload the cover art
  const uploadCoverArt = async (file: File) => {
    if (!user) return;
    try {
      const fileKey = await uploadFile(file, 'image', Number(user.id));
      // Update the form value in SavePlaylistDialog
      formRef.current?.setValue('cover_art_url', fileKey, { shouldValidate: true });
      toast.success('Cover art uploaded');
    } catch (error) {
      console.error('Error uploading cover art:', error);
      toast.error('Failed to upload cover art');
    }
  };

  const handleSavePlaylist = () => {
    setIsSavePlaylistDialogOpen(true)
  }

  const formRef = useRef<UseFormReturn<FormValues>>(null);

  const [isSortExpanded, setIsSortExpanded] = useState(false);

  const [isNarrowView, setIsNarrowView] = useState(false);

  useEffect(() => {
    if (initialSelectedPlaylist) {
      handlePlaylistChange(initialSelectedPlaylist);
    }
  }, [initialSelectedPlaylist, handlePlaylistChange]);

  // Update parent filterOptions when local state changes
  useEffect(() => {
    setParentFilterOptions(filterOptions)
  }, [filterOptions, setParentFilterOptions])

  // Add this useEffect to synchronize the search term
  useEffect(() => {
    if (querySearch) {
      setFilterOptions(prev => ({ ...prev, search: querySearch }))
    }
  }, [querySearch])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 dark:from-blue-950/50 dark:via-slate-900 dark:to-purple-950/30">
        <Head>
          <title>BibleChorus - Listen</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-16 pt-12"
        >
          {/* Enhanced Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.08] via-purple-500/[0.06] to-indigo-500/[0.08] dark:from-blue-500/[0.15] dark:via-purple-500/[0.12] dark:to-indigo-500/[0.15]"></div>
            <div className="absolute top-0 -left-8 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
            <div className="absolute top-12 -right-8 w-80 h-80 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-12 left-32 w-96 h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.1),rgba(255,255,255,0))]"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-indigo-500/20 backdrop-blur-md border border-blue-500/20 dark:border-blue-500/30 shadow-lg">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent font-semibold">
                    Discover Music
                  </span>
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
              >
                <span className="block text-slate-900 dark:text-white mb-2">Listen &</span>
                <span className="block relative">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                    Explore
                  </span>
                  <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-full scale-x-0 animate-scale-x"></div>
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-8 text-xl text-slate-600 dark:text-slate-300 sm:text-2xl max-w-3xl mx-auto leading-relaxed"
              >
                Dive into a vast collection of 
                <span className="font-semibold text-slate-900 dark:text-white"> Bible-inspired music</span> with 
                <span className="font-semibold text-slate-900 dark:text-white"> powerful filters and playlists</span>
              </motion.p>
            </div>

            {/* Enhanced Stats Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <Music2 className="relative w-10 h-10 mx-auto mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">{totalSongs}</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Songs Available</div>
              </div>
              
              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <ListMusic className="relative w-10 h-10 mx-auto mb-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-2">{playlists?.length || 0}</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Playlists</div>
              </div>
              
              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <Headphones className="relative w-10 h-10 mx-auto mb-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-4xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent mb-2">{queue.length}</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">In Queue</div>
              </div>
            </motion.div>
            
            {/* Enhanced Floating Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="absolute top-16 right-16 hidden xl:block"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl backdrop-blur-sm animate-float shadow-xl"></div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="absolute bottom-16 left-16 hidden xl:block"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl backdrop-blur-sm animate-float animation-delay-2000 shadow-xl"></div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content Container */}
        <div className="container mx-auto px-4 -mt-8 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Enhanced Header Controls */}
            <div className="sticky top-0 z-20 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50">
              {/* Playlist Selection and Save Button */}
              <div className="px-8 py-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Popover open={isPlaylistPopoverOpen} onOpenChange={setIsPlaylistPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[240px] justify-between h-12 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 rounded-xl text-base">
                        <div className="flex items-center overflow-hidden">
                          <ListMusic className="h-5 w-5 mr-3 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                          <span className="truncate">
                            {selectedPlaylist
                              ? playlists?.find(p => p.id.toString() === selectedPlaylist)?.name
                              : 'Select a playlist'}
                          </span>
                        </div>
                        {selectedPlaylist && (
                          <X
                            className="h-4 w-4 flex-shrink-0 hover:text-destructive ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearPlaylistSelection();
                            }}
                          />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl">
                      <div className="p-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search playlists..."
                            value={playlistSearch}
                            onChange={(e) => setPlaylistSearch(e.target.value)}
                            className="h-10 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 rounded-xl"
                          />
                        </div>
                        <ScrollArea className="h-[200px]">
                          {filteredPlaylists.map((playlist) => (
                            <div
                              key={playlist.id}
                              className={cn(
                                "flex items-center px-3 py-2 cursor-pointer hover:bg-white/40 dark:hover:bg-slate-600/40 rounded-xl transition-all duration-300",
                                selectedPlaylist === playlist.id.toString() && "bg-blue-100/60 dark:bg-blue-900/30"
                              )}
                              onClick={() => handlePlaylistSelect(playlist.id.toString())}
                            >
                              <ListMusic className="h-4 w-4 mr-3 flex-shrink-0" />
                              <span className="break-words overflow-hidden">{playlist.name}</span>
                              {selectedPlaylist === playlist.id.toString() && (
                                <Check className="ml-auto h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {selectedPlaylist && (
                    <div className="w-12 h-12 relative flex-shrink-0">
                      <Image
                        src={playlists?.find((p) => p.id.toString() === selectedPlaylist)?.cover_art_url || '/biblechorus-icon.png'}
                        alt="Playlist cover"
                        layout="fill"
                        objectFit="cover"
                        className="rounded-xl shadow-lg"
                      />
                    </div>
                  )}
                  <Button onClick={handleSavePlaylist} className="h-12 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-xl font-semibold">
                    <Save className="w-5 h-5 mr-2" />
                    <span>Save Playlist</span>
                  </Button>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsNarrowView(!isNarrowView)}
                      className="h-12 w-12 p-0 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 rounded-xl"
                    >
                      {isNarrowView ? (
                        <Expand className="h-5 w-5" />
                      ) : (
                        <Shrink className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isNarrowView ? 'Expand view' : 'Narrow view'}</p>
                  </TooltipContent>
                </Tooltip>
                             </div>

              {/* Enhanced Filter and Sort Sections */}
              <AnimatePresence>
                {isFilterExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border-t border-white/20 dark:border-slate-700/50"
                  >
                    <div className="px-8 py-6">
                      <Filters 
                        filterOptions={filterOptions} 
                        setFilterOptions={setFilterOptions}
                        setIsFilterExpanded={setIsFilterExpanded}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isSortExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border-t border-white/20 dark:border-slate-700/50"
                  >
                    <div className="px-8 py-6">
                      <SortOptions
                        filterOptions={filterOptions as FilterOptions}
                        setFilterOptions={setFilterOptions}
                        setIsSortExpanded={setIsSortExpanded}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Enhanced Main Content */}
            <div className="p-8">
              {/* Filter Tags */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-wrap gap-3 mb-8"
              >
                {getFilterTags().map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 rounded-xl shadow-sm"
                  >
                    {tag.label}
                    <X
                      className="h-4 w-4 cursor-pointer hover:text-destructive transition-colors duration-300"
                      onClick={() => removeFilter(tag.type, tag.value)}
                    />
                  </Badge>
                ))}
              </motion.div>

              {/* Song List Content */}
              {songs.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <SongList
                    songs={songs}
                    isNarrowView={isNarrowView}
                    totalSongs={totalSongs}
                    fetchAllSongs={fetchAllSongs}
                  />
                  {hasMore && (
                    <>
                      {isValidating && <SongListSkeleton />}
                      {/* Sentinel for infinite scroll */}
                      <div ref={loadMoreRef} className="h-1" />
                    </>
                  )}
                </motion.div>
              ) : isValidating ? (
                <div className="flex items-center justify-center min-h-[500px]">
                  <div className="space-y-6 text-center">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 mx-auto"></div>
                      <div className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-lg">Loading songs...</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="relative mb-6">
                    <Music2 className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-20"></div>
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-white">No songs found</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-lg max-w-md mx-auto">
                    Try adjusting your filters or search terms to find more music that matches your preferences.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Enhanced Filter Toggle Button */}
        {!isFilterExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsFilterExpanded(true)}
            className={`fixed right-4 z-30 p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 backdrop-blur-sm ${filterButtonBottomClass}`}
            aria-label="Expand filters"
          >
            <Filter className="h-6 w-6" />
          </motion.button>
        )}

        {/* Enhanced Sort Toggle Button */}
        {!isSortExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsSortExpanded(true)}
            className={`fixed ${sortButtonLeftClass} z-30 p-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 backdrop-blur-sm ${filterButtonBottomClass}`}
            aria-label="Expand sorting"
          >
            <ArrowUpDown className="h-6 w-6" />
          </motion.button>
        )}

        {/* Add SavePlaylistDialog */}
        <SavePlaylistDialog
          isOpen={isSavePlaylistDialogOpen}
          onClose={() => setIsSavePlaylistDialogOpen(false)}
          songs={songs}
          filterOptions={filterOptions}
          playlists={playlists}
          user={user ? { ...user, id: user.id.toString() } : null}
          onImageCropComplete={onImageCropComplete}
          openImageCropper={openImageCropper}
          formRef={formRef}
        />

        {/* Image Cropper Dialog */}
        <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
          <DialogContent>
            {cropImageUrl && (
              <ImageCropper
                imageUrl={cropImageUrl}
                onCropComplete={onImageCropComplete}
                onCancel={() => setIsCropperOpen(false)}
                maxHeight={500} // Added maxHeight prop
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
