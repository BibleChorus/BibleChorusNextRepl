import { Filters } from "@/components/ListenPage/Filters";
import { SongList } from "@/components/ListenPage/SongList";
import {
  ArrowUpDown,
  Check,
  Edit,
  Expand,
  Filter,
  ListMusic,
  PlayCircle,
  Save,
  Search,
  Shrink,
  Shuffle,
  X,
} from "lucide-react";
import Head from "next/head";
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import useSWR from "swr";

import SavePlaylistDialog from "@/components/ListenPage/SavePlaylistDialog";
import { SongListSkeleton } from "@/components/ListenPage/SongListSkeleton";
import { SortOptions } from "@/components/ListenPage/SortOptions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip"; // Ensure the correct import path
import {
  CropResultMetadata,
  ImageCropper,
} from "@/components/UploadPage/ImageCropper";
import { useAuth } from "@/contexts/AuthContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { getExtensionFromMimeType, stripFileExtension } from "@/lib/imageUtils";
import { uploadFile } from "@/lib/uploadUtils";
import { cn, parsePostgresArray } from "@/lib/utils"; // Import the utility function
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/router";
import { UseFormReturn } from "react-hook-form"; // Add this import
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import useSWRInfinite from "swr/infinite";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import User from types.ts
import { Song, User } from "@/types"; // Ensure correct path based on your project structure

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load songs");
  const data = await response.json();
  return {
    songs: (data.songs || []).map((song: Song) => ({
      ...song,
      genres: parsePostgresArray(song.genres),
    })),
    total: Number(data.total) || 0,
  };
};

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
  sortOrder: "asc" | "desc";
  showMySongs: boolean;
  includeJourneySongs: boolean;
};

export default function Listen() {
  const router = useRouter();
  const { playlistId } = router.query;

  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    lyricsAdherence: [],
    isContinuous: "all",
    aiMusic: "all",
    genres: [],
    aiUsedForLyrics: "all",
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
    sortBy: "mostRecent",
    sortOrder: "desc",
    showMySongs: false,
    includeJourneySongs: false,
  });

  useEffect(() => {
    if (playlistId && typeof playlistId === "string" && initialLoad) {
      setSelectedPlaylist(playlistId);
      setFilterOptions((prev) => ({ ...prev, playlist_id: playlistId }));
      setInitialLoad(false);
    }
  }, [playlistId, initialLoad]);

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
  action: "create" | "add";
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
  setFilterOptions: setParentFilterOptions,
}: {
  selectedPlaylist: string | null;
  setSelectedPlaylist: (playlistId: string | null) => void;
  filterOptions: FilterOptions;
  setFilterOptions: Dispatch<SetStateAction<FilterOptions>>;
}) {
  const router = useRouter();
  const querySearch = (router.query.search as string) || "";
  const { user } = useAuth(); // useAuth already provides User | null with correct type
  const {
    isShuffling,
    updateQueue,
    registerShuffleLoader,
    playSong,
    toggleShuffle,
  } = useMusicPlayer();

  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(
    initialSelectedPlaylist,
  );
  const [filterOptions, setFilterOptions] =
    useState<FilterOptions>(initialFilterOptions);

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
      const [book, chapter] = c.split(":");
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
  }, [
    router.isReady,
    router.query.bibleBooks,
    router.query.bibleChapters,
    router.query.bibleVerses,
  ]);

  // Initialize filterOptions with URL query
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Debounce filter changes
  const [debouncedFilters, setDebouncedFilters] = useState(filterOptions);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedFilters(filterOptions), 500);
    return () => clearTimeout(handler);
  }, [filterOptions]);

  // Build query string for filters
  const buildQueryString = (
    filters: FilterOptions,
    page: number,
    user: User | null,
    selectedPlaylist: string | null,
    limit?: number,
  ) => {
    const params = new URLSearchParams();

    // Add filters to params
    filters.lyricsAdherence.forEach((value) =>
      params.append("lyricsAdherence", value),
    );
    if (filters.isContinuous !== "all") {
      params.append("isContinuous", filters.isContinuous);
    }
    if (filters.aiMusic !== "all") {
      params.append("aiMusic", filters.aiMusic);
    }
    filters.genres.forEach((genre) => params.append("genres", genre));
    if (filters.aiUsedForLyrics !== "all") {
      params.append("aiUsedForLyrics", filters.aiUsedForLyrics);
    }
    if (filters.musicModelUsed) {
      params.append("musicModelUsed", filters.musicModelUsed);
    }
    if (filters.title) {
      params.append("title", filters.title);
    }
    if (filters.artist) {
      params.append("artist", filters.artist);
    }
    if (filters.bibleTranslation) {
      params.append("bibleTranslation", filters.bibleTranslation);
    }
    filters.bibleBooks.forEach((book) => params.append("bibleBooks", book));

    if (filters.search) {
      params.append("search", filters.search);
    }

    // Add bibleChapters to params
    Object.entries(filters.bibleChapters || {}).forEach(([book, chapters]) => {
      chapters.forEach((chapter) => {
        params.append("bibleChapters", `${book}:${chapter}`);
      });
    });

    // Add bibleVerses to params
    filters.bibleVerses.forEach((verse) => params.append("bibleVerses", verse));

    if (selectedPlaylist) {
      params.append("playlist_id", selectedPlaylist);
    }

    if (filters.showLikedSongs) {
      params.append("showLikedSongs", "true");
    }

    if (filters.showBestMusically) {
      params.append("showBestMusically", "true");
    }

    if (filters.showBestLyrically) {
      params.append("showBestLyrically", "true");
    }

    if (filters.showBestOverall) {
      params.append("showBestOverall", "true");
    }

    if (user) {
      params.append("userId", user.id.toString());
    }

    params.append("page", page.toString());
    params.append("limit", (limit || 20).toString());

    // Add sort options
    if (filters.sortBy) {
      params.append("sortBy", filters.sortBy);
    }
    if (filters.sortOrder) {
      params.append("sortOrder", filters.sortOrder);
    }

    if (filters.showMySongs && user) {
      params.append("showMySongs", "true");
    }

    if (filters.includeJourneySongs) {
      params.append("includeJourneySongs", "true");
    }

    return params.toString();
  };

  // State to track if more songs are available
  const [hasMore, setHasMore] = useState(true);

  // Fetch playlists
  const { data: userPlaylists } = useSWR(
    user ? `/api/users/${user.id}/playlists` : null,
    (url) => axios.get(url).then((res) => res.data),
  );

  const { data: publicPlaylists } = useSWR(`/api/playlists`, (url) =>
    axios.get(url).then((res) => res.data.playlists),
  );

  // Merge user playlists and public playlists and sort them
  const playlists = React.useMemo(() => {
    let combinedPlaylists: typeof userPlaylists = [];

    if (user && userPlaylists) {
      // If user is logged in, merge user playlists and public playlists
      const mergedPlaylists = [...userPlaylists];
      publicPlaylists?.forEach((publicPlaylist) => {
        if (
          !mergedPlaylists.some(
            (userPlaylist) => userPlaylist.id === publicPlaylist.id,
          )
        ) {
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

  const [playlistSearch, setPlaylistSearch] = useState("");
  const [isPlaylistPopoverOpen, setIsPlaylistPopoverOpen] = useState(false);

  const filteredPlaylists =
    playlists?.filter((playlist) =>
      playlist.name.toLowerCase().includes(playlistSearch.toLowerCase()),
    ) || [];

  // Infinite scroll data fetching
  const { data, error, isValidating, size, setSize, mutate } = useSWRInfinite(
    (index) =>
      `/api/songs?${buildQueryString(
        debouncedFilters,
        index + 1,
        user,
        selectedPlaylist,
        20,
      )}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
      onSuccess: (data) => {
        const total = data?.[0]?.total || 0;
        const loadedSongs = data
          ? data.flatMap((page) => page.songs).length
          : 0;
        setHasMore(loadedSongs < total);
      },
    },
  );

  // Handle playlist selection
  const handlePlaylistSelect = (playlistId: string) => {
    handlePlaylistChange(playlistId);
    setIsPlaylistPopoverOpen(false);
  };

  // Memoize handlePlaylistChange to prevent unnecessary re-renders and fix linter warning
  const handlePlaylistChange = useCallback(
    (playlistId: string | null) => {
      setSelectedPlaylist(playlistId);
      setParentSelectedPlaylist(playlistId);
      setFilterOptions((prev) => ({ ...prev, playlist_id: playlistId }));
      setSize(1); // Reset pagination
      mutate(); // Re-fetch data with new playlist selection
    },
    [mutate, setSize, setParentSelectedPlaylist],
  );

  // Clear playlist selection
  const clearPlaylistSelection = useCallback(() => {
    handlePlaylistChange(null);
  }, [handlePlaylistChange]);

  // Songs are derived from the data fetched by SWRInfinite
  const songs = data ? data.flatMap((page) => page.songs) : [];
  const totalSongs = data?.[0]?.total || 0;

  const fetchAllSongs = useCallback(async (): Promise<Song[]> => {
    // First fetch to get the total count
    const countQuery = buildQueryString(
      debouncedFilters,
      1,
      user,
      selectedPlaylist,
      1,
    );
    const countResult = await fetcher(`/api/songs?${countQuery}`);
    const total = countResult.total || 0;

    // If there are songs, fetch all of them
    if (total > 0) {
      const allQuery = buildQueryString(
        debouncedFilters,
        1,
        user,
        selectedPlaylist,
        total,
      );
      const result = await fetcher(`/api/songs?${allQuery}`);
      return result.songs || [];
    }
    return [];
  }, [debouncedFilters, user, selectedPlaylist]);

  const toPlayerSong = useCallback(
    (s: Song) => ({
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
    }),
    [],
  );

  // Use refs to avoid dependency issues
  const fetchAllSongsRef = useRef(fetchAllSongs);
  const toPlayerSongRef = useRef(toPlayerSong);
  const updateQueueRef = useRef(updateQueue);

  useEffect(() => {
    fetchAllSongsRef.current = fetchAllSongs;
  }, [fetchAllSongs]);

  useEffect(() => {
    toPlayerSongRef.current = toPlayerSong;
  }, [toPlayerSong]);

  useEffect(() => {
    updateQueueRef.current = updateQueue;
  }, [updateQueue]);

  useEffect(() => {
    return registerShuffleLoader(async () => {
      const all = await fetchAllSongsRef.current();
      return all.map(toPlayerSongRef.current);
    });
  }, [registerShuffleLoader]);

  // Update shuffle queue when filters or playlist change while shuffle is active
  useEffect(() => {
    if (!isShuffling) return;

    // Use AbortController for proper cleanup
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout;

    const updateShuffleQueue = async () => {
      // Check if already aborted
      if (abortController.signal.aborted) return;

      try {
        const all = await fetchAllSongsRef.current();

        // Check again after async operation
        if (abortController.signal.aborted) return;

        const shuffledSongs = all.map(toPlayerSongRef.current);
        // Only update if we actually have songs that match the current criteria
        if (shuffledSongs.length > 0) {
          updateQueueRef.current(shuffledSongs);
        }
      } catch (err) {
        // Don't log if it's an abort error
        if (!abortController.signal.aborted) {
          console.error(
            "Error updating shuffle queue after filter/playlist change:",
            err,
          );
        }
      }
    };

    // Debounce the update to avoid rapid successive calls
    timeoutId = setTimeout(updateShuffleQueue, 500);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [isShuffling, debouncedFilters, selectedPlaylist]);

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

  const removeFilter = (filterType: keyof FilterOptions, value?: string) => {
    setFilterOptions((prev) => {
      if (
        filterType === "showLikedSongs" ||
        filterType === "showBestMusically" ||
        filterType === "showBestLyrically" ||
        filterType === "showBestOverall" ||
        filterType === "showMySongs" // Add this line
      ) {
        return {
          ...prev,
          [filterType]: false,
        };
      } else if (filterType === "aiUsedForLyrics") {
        return {
          ...prev,
          aiUsedForLyrics: "all", // Reset to 'all' when the tag is removed
        };
      } else if (filterType === "aiMusic") {
        return {
          ...prev,
          aiMusic: "all", // Reset to 'all' when the tag is removed
        };
      } else if (filterType === "lyricsAdherence" && value) {
        return {
          ...prev,
          lyricsAdherence: prev.lyricsAdherence.filter((v) => v !== value),
        };
      } else if (filterType === "genres" && value) {
        return {
          ...prev,
          genres: prev.genres.filter((v) => v !== value),
        };
      } else if (filterType === "bibleBooks" && value) {
        // Remove the book from bibleBooks
        const newBibleBooks = prev.bibleBooks.filter((v) => v !== value);

        // Remove chapters associated with the removed book
        const newBibleChapters = { ...prev.bibleChapters };
        delete newBibleChapters[value]; // Remove the key for the removed book

        // Remove verses associated with the removed book's chapters
        const versesToKeep = prev.bibleVerses.filter((verse) => {
          // Keep verses that are not in the removed book
          return !verse.startsWith(`${value} `);
        });

        return {
          ...prev,
          bibleBooks: newBibleBooks,
          bibleChapters: newBibleChapters,
          bibleVerses: versesToKeep,
        };
      } else if (filterType === "bibleChapters" && value) {
        // Remove selected chapter
        const [book, chapter] = value.split(":");
        const chapters = prev.bibleChapters[book] || [];
        const newChapters = chapters.filter((ch) => ch !== Number(chapter));
        const newBibleChapters = { ...prev.bibleChapters, [book]: newChapters };

        // Remove book key if no chapters are left
        if (newChapters.length === 0) {
          delete newBibleChapters[book];
        }

        // Remove verses associated with the removed chapter
        const versesToKeep = prev.bibleVerses.filter((verse) => {
          // Keep verses that are not in the removed chapter
          return !verse.startsWith(`${book} ${chapter}:`);
        });

        return {
          ...prev,
          bibleChapters: newBibleChapters,
          bibleVerses: versesToKeep,
        };
      } else if (filterType === "bibleVerses" && value) {
        // Remove selected verse
        return {
          ...prev,
          bibleVerses: prev.bibleVerses.filter((v) => v !== value),
        };
      } else if (filterType === "search") {
        return {
          ...prev,
          search: "",
        };
      } else {
        return {
          ...prev,
          [filterType]: typeof prev[filterType] === "boolean" ? false : "",
        };
      }
    });
  };

  const getFilterTags = (): {
    type: keyof FilterOptions;
    label: string;
    value?: string;
  }[] => {
    const tags: { type: keyof FilterOptions; label: string; value?: string }[] =
      [];

    if (filterOptions.search) {
      tags.push({
        type: "search",
        label: `Search: "${filterOptions.search}"`,
        value: filterOptions.search,
      });
    }

    if (filterOptions.lyricsAdherence.length > 0) {
      filterOptions.lyricsAdherence.forEach((value) => {
        tags.push({
          type: "lyricsAdherence",
          label: `Lyrics: ${value.replace(/_/g, " ")}`,
          value,
        });
      });
    }

    if (filterOptions.isContinuous !== "all") {
      tags.push({
        type: "isContinuous",
        label: `Passage: ${filterOptions.isContinuous === "true" ? "Continuous" : "Non-continuous"}`,
      });
    }

    if (filterOptions.aiMusic !== "all") {
      tags.push({
        type: "aiMusic",
        label: `Music: ${filterOptions.aiMusic === "true" ? "AI Generated" : "Human Composed"}`,
      });
    }

    if (filterOptions.genres.length > 0) {
      filterOptions.genres.forEach((genre) => {
        tags.push({
          type: "genres",
          label: `Genre: ${genre}`,
          value: genre,
        });
      });
    }

    if (filterOptions.aiUsedForLyrics !== "all") {
      tags.push({
        type: "aiUsedForLyrics",
        label: `Lyrics: ${filterOptions.aiUsedForLyrics === "true" ? "AI Generated" : "Human Written"}`,
      });
    }

    if (filterOptions.musicModelUsed) {
      tags.push({
        type: "musicModelUsed",
        label: `Music Model: ${filterOptions.musicModelUsed}`,
      });
    }

    if (filterOptions.bibleTranslation) {
      tags.push({
        type: "bibleTranslation",
        label: `Translation: ${filterOptions.bibleTranslation}`,
      });
    }

    if (filterOptions.bibleBooks.length > 0) {
      filterOptions.bibleBooks.forEach((book) => {
        tags.push({
          type: "bibleBooks",
          label: `Book: ${book}`,
          value: book,
        });
      });
    }

    if (
      filterOptions.bibleChapters &&
      Object.keys(filterOptions.bibleChapters).length > 0
    ) {
      Object.entries(filterOptions.bibleChapters).forEach(
        ([book, chapters]) => {
          chapters.forEach((chapter) => {
            tags.push({
              type: "bibleChapters",
              label: `Chapter: ${book} ${chapter}`,
              value: `${book}:${chapter}`,
            });
          });
        },
      );
    }

    if (filterOptions.bibleVerses.length > 0) {
      filterOptions.bibleVerses.forEach((verse) => {
        tags.push({
          type: "bibleVerses",
          label: `Verse: ${verse}`,
          value: verse,
        });
      });
    }

    if (filterOptions.showLikedSongs) {
      tags.push({
        type: "showLikedSongs",
        label: "Liked Songs",
      });
    }

    if (filterOptions.showBestMusically) {
      tags.push({
        type: "showBestMusically",
        label: "Voted Best Musically",
      });
    }

    if (filterOptions.showBestLyrically) {
      tags.push({
        type: "showBestLyrically",
        label: "Voted Best Lyrically",
      });
    }

    if (filterOptions.showBestOverall) {
      tags.push({
        type: "showBestOverall",
        label: "Voted Best Overall",
      });
    }

    if (filterOptions.showMySongs) {
      tags.push({
        type: "showMySongs",
        label: "My Songs",
      });
    }

    return tags;
  };

  const [isSavePlaylistDialogOpen, setIsSavePlaylistDialogOpen] =
    useState(false);

  // New state variables for image cropping
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);

  // Handler to open the ImageCropper
  const openImageCropper = () => {
    setIsCropperOpen(true);
  };

  const buildFileFromCrop = (blob: Blob, metadata?: CropResultMetadata) => {
    const mimeType = metadata?.mimeType || blob.type || "image/jpeg";
    const extension = getExtensionFromMimeType(mimeType);
    const fallbackName = `playlist-cover-${Date.now()}`;
    const derivedBase = metadata?.suggestedFileName
      ? stripFileExtension(metadata.suggestedFileName)
      : metadata?.originalFileName
        ? stripFileExtension(metadata.originalFileName)
        : "";
    const baseName =
      derivedBase && derivedBase.length > 0 ? derivedBase : fallbackName;
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

  const handleImageCropperComplete = (
    blob: Blob,
    metadata?: CropResultMetadata,
  ) => {
    const file = buildFileFromCrop(blob, metadata);
    onImageCropComplete(file);
  };

  // Function to upload the cover art
  const uploadCoverArt = async (file: File) => {
    if (!user) return;
    if (!(file instanceof File)) {
      toast.error("Invalid cover art file provided");
      console.error(
        "Expected File when uploading cover art but received",
        file,
      );
      return;
    }

    try {
      const uploadResult = await uploadFile(
        file,
        "image",
        Number(user.id),
        "playlist_cover",
      );
      if (typeof uploadResult === "string") {
        throw new Error(uploadResult);
      }

      const { fileKey } = uploadResult;
      formRef.current?.setValue("cover_art_url", fileKey, {
        shouldValidate: true,
      });
      formRef.current?.setValue("coverArtFile", file, { shouldValidate: true });
      toast.success("Cover art uploaded");
    } catch (error) {
      console.error("Error uploading cover art:", error);
      toast.error("Failed to upload cover art");
    }
  };

  const handleSavePlaylist = () => {
    setIsSavePlaylistDialogOpen(true);
  };

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
    setParentFilterOptions(filterOptions);
  }, [filterOptions, setParentFilterOptions]);

  // Add this useEffect to synchronize the search term
  useEffect(() => {
    if (querySearch) {
      setFilterOptions((prev) => ({ ...prev, search: querySearch }));
    }
  }, [querySearch]);

  const resetFilters = () =>
    setFilterOptions({
      lyricsAdherence: [],
      isContinuous: "all",
      aiMusic: "all",
      genres: [],
      aiUsedForLyrics: "all",
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
      sortBy: "mostRecent",
      sortOrder: "desc",
      showMySongs: false,
      includeJourneySongs: false,
    });

  const [isStartingPlayback, setIsStartingPlayback] = useState(false);
  const playCollection = async (shuffle: boolean) => {
    if (isStartingPlayback) return;
    setIsStartingPlayback(true);
    try {
      const allSongs = await fetchAllSongs();
      if (!allSongs.length) {
        toast.error("No songs to play");
        return;
      }
      const playerSongs = allSongs.map(toPlayerSong);
      updateQueue(playerSongs);
      if (isShuffling !== shuffle) toggleShuffle();
      playSong(
        playerSongs[
          shuffle ? Math.floor(Math.random() * playerSongs.length) : 0
        ],
        playerSongs,
      );
      toast.success(
        `${shuffle ? "Shuffling" : "Playing"} ${allSongs.length} songs`,
      );
    } catch (failure) {
      console.error("Error playing songs:", failure);
      toast.error("Could not start playback. Please try again.");
    } finally {
      setIsStartingPlayback(false);
    }
  };

  const activeTags = getFilterTags();
  const activePlaylist = playlists?.find(
    (playlist) => playlist.id.toString() === selectedPlaylist,
  );

  return (
    <TooltipProvider>
      <Head>
        <title>Listen · BibleChorus</title>
        <meta
          name="description"
          content="Discover Bible-inspired music by passage, genre, artist, and more."
        />
      </Head>
      <main className="page-shell">
        <header className="page-header flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="page-eyebrow flex items-center gap-2">
              <ListMusic className="h-4 w-4" /> Scripture, with a soundtrack
            </p>
            <h1 className="page-title">Let the Word stay with you.</h1>
            <p className="page-description">
              Find music for the passage you’re reading, the season you’re in,
              or the moment you need.
            </p>
          </div>
          <p className="shrink-0 text-sm text-muted-foreground">
            {data
              ? `${totalSongs.toLocaleString()} songs to discover`
              : "Discover the music library"}
          </p>
        </header>

        <section
          aria-label="Library controls"
          className="surface-card mb-6 p-4 sm:p-5"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search songs"
                placeholder="Search songs, artists, or Scripture…"
                value={filterOptions.search}
                onChange={(event) =>
                  setFilterOptions((previous) => ({
                    ...previous,
                    search: event.target.value,
                  }))
                }
                className="h-12 pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={isFilterExpanded ? "secondary" : "outline"}
                aria-expanded={isFilterExpanded}
                aria-controls="listen-filters"
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="h-11"
              >
                <Filter className="mr-2 h-4 w-4" /> Filters
                {activeTags.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 rounded-full px-1.5"
                  >
                    {activeTags.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant={isSortExpanded ? "secondary" : "outline"}
                aria-expanded={isSortExpanded}
                aria-controls="listen-sort"
                onClick={() => setIsSortExpanded(!isSortExpanded)}
                className="h-11"
              >
                <ArrowUpDown className="mr-2 h-4 w-4" /> Sort
              </Button>
              <Button
                variant={isPlaylistExpanded ? "secondary" : "outline"}
                aria-expanded={isPlaylistExpanded}
                aria-controls="listen-playlists"
                onClick={() => setIsPlaylistExpanded(!isPlaylistExpanded)}
                className="h-11"
              >
                <ListMusic className="mr-2 h-4 w-4" /> Playlists
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => setIsNarrowView(!isNarrowView)}
                    aria-label={
                      isNarrowView
                        ? "Expand song details"
                        : "Use compact song view"
                    }
                    aria-pressed={isNarrowView}
                  >
                    {isNarrowView ? (
                      <Expand className="h-4 w-4" />
                    ) : (
                      <Shrink className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isNarrowView ? "Expand song details" : "Compact song view"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          {isFilterExpanded && (
            <div
              id="listen-filters"
              className="mt-5 border-t border-border pt-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">Find your sound</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close filters"
                  onClick={() => setIsFilterExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Filters
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                setIsFilterExpanded={setIsFilterExpanded}
              />
            </div>
          )}
          {isSortExpanded && (
            <div id="listen-sort" className="mt-5 border-t border-border pt-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">
                  Put the favorites first
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close sorting"
                  onClick={() => setIsSortExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SortOptions
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                setIsSortExpanded={setIsSortExpanded}
              />
            </div>
          )}
          {isPlaylistExpanded && (
            <div
              id="listen-playlists"
              className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5"
            >
              <Popover
                open={isPlaylistPopoverOpen}
                onOpenChange={setIsPlaylistPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-11 max-w-full gap-2">
                    <ListMusic className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {activePlaylist?.name || "Choose a playlist"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] p-3">
                  <Input
                    aria-label="Search playlists"
                    placeholder="Search playlists…"
                    value={playlistSearch}
                    onChange={(event) => setPlaylistSearch(event.target.value)}
                    className="mb-3"
                  />
                  <ScrollArea className="h-72">
                    <div className="space-y-1">
                      {filteredPlaylists.map((playlist) => (
                        <button
                          type="button"
                          key={playlist.id}
                          onClick={() =>
                            handlePlaylistSelect(playlist.id.toString())
                          }
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selectedPlaylist === playlist.id.toString() &&
                              "bg-primary/10",
                          )}
                        >
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={
                                playlist.cover_art_url ||
                                "/biblechorus-icon.png"
                              }
                              alt=""
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {playlist.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {playlist.song_count || 0} songs
                            </p>
                          </div>
                          {selectedPlaylist === playlist.id.toString() && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      ))}
                      {!filteredPlaylists.length && (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          No playlists match your search.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {selectedPlaylist && (
                <>
                  <Button variant="ghost" onClick={clearPlaylistSelection}>
                    <X className="mr-2 h-4 w-4" /> Clear selection
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/playlists/${selectedPlaylist}`)
                    }
                  >
                    <Edit className="mr-2 h-4 w-4" /> Open playlist
                  </Button>
                </>
              )}
              <Button onClick={handleSavePlaylist} className="sm:ml-auto">
                <Save className="mr-2 h-4 w-4" /> Save collection
              </Button>
            </div>
          )}
        </section>

        {(activeTags.length > 0 || selectedPlaylist) && (
          <div
            className="mb-6 flex flex-wrap items-center gap-2"
            aria-label="Active library filters"
          >
            {selectedPlaylist && (
              <Badge variant="secondary" className="gap-2 rounded-full py-2">
                {activePlaylist?.name || "Selected playlist"}
                <button
                  type="button"
                  onClick={clearPlaylistSelection}
                  aria-label="Remove playlist filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {activeTags.map((tag, index) => (
              <Badge
                variant="secondary"
                key={`${tag.type}-${tag.value || index}`}
                className="gap-2 rounded-full py-2 font-normal"
              >
                {tag.label}
                <button
                  type="button"
                  aria-label={`Remove ${tag.label}`}
                  onClick={() => removeFilter(tag.type, tag.value)}
                  className="rounded-full hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {activeTags.length > 0 && (
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                Clear filters
              </Button>
            )}
          </div>
        )}

        <section className="surface-card p-3 sm:p-6" aria-label="Songs">
          {error && (
            <div
              role="alert"
              className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4"
            >
              <div>
                <h2 className="font-semibold">We couldn’t load the songs.</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please try again in a moment.
                </p>
              </div>
              <Button variant="outline" onClick={() => mutate()}>
                Try again
              </Button>
            </div>
          )}
          {songs.length > 0 ? (
            <>
              <div className="mb-5 flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    {activePlaylist?.name || "The music library"}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {totalSongs.toLocaleString()} songs
                    {activeTags.length
                      ? " in this collection"
                      : ", one shared story"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => playCollection(true)}
                    disabled={isStartingPlayback}
                  >
                    <Shuffle className="mr-2 h-4 w-4" /> Shuffle
                  </Button>
                  <Button
                    onClick={() => playCollection(false)}
                    disabled={isStartingPlayback}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />{" "}
                    {isStartingPlayback ? "Loading…" : "Play all"}
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
                <div className="mt-6">
                  <div ref={loadMoreRef} className="h-1" />
                  {isValidating ? (
                    <SongListSkeleton />
                  ) : (
                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => setSize(size + 1)}
                      >
                        Load more songs
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : isValidating ? (
            <div role="status" aria-label="Loading songs">
              <p className="mb-5 text-sm text-muted-foreground">
                Finding your next favorite…
              </p>
              <SongListSkeleton />
            </div>
          ) : !error ? (
            <div className="px-3 py-16 text-center">
              <PlayCircle className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <h2 className="text-xl font-semibold">
                No songs match this collection.
              </h2>
              <p className="mx-auto mb-5 mt-2 max-w-md text-sm text-muted-foreground">
                Try another passage, genre, or search to discover more music.
              </p>
              {activeTags.length > 0 && (
                <Button variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : null}
        </section>
      </main>
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
      <Dialog
        open={isCropperOpen}
        onOpenChange={(open) => {
          setIsCropperOpen(open);
          if (!open) setCropImageUrl(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Playlist artwork</DialogTitle>
            <DialogDescription>
              Choose the part of your image to use for this collection.
            </DialogDescription>
          </DialogHeader>
          {cropImageUrl && (
            <ImageCropper
              imageUrl={cropImageUrl}
              onCropComplete={handleImageCropperComplete}
              onCancel={() => {
                setIsCropperOpen(false);
                setCropImageUrl(null);
              }}
              maxHeight={500}
            />
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
