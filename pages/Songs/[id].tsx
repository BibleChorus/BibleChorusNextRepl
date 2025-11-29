import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Play, Pause, Edit, Share2, Info, Trash2, Heart, Music, BookOpen, Star, ThumbsUp, ThumbsDown, X, Pencil, BookOpenText, Sparkles, ArrowLeft } from 'lucide-react'
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

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return CDN_URL ? `${CDN_URL}${path}` : `/${path}`;
};

const formatJourneySongOrigin = (origin: string): string => {
  const originLabels: Record<string, string> = {
    'prior_recording': 'Previously Written Song',
    'journal_entry': 'Journal Entry',
    'dream': 'Dream',
    'testimony': 'Testimony',
    'life_milestone': 'Life Milestone',
    'prophetic_word': 'Prayer or Prophetic Utterance',
    'other': 'Other'
  };
  return originLabels[origin] || origin.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

interface Song {
  id: number
  title: string
  artist: string
  audio_url: string
  uploaded_by: number
  ai_used_for_lyrics: boolean
  music_ai_generated: boolean
  music_origin?: 'human' | 'ai' | 'ai_cover_of_human'
  bible_translation_used: string
  genres: string[]
  lyrics_scripture_adherence: 'word_for_word' | 'close_paraphrase' | 'creative_inspiration' | 'somewhat_connected' | 'no_connection'
  is_continuous_passage: boolean
  lyrics: string
  lyric_ai_prompt?: string
  music_ai_prompt?: string
  music_model_used?: string
  song_art_url: string
  created_at: string
  username: string
  bible_verses?: { book: string; chapter: number; verse: number; text: string }[]
  duration: number
  is_journey_song?: boolean
  journey_date?: string
  journey_song_origin?: 'prior_recording' | 'journal_entry' | 'dream' | 'testimony' | 'life_milestone' | 'prophetic_word' | 'other'
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

const FilmGrainOverlay: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none opacity-[0.015]"
      style={{
        zIndex: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}
    />
  );
};

interface AmbientOrbsOverlayProps {
  isDark: boolean;
}

const AmbientOrbsOverlay: React.FC<AmbientOrbsOverlayProps> = ({ isDark }) => {
  const orbColors = {
    primary: isDark ? 'rgba(212, 175, 55, 0.06)' : 'rgba(191, 161, 48, 0.05)',
    secondary: isDark ? 'rgba(160, 160, 160, 0.04)' : 'rgba(100, 100, 100, 0.03)',
    tertiary: isDark ? 'rgba(229, 229, 229, 0.02)' : 'rgba(50, 50, 50, 0.02)',
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <motion.div 
        className="absolute top-0 left-0 w-96 h-96 rounded-full"
        style={{
          background: orbColors.primary,
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: orbColors.secondary,
          filter: 'blur(120px)'
        }}
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div 
        className="absolute top-1/2 right-1/4 w-72 h-72 rounded-full"
        style={{
          background: orbColors.tertiary,
          filter: 'blur(100px)'
        }}
        animate={{
          y: [0, 20, 0],
          x: [0, -15, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />
    </div>
  );
};

export default function SongPage({ song: initialSong }: SongPageProps) {
  const [song, setSong] = useState(initialSong)
  const router = useRouter()
  const { user } = useAuth()
  const { playSong, currentSong, isPlaying, pause, resume } = useMusicPlayer()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const isDark = resolvedTheme === 'dark'

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgAlt: isDark ? '#0a0a0a' : '#f0ede6',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    textMuted: isDark ? '#6f6f6f' : '#6f6f6f',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderLight: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    borderHover: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  }
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
  const areVersesContinuous = (verses: string[]) => {
    if (verses.length === 0) return false;

    const parseVerseReference = (reference: string) => {
      const trimmedReference = reference.trim();
      const lastSpaceIndex = trimmedReference.lastIndexOf(' ');

      if (lastSpaceIndex === -1) {
        return { book: trimmedReference, chapter: NaN, verse: NaN };
      }

      const book = trimmedReference.slice(0, lastSpaceIndex);
      const chapterVerse = trimmedReference.slice(lastSpaceIndex + 1);
      const [chapterStr, verseStr] = chapterVerse.split(':');

      return {
        book,
        chapter: Number(chapterStr),
        verse: Number(verseStr),
      };
    };

    const sortedVerses = [...verses].sort((a, b) => {
      const { book: bookA, chapter: chapterA, verse: verseA } = parseVerseReference(a);
      const { book: bookB, chapter: chapterB, verse: verseB } = parseVerseReference(b);

      if (bookA !== bookB) return bookA.localeCompare(bookB);
      if (chapterA !== chapterB) return chapterA - chapterB;
      return verseA - verseB;
    });

    let prevBook = '', prevChapter = 0, prevVerse = 0;
    for (let i = 0; i < sortedVerses.length; i++) {
      const { book, chapter, verse } = parseVerseReference(sortedVerses[i]);

      if (i > 0) {
        if (book !== prevBook) return false;
        if (chapter === prevChapter && verse !== prevVerse + 1) return false;
        if (chapter !== prevChapter && (chapter !== prevChapter + 1 || verse !== 1)) return false;
      }

      prevBook = book;
      prevChapter = chapter;
      prevVerse = verse;
    }

    return true;
  };

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
    setEditedIsContinuousPassage(areVersesContinuous(uniqueVerses));
  };

  const handleBibleVerseRemove = (verseToRemove: string) => {
    const updatedVerses = selectedBibleVerses.filter(verse => verse !== verseToRemove);
    setSelectedBibleVerses(updatedVerses);
    setEditedIsContinuousPassage(areVersesContinuous(updatedVerses));
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
    setMounted(true)
  }, [])

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

  if (!mounted) {
    return (
      <>
        <Head>
          <title>{`${song.title} by ${song.username} - BibleChorus`}</title>
        </Head>
        <div 
          className="min-h-screen opacity-0" 
          style={{ fontFamily: "'Manrope', sans-serif" }} 
        />
      </>
    )
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{ 
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: "'Manrope', sans-serif"
      }}
    >
      <Head>
        <title>{`${song.title} by ${song.username} - BibleChorus`}</title>
        <meta property="og:title" content={`${song.title} by ${song.username}`} />
        <meta property="og:description" content={`Listen to "${song.title}" by ${song.username} on BibleChorus.`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_CDN_URL}${song.song_art_url || '/default-cover.jpg'}`} />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASE_URL}/Songs/${song.id}`} />
        <meta property="og:type" content="music.song" />
        <meta property="music:duration" content={`${song.duration}`} />
        <meta property="music:musician" content={song.username} />
      </Head>

      <style jsx global>{`
        html, body {
          background-color: ${theme.bg} !important;
        }
      `}</style>

      <AmbientOrbsOverlay isDark={isDark} />
      <FilmGrainOverlay />

      <div className="relative" style={{ zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-16 pt-12"
        >
          <div className="container mx-auto px-6 md:px-12">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.back()}
              className="mb-8 flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-light transition-colors"
              style={{ color: theme.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
              onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </motion.button>

            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-6"
              >
                <span 
                  className="inline-flex items-center gap-3 px-5 py-2 text-xs tracking-[0.3em] uppercase"
                  style={{ 
                    border: `1px solid ${theme.border}`,
                    color: theme.accent,
                    fontFamily: "'Manrope', sans-serif"
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
                  Song Spotlight
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-6"
              >
                <span 
                  className="block text-4xl md:text-5xl lg:text-6xl tracking-tight"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  {song.title}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg md:text-xl font-light"
                style={{ color: theme.textSecondary }}
              >
                By {song.artist}
              </motion.p>

              {song.bible_verses && song.bible_verses.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="mt-6 flex items-center justify-center gap-3"
                >
                  <p 
                    className="text-sm sm:text-base font-medium"
                    style={{ color: theme.accent }}
                  >
                    {formatBibleVerses(song.bible_verses)}
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsKJVTextOpen(true)}
                          className="transition-colors"
                          style={{ color: theme.accent }}
                          onMouseEnter={(e) => e.currentTarget.style.color = theme.accentHover}
                          onMouseLeave={(e) => e.currentTarget.style.color = theme.accent}
                        >
                          <BookOpenText className="h-5 w-5" />
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to view Bible verses</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="container mx-auto px-6 md:px-12 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="p-6 md:p-10 space-y-8"
            style={{ 
              backgroundColor: theme.bgCard,
              border: `1px solid ${theme.border}`
            }}
          >

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-12">
            {song.song_art_url && (
              <motion.div 
                className="md:col-span-2 xl:col-span-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div 
                  className="relative group overflow-hidden"
                  style={{ border: `1px solid ${theme.border}` }}
                >
                  <Image
                    src={getImageUrl(song.song_art_url)}
                    alt={song.title}
                    width={400}
                    height={500}
                    className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
                  />
                  {isCreator && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute top-4 right-4 p-2 transition-all duration-300"
                      style={{ 
                        backgroundColor: `${theme.bgCard}cc`,
                        border: `1px solid ${theme.border}`,
                        color: theme.text
                      }}
                      onClick={handleEditArtClick}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.accent
                        e.currentTarget.style.color = theme.accent
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme.border
                        e.currentTarget.style.color = theme.text
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            <div 
              className="md:col-span-2 xl:col-span-4 p-6"
              style={{ 
                backgroundColor: theme.bgCard,
                border: `1px solid ${theme.border}`
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 
                  className="text-xl tracking-wide"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  Song Details
                </h2>
                {isCreator && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditDialogOpen(true)}
                    className="p-2 transition-colors"
                    style={{ color: theme.textSecondary }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
                  >
                    <Pencil className="h-4 w-4" />
                  </motion.button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {song.genres && song.genres.map((genre, index) => (
                  <span 
                    key={`${song.id}-${genre}-${index}`}
                    className="px-3 py-1 text-xs tracking-wider uppercase"
                    style={{ 
                      border: `1px solid ${theme.border}`,
                      color: theme.textSecondary,
                      fontFamily: "'Manrope', sans-serif"
                    }}
                  >
                    {genre}
                  </span>
                ))}
                <span 
                  className="px-3 py-1 text-xs tracking-wider uppercase"
                  style={{ 
                    border: `1px solid ${theme.accent}40`,
                    color: theme.accent,
                    fontFamily: "'Manrope', sans-serif"
                  }}
                >
                  {song.bible_translation_used}
                </span>
                <span 
                  className="px-3 py-1 text-xs tracking-wider uppercase"
                  style={{ 
                    backgroundColor: `${theme.accent}20`,
                    border: `1px solid ${theme.accent}40`,
                    color: theme.accent,
                    fontFamily: "'Manrope', sans-serif"
                  }}
                >
                  {song.lyrics_scripture_adherence.replace(/_/g, ' ')}
                </span>
                {song.ai_used_for_lyrics && (
                  <span 
                    className="px-3 py-1 text-xs tracking-wider uppercase"
                    style={{ 
                      border: `1px solid ${theme.border}`,
                      color: theme.textSecondary,
                      fontFamily: "'Manrope', sans-serif"
                    }}
                  >
                    AI Lyrics
                  </span>
                )}
                {song.music_ai_generated && (
                  <span 
                    className="px-3 py-1 text-xs tracking-wider uppercase"
                    style={{ 
                      border: `1px solid ${theme.border}`,
                      color: theme.textSecondary,
                      fontFamily: "'Manrope', sans-serif"
                    }}
                  >
                    AI Music
                  </span>
                )}
                {song.is_journey_song && (
                  <span 
                    className="px-3 py-1 text-xs tracking-wider uppercase"
                    style={{ 
                      backgroundColor: `${theme.accent}30`,
                      border: `1px solid ${theme.accent}`,
                      color: theme.accent,
                      fontFamily: "'Manrope', sans-serif"
                    }}
                  >
                    Journey Song
                  </span>
                )}
              </div>

              <div className="space-y-3 mb-6" style={{ color: theme.textSecondary }}>
                <p className="text-sm font-light">
                  <span style={{ color: theme.textMuted }}>Uploaded by:</span>{' '}
                  <span style={{ color: theme.text }}>{song.username}</span>
                </p>
                <p className="text-sm font-light">
                  <span style={{ color: theme.textMuted }}>Created:</span>{' '}
                  <span style={{ color: theme.text }}>{new Date(song.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </p>
              </div>

              {song.is_journey_song && (
                <div 
                  className="p-4 mb-6"
                  style={{ 
                    backgroundColor: `${theme.accent}10`,
                    border: `1px solid ${theme.accent}30`
                  }}
                >
                  <p 
                    className="text-sm font-medium mb-3"
                    style={{ color: theme.accent }}
                  >
                    Journey Song Details
                  </p>
                  {song.journey_date && (
                    <p className="text-sm font-light" style={{ color: theme.textSecondary }}>
                      <span style={{ color: theme.textMuted }}>Originating Date:</span>{' '}
                      <span style={{ color: theme.text }}>{(() => {
                        const dateStr = song.journey_date;
                        const datePart = dateStr.split('T')[0].split(' ')[0];
                        const [year, month, day] = datePart.split('-').map(Number);
                        return new Date(year, month - 1, day).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                      })()}</span>
                    </p>
                  )}
                  {song.journey_song_origin && (
                    <p className="text-sm font-light mt-2" style={{ color: theme.textSecondary }}>
                      <span style={{ color: theme.textMuted }}>Origin:</span>{' '}
                      <span style={{ color: theme.text }}>{formatJourneySongOrigin(song.journey_song_origin)}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePlayClick}
                  className="w-full py-3 px-6 flex items-center justify-center gap-2 text-sm tracking-[0.15em] uppercase font-medium transition-all duration-300"
                  style={{ 
                    backgroundColor: theme.accent,
                    color: isDark ? '#050505' : '#ffffff'
                  }}
                >
                  {currentSong?.id === song.id && isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Play
                    </>
                  )}
                </motion.button>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleShare}
                    className="flex-1 py-3 px-4 flex items-center justify-center gap-2 text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300"
                    style={{ 
                      border: `1px solid ${theme.border}`,
                      color: theme.text,
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.accent
                      e.currentTarget.style.color = theme.accent
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.border
                      e.currentTarget.style.color = theme.text
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </motion.button>

                  {isCreator && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isDeleting}
                          className="flex-1 py-3 px-4 flex items-center justify-center gap-2 text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300"
                          style={{ 
                            border: `1px solid ${isDark ? 'rgba(220, 38, 38, 0.5)' : 'rgba(220, 38, 38, 0.5)'}`,
                            color: isDark ? '#ef4444' : '#dc2626',
                            backgroundColor: 'transparent'
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </motion.button>
                      </AlertDialogTrigger>
                      <AlertDialogContent style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}>
                        <AlertDialogHeader>
                          <AlertDialogTitle style={{ color: theme.text }}>Are you sure you want to delete this song?</AlertDialogTitle>
                          <AlertDialogDescription style={{ color: theme.textSecondary }}>
                            This action cannot be undone. This will permanently delete the song, its associated data, and remove the audio and artwork files from storage.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel 
                            style={{ 
                              border: `1px solid ${theme.border}`,
                              color: theme.text,
                              backgroundColor: 'transparent'
                            }}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={deleteSong}
                            style={{ 
                              backgroundColor: '#dc2626',
                              color: '#ffffff'
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>

            {/* Votes and Likes Card */}
            <div 
              className="md:col-span-2 xl:col-span-4 p-6"
              style={{ 
                backgroundColor: theme.bgCard,
                border: `1px solid ${theme.border}`
              }}
            >
              <h2 
                className="text-xl tracking-wide mb-6"
                style={{ fontFamily: "'Italiana', serif", color: theme.text }}
              >
                Votes & Likes
              </h2>

              <div className="flex flex-col space-y-4">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleLike}
                  className="flex items-center justify-between p-3 transition-all duration-300"
                  style={{ 
                    border: `1px solid ${theme.borderLight}`,
                    color: likeState ? '#ef4444' : theme.textSecondary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.accent
                    if (!likeState) e.currentTarget.style.color = theme.accent
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.borderLight
                    if (!likeState) e.currentTarget.style.color = theme.textSecondary
                  }}
                >
                  <span className="text-sm tracking-wider uppercase font-light">Likes</span>
                  <div className="flex items-center gap-2">
                    <Heart
                      className={`h-5 w-5 ${likeState ? 'fill-current' : ''}`}
                    />
                    <span className="text-lg font-medium" style={{ color: theme.text }}>{likeCount}</span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleVoteClick('Best Musically')}
                  className="flex items-center justify-between p-3 transition-all duration-300"
                  style={{ 
                    border: `1px solid ${theme.borderLight}`,
                    color: theme.textSecondary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.accent
                    e.currentTarget.style.color = theme.accent
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.borderLight
                    e.currentTarget.style.color = theme.textSecondary
                  }}
                >
                  <span className="text-sm tracking-wider uppercase font-light">Best Musically</span>
                  <div className="flex items-center gap-2">
                    {getVoteIcon('Best Musically')}
                    <span className="text-lg font-medium" style={{ color: theme.text }}>{voteCounts['Best Musically'] || 0}</span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleVoteClick('Best Lyrically')}
                  className="flex items-center justify-between p-3 transition-all duration-300"
                  style={{ 
                    border: `1px solid ${theme.borderLight}`,
                    color: theme.textSecondary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.accent
                    e.currentTarget.style.color = theme.accent
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.borderLight
                    e.currentTarget.style.color = theme.textSecondary
                  }}
                >
                  <span className="text-sm tracking-wider uppercase font-light">Best Lyrically</span>
                  <div className="flex items-center gap-2">
                    {getVoteIcon('Best Lyrically')}
                    <span className="text-lg font-medium" style={{ color: theme.text }}>{voteCounts['Best Lyrically'] || 0}</span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleVoteClick('Best Overall')}
                  className="flex items-center justify-between p-3 transition-all duration-300"
                  style={{ 
                    border: `1px solid ${theme.borderLight}`,
                    color: theme.textSecondary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.accent
                    e.currentTarget.style.color = theme.accent
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.borderLight
                    e.currentTarget.style.color = theme.textSecondary
                  }}
                >
                  <span className="text-sm tracking-wider uppercase font-light">Best Overall</span>
                  <div className="flex items-center gap-2">
                    {getVoteIcon('Best Overall')}
                    <span className="text-lg font-medium" style={{ color: theme.text }}>{voteCounts['Best Overall'] || 0}</span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setIsCommentsDialogOpen(true)}
                  className="flex items-center justify-between p-3 transition-all duration-300"
                  style={{ 
                    border: `1px solid ${theme.borderLight}`,
                    color: theme.textSecondary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.accent
                    e.currentTarget.style.color = theme.accent
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.borderLight
                    e.currentTarget.style.color = theme.textSecondary
                  }}
                >
                  <span className="text-sm tracking-wider uppercase font-light">Comments</span>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-lg font-medium" style={{ color: theme.text }}>{commentsCount}</span>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* AI Info Card */}
            {(song.ai_used_for_lyrics || song.music_ai_generated) && (
              <div 
                className="md:col-span-2 xl:col-span-4 p-6"
                style={{ 
                  backgroundColor: theme.bgCard,
                  border: `1px solid ${theme.border}`
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 
                    className="text-xl tracking-wide"
                    style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                  >
                    AI Information
                  </h2>
                  {isCreator && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsAIEditDialogOpen(true)}
                      className="p-2 transition-colors"
                      style={{ color: theme.textSecondary }}
                      onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                      onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
                    >
                      <Pencil className="h-4 w-4" />
                    </motion.button>
                  )}
                </div>

                <Accordion type="multiple" defaultValue={['lyric-ai', 'music-ai']} className="space-y-3">
                  {song.ai_used_for_lyrics && (
                    <AccordionItem 
                      value="lyric-ai" 
                      className="border-0"
                      style={{ borderBottom: `1px solid ${theme.borderLight}` }}
                    >
                      <AccordionTrigger 
                        className="text-sm tracking-wider uppercase font-light py-3"
                        style={{ color: theme.textSecondary }}
                      >
                        Lyric AI
                      </AccordionTrigger>
                      <AccordionContent>
                        <ScrollArea 
                          className="h-[200px] w-full p-4"
                          style={{ border: `1px solid ${theme.borderLight}` }}
                        >
                          <p className="mb-2 text-sm" style={{ color: theme.accent }}>Prompt:</p>
                          <p className="text-sm font-light" style={{ color: theme.textSecondary }}>{song.lyric_ai_prompt}</p>
                        </ScrollArea>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  {song.music_ai_generated && (
                    <AccordionItem 
                      value="music-ai" 
                      className="border-0"
                      style={{ borderBottom: `1px solid ${theme.borderLight}` }}
                    >
                      <AccordionTrigger 
                        className="text-sm tracking-wider uppercase font-light py-3"
                        style={{ color: theme.textSecondary }}
                      >
                        Music AI
                      </AccordionTrigger>
                      <AccordionContent>
                        <ScrollArea 
                          className="h-[200px] w-full p-4"
                          style={{ border: `1px solid ${theme.borderLight}` }}
                        >
                          <p className="text-sm" style={{ color: theme.text }}>
                            <span style={{ color: theme.accent }}>Model:</span> {song.music_model_used}
                          </p>
                          <p className="mt-3 text-sm" style={{ color: theme.accent }}>Prompt:</p>
                          <p className="text-sm font-light" style={{ color: theme.textSecondary }}>{song.music_ai_prompt}</p>
                        </ScrollArea>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </div>
            )}

            {/* Bible Info Card */}
            <div 
              className="md:col-span-2 xl:col-span-8 p-6"
              style={{ 
                backgroundColor: theme.bgCard,
                border: `1px solid ${theme.border}`
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 
                  className="text-xl tracking-wide"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  Bible Info
                </h2>
                {isCreator && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsBibleInfoEditDialogOpen(true)}
                    className="p-2 transition-colors"
                    style={{ color: theme.textSecondary }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
                  >
                    <Pencil className="h-4 w-4" />
                  </motion.button>
                )}
              </div>

              <Accordion type="single" collapsible defaultValue="verses">
                <AccordionItem 
                  value="verses" 
                  className="border-0"
                  style={{ borderBottom: `1px solid ${theme.borderLight}` }}
                >
                  <AccordionTrigger 
                    className="text-sm tracking-wider uppercase font-light py-3"
                    style={{ color: theme.textSecondary }}
                  >
                    Bible Verses Covered
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mb-4">
                      <Popover open={openTranslation} onOpenChange={setOpenTranslation}>
                        <PopoverTrigger asChild>
                          <button
                            role="combobox"
                            aria-expanded={openTranslation}
                            className="w-full py-2 px-4 flex items-center justify-between text-sm transition-colors"
                            style={{ 
                              border: `1px solid ${theme.border}`,
                              color: theme.text,
                              backgroundColor: 'transparent'
                            }}
                          >
                            {bibleInfoTranslation ? `${bibleInfoTranslation} - ${BOLLS_LIFE_API_BIBLE_TRANSLATIONS.find(t => t.shortName === bibleInfoTranslation)?.fullName}` : "Select Bible translation..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0" style={{ color: theme.textMuted }} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-full p-0 max-w-[90vw] sm:max-w-[300px]" 
                          ref={translationRef}
                          style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
                        >
                          <div className="p-2">
                            <div className="flex items-center justify-between pb-2">
                              <Input
                                placeholder="Search translations..."
                                value={translationSearch}
                                onChange={(e) => setTranslationSearch(e.target.value)}
                                className="mr-2"
                                style={{ 
                                  backgroundColor: 'transparent',
                                  border: `1px solid ${theme.border}`,
                                  color: theme.text
                                }}
                              />
                              {bibleInfoTranslation && (
                                <button
                                  onClick={() => {
                                    setBibleInfoTranslation('NASB')
                                    setTranslationSearch('')
                                  }}
                                  className="px-3 py-1 text-xs tracking-wider uppercase transition-colors"
                                  style={{ 
                                    border: `1px solid ${theme.border}`,
                                    color: theme.textSecondary
                                  }}
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            <div className="max-h-[200px] overflow-y-auto">
                              {filteredTranslations().map((translation) => (
                                <div
                                  key={translation.shortName}
                                  className="flex cursor-pointer items-center px-2 py-1 transition-colors"
                                  style={{ 
                                    backgroundColor: bibleInfoTranslation === translation.shortName ? `${theme.accent}20` : 'transparent',
                                    color: theme.text
                                  }}
                                  onClick={() => {
                                    setBibleInfoTranslation(translation.shortName)
                                    setOpenTranslation(false)
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}10`}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bibleInfoTranslation === translation.shortName ? `${theme.accent}20` : 'transparent'}
                                >
                                  <div 
                                    className="mr-2 h-4 w-4 flex-shrink-0 flex items-center justify-center"
                                    style={{ border: `1px solid ${theme.accent}` }}
                                  >
                                    {bibleInfoTranslation === translation.shortName && <Check className="h-3 w-3" style={{ color: theme.accent }} />}
                                  </div>
                                  <div className="flex-grow overflow-hidden">
                                    <span className="font-medium" style={{ color: theme.accent }}>{translation.shortName}</span>
                                    <span style={{ color: theme.textSecondary }}> - </span>
                                    <span className="text-sm break-words" style={{ color: theme.textSecondary }}>{translation.fullName}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <ScrollArea 
                      className="h-[400px] w-full p-4"
                      style={{ border: `1px solid ${theme.borderLight}` }}
                    >
                      {isLoadingBibleInfoVerses ? (
                        <div className="flex flex-col items-center justify-center h-40">
                          <BookOpen className="h-12 w-12 animate-pulse" style={{ color: theme.accent }} />
                          <p className="mt-4" style={{ color: theme.textMuted }}>Loading verses...</p>
                        </div>
                      ) : bibleInfoVerseError ? (
                        <p className="text-red-500">{bibleInfoVerseError}</p>
                      ) : (
                        bibleInfoVerses.map((verse, index) => (
                          <div key={index} className="mb-4">
                            <p className="font-medium" style={{ color: theme.accent }}>{`${verse.book} ${verse.chapter}:${verse.verse}`}</p>
                            <div className="text-sm font-light" style={{ color: theme.textSecondary }} dangerouslySetInnerHTML={renderHTML(verse.text)} />
                          </div>
                        ))
                      )}
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Lyrics Card */}
            <div 
              className="md:col-span-2 xl:col-span-12 p-6"
              style={{ 
                backgroundColor: theme.bgCard,
                border: `1px solid ${theme.border}`
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 
                  className="text-xl tracking-wide"
                  style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                >
                  Lyrics
                </h2>
                {isCreator && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsLyricsEditDialogOpen(true)}
                    className="p-2 transition-colors"
                    style={{ color: theme.textSecondary }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
                  >
                    <Pencil className="h-4 w-4" />
                  </motion.button>
                )}
              </div>

              <Accordion type="single" collapsible defaultValue="lyrics">
                <AccordionItem 
                  value="lyrics" 
                  className="border-0"
                  style={{ borderBottom: `1px solid ${theme.borderLight}` }}
                >
                  <AccordionTrigger 
                    className="text-sm tracking-wider uppercase font-light py-3"
                    style={{ color: theme.textSecondary }}
                  >
                    View Lyrics
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea 
                      className="h-[400px] w-full p-4"
                      style={{ border: `1px solid ${theme.borderLight}` }}
                    >
                      <p className="whitespace-pre-wrap text-sm font-light leading-relaxed" style={{ color: theme.textSecondary }}>{song.lyrics}</p>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </motion.div>
        </div>
      </div>

      {/* KJV Text Dialog */}
      <Dialog open={isKJVTextOpen} onOpenChange={setIsKJVTextOpen}>
        <DialogContent 
          className="sm:max-w-[600px]"
          style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Italiana', serif", color: theme.text }}>
              {dialogTranslation} Text for {formatBibleVerses(song.bible_verses || [])}
            </DialogTitle>
            <div className="mt-4">
              <Popover open={dialogOpenTranslation} onOpenChange={setDialogOpenTranslation}>
                <PopoverTrigger asChild>
                  <button
                    role="combobox"
                    aria-expanded={dialogOpenTranslation}
                    className="w-full py-2 px-4 flex items-center justify-between text-sm transition-colors"
                    style={{ 
                      border: `1px solid ${theme.border}`,
                      color: theme.text,
                      backgroundColor: 'transparent'
                    }}
                  >
                    {dialogTranslation ? `${dialogTranslation} - ${BOLLS_LIFE_API_BIBLE_TRANSLATIONS.find(t => t.shortName === dialogTranslation)?.fullName}` : "Select Bible translation..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0" style={{ color: theme.textMuted }} />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-full p-0 max-w-[90vw] sm:max-w-[300px]" 
                  ref={dialogTranslationRef}
                  style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
                >
                  <div className="p-2">
                    <div className="flex items-center justify-between pb-2">
                      <Input
                        placeholder="Search translations..."
                        value={dialogTranslationSearch}
                        onChange={(e) => setDialogTranslationSearch(e.target.value)}
                        className="mr-2"
                        style={{ 
                          backgroundColor: 'transparent',
                          border: `1px solid ${theme.border}`,
                          color: theme.text
                        }}
                      />
                      {dialogTranslation && (
                        <button
                          onClick={() => {
                            setDialogTranslation('KJV')
                            setDialogTranslationSearch('')
                          }}
                          className="px-3 py-1 text-xs tracking-wider uppercase transition-colors"
                          style={{ 
                            border: `1px solid ${theme.border}`,
                            color: theme.textSecondary
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredDialogTranslations().map((translation) => (
                        <div
                          key={translation.shortName}
                          className="flex cursor-pointer items-center px-2 py-1 transition-colors"
                          style={{ 
                            backgroundColor: dialogTranslation === translation.shortName ? `${theme.accent}20` : 'transparent',
                            color: theme.text
                          }}
                          onClick={() => {
                            setDialogTranslation(translation.shortName)
                            setDialogOpenTranslation(false)
                            setSelectedTranslation(translation.shortName)
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.accent}10`}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = dialogTranslation === translation.shortName ? `${theme.accent}20` : 'transparent'}
                        >
                          <div 
                            className="mr-2 h-4 w-4 flex-shrink-0 flex items-center justify-center"
                            style={{ border: `1px solid ${theme.accent}` }}
                          >
                            {dialogTranslation === translation.shortName && <Check className="h-3 w-3" style={{ color: theme.accent }} />}
                          </div>
                          <div className="flex-grow overflow-hidden">
                            <span className="font-medium" style={{ color: theme.accent }}>{translation.shortName}</span>
                            <span style={{ color: theme.textSecondary }}> - </span>
                            <span className="text-sm break-words" style={{ color: theme.textSecondary }}>{translation.fullName}</span>
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
                <BookOpen className="h-12 w-12 animate-pulse" style={{ color: theme.accent }} />
                <p className="mt-4" style={{ color: theme.textMuted }}>Loading verses...</p>
              </div>
            ) : verseError ? (
              <p className="text-red-500">{verseError}</p>
            ) : (
              verses.map((verse, index) => (
                <div key={index} className="mb-4">
                  <p className="font-medium" style={{ color: theme.accent }}>{`${verse.book} ${verse.chapter}:${verse.verse}`}</p>
                  <div className="text-sm font-light" style={{ color: theme.textSecondary }} dangerouslySetInnerHTML={renderHTML(verse.text)} />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Vote Dialog */}
      <Dialog open={isVoteDialogOpen} onOpenChange={setIsVoteDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px]"
          style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
        >
          <DialogHeader>
            <DialogTitle 
              className="text-center"
              style={{ fontFamily: "'Italiana', serif", color: theme.text }}
            >
              Vote for {selectedVoteType}
            </DialogTitle>
            <DialogDescription className="text-center" style={{ color: theme.textSecondary }}>
              {song.title}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
            {voteStates[selectedVoteType] !== 1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleVote('up')}
                className="w-full sm:w-auto py-2 px-4 flex items-center justify-center gap-2 text-sm tracking-[0.1em] uppercase transition-colors"
                style={{ 
                  border: `1px solid ${theme.border}`,
                  color: theme.text
                }}
              >
                <ThumbsUp className="h-4 w-4" />
                Upvote
              </motion.button>
            )}
            {voteStates[selectedVoteType] !== -1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleVote('down')}
                className="w-full sm:w-auto py-2 px-4 flex items-center justify-center gap-2 text-sm tracking-[0.1em] uppercase transition-colors"
                style={{ 
                  border: `1px solid ${theme.border}`,
                  color: theme.text
                }}
              >
                <ThumbsDown className="h-4 w-4" />
                Downvote
              </motion.button>
            )}
            {voteStates[selectedVoteType] !== 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleVote('0')}
                className="w-full sm:w-auto py-2 px-4 flex items-center justify-center gap-2 text-sm tracking-[0.1em] uppercase transition-colors"
                style={{ 
                  border: `1px solid ${theme.border}`,
                  color: theme.text
                }}
              >
                <X className="h-4 w-4" />
                Remove Vote
              </motion.button>
            )}
          </div>
          <div className="text-sm text-center mt-4" style={{ color: theme.textMuted }}>
            Your current vote: {getVoteLabel(voteStates[selectedVoteType] || 0)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Song Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px]"
          style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Italiana', serif", color: theme.text }}>Edit Song Details</DialogTitle>
            <DialogDescription style={{ color: theme.textSecondary }}>
              Make changes to the song title, artist name, and genres here.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right" style={{ color: theme.textSecondary }}>
                  Title
                </Label>
                <Input
                  id="title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="col-span-3"
                  style={{ backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.text }}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="artist" className="text-right" style={{ color: theme.textSecondary }}>
                  Artist
                </Label>
                <Input
                  id="artist"
                  value={editedArtist}
                  onChange={(e) => setEditedArtist(e.target.value)}
                  className="col-span-3"
                  style={{ backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.text }}
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="genres" className="text-right pt-2" style={{ color: theme.textSecondary }}>
                  Genres
                </Label>
                <div className="col-span-3">
                  <Popover open={openGenre} onOpenChange={setOpenGenre}>
                    <PopoverTrigger asChild>
                      <button
                        role="combobox"
                        aria-expanded={openGenre}
                        className="w-full py-2 px-4 flex items-center justify-between text-sm"
                        style={{ border: `1px solid ${theme.border}`, color: theme.text, backgroundColor: 'transparent' }}
                      >
                        {editedGenres.length > 0 ? `${editedGenres.length} selected` : "Select genres..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0" style={{ color: theme.textMuted }} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}>
                      <div className="p-2">
                        <div className="flex items-center justify-between pb-2">
                          <Input
                            placeholder="Search genres..."
                            value={genreSearch}
                            onChange={(e) => setGenreSearch(e.target.value)}
                            className="mr-2"
                            style={{ backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.text }}
                          />
                          <button onClick={clearGenres} className="px-3 py-1 text-xs uppercase" style={{ border: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                            Clear
                          </button>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredGenres().map((genre) => (
                            <div
                              key={genre}
                              className="flex cursor-pointer items-center px-2 py-1 transition-colors"
                              style={{ backgroundColor: editedGenres.includes(genre) ? `${theme.accent}20` : 'transparent', color: theme.text }}
                              onClick={() => handleGenreToggle(genre)}
                            >
                              <div className="mr-2 h-4 w-4 flex items-center justify-center" style={{ border: `1px solid ${theme.accent}` }}>
                                {editedGenres.includes(genre) && <Check className="h-3 w-3" style={{ color: theme.accent }} />}
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
                        className="px-2 py-1 text-sm flex items-center"
                        style={{ border: `1px solid ${theme.accent}40`, color: theme.accent }}
                      >
                        {genre}
                        <button className="ml-1 p-0.5" onClick={() => handleGenreToggle(genre)}>
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isEditing}
                className="py-2 px-6 text-sm tracking-[0.1em] uppercase transition-all"
                style={{ backgroundColor: theme.accent, color: isDark ? '#050505' : '#ffffff' }}
              >
                {isEditing ? 'Saving...' : 'Save changes'}
              </motion.button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Lyrics Dialog */}
      <Dialog open={isLyricsEditDialogOpen} onOpenChange={setIsLyricsEditDialogOpen}>
        <DialogContent 
          className="sm:max-w-[600px]"
          style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Italiana', serif", color: theme.text }}>Edit Lyrics</DialogTitle>
            <DialogDescription style={{ color: theme.textSecondary }}>
              Make changes to the lyrics and lyrics adherence here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lyrics" className="text-right" style={{ color: theme.textSecondary }}>
                Lyrics
              </Label>
              <Textarea
                id="lyrics"
                value={editedLyrics}
                onChange={(e) => setEditedLyrics(e.target.value)}
                className="col-span-3"
                rows={10}
                style={{ backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.text }}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lyrics-adherence" className="text-right" style={{ color: theme.textSecondary }}>
                Scripture Adherence
              </Label>
              <Select
                onValueChange={(value) => setEditedLyricsAdherence(value as 'word_for_word' | 'close_paraphrase' | 'creative_inspiration')}
                defaultValue={editedLyricsAdherence}
              >
                <SelectTrigger className="col-span-3" style={{ backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.text }}>
                  <SelectValue placeholder="Select adherence level" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}>
                  <SelectItem value="word_for_word">Word-for-word</SelectItem>
                  <SelectItem value="close_paraphrase">Close paraphrase</SelectItem>
                  <SelectItem value="creative_inspiration">Creative inspiration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLyricsEditSubmit}
              disabled={isLyricsEditing}
              className="py-2 px-6 text-sm tracking-[0.1em] uppercase transition-all"
              style={{ backgroundColor: theme.accent, color: isDark ? '#050505' : '#ffffff' }}
            >
              {isLyricsEditing ? 'Saving...' : 'Save changes'}
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit AI Info Dialog */}
      <Dialog open={isAIEditDialogOpen} onOpenChange={setIsAIEditDialogOpen}>
        <DialogContent 
          className="sm:max-w-[600px]"
          style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Italiana', serif", color: theme.text }}>Edit AI Information</DialogTitle>
            <DialogDescription style={{ color: theme.textSecondary }}>
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAIEditSubmit}
              disabled={isAIEditing}
              className="py-2 px-6 text-sm tracking-[0.1em] uppercase transition-all"
              style={{ backgroundColor: theme.accent, color: isDark ? '#050505' : '#ffffff' }}
            >
              {isAIEditing ? 'Saving...' : 'Save changes'}
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bible Info Edit Dialog */}
      <Dialog open={isBibleInfoEditDialogOpen} onOpenChange={setIsBibleInfoEditDialogOpen}>
        <DialogContent 
          className="sm:max-w-[600px]"
          style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Italiana', serif", color: theme.text }}>Edit Bible Information</DialogTitle>
            <DialogDescription style={{ color: theme.textSecondary }}>
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={selectedBibleVerses.length === 0 || isBibleInfoEditing}
              onClick={handleBibleInfoEditSubmit}
              className="py-2 px-6 text-sm tracking-[0.1em] uppercase transition-all disabled:opacity-50"
              style={{ backgroundColor: theme.accent, color: isDark ? '#050505' : '#ffffff' }}
            >
              {isBibleInfoEditing ? 'Saving...' : 'Save changes'}
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Song Art Dialog */}
      <Dialog open={isEditArtDialogOpen} onOpenChange={setIsEditArtDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px]"
          style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Italiana', serif", color: theme.text }}>Edit Song Art</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center">
            <div 
              className="mb-4 overflow-hidden"
              style={{ border: `1px solid ${theme.border}` }}
            >
              <Image
                src={song.song_art_url ? getImageUrl(song.song_art_url) : '/biblechorus-icon.png'}
                alt="Current Song Art"
                width={200}
                height={200}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReplaceClick}
              className="py-2 px-6 text-sm tracking-[0.1em] uppercase transition-all"
              style={{ backgroundColor: theme.accent, color: isDark ? '#050505' : '#ffffff' }}
            >
              Replace Image
            </motion.button>
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
        <DialogContent 
          className="sm:max-w-[600px] p-0"
          style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
        >
          <DialogHeader className="p-4">
            <DialogTitle style={{ fontFamily: "'Italiana', serif", color: theme.text }}>Crop Image</DialogTitle>
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
        <DialogContent 
          className="sm:max-w-[600px] h-[80vh] flex flex-col"
          style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Italiana', serif", color: theme.text }}>Comments</DialogTitle>
            <DialogDescription style={{ color: theme.textSecondary }}>
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