import React, { useState, useEffect, useCallback, useRef, useMemo, Dispatch, SetStateAction } from 'react';
import Head from 'next/head'
import useSWR from 'swr'
import { SongList } from '@/components/ListenPage/SongList'
import { Filters } from '@/components/ListenPage/Filters'
import { motion, AnimatePresence } from "framer-motion"
import { Filter, X, Info, Save, Search, Check, ListMusic, ArrowUpDown, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Expand, Shrink, PlayCircle, Edit } from "lucide-react"

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
import { ImageCropper, CropResultMetadata } from '@/components/UploadPage/ImageCropper';
import { getExtensionFromMimeType, stripFileExtension } from '@/lib/imageUtils'
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { uploadFile } from '@/lib/uploadUtils';
import { useForm, UseFormReturn } from 'react-hook-form'; // Add this import
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { SortOptions } from '@/components/ListenPage/SortOptions';

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
  const { currentSong, isMinimized, isShuffling, queue, updateQueue, registerShuffleLoader, playSong, toggleShuffle } = useMusicPlayer();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

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

  const buildFileFromCrop = (blob: Blob, metadata?: CropResultMetadata) => {
    const mimeType = metadata?.mimeType || blob.type || 'image/jpeg';
    const extension = getExtensionFromMimeType(mimeType);
    const fallbackName = `playlist-cover-${Date.now()}`;
    const derivedBase = metadata?.suggestedFileName
      ? stripFileExtension(metadata.suggestedFileName)
      : metadata?.originalFileName
        ? stripFileExtension(metadata.originalFileName)
        : '';
    const baseName = derivedBase && derivedBase.length > 0 ? derivedBase : fallbackName;
    const fileName = metadata?.suggestedFileName || `${baseName}.${extension}`;
    return new File([blob], fileName, { type: mimeType });
  };

  // Handler when cropping is complete
  const onImageCropComplete = async (croppedFile: File) => {
    // Handle the cropped image file
    // Upload the cropped file and update the form value in SavePlaylistDialog
    await uploadCoverArt(croppedFile);
    setIsCropperOpen(false);
    setCropImageUrl(null);
  };

  const handleImageCropperComplete = (blob: Blob, metadata?: CropResultMetadata) => {
    const file = buildFileFromCrop(blob, metadata);
    onImageCropComplete(file);
  };

  // Function to upload the cover art
  const uploadCoverArt = async (file: File) => {
    if (!user) return;
    if (!(file instanceof File)) {
      toast.error('Invalid cover art file provided');
      console.error('Expected File when uploading cover art but received', file);
      return;
    }

    try {
      const uploadResult = await uploadFile(file, 'image', Number(user.id), 'playlist_cover');
      if (typeof uploadResult === 'string') {
        throw new Error(uploadResult);
      }

      const { fileKey } = uploadResult;
      formRef.current?.setValue('cover_art_url', fileKey, { shouldValidate: true });
      formRef.current?.setValue('coverArtFile', file, { shouldValidate: true });
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
  const [isPlaylistExpanded, setIsPlaylistExpanded] = useState(false);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
        <Head>
          <title>BibleChorus - Listen</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <motion.div
          className="sticky top-16 lg:top-[4.5rem] z-20 bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border-b border-white/20 dark:border-slate-700/50 shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Smart Header with Filter Preview */}
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Title and Stats */}
              <div className="flex items-center gap-4">
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-2xl lg:text-3xl font-bold"
                >
                  <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400 bg-clip-text text-transparent">
                    Listen
                  </span>
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-400/12 to-purple-400/12 border border-indigo-400/12"
                >
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {totalSongs.toLocaleString()} songs
                  </span>
                </motion.div>
              </div>

              {/* Filter Preview and Quick Actions */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center gap-3"
              >
                {/* Quick Action Buttons */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className={cn(
                    "h-9 px-3 backdrop-blur-sm transition-all duration-300",
                    getFilterTags().length > 0
                      ? "bg-gradient-to-r from-indigo-400/14 to-purple-400/14 border-indigo-400/24 text-indigo-700 dark:text-indigo-300 hover:from-indigo-400/20 hover:to-purple-400/20"
                      : "bg-white/60 dark:bg-slate-700/60 border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80"
                  )}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {getFilterTags().length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-indigo-400/16 dark:bg-indigo-300/16 rounded-full">
                      {getFilterTags().length}
                    </span>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSortExpanded(!isSortExpanded)}
                  className="h-9 px-3 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlaylistExpanded(!isPlaylistExpanded)}
                  className={cn(
                    "h-9 px-3 backdrop-blur-sm transition-all duration-300",
                    selectedPlaylist
                      ? "bg-gradient-to-r from-purple-400/14 to-pink-400/14 border-purple-400/24 text-purple-700 dark:text-purple-300 hover:from-purple-400/20 hover:to-pink-400/20"
                      : "bg-white/60 dark:bg-slate-700/60 border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80"
                  )}
                >
                  <ListMusic className="h-4 w-4 mr-2" />
                  Playlists
                  {selectedPlaylist && (
                    <span className="ml-2 w-2 h-2 bg-purple-400/50 dark:bg-purple-300/50 rounded-full"></span>
                  )}
                </Button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsNarrowView(!isNarrowView)}
                      className="h-9 w-9 p-0 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80"
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
              </motion.div>
            </div>
          </div>



          {/* Enhanced Filter Section */}
          <AnimatePresence>
            {isFilterExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="container mx-auto px-4 pb-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/12 dark:border-slate-700/40 rounded-2xl shadow-xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      Filters & Search
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFilterExpanded(false)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Filters 
                    filterOptions={filterOptions} 
                    setFilterOptions={setFilterOptions}
                    setIsFilterExpanded={setIsFilterExpanded}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Sort Section */}
          <AnimatePresence>
            {isSortExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="container mx-auto px-4 pb-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/12 dark:border-slate-700/40 rounded-2xl shadow-xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      Sort Options
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSortExpanded(false)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <SortOptions
                    filterOptions={filterOptions as FilterOptions}
                    setFilterOptions={setFilterOptions}
                    setIsSortExpanded={setIsSortExpanded}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Playlist Section */}
          <AnimatePresence>
            {isPlaylistExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="container mx-auto px-4 pb-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/12 dark:border-slate-700/40 rounded-2xl shadow-xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      Playlist Management
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPlaylistExpanded(false)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Current Playlist Section */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          {selectedPlaylist && (
                            <div className="w-12 h-12 relative flex-shrink-0 group">
                              <Image
                                src={playlists?.find((p) => p.id.toString() === selectedPlaylist)?.cover_art_url || '/biblechorus-icon.png'}
                                alt="Playlist cover"
                                layout="fill"
                                objectFit="cover"
                                className="rounded-xl transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-400/16 to-purple-400/16 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                          )}
                          
                          <Popover open={isPlaylistPopoverOpen} onOpenChange={setIsPlaylistPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="h-12 px-4 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 rounded-xl min-w-[200px] justify-start">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <ListMusic className="h-4 w-4 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                                  <div className="flex flex-col items-start min-w-0">
                                    <span className="font-medium text-sm truncate">
                                      {selectedPlaylist
                                        ? playlists?.find(p => p.id.toString() === selectedPlaylist)?.name
                                        : 'Select Playlist'}
                                    </span>
                                    {selectedPlaylist && (
                                      <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {playlists?.find(p => p.id.toString() === selectedPlaylist)?.song_count || 0} songs
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {selectedPlaylist && (
                                  <X
                                    className="h-4 w-4 flex-shrink-0 hover:text-red-500 ml-auto transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      clearPlaylistSelection();
                                    }}
                                  />
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl">
                              <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                  <Search className="h-4 w-4 text-slate-400" />
                                  <Input
                                    placeholder="Search playlists..."
                                    value={playlistSearch}
                                    onChange={(e) => setPlaylistSearch(e.target.value)}
                                    className="h-9 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 rounded-lg"
                                  />
                                </div>
                                <ScrollArea className="h-[300px]">
                                  <div className="space-y-1">
                                    {filteredPlaylists.map((playlist) => (
                                      <motion.div
                                        key={playlist.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={cn(
                                          "flex items-center gap-3 p-3 cursor-pointer rounded-xl transition-all duration-200 hover:bg-gradient-to-r hover:from-indigo-400/12 hover:to-purple-400/12",
                                          selectedPlaylist === playlist.id.toString() && "bg-gradient-to-r from-indigo-400/12 to-purple-400/12 border border-indigo-400/12"
                                        )}
                                        onClick={() => handlePlaylistSelect(playlist.id.toString())}
                                      >
                                        <div className="w-10 h-10 relative flex-shrink-0">
                                          <Image
                                            src={playlist.cover_art_url || '/biblechorus-icon.png'}
                                            alt={playlist.name}
                                            layout="fill"
                                            objectFit="cover"
                                            className="rounded-lg"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate text-slate-900 dark:text-white">
                                            {playlist.name}
                                          </div>
                                          <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {playlist.song_count || 0} songs
                                          </div>
                                        </div>
                                        {selectedPlaylist === playlist.id.toString() && (
                                          <Check className="h-4 w-4 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                                        )}
                                      </motion.div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        {/* Quick Playlist Actions */}
                        {selectedPlaylist && (
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                            className="hidden sm:flex items-center gap-2"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </motion.div>
                        )}
                      </div>

                      {/* Save Button */}
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={handleSavePlaylist}
                          className="h-12 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-xl font-medium"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Playlist
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <main className="container mx-auto px-2 sm:px-4 py-6">
          {/* Enhanced Active Filters Display */}
          {getFilterTags().length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-4 mb-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Active Filters ({getFilterTags().length})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterOptions({
                      lyricsAdherence: [],
                      isContinuous: "all",
                      aiMusic: "all", 
                      genres: [],
                      aiUsedForLyrics: 'all',
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
                      sortBy: 'mostRecent',
                      sortOrder: 'desc',
                      showMySongs: false,
                    })}
                    className="h-8 px-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getFilterTags().map((tag, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Badge 
                        variant="secondary" 
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-400/12 to-purple-400/12 border border-indigo-400/12 text-slate-700 dark:text-slate-300 hover:from-indigo-400/18 hover:to-purple-400/18 transition-all duration-200 rounded-lg"
                      >
                        <span className="text-sm">{tag.label}</span>
                        <button
                          onClick={() => removeFilter(tag.type, tag.value)}
                          className="ml-1 hover:text-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Enhanced Song List Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-3 sm:p-6 shadow-xl"
          >
            {songs.length > 0 ? (
              <div className="space-y-4">
                {/* Song Count and Quick Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {totalSongs.toLocaleString()} Songs
                    </h2>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const allSongs = await fetchAllSongs();
                          if (allSongs.length > 0) {
                            const playerSongs = allSongs.map(toPlayerSong);
                            // Enable shuffle mode and start playing the first song
                            updateQueue(playerSongs);
                            if (!isShuffling) {
                              toggleShuffle(); // This will shuffle the queue
                            }
                            // Play the first song in the shuffled queue
                            const firstSong = playerSongs[0];
                            playSong(firstSong, playerSongs);
                            toast.success(`Shuffling ${allSongs.length} songs`);
                          } else {
                            toast.error('No songs to shuffle');
                          }
                        } catch (error) {
                          console.error('Error shuffling songs:', error);
                          toast.error('Failed to shuffle songs');
                        }
                      }}
                      className="h-9 px-4 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 rounded-lg"
                    >
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Shuffle All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const allSongs = await fetchAllSongs();
                          if (allSongs.length > 0) {
                            const playerSongs = allSongs.map(toPlayerSong);
                            // Disable shuffle mode and start playing the first song
                            updateQueue(playerSongs);
                            if (isShuffling) {
                              toggleShuffle(); // This will disable shuffle
                            }
                            // Play the first song in order
                            const firstSong = playerSongs[0];
                            playSong(firstSong, playerSongs);
                            toast.success(`Playing ${allSongs.length} songs`);
                          } else {
                            toast.error('No songs to play');
                          }
                        } catch (error) {
                          console.error('Error playing songs:', error);
                          toast.error('Failed to play songs');
                        }
                      }}
                      className="h-9 px-4 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 rounded-lg"
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Play All
                    </Button>
                  </div>
                </div>

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
              </div>
            ) : isValidating ? (
              // Enhanced loading state
              <div className="space-y-6">
                <div className="flex items-center justify-center py-12">
                  <div className="space-y-4 text-center">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 mx-auto"></div>
                      <div className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-r from-indigo-400/16 to-purple-400/16"></div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-lg">Loading songs...</p>
                  </div>
                </div>
                <SongListSkeleton />
              </div>
            ) : (
              // Enhanced empty state
              <div className="text-center py-16">
                <div className="relative mb-6">
                  <PlayCircle className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full opacity-20"></div>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-white">No songs found</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6 text-lg max-w-md mx-auto">
                  {getFilterTags().length > 0 
                    ? "Try adjusting your filters to find more songs"
                    : "Start exploring our collection of Bible-inspired music!"}
                </p>
                {getFilterTags().length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setFilterOptions({
                      lyricsAdherence: [],
                      isContinuous: "all",
                      aiMusic: "all", 
                      genres: [],
                      aiUsedForLyrics: 'all',
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
                      sortBy: 'mostRecent',
                      sortOrder: 'desc',
                      showMySongs: false,
                    })}
                    className="h-12 px-6 border-2 hover:scale-105 transition-all duration-300 rounded-xl"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </main>



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
        <Dialog
          open={isCropperOpen}
          onOpenChange={(open) => {
            setIsCropperOpen(open);
            if (!open) {
              setCropImageUrl(null);
            }
          }}
        >
          <DialogContent>
            {cropImageUrl && (
              <ImageCropper
                imageUrl={cropImageUrl}
                onCropComplete={handleImageCropperComplete}
                onCancel={() => {
                  setIsCropperOpen(false);
                  setCropImageUrl(null);
                }}
                maxHeight={500} // Added maxHeight prop
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
