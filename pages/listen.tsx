import React, { useState, useEffect, useCallback, useRef, useMemo, Dispatch, SetStateAction } from 'react';
import Head from 'next/head'
import useSWR from 'swr'
import { SongList } from '@/components/ListenPage/SongList'
import { Filters } from '@/components/ListenPage/Filters'
import { motion, AnimatePresence } from "framer-motion"
import { Filter, X, Info, Save, Search, Check, ListMusic, ArrowUpDown, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Expand, Shrink } from "lucide-react"
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
    selectedPlaylist: string | null
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
    params.append('limit', '20')

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
        selectedPlaylist
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
    const query = buildQueryString(debouncedFilters, 1, user, selectedPlaylist)
    const result = await fetcher(`/api/songs?${query}&limit=${totalSongs}`)
    return result.songs
  }, [debouncedFilters, user, selectedPlaylist, totalSongs])


  const toPlayerSong = (s: Song) => ({
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
  })

  useEffect(() => {
    registerShuffleLoader(async () => {
      const all = await fetchAllSongs()
      return all.map(toPlayerSong)
    })
  }, [fetchAllSongs, registerShuffleLoader])

  useEffect(() => {
    if (isShuffling && queue.length < totalSongs && totalSongs > songs.length) {
      fetchAllSongs()
        .then((all) => updateQueue(all.map(toPlayerSong)))
        .catch((err) => console.error('Error fetching all songs for shuffle:', err))
    }
  }, [isShuffling, totalSongs, songs.length, fetchAllSongs, updateQueue, queue.length])

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
      <div className="min-h-screen bg-background">
        <Head>
          <title>BibleChorus - Listen</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Header Section */}
          <div className={`container mx-auto px-2 transition-all duration-300 ${isHeaderVisible ? 'h-12' : 'h-8'}`}>
            <div className="flex items-center justify-between h-full">
              <h1 className={`text-xl font-bold text-foreground transition-opacity duration-300 ${isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}>
                Listen to Songs
              </h1>
            </div>
          </div>

          {/* Playlist Selection and Save Button */}
          <div className={`container mx-auto px-2 py-2 flex items-center justify-between transition-all duration-300 ${isHeaderVisible ? 'mt-0' : 'mt-2'}`}>
            <div className="flex items-center space-x-2">
              <Popover open={isPlaylistPopoverOpen} onOpenChange={setIsPlaylistPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-between h-8 text-xs">
                    <div className="flex items-center overflow-hidden">
                      <ListMusic className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {selectedPlaylist
                          ? playlists?.find(p => p.id.toString() === selectedPlaylist)?.name
                          : 'Select a playlist'}
                      </span>
                    </div>
                    {selectedPlaylist && (
                      <X
                        className="h-3 w-3 flex-shrink-0 hover:text-destructive ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearPlaylistSelection();
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <div className="p-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search playlists..."
                        value={playlistSearch}
                        onChange={(e) => setPlaylistSearch(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <ScrollArea className="h-[200px]">
                      {filteredPlaylists.map((playlist) => (
                        <div
                          key={playlist.id}
                          className={cn(
                            "flex items-center px-2 py-1 cursor-pointer hover:bg-accent",
                            selectedPlaylist === playlist.id.toString() && "bg-accent"
                          )}
                          onClick={() => handlePlaylistSelect(playlist.id.toString())}
                        >
                          <ListMusic className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="break-words overflow-hidden">{playlist.name}</span>
                          {selectedPlaylist === playlist.id.toString() && (
                            <Check className="ml-auto h-4 w-4 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
              {selectedPlaylist && (
                <div className="w-8 h-8 relative flex-shrink-0">
                  <Image
                    src={playlists?.find((p) => p.id.toString() === selectedPlaylist)?.cover_art_url || '/biblechorus-icon.png'}
                    alt="Playlist cover"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md"
                  />
                </div>
              )}
              <Button onClick={handleSavePlaylist} className="h-8 text-xs px-2 flex items-center space-x-1">
                <Save className="w-3 h-3" />
                <span className="hidden sm:inline">Save</span>
              </Button>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNarrowView(!isNarrowView)}
                  className="h-8 w-8 p-0"
                >
                  {isNarrowView ? (
                    <Expand className="h-4 w-4" />
                  ) : (
                    <Shrink className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isNarrowView ? 'Expand view' : 'Narrow view'}</p>
              </TooltipContent>
            </Tooltip>
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
                <div className="container mx-auto px-2 py-2">
                  <Filters 
                    filterOptions={filterOptions} 
                    setFilterOptions={setFilterOptions}
                    setIsFilterExpanded={setIsFilterExpanded}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sort Group Section */}
          <AnimatePresence>
            {isSortExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
              >
                <div className="container mx-auto px-2 py-2">
                  <SortOptions
                    filterOptions={filterOptions as FilterOptions}
                    setFilterOptions={setFilterOptions}
                    setIsSortExpanded={setIsSortExpanded}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
            </>
          ) : isValidating ? (
            // Show skeletons while loading
            <SongListSkeleton />
          ) : (
            // Show 'No songs found' when no songs are available after loading
            <p>No songs found.</p>
          )}
        </main>

        {/* Filter Toggle Button - Moved to bottom right */}
        {!isFilterExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsFilterExpanded(true)}
            className={`fixed right-4 z-20 p-2 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all duration-300 ${filterButtonBottomClass}`}
            aria-label="Expand filters"
          >
            <Filter className="h-5 w-5" />
          </motion.button>
        )}

        {/* Sort Toggle Button - Left aligned */}
        {!isSortExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsSortExpanded(true)}
            className={`fixed ${sortButtonLeftClass} z-20 p-2 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all duration-300 ${filterButtonBottomClass}`}
            aria-label="Expand sorting"
          >
            <ArrowUpDown className="h-5 w-5" />
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
