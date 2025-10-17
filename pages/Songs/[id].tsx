import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Play, Pause, Edit, Share2, Info, Trash2, Heart, Music, BookOpen, Star, ThumbsUp, ThumbsDown, X, Pencil, BookOpenText , Sparkles } from 'lucide-react'
import db from '@/db'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import axios from 'axios'
import { toast } from "sonner"
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { formatBibleVerses } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { MusicFilled, BookOpenFilled, StarFilled } from '@/components/ui/custom-icons'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FormControl } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { AI_MUSIC_MODELS } from '@/lib/constants';
import { GENRES } from "@/lib/constants"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BIBLE_BOOKS, BIBLE_TRANSLATIONS } from "@/lib/constants"
import AsyncSelect from 'react-select/async'
import { BOLLS_LIFE_API_BIBLE_TRANSLATIONS } from '@/lib/constants'
import DOMPurify from 'isomorphic-dompurify';
import { ImageCropper, CropResultMetadata } from '@/components/UploadPage/ImageCropper'
import { parsePostgresArray } from '@/lib/utils'; // Add a utility function to parse PostgreSQL arrays
import { components } from 'react-select';
import { extractFileExtension, getExtensionFromMimeType, stripFileExtension } from '@/lib/imageUtils'
import { MessageCircle } from 'lucide-react'; // Add this import
import { CommentList } from '@/components/SongComments/CommentList'; // Add this import
import { NewCommentForm } from '@/components/SongComments/NewCommentForm'; // Add this import
import { SongComment } from '@/types';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext'

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

interface Song {
  id: number
  title: string
  artist: string
  audio_url: string
  uploaded_by: number
  ai_used_for_lyrics: boolean
  music_ai_generated: boolean
  bible_translation_used: string
  genres: string[]
  lyrics_scripture_adherence: 'word_for_word' | 'close_paraphrase' | 'creative_inspiration'
  is_continuous_passage: boolean
  lyrics: string
  lyric_ai_prompt?: string
  music_ai_prompt?: string
  music_model_used?: string
  song_art_url: string
  created_at: string
  username: string
  bible_verses?: { book: string; chapter: number; verse: number; text: string }[]
  duration: number // Added duration field
}

interface SongPageProps {
  song: Song
}

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export default function SongPage({ song: initialSong }: SongPageProps) {
  const [song, setSong] = useState(initialSong)
  const router = useRouter()
  const { user } = useAuth()
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false)
  const [selectedVoteType, setSelectedVoteType] = useState<string>('')
  const [voteStates, setVoteStates] = useState<Record<string, number>>({})
  const [likeState, setLikeState] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [isKJVTextOpen, setIsKJVTextOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editedTitle, setEditedTitle] = useState(song.title)
  const [editedArtist, setEditedArtist] = useState(song.artist)
  const [isEditing, setIsEditing] = useState(false)
  const [isLyricsEditDialogOpen, setIsLyricsEditDialogOpen] = useState(false)
  const [editedLyrics, setEditedLyrics] = useState(song.lyrics)
  const [editedLyricsAdherence, setEditedLyricsAdherence] = useState(song.lyrics_scripture_adherence)
  const [isLyricsEditing, setIsLyricsEditing] = useState(false)
  const [isAIEditDialogOpen, setIsAIEditDialogOpen] = useState(false)
  const [editedAIUsedForLyrics, setEditedAIUsedForLyrics] = useState(song.ai_used_for_lyrics)
  const [editedLyricAIPrompt, setEditedLyricAIPrompt] = useState(song.lyric_ai_prompt || '')
  const [editedMusicAIGenerated, setEditedMusicAIGenerated] = useState(song.music_ai_generated)
  const [editedMusicModelUsed, setEditedMusicModelUsed] = useState(song.music_model_used || '')
  const [editedMusicAIPrompt, setEditedMusicAIPrompt] = useState(song.music_ai_prompt || '')
  const [isAIEditing, setIsAIEditing] = useState(false)
  const [editedGenres, setEditedGenres] = useState<string[]>(initialSong.genres || [])
  const [openGenre, setOpenGenre] = useState(false)
  const [genreSearch, setGenreSearch] = useState('')
  const [isBibleInfoEditDialogOpen, setIsBibleInfoEditDialogOpen] = useState(false)
  const [editedBibleTranslation, setEditedBibleTranslation] = useState(initialSong.bible_translation_used)
  const [editedLyricsScriptureAdherence, setEditedLyricsScriptureAdherence] = useState(initialSong.lyrics_scripture_adherence)
  const [editedIsContinuousPassage, setEditedIsContinuousPassage] = useState(initialSong.is_continuous_passage)
  const [selectedBibleBooks, setSelectedBibleBooks] = useState<string[]>([])
  const [selectedChapters, setSelectedChapters] = useState<{[book: string]: number[]}>({})
  const [selectedBibleVerses, setSelectedBibleVerses] = useState<string[]>(initialSong.bible_verses ? initialSong.bible_verses.map(verse => `${verse.book} ${verse.chapter}:${verse.verse}`) : []);
  const [openBibleBooks, setOpenBibleBooks] = useState(false)
  const [bibleBookSearch, setBibleBookSearch] = useState('')
  const [openTranslation, setOpenTranslation] = useState(false)
  const [translationSearch, setTranslationSearch] = useState('')

  // State for controlling Accordion default values based on screen size
  const [accordionDefaultValues, setAccordionDefaultValues] = useState<string[]>([])

  // Check if the current user is the creator of the song
  const isCreator = user && user.id.toString() === song.uploaded_by.toString()

  // State variables for Bible verses editing
  const [isBibleInfoEditing, setIsBibleInfoEditing] = useState(false)

  // Popover controls
  const [openChapters, setOpenChapters] = useState(false)
  const [chapterSearch, setChapterSearch] = useState('')
  const [openBibleVerses, setOpenBibleVerses] = useState(false)
  const [bibleVerseSearch, setBibleVerseSearch] = useState('')

  const [selectedTranslation, setSelectedTranslation] = useState('NASB'); // Default translation
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [verseError, setVerseError] = useState<string | null>(null);

  // New state variables for the Bible Info Card
  const [bibleInfoTranslation, setBibleInfoTranslation] = useState(() => {
    const matchingTranslation = BOLLS_LIFE_API_BIBLE_TRANSLATIONS.find(
      t => t.shortName === initialSong.bible_translation_used
    );
    return matchingTranslation ? matchingTranslation.shortName : 'NASB';
  });
  const [bibleInfoVerses, setBibleInfoVerses] = useState<BibleVerse[]>([]);
  const [isLoadingBibleInfoVerses, setIsLoadingBibleInfoVerses] = useState(false);
  const [bibleInfoVerseError, setBibleInfoVerseError] = useState<string | null>(null);

  const translationRef = useRef<HTMLDivElement>(null)

  const [dialogTranslation, setDialogTranslation] = useState(() => {
    const matchingTranslation = BOLLS_LIFE_API_BIBLE_TRANSLATIONS.find(
      t => t.shortName === initialSong.bible_translation_used
    );
    return matchingTranslation ? matchingTranslation.shortName : 'NASB';
  });
  const [dialogOpenTranslation, setDialogOpenTranslation] = useState(false);
  const [dialogTranslationSearch, setDialogTranslationSearch] = useState('');
  const dialogTranslationRef = useRef<HTMLDivElement>(null);

  // State variables for song art editing
  const [isEditArtDialogOpen, setIsEditArtDialogOpen] = useState(false)
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [isImageCropperOpen, setIsImageCropperOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add these state variables
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [comments, setComments] = useState<SongComment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);

  // Define the MultiValue component inside the SongPage function
  const MultiValue = () => null;

  // State for controlling the maximum height of the ImageCropper
  const [cropperMaxHeight, setCropperMaxHeight] = useState<number>(0)

  useEffect(() => {
    const updateCropperMaxHeight = () => {
      const viewportHeight = window.innerHeight
      setCropperMaxHeight(Math.floor(viewportHeight * 0.8)) // Set max height to 80% of viewport height
    }

    updateCropperMaxHeight()
    window.addEventListener('resize', updateCropperMaxHeight)

    return () => {
      window.removeEventListener('resize', updateCropperMaxHeight)
    }
  }, [])

  // Function to sanitize and render HTML
  const renderHTML = (html: string) => {
    return { __html: DOMPurify.sanitize(html) };
  };

  // Fetch verses when the selected translation changes
  useEffect(() => {
    const fetchVerses = async () => {
      if (!isKJVTextOpen || !song.bible_verses || song.bible_verses.length === 0) return;

      setIsLoadingVerses(true);
      setVerseError(null);

      try {
        const versesToFetch = song.bible_verses.map((verse) => ({
          translation: dialogTranslation,
          book: BIBLE_BOOKS.indexOf(verse.book) + 1,
          chapter: verse.chapter,
          verses: [verse.verse]
        }));

        const response = await axios.post('/api/fetch-verses', versesToFetch);
        
        const fetchedVerses = response.data.flat().map((verse: any) => ({
          book: BIBLE_BOOKS[verse.book - 1],
          chapter: verse.chapter,
          verse: verse.verse,
          text: verse.text
        }));

        setVerses(fetchedVerses);
      } catch (error) {
        console.error('Error fetching verses:', error);
        setVerseError('Failed to load verses. Please try again later.');
      } finally {
        setIsLoadingVerses(false);
      }
    };

    fetchVerses();
  }, [dialogTranslation, isKJVTextOpen, song.bible_verses]);

  // New useEffect for fetching verses in the Bible Info Card
  useEffect(() => {
    const fetchBibleInfoVerses = async () => {
      if (!song.bible_verses || song.bible_verses.length === 0) return;

      setIsLoadingBibleInfoVerses(true);
      setBibleInfoVerseError(null);

      try {
        const versesToFetch = song.bible_verses.map((verse) => ({
          translation: bibleInfoTranslation,
          book: BIBLE_BOOKS.indexOf(verse.book) + 1,
          chapter: verse.chapter,
          verses: [verse.verse]
        }));

        const response = await axios.post('/api/fetch-verses', versesToFetch);
        
        const fetchedVerses = response.data.flat().map((verse: any) => ({
          book: BIBLE_BOOKS[verse.book - 1],
          chapter: verse.chapter,
          verse: verse.verse,
          text: verse.text
        }));

        setBibleInfoVerses(fetchedVerses);
      } catch (error) {
        console.error('Error fetching Bible info verses:', error);
        setBibleInfoVerseError('Failed to load verses. Please try again later.');
      } finally {
        setIsLoadingBibleInfoVerses(false);
      }
    };

    fetchBibleInfoVerses();
  }, [bibleInfoTranslation, song.bible_verses]);

  // Add these functions near the top of your component, after the state declarations
  const loadBibleVerses = async (inputValue: string) => {
    if (!inputValue || inputValue.trim() === '') {
      return [];
    }

    try {
      const response = await axios.get('/api/bible-verses', { params: { search: inputValue } });
      return response.data.map((verse: any) => ({
        label: `${verse.book} ${verse.chapter}:${verse.verse}`,
        value: `${verse.book} ${verse.chapter}:${verse.verse}`,
      }));
    } catch (error) {
      console.error('Error fetching Bible verses:', error);
      return [];
    }
  };

  const handleBibleVersesChange = (selectedOptions: any) => {
    const verses = selectedOptions ? selectedOptions.map((option: any) => option.value) : [];
    const uniqueVerses = Array.from(new Set([...selectedBibleVerses, ...verses]));
    setSelectedBibleVerses(uniqueVerses);
  };

  const handleBibleVerseRemove = (verseToRemove: string) => {
    setSelectedBibleVerses(selectedBibleVerses.filter(verse => verse !== verseToRemove));
  };

  // Update the filteredTranslations function
  const filteredTranslations = useCallback(() => {
    return BOLLS_LIFE_API_BIBLE_TRANSLATIONS.filter(translation =>
      translation.shortName.toLowerCase().includes(translationSearch.toLowerCase()) ||
      translation.fullName.toLowerCase().includes(translationSearch.toLowerCase())
    )
  }, [translationSearch])

  const filteredDialogTranslations = useCallback(() => {
    return BOLLS_LIFE_API_BIBLE_TRANSLATIONS.filter(translation =>
      translation.shortName.toLowerCase().includes(dialogTranslationSearch.toLowerCase()) ||
      translation.fullName.toLowerCase().includes(dialogTranslationSearch.toLowerCase())
    )
  }, [dialogTranslationSearch])

  // Update the handleBibleInfoEditSubmit function
  const handleBibleInfoEditSubmit = async () => {
    if (selectedBibleVerses.length === 0) {
      toast.error("Please select at least one Bible verse.");
      return;
    }
    setIsBibleInfoEditing(true);
    try {
      const response = await axios.put(`/api/songs/${song.id}/edit-bible-info`, {
        bible_translation_used: bibleInfoTranslation,
        is_continuous_passage: editedIsContinuousPassage,
        bible_verses: selectedBibleVerses,
      });
      if (response.status === 200) {
        // Update the song's bible verses
        setSong({
          ...song,
          bible_translation_used: bibleInfoTranslation,
          is_continuous_passage: editedIsContinuousPassage,
          bible_verses: response.data.bible_verses,
        });
        setIsBibleInfoEditDialogOpen(false);
        toast.success("Bible information updated successfully");
      }
    } catch (error) {
      console.error('Error updating Bible information:', error);
      toast.error("Failed to update Bible information");
    } finally {
      setIsBibleInfoEditing(false);
    }
  };

  const fetchUserVote = useCallback(async () => {
    try {
      const response = await axios.get(`/api/votes`, {
        params: { user_id: user?.id, song_id: song.id }
      })
      const userVotes = response.data
      const newVoteStates: Record<string, number> = {}

      userVotes.forEach((vote: any) => {
        newVoteStates[vote.vote_type] = vote.vote_value
      })
      setVoteStates(newVoteStates)
    } catch (error) {
      console.error('Error fetching user votes:', error)
    }
  }, [user?.id, song.id])

  const fetchUserLike = useCallback(async () => {
    if (!user) return
    try {
      const response = await axios.get(`/api/users/${user.id}/likes`)
      const userLikes = response.data
      setLikeState(userLikes.some((like: any) => like.likeable_type === 'song' && like.likeable_id === song.id))
    } catch (error) {
      console.error('Error fetching user likes:', error)
    }
  }, [user, song.id])

  const fetchLikeCount = useCallback(async () => {
    try {
      const response = await axios.get('/api/likes/count')
      setLikeCount(response.data[song.id] || 0)
    } catch (error) {
      console.error('Error fetching like count:', error)
    }
  }, [song.id])

  const fetchVoteCounts = useCallback(async () => {
    try {
      const response = await axios.get('/api/votes/count')
      setVoteCounts(response.data[song.id] || {})
    } catch (error) {
      console.error('Error fetching vote counts:', error)
    }
  }, [song.id])

  const fetchCommentsCount = useCallback(async () => {
    try {
      const response = await axios.get(`/api/songs/${song.id}/comments/count`);
      setCommentsCount(response.data.count);
    } catch (error) {
      console.error('Error fetching comments count:', error);
    }
  }, [song.id]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchLikeCount();
      await fetchVoteCounts();
      await fetchCommentsCount();
      
      if (user) {
        await fetchUserVote();
        await fetchUserLike();
      }
    };

    fetchData();

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setAccordionDefaultValues(['lyrics', 'ai-info']);
      } else {
        setAccordionDefaultValues([]);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [user, song.id, fetchLikeCount, fetchVoteCounts, fetchCommentsCount, fetchUserVote, fetchUserLike]);

  useEffect(() => {
    if (initialSong.bible_verses) {
      const books = Array.from(new Set(initialSong.bible_verses.map(verse => verse.book)))
      setSelectedBibleBooks(books)
      
      const chapters: {[book: string]: number[]} = {}
      const verses: string[] = []
      initialSong.bible_verses.forEach(verse => {
        if (!chapters[verse.book]) {
          chapters[verse.book] = []
        }
        if (!chapters[verse.book].includes(verse.chapter)) {
          chapters[verse.book].push(verse.chapter)
        }
        verses.push(`${verse.book} ${verse.chapter}:${verse.verse}`)
      })
      setSelectedChapters(chapters)
      setSelectedBibleVerses(verses)
    }
  }, [initialSong.bible_verses])

  const handlePlayClick = () => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      playSong(
        {
          id: song.id,
          title: song.title,
          artist: song.artist || song.username,
          audioUrl: song.audio_url,
          audio_url: song.audio_url,
          coverArtUrl: song.song_art_url,
          duration: song.duration,
          uploaded_by: song.uploaded_by,
        },
        [{ // Create a queue with just this song
          id: song.id,
          title: song.title,
          artist: song.artist || song.username,
          audioUrl: song.audio_url,
          audio_url: song.audio_url,
          coverArtUrl: song.song_art_url,
          duration: song.duration,
          uploaded_by: song.uploaded_by,
        }]
      );
    }
  };

  const deleteSong = async () => {
    setIsDeleting(true)
    try {
      const response = await axios.delete(`/api/songs/${song.id}/delete`)

      if (response.status === 200) {
        toast.success("Song deleted successfully")
        router.push('/profile') // Redirect to profile page after successful deletion
      } else {
        throw new Error('Failed to delete song')
      }
    } catch (error) {
      console.error('Error deleting song:', error)
      toast.error("Failed to delete song. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleVoteClick = (voteType: string) => {
    if (!user) {
      toast.error('You need to be logged in to vote')
      return
    }
    setSelectedVoteType(voteType)
    setIsVoteDialogOpen(true)
  }

  const handleVote = async (value: string) => {
    if (!user) {
      toast.error('You need to be logged in to vote')
      return
    }

    const voteValue = value === 'up' ? 1 : value === 'down' ? -1 : 0
    
    try {
      const response = await axios.post('/api/votes', {
        user_id: user.id,
        song_id: song.id,
        vote_type: selectedVoteType,
        vote_value: voteValue
      })

      setVoteStates(prevStates => ({
        ...prevStates,
        [selectedVoteType]: voteValue
      }))

      // Update the vote count
      setVoteCounts(prevCounts => ({
        ...prevCounts,
        [selectedVoteType]: response.data.count
      }))

      toast.success('Vote submitted successfully')
    } catch (error) {
      console.error('Error submitting vote:', error)
      toast.error('Failed to submit vote')
    }

    setIsVoteDialogOpen(false)
  }

  const handleLike = useCallback(async () => {
    if (!user) {
      toast.error('You need to be logged in to like a song')
      return
    }

    try {
      if (likeState) {
        await axios.delete(`/api/likes`, {
          data: { user_id: user.id, likeable_type: 'song', likeable_id: song.id }
        })
      } else {
        await axios.post('/api/likes', {
          user_id: user.id,
          likeable_type: 'song',
          likeable_id: song.id
        })
      }

      setLikeState(!likeState)

      // Update like count
      setLikeCount(prev => prev + (likeState ? -1 : 1))

      toast.success(likeState ? 'Song unliked' : 'Song liked')
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like status')
    }
  }, [user, likeState, song.id])

  const getVoteValue = (value: number | undefined): string => {
    if (value === 1) return 'up';
    if (value === -1) return 'down';
    return '0';
  };

  const getVoteLabel = (value: number): string => {
    if (value === 1) return 'Upvoted';
    if (value === -1) return 'Downvoted';
    return 'No vote';
  };

  const getVoteIcon = (voteType: string) => {
    const voteValue = voteStates[voteType] || 0;
    const isUpvoted = voteValue === 1;

    const iconProps = {
      className: 'h-4 w-4 mr-1',
    };

    if (isUpvoted) {
      switch (voteType) {
        case 'Best Musically':
          return <MusicFilled {...iconProps} style={{ color: '#3b82f6' }} />; // Blue color
        case 'Best Lyrically':
          return <BookOpen {...iconProps} style={{ color: '#22c55e' }} />; // Green color, but using outlined icon
        case 'Best Overall':
          return <StarFilled {...iconProps} style={{ color: '#eab308' }} />; // Yellow color
        default:
          return null;
      }
    } else {
      // For downvotes or no votes, use the regular outlined icons
      switch (voteType) {
        case 'Best Musically':
          return <Music {...iconProps} />;
        case 'Best Lyrically':
          return <BookOpen {...iconProps} />;
        case 'Best Overall':
          return <Star {...iconProps} />;
        default:
          return null;
      }
    }
  };

  const filteredGenres = useCallback(() => {
    return GENRES.filter(genre =>
      genre.toLowerCase().includes(genreSearch.toLowerCase())
    )
  }, [genreSearch])

  const filteredBibleBooks = useCallback(() => {
    return BIBLE_BOOKS.filter(book =>
      book.toLowerCase().includes(bibleBookSearch.toLowerCase())
    )
  }, [bibleBookSearch])

  const handleGenreToggle = (genre: string) => {
    let updatedGenres: string[];
    if (editedGenres.includes(genre)) {
      updatedGenres = editedGenres.filter(g => g !== genre);
    } else {
      updatedGenres = [...editedGenres, genre];
    }
    setEditedGenres(updatedGenres);
  }

  const clearGenres = () => {
    setEditedGenres([]);
  }

  const handleBibleBookToggle = (book: string) => {
    let updatedBooks: string[];
    if (selectedBibleBooks.includes(book)) {
      updatedBooks = selectedBibleBooks.filter(b => b !== book);
      const { [book]: _, ...restChapters } = selectedChapters;
      setSelectedChapters(restChapters);
    } else {
      updatedBooks = [...selectedBibleBooks, book];
    }
    setSelectedBibleBooks(updatedBooks);
  }

  const clearBibleBooks = () => {
    setSelectedBibleBooks([]);
    setSelectedChapters({});
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editedTitle.trim()) {
      toast.error("Song title cannot be empty")
      return
    }
    setIsEditing(true)
    try {
      const response = await axios.put(`/api/songs/${song.id}/edit`, {
        title: editedTitle,
        artist: editedArtist,
        genres: editedGenres, // Add this line
      })
      if (response.status === 200) {
        setSong({ ...song, title: editedTitle, artist: editedArtist, genres: editedGenres }) // Update this line
        setIsEditDialogOpen(false)
        toast.success("Song details updated successfully")
      }
    } catch (error) {
      console.error('Error updating song:', error)
      toast.error("Failed to update song details")
    } finally {
      setIsEditing(false)
    }
  }

  const handleLyricsEditSubmit = async () => {
    if (!editedLyrics.trim()) {
      toast.error("Lyrics cannot be empty")
      return
    }
    setIsLyricsEditing(true)
    try {
      const response = await axios.put(`/api/songs/${song.id}/edit`, {
        lyrics: editedLyrics,
        lyrics_scripture_adherence: editedLyricsAdherence,
      })
      if (response.status === 200) {
        setSong({ ...song, lyrics: editedLyrics, lyrics_scripture_adherence: editedLyricsAdherence })
        setIsLyricsEditDialogOpen(false)
        toast.success("Lyrics updated successfully")
      }
    } catch (error) {
      console.error('Error updating lyrics:', error)
      toast.error("Failed to update lyrics")
    } finally {
      setIsLyricsEditing(false)
    }
  }

  const handleAIEditSubmit = async () => {
    setIsAIEditing(true)
    try {
      const response = await axios.put(`/api/songs/${song.id}/edit`, {
        ai_used_for_lyrics: editedAIUsedForLyrics,
        lyric_ai_prompt: editedLyricAIPrompt,
        music_ai_generated: editedMusicAIGenerated,
        music_model_used: editedMusicModelUsed,
        music_ai_prompt: editedMusicAIPrompt,
      })
      if (response.status === 200) {
        setSong({
          ...song,
          ai_used_for_lyrics: editedAIUsedForLyrics,
          lyric_ai_prompt: editedLyricAIPrompt,
          music_ai_generated: editedMusicAIGenerated,
          music_model_used: editedMusicModelUsed,
          music_ai_prompt: editedMusicAIPrompt,
        })
        setIsAIEditDialogOpen(false)
        toast.success("AI information updated successfully")
      }
    } catch (error) {
      console.error('Error updating AI information:', error)
      toast.error("Failed to update AI information")
    } finally {
      setIsAIEditing(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (translationRef.current && !translationRef.current.contains(event.target as Node)) {
        setOpenTranslation(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogTranslationRef.current && !dialogTranslationRef.current.contains(event.target as Node)) {
        setDialogOpenTranslation(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleEditArtClick = () => {
    setIsEditArtDialogOpen(true)
  }

  const handleReplaceClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > MAX_IMAGE_FILE_SIZE) {
        toast.error(`File size exceeds the limit of 5MB`)
        return
      }
      const imageUrl = URL.createObjectURL(file)
      setCropImageUrl(imageUrl)
      setIsImageCropperOpen(true)
      setPendingImageFile(file)
    }
  }

  const handleCropComplete = async (croppedImageBlob: Blob, metadata?: CropResultMetadata) => {
    setIsImageCropperOpen(false);
    setIsEditArtDialogOpen(false);

    try {
      // First, delete the old song art
      if (song.song_art_url) {
        const fileKey = song.song_art_url.replace(CDN_URL, '').replace(/^\/+/, '');
        // Changed DELETE to POST method
        await axios.post('/api/delete-file', { fileKey });
      }

      const fileType = metadata?.mimeType || croppedImageBlob.type || pendingImageFile?.type || 'image/jpeg';
      const suggestedName = metadata?.suggestedFileName || pendingImageFile?.name;
      const fallbackBase = pendingImageFile?.name ? stripFileExtension(pendingImageFile.name) : `song-art-${Date.now()}`;
      const fileExtension = extractFileExtension(suggestedName) || getExtensionFromMimeType(fileType);
      const fileName = suggestedName || `${fallbackBase}.${fileExtension}`;
      const userId = user?.id;
      const fileSize = croppedImageBlob.size.toString();

      // Get signed URL for uploading new song art
      const uploadUrlResponse = await axios.post('/api/upload-url', {
        fileType,
        fileExtension,
        title: fileName,
        userId,
        fileSize,
      });

      if (uploadUrlResponse.status !== 200) {
        throw new Error('Failed to get upload URL');
      }

      const { signedUrl, fileKey } = uploadUrlResponse.data;

      // Upload the image to S3 using the signed URL
      await axios.put(signedUrl, croppedImageBlob, {
        headers: {
          'Content-Type': fileType,
          'Content-Length': croppedImageBlob.size,
        },
      });

      // Update the song with the new song art URL
      const updateResponse = await axios.put(`/api/songs/${song.id}/update-song-art`, {
        songArtUrl: fileKey,
      });

      if (updateResponse.status === 200) {
        setSong({ ...song, song_art_url: updateResponse.data.updatedUrl });
        toast.success('Song art updated successfully');
      } else {
        throw new Error('Failed to update song art URL');
      }

    } catch (error) {
      console.error('Error updating song art:', error);
      toast.error('Failed to update song art');
    }

    setPendingImageFile(null)
  };

  const handleCropCancel = () => {
    setIsImageCropperOpen(false)
    setCropImageUrl(null)
    setPendingImageFile(null)
  }

  const fetchComments = useCallback(async () => {
    try {
      const response = await axios.get(`/api/songs/${song.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [song.id]);

  useEffect(() => {
    if (isCommentsDialogOpen) {
      fetchComments();
    }
  }, [isCommentsDialogOpen, fetchComments]);

  // Add this function to handle new comments
  const handleCommentAdded = useCallback((newComment: SongComment) => {
    setComments((prevComments) => {
      const updatedComments = [...prevComments];
      if (newComment.parent_comment_id) {
        // Find the parent comment and add the reply
        const parentIndex = updatedComments.findIndex(c => c.id === newComment.parent_comment_id);
        if (parentIndex !== -1) {
          updatedComments.splice(parentIndex + 1, 0, newComment);
        } else {
          updatedComments.push(newComment);
        }
      } else {
        updatedComments.push(newComment);
      }
      return updatedComments;
    });
    setCommentsCount((prevCount) => prevCount + 1);
  }, []);

  const handleShare = useCallback(async () => {
    // Get the correct artist attribution
    const artistAttribution = song.username;
    
    const songUrl = `${window.location.origin}/Songs/${song.id}`;
    const shareData = {
      title: `${song.title} by ${artistAttribution}`, // Updated title
      text: `Check out "${song.title}" by ${artistAttribution} on BibleChorus`, // Updated text
      url: songUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success('Song shared successfully');
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing song:', error);
          toast.error('Failed to share song');
        }
      }
    } else {
      // Fallback to copying the link
      try {
        await navigator.clipboard.writeText(songUrl);
        toast.success('Song link copied to clipboard');
      } catch (error) {
        console.error('Error copying song link:', error);
        toast.error('Failed to copy song link');
      }
    }
  }, [song]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/60 via-white to-fuchsia-50/30 dark:from-violet-950/40 dark:via-slate-900 dark:to-fuchsia-950/30">
      <Head>
        <title>{`${song.title} by ${song.username} - BibleChorus`}</title>
        <meta property="og:title" content={`${song.title} by ${song.username}`} />
        <meta property="og:description" content={`Listen to "${song.title}" by ${song.username} on BibleChorus.`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_CDN_URL}${song.song_art_url || '/default-cover.jpg'}`} />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASE_URL}/Songs/${song.id}`} />
        <meta property="og:type" content="music.song" />
        <meta property="music:duration" content={`${song.duration}`} />
        <meta property="music:musician" content={song.username} />
        {/* Add other Open Graph music tags as needed */}
      </Head>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden pb-20 pt-12"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/60 via-fuchsia-500/40 to-indigo-500/60"></div>
          <div className="absolute top-0 -left-8 w-96 h-96 bg-violet-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
          <div className="absolute top-12 -right-8 w-80 h-80 bg-fuchsia-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-12 left-32 w-96 h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(139,92,246,0.1),rgba(255,255,255,0))]"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:via-fuchsia-500/20 dark:to-indigo-500/20 backdrop-blur-md border border-violet-500/20 dark:border-violet-500/30 shadow-lg">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 dark:from-violet-400 dark:via-fuchsia-400 dark:to-indigo-400 bg-clip-text text-transparent font-semibold">
                Song Spotlight
              </span>
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold tracking-tight"
          >
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                {song.title}
              </span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 rounded-full scale-x-0 animate-scale-x"></div>
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-4 text-lg text-slate-600 dark:text-slate-300"
          >
            By {song.artist}
          </motion.p>
          {song.bible_verses && song.bible_verses.length > 0 && (
            <div className="mt-4 flex items-center justify-center">
              <p className="text-sm sm:text-base font-semibold text-white">
                {formatBibleVerses(song.bible_verses)}
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsKJVTextOpen(true)}
                      className="ml-2 text-white hover:text-primary-300 transition-colors"
                    >
                      <BookOpenText className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to view Bible verses</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          {isCreator && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:text-primary-300 transition-colors"
              onClick={handleEditArtClick}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>

      <div className="container mx-auto px-4 -mt-12 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl p-6 md:p-10 space-y-6"
        >
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300"
          >
            Back
          </Button>

          <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
            {song.song_art_url && (
              <div className="w-full md:w-1/3 mb-4 md:mb-0">
                <Image
                  src={song.song_art_url.startsWith('http') ? song.song_art_url : `${CDN_URL}${song.song_art_url}`}
                  alt={song.title}
                  width={400}
                  height={500}
                  className="w-full h-auto object-contain rounded"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Song Info Card */}
          <Card className="lg:col-span-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold mb-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
                  Song Details
                </CardTitle>
                {isCreator && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {song.genres && song.genres.map((genre, index) => (
                  <Badge key={`${song.id}-${genre}-${index}`} variant="secondary">
                    {genre}
                  </Badge>
                ))}
                <Badge variant="outline">{song.bible_translation_used}</Badge>
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  {song.lyrics_scripture_adherence.replace(/_/g, ' ')}
                </Badge>
                <Badge variant="outline">
                  {song.is_continuous_passage ? 'Continuous' : 'Non-Continuous'}
                </Badge>
                {song.ai_used_for_lyrics && <Badge variant="secondary">AI Lyrics</Badge>}
                {song.music_ai_generated && <Badge variant="secondary">AI Music</Badge>}
              </div>
              <p><strong>Uploaded by:</strong> {song.username}</p>
              <p><strong>Created at:</strong> {new Date(song.created_at).toLocaleString()}</p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                onClick={handlePlayClick}
                className="w-full"
              >
                {currentSong?.id === song.id && isPlaying ? (
                  <>
                    <Pause className="mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2" />
                    Play
                  </>
                )}
              </Button>
              <div className="flex w-full space-x-2">
                <Button variant="outline" className="flex-1" onClick={handleShare}>
                  <Share2 className="mr-2" />Share
                </Button>
                {isCreator && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isDeleting} className="flex-1">
                        <Trash2 className="mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this song?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the song, its associated data, and remove the audio and artwork files from storage.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteSong}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardFooter>
          </Card>

          {/* Votes and Likes Card */}
          <Card className="lg:col-span-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent text-2xl font-bold">
                Votes & Likes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <button
                  onClick={handleLike}
                  className="flex items-center justify-between text-gray-500 hover:text-red-500 transition-colors duration-200"
                >
                  <span>Likes</span>
                  <div className="flex items-center">
                    <Heart
                      className={`h-6 w-6 mr-2 ${
                        likeState ? 'fill-current text-red-500' : ''
                      }`}
                    />
                    <span className="text-lg">{likeCount}</span>
                  </div>
                </button>
                <button
                  onClick={() => handleVoteClick('Best Musically')}
                  className="flex items-center justify-between text-gray-500 hover:text-blue-500 transition-colors duration-200"
                >
                  <span>Best Musically</span>
                  <div className="flex items-center">
                    {getVoteIcon('Best Musically')}
                    <span className="text-lg">{voteCounts['Best Musically'] || 0}</span>
                  </div>
                </button>
                <button
                  onClick={() => handleVoteClick('Best Lyrically')}
                  className="flex items-center justify-between text-gray-500 hover:text-green-500 transition-colors duration-200"
                >
                  <span>Best Lyrically</span>
                  <div className="flex items-center">
                    {getVoteIcon('Best Lyrically')}
                    <span className="text-lg">{voteCounts['Best Lyrically'] || 0}</span>
                  </div>
                </button>
                <button
                  onClick={() => handleVoteClick('Best Overall')}
                  className="flex items-center justify-between text-gray-500 hover:text-yellow-500 transition-colors duration-200"
                >
                  <span>Best Overall</span>
                  <div className="flex items-center">
                    {getVoteIcon('Best Overall')}
                    <span className="text-lg">{voteCounts['Best Overall'] || 0}</span>
                  </div>
                </button>
                <button
                  onClick={() => setIsCommentsDialogOpen(true)}
                  className="flex items-center justify-between text-gray-500 hover:text-purple-500 transition-colors duration-200"
                >
                  <span>Comments</span>
                  <div className="flex items-center">
                    <MessageCircle className="h-6 w-6 mr-2" />
                    <span className="text-lg">{commentsCount}</span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* AI Info Card */}
          {(song.ai_used_for_lyrics || song.music_ai_generated) && (
            <Card className="lg:col-span-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
                  AI Information
                </CardTitle>
                  {isCreator && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAIEditDialogOpen(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" defaultValue={['lyric-ai', 'music-ai']}>
                  {song.ai_used_for_lyrics && (
                    <AccordionItem value="lyric-ai">
                      <AccordionTrigger>Lyric AI</AccordionTrigger>
                      <AccordionContent>
                        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                          <p className="mb-2"><strong>Prompt:</strong></p>
                          <p>{song.lyric_ai_prompt}</p>
                        </ScrollArea>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  {song.music_ai_generated && (
                    <AccordionItem value="music-ai">
                      <AccordionTrigger>Music AI</AccordionTrigger>
                      <AccordionContent>
                        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                          <p><strong>Model:</strong> {song.music_model_used}</p>
                          <p className="mt-2"><strong>Prompt:</strong></p>
                          <p>{song.music_ai_prompt}</p>
                        </ScrollArea>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Bible Info Card */}
          <Card className="lg:col-span-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
                  Bible Info
                </CardTitle>
                {isCreator && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsBibleInfoEditDialogOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible defaultValue="verses">
                <AccordionItem value="verses">
                  <AccordionTrigger>Bible Verses Covered</AccordionTrigger>
                  <AccordionContent>
                    <div className="mb-4">
                      <Popover open={openTranslation} onOpenChange={setOpenTranslation}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openTranslation}
                            className="w-full justify-between"
                          >
                            {bibleInfoTranslation ? `${bibleInfoTranslation} - ${BOLLS_LIFE_API_BIBLE_TRANSLATIONS.find(t => t.shortName === bibleInfoTranslation)?.fullName}` : "Select Bible translation..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 max-w-[90vw] sm:max-w-[300px]" ref={translationRef}>
                          <div className="p-2">
                            <div className="flex items-center justify-between pb-2">
                              <Input
                                placeholder="Search translations..."
                                value={translationSearch}
                                onChange={(e) => setTranslationSearch(e.target.value)}
                                className="mr-2"
                              />
                              {bibleInfoTranslation && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setBibleInfoTranslation('NASB')
                                    setTranslationSearch('')
                                  }}
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                            <div className="max-h-[200px] overflow-y-auto">
                              {filteredTranslations().map((translation) => (
                                <div
                                  key={translation.shortName}
                                  className={cn(
                                    "flex cursor-pointer items-center rounded-md px-2 py-1 hover:bg-accent",
                                    bibleInfoTranslation === translation.shortName && "bg-accent"
                                  )}
                                  onClick={() => {
                                    setBibleInfoTranslation(translation.shortName)
                                    setOpenTranslation(false)
                                  }}
                                >
                                  <div className="mr-2 h-4 w-4 flex-shrink-0 border border-primary rounded flex items-center justify-center">
                                    {bibleInfoTranslation === translation.shortName && <Check className="h-3 w-3" />}
                                  </div>
                                  <div className="flex-grow overflow-hidden">
                                    <span className="font-semibold">{translation.shortName}</span> - <span className="text-sm break-words">{translation.fullName}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      {isLoadingBibleInfoVerses ? (
                        <div className="flex flex-col items-center justify-center h-40">
                          <BookOpen className="h-12 w-12 animate-pulse text-primary" />
                          <p className="mt-4 text-muted-foreground">Loading verses...</p>
                        </div>
                      ) : bibleInfoVerseError ? (
                        <p className="text-red-500">{bibleInfoVerseError}</p>
                      ) : (
                        bibleInfoVerses.map((verse, index) => (
                          <div key={index} className="mb-4">
                            <p className="font-semibold">{`${verse.book} ${verse.chapter}:${verse.verse}`}</p>
                            <div dangerouslySetInnerHTML={renderHTML(verse.text)} />
                          </div>
                        ))
                      )}
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Lyrics Card */}
          <Card className="lg:col-span-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
                  Lyrics
                </CardTitle>
                {isCreator && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLyricsEditDialogOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible defaultValue="lyrics">
                <AccordionItem value="lyrics">
                  <AccordionTrigger>View Lyrics</AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      <p className="whitespace-pre-wrap">{song.lyrics}</p>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* KJV Text Dialog */}
      <Dialog open={isKJVTextOpen} onOpenChange={setIsKJVTextOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {dialogTranslation} Text for {formatBibleVerses(song.bible_verses || [])}
            </DialogTitle>
            {/* Updated translation selection dropdown */}
            <div className="mt-4">
              <Popover open={dialogOpenTranslation} onOpenChange={setDialogOpenTranslation}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={dialogOpenTranslation}
                    className="w-full justify-between"
                  >
                    {dialogTranslation ? `${dialogTranslation} - ${BOLLS_LIFE_API_BIBLE_TRANSLATIONS.find(t => t.shortName === dialogTranslation)?.fullName}` : "Select Bible translation..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 max-w-[90vw] sm:max-w-[300px]" ref={dialogTranslationRef}>
                  <div className="p-2">
                    <div className="flex items-center justify-between pb-2">
                      <Input
                        placeholder="Search translations..."
                        value={dialogTranslationSearch}
                        onChange={(e) => setDialogTranslationSearch(e.target.value)}
                        className="mr-2"
                      />
                      {dialogTranslation && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDialogTranslation('KJV')
                            setDialogTranslationSearch('')
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredDialogTranslations().map((translation) => (
                        <div
                          key={translation.shortName}
                          className={cn(
                            "flex cursor-pointer items-center rounded-md px-2 py-1 hover:bg-accent",
                            dialogTranslation === translation.shortName && "bg-accent"
                          )}
                          onClick={() => {
                            setDialogTranslation(translation.shortName)
                            setDialogOpenTranslation(false)
                            setSelectedTranslation(translation.shortName)
                          }}
                        >
                          <div className="mr-2 h-4 w-4 flex-shrink-0 border border-primary rounded flex items-center justify-center">
                            {dialogTranslation === translation.shortName && <Check className="h-3 w-3" />}
                          </div>
                          <div className="flex-grow overflow-hidden">
                            <span className="font-semibold">{translation.shortName}</span> - <span className="text-sm break-words">{translation.fullName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto mt-4">
            {isLoadingVerses ? (
              <div className="flex flex-col items-center justify-center h-40">
                <BookOpen className="h-12 w-12 animate-pulse text-primary" />
                <p className="mt-4 text-muted-foreground">Loading verses...</p>
              </div>
            ) : verseError ? (
              <p className="text-red-500">{verseError}</p>
            ) : (
              verses.map((verse, index) => (
                <div key={index} className="mb-4">
                  <p className="font-semibold">{`${verse.book} ${verse.chapter}:${verse.verse}`}</p>
                  <div dangerouslySetInnerHTML={renderHTML(verse.text)} />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Vote Dialog */}
      <Dialog open={isVoteDialogOpen} onOpenChange={setIsVoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">Vote for {selectedVoteType}</DialogTitle>
            <DialogDescription className="text-center">{song.title}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {voteStates[selectedVoteType] !== 1 && (
              <Button onClick={() => handleVote('up')} variant="outline" className="w-full sm:w-auto">
                <ThumbsUp className="mr-2 h-4 w-4" />
                Upvote
              </Button>
            )}
            {voteStates[selectedVoteType] !== -1 && (
              <Button onClick={() => handleVote('down')} variant="outline" className="w-full sm:w-auto">
                <ThumbsDown className="mr-2 h-4 w-4" />
                Downvote
              </Button>
            )}
            {voteStates[selectedVoteType] !== 0 && (
              <Button onClick={() => handleVote('0')} variant="outline" className="w-full sm:w-auto">
                <X className="mr-2 h-4 w-4" />
                Remove Vote
              </Button>
            )}
          </div>
          <div className="text-sm text-center text-muted-foreground mt-4">
            Your current vote: {getVoteLabel(voteStates[selectedVoteType] || 0)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Song Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Song Details</DialogTitle>
            <DialogDescription>
              Make changes to the song title, artist name, and genres here.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="artist" className="text-right">
                  Artist
                </Label>
                <Input
                  id="artist"
                  value={editedArtist}
                  onChange={(e) => setEditedArtist(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="genres" className="text-right pt-2">
                  Genres
                </Label>
                <div className="col-span-3">
                  <Popover open={openGenre} onOpenChange={setOpenGenre}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openGenre}
                        className="w-full justify-between"
                      >
                        {editedGenres.length > 0
                          ? `${editedGenres.length} selected`
                          : "Select genres..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <div className="p-2">
                        <div className="flex items-center justify-between pb-2">
                          <Input
                            placeholder="Search genres..."
                            value={genreSearch}
                            onChange={(e) => setGenreSearch(e.target.value)}
                            className="mr-2"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearGenres}
                          >
                            Clear
                          </Button>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredGenres().map((genre) => (
                            <div
                              key={genre}
                              className={cn(
                                "flex cursor-pointer items-center rounded-md px-2 py-1 hover:bg-accent",
                                editedGenres.includes(genre) && "bg-accent"
                              )}
                              onClick={() => handleGenreToggle(genre)}
                            >
                              <div className="mr-2 h-4 w-4 border border-primary rounded flex items-center justify-center">
                                {editedGenres.includes(genre) && <Check className="h-3 w-3" />}
                              </div>
                              {genre}
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {editedGenres.map((genre) => (
                      <div
                        key={genre}
                        className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-sm flex items-center"
                      >
                        {genre}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-4 w-4 p-0"
                          onClick={() => handleGenreToggle(genre)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Lyrics Dialog */}
      <Dialog open={isLyricsEditDialogOpen} onOpenChange={setIsLyricsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Lyrics</DialogTitle>
            <DialogDescription>
              Make changes to the lyrics and lyrics adherence here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lyrics" className="text-right">
                Lyrics
              </Label>
              <Textarea
                id="lyrics"
                value={editedLyrics}
                onChange={(e) => setEditedLyrics(e.target.value)}
                className="col-span-3"
                rows={10}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lyrics-adherence" className="text-right">
                Scripture Adherence
              </Label>
              <Select
                onValueChange={(value) => setEditedLyricsAdherence(value as 'word_for_word' | 'close_paraphrase' | 'creative_inspiration')}
                defaultValue={editedLyricsAdherence}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select adherence level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="word_for_word">Word-for-word</SelectItem>
                  <SelectItem value="close_paraphrase">Close paraphrase</SelectItem>
                  <SelectItem value="creative_inspiration">Creative inspiration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleLyricsEditSubmit} disabled={isLyricsEditing}>
              {isLyricsEditing ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit AI Info Dialog */}
      <Dialog open={isAIEditDialogOpen} onOpenChange={setIsAIEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit AI Information</DialogTitle>
            <DialogDescription>
              Make changes to the AI-related information here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-used-for-lyrics">AI Used for Lyrics</Label>
              <Switch
                id="ai-used-for-lyrics"
                checked={editedAIUsedForLyrics}
                onCheckedChange={setEditedAIUsedForLyrics}
              />
            </div>
            {editedAIUsedForLyrics && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lyric-ai-prompt" className="text-right">
                  Lyric AI Prompt
                </Label>
                <Textarea
                  id="lyric-ai-prompt"
                  value={editedLyricAIPrompt}
                  onChange={(e) => setEditedLyricAIPrompt(e.target.value)}
                  className="col-span-3"
                  rows={3}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="music-ai-generated">AI Generated Music</Label>
              <Switch
                id="music-ai-generated"
                checked={editedMusicAIGenerated}
                onCheckedChange={setEditedMusicAIGenerated}
              />
            </div>
            {editedMusicAIGenerated && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="music-model-used" className="text-right">
                    AI Music Model
                  </Label>
                  <Select
                    onValueChange={setEditedMusicModelUsed}
                    defaultValue={editedMusicModelUsed}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select AI music model" />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MUSIC_MODELS.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="music-ai-prompt" className="text-right">
                    Music AI Prompt
                  </Label>
                  <Textarea
                    id="music-ai-prompt"
                    value={editedMusicAIPrompt}
                    onChange={(e) => setEditedMusicAIPrompt(e.target.value)}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleAIEditSubmit} disabled={isAIEditing}>
              {isAIEditing ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bible Info Edit Dialog */}
      <Dialog open={isBibleInfoEditDialogOpen} onOpenChange={setIsBibleInfoEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Bible Information</DialogTitle>
            <DialogDescription>
              Make changes to the Bible-related information here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bible-translation" className="text-right">
                Bible Translation
              </Label>
              <div className="col-span-3">
                <Select
                  value={bibleInfoTranslation}
                  onValueChange={(value) => setBibleInfoTranslation(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Bible translation" />
                  </SelectTrigger>
                  <SelectContent>
                    {BIBLE_TRANSLATIONS.map((translation) => (
                      <SelectItem key={translation} value={translation}>
                        {translation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="continuous-passage" className="text-right">
                Continuous Passage
              </Label>
              <div className="col-span-3">
                <Switch
                  checked={editedIsContinuousPassage}
                  onCheckedChange={setEditedIsContinuousPassage}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="bible-verses" className="text-right pt-2">
                Bible Verses
              </Label>
              <div className="col-span-3">
                <AsyncSelect
                  id="bible-verses"
                  isMulti
                  cacheOptions
                  defaultOptions
                  loadOptions={loadBibleVerses}
                  onChange={handleBibleVersesChange}
                  value={[]}
                  placeholder="Search and select Bible verses..."
                  components={{ MultiValue }}
                  styles={{
                    control: (provided) => ({ ...provided, minHeight: '56px' }),
                    menu: (provided) => ({ ...provided, zIndex: 9999 }),
                  }}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedBibleVerses.map((verse) => (
                    <div
                      key={verse}
                      className="bg-secondary text-secondary-foreground rounded-full px-2 py-2 text-sm flex items-center"
                    >
                      {verse}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-4 w-4 p-0"
                        onClick={() => handleBibleVerseRemove(verse)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={selectedBibleVerses.length === 0 || isBibleInfoEditing}
              onClick={handleBibleInfoEditSubmit}
            >
              {isBibleInfoEditing ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Song Art Dialog */}
      <Dialog open={isEditArtDialogOpen} onOpenChange={setIsEditArtDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Song Art</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center">
            <Image
              src={song.song_art_url ? `${CDN_URL}${song.song_art_url}` : '/biblechorus-icon.png'}
              alt="Current Song Art"
              width={200}
              height={200}
              className="rounded-lg mb-4"
            />
            <Button onClick={handleReplaceClick}>Replace Image</Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isImageCropperOpen} onOpenChange={setIsImageCropperOpen}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <DialogHeader className="p-4">
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          {cropImageUrl && (
            <ImageCropper
              imageUrl={cropImageUrl}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
              maxHeight={cropperMaxHeight}
              originalFileName={pendingImageFile?.name}
              originalMimeType={pendingImageFile?.type}
              desiredFileName={pendingImageFile?.name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>
              Join the discussion about this song.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-4">
            {user && (
              <NewCommentForm
                songId={song.id}
                onCommentAdded={handleCommentAdded}
              />
            )}
            <CommentList
              comments={comments}
              songId={song.id}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };

  try {
    const song = await db('songs')
      .join('users', 'songs.uploaded_by', 'users.id')
      .where('songs.id', id)
      .select('songs.*', 'users.username')
      .first();

    if (!song) {
      return {
        notFound: true,
      };
    }

    console.log('song.genres:', song.genres);
    console.log('Type of song.genres:', typeof song.genres);

    // Only parse if genres is a string
    if (typeof song.genres === 'string') {
      song.genres = parsePostgresArray(song.genres);
    } else if (Array.isArray(song.genres)) {
      // Already an array, no need to parse
    } else {
      // Handle unexpected types
      song.genres = [];
    }

    // Fetch Bible verses for the song, excluding KJV_text
    const verses = await db('song_verses')
      .join('bible_verses', 'song_verses.verse_id', 'bible_verses.id')
      .where('song_verses.song_id', id)
      .select(
        'bible_verses.book',
        'bible_verses.chapter',
        'bible_verses.verse'
      )
      .orderBy(['bible_verses.book', 'bible_verses.chapter', 'bible_verses.verse']);

    song.bible_verses = verses;

    return {
      props: { song: JSON.parse(JSON.stringify(song)) }
    };
  } catch (error) {
    console.error('Error fetching song:', error);
    return {
      notFound: true,
    };
  }
};