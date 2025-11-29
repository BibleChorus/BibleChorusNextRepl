import Head from 'next/head'
import Image from 'next/image'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown, X, Trash2, File as FileIcon, Info, Calendar as CalendarIcon, Upload as UploadIcon, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { format, parse, isValid } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { BIBLE_BOOKS, GENRES, AI_MUSIC_MODELS, BIBLE_TRANSLATIONS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery, QueryClientProvider, QueryClient } from 'react-query'
import axios from 'axios'
import { toast } from "sonner";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Progress } from "@/components/ui/progress"
import { ImageCropper, CropResultMetadata } from '@/components/UploadPage/ImageCropper'
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '@/components/Modal'
import UploadProgressBar from '@/components/UploadPage/UploadProgressBar';
import GradientButton from '@/components/GradientButton';
import UploadInfoDialog from '@/components/UploadPage/UploadInfoDialog';
import { useRouter } from 'next/router'
import { extractFileExtension, getExtensionFromMimeType, stripFileExtension } from '@/lib/imageUtils'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'

const MAX_AUDIO_FILE_SIZE = 200 * 1024 * 1024; // 200MB in bytes
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Update the form schema to include duration and journey fields
const formSchema = z.object({
  // Step 1: AI Info
  ai_used_for_lyrics: z.boolean(),
  music_ai_generated: z.boolean(),
  music_origin: z.enum(['human', 'ai', 'ai_cover_of_human']),
  lyric_ai_prompt: z.string().optional(),
  music_model_used: z.string().optional(),
  music_ai_prompt: z.string().optional(),

  // Step 2: Song Info
  title: z.string().min(1, "Title is required"),
  artist: z.string().optional(),
  genres: z.array(z.string()).min(1, "At least one genre is required"),
  lyrics: z.string().min(1, "Lyrics are required"),

  // Journey Song Fields
  is_journey_song: z.boolean(),
  journey_date: z.string().optional(),
  journey_song_origin: z.enum(['prior_recording', 'journal_entry', 'dream', 'testimony', 'life_milestone', 'prophetic_word', 'other']).optional(),

  // Step 3: Bible Info
  bible_translation_used: z.string().optional(),
  lyrics_scripture_adherence: z.enum([
    "word_for_word",
    "close_paraphrase",
    "creative_inspiration",
    "somewhat_connected",
    "no_connection"
  ]),
  is_continuous_passage: z.boolean(),
  bible_books: z.string().optional(),
  bible_chapters: z.record(z.string(), z.array(z.number())).optional(),
  bible_verses: z.string().optional(),

  // Step 4: Upload
  audio_file: z.instanceof(File).optional(),
  song_art_file: z.instanceof(File).optional(),

  // Include URLs after upload
  audio_url: z.string().optional(),
  song_art_url: z.string().optional(),

  // Added uploaded_by field
  uploaded_by: z.union([z.string(), z.number()]).optional(),
  duration: z.number().optional(),
}).refine((data) => {
  if (data.ai_used_for_lyrics && (!data.lyric_ai_prompt || data.lyric_ai_prompt.trim().length === 0)) {
    return false;
  }
  const musicOrigin = data.music_origin;
  if (musicOrigin === 'ai' || musicOrigin === 'ai_cover_of_human') {
    if (!data.music_model_used || data.music_model_used.trim().length === 0) {
      return false;
    }
    if (!data.music_ai_prompt || data.music_ai_prompt.trim().length === 0) {
      return false;
    }
  }
  return true;
}, {
  message: "Required fields are missing",
  path: ["lyric_ai_prompt", "music_model_used", "music_ai_prompt"],
}).refine((data) => {
  if (data.lyrics_scripture_adherence !== 'no_connection') {
    if (!data.bible_translation_used || data.bible_translation_used.trim().length === 0) {
      return false;
    }
    if (!data.bible_books || data.bible_books.trim().length === 0) {
      return false;
    }
    if (!data.bible_verses || data.bible_verses.trim().length === 0) {
      return false;
    }
  }
  return true;
}, {
  message: "Bible information is required for scripture-connected songs",
  path: ["bible_translation_used", "bible_books", "bible_verses"],
});

// Create a client
const queryClient = new QueryClient()

function Upload() {
  return (
    <QueryClientProvider client={queryClient}>
      <UploadContent />
    </QueryClientProvider>
  )
}

function UploadContent() {
  console.log("Upload component rendered");

  const { user } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

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
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    borderAccent: isDark ? 'rgba(212, 175, 55, 0.5)' : 'rgba(191, 161, 48, 0.5)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    inputBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    selection: isDark ? '#ffffff' : '#161616',
    selectionText: isDark ? '#000000' : '#ffffff',
    success: '#22c55e',
    error: '#ef4444',
  };

  // Move all hooks and state declarations to the top level
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cropperMaxHeight, setCropperMaxHeight] = useState<number>(0);

  // State hooks
  const [openGenre, setOpenGenre] = useState(false);
  const [openTranslation, setOpenTranslation] = useState(false);
  const [genreSearch, setGenreSearch] = useState('');
  const [translationSearch, setTranslationSearch] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTranslation, setSelectedTranslation] = useState<string>('');
  const [showValidationMessages, setShowValidationMessages] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [audioUploadStatus, setAudioUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [imageUploadStatus, setImageUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [hasShownValidMessage, setHasShownValidMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openChapters, setOpenChapters] = useState(false);
  const [chapterSearch, setChapterSearch] = useState('');
  const [openBibleVerses, setOpenBibleVerses] = useState(false);
  const [bibleVerseSearch, setBibleVerseSearch] = useState('');
  const [selectedBibleVerses, setSelectedBibleVerses] = useState<string[]>([]);

  // Add the remaining useState hooks
  const [openBibleBooks, setOpenBibleBooks] = useState(false);
  const [bibleBookSearch, setBibleBookSearch] = useState('');
  const [selectedBibleBooks, setSelectedBibleBooks] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<{[book: string]: number[]}>({});

  // Song type state for journey songs
  const [songType, setSongType] = useState<'scripture' | 'journey' | 'both'>('scripture');
  const [journeyDate, setJourneyDate] = useState<Date | undefined>(new Date());
  const [journeyDateInput, setJourneyDateInput] = useState<string>(format(new Date(), "MM/dd/yyyy"));

  // Refs
  const genreRef = useRef<HTMLDivElement>(null);
  const translationRef = useRef<HTMLDivElement>(null);
  const bibleVerseRef = useRef<HTMLDivElement>(null);
  const bibleBookRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ai_used_for_lyrics: true,
      music_ai_generated: true,
      music_origin: 'ai',
      is_continuous_passage: false,
      music_model_used: undefined,
      music_ai_prompt: undefined,
      title: "",
      artist: "",
      lyrics: "",
      genres: [],
      duration: undefined,
      is_journey_song: false,
      journey_date: undefined,
      journey_song_origin: undefined,
      lyrics_scripture_adherence: undefined,
    },
    mode: "onBlur",
  });

  // Form watchers
  const watchAiUsedForLyrics = form.watch("ai_used_for_lyrics");
  const watchScriptureAdherence = form.watch("lyrics_scripture_adherence");
  const watchMusicOrigin = form.watch("music_origin");

  // Move useMemo hooks here, outside of any conditional statements
  const filteredGenres = useMemo(() => {
    return GENRES.filter(genre =>
      genre.toLowerCase().includes(genreSearch.toLowerCase())
    )
  }, [genreSearch])

  const filteredTranslations = useMemo(() => {
    return BIBLE_TRANSLATIONS.filter(translation =>
      translation.toLowerCase().includes(translationSearch.toLowerCase())
    )
  }, [translationSearch])

  // Add the filteredBibleBooks hook
  const filteredBibleBooks = useCallback(() => {
    return BIBLE_BOOKS.filter(book =>
      book.toLowerCase().includes(bibleBookSearch.toLowerCase())
    )
  }, [bibleBookSearch])

  // Replace the existing useQuery hook with this:

  const {
    data: availableChapters,
    isLoading: isLoadingChapters
  } = useQuery(
    ['chapters', selectedBibleBooks],
    async () => {
      if (selectedBibleBooks.length === 0) return {}
      const response = await axios.get('/api/chapters', {
        params: { books: selectedBibleBooks.join(',') }
      })
      return response.data
    },
    {
      enabled: selectedBibleBooks.length > 0,
      // Add a select function to handle the case when selectedBibleBooks is empty
      select: (data) => selectedBibleBooks.length === 0 ? {} : data
    }
  )

  // Then update the filteredChapters function:

  const filteredChapters = useCallback(() => {
    if (!availableChapters || Object.keys(availableChapters).length === 0) return {}
    return Object.entries(availableChapters).reduce((acc, [book, chapters]) => {
      acc[book] = (chapters as number[]).filter(chapter => 
        chapter.toString().includes(chapterSearch)
      )
      return acc
    }, {} as Record<string, number[]>)
  }, [availableChapters, chapterSearch])

  const handleChapterToggle = (book: string, chapter: number) => {
    setSelectedChapters(prev => {
      const bookChapters = prev[book] || []
      if (bookChapters.includes(chapter)) {
        return { ...prev, [book]: bookChapters.filter(ch => ch !== chapter) }
      } else {
        return { ...prev, [book]: [...bookChapters, chapter].sort((a, b) => a - b) }
      }
    })
  }

  const clearChapters = () => {
    setSelectedChapters({})
  }

  // Update the useQuery hook for fetching Bible verses
  const { data: bibleVerses, isLoading } = useQuery(
    ['bibleVerses', selectedBibleBooks, selectedChapters],
    async () => {
      if (selectedBibleBooks.length === 0) return {};
      const verses = await Promise.all(
        selectedBibleBooks.flatMap(book => 
          (selectedChapters[book] || []).map(chapter => 
            axios.get('/api/bible-verses', { params: { book, chapter } })
          )
        )
      );
      return verses.reduce((acc, response) => {
        const verses = response.data;
        if (verses.length > 0) {
          const book = verses[0].book;
          const chapter = verses[0].chapter;
          if (!acc[book]) acc[book] = {};
          acc[book][chapter] = verses;
        }
        return acc;
      }, {} as Record<string, Record<number, any[]>>);
    },
    { enabled: selectedBibleBooks.length > 0 && Object.keys(selectedChapters).length > 0 }
  );

  // Update the filteredBibleVerses function
  const filteredBibleVerses = useCallback(() => {
    if (!bibleVerses) return {};
    return Object.entries(bibleVerses).reduce((acc, [book, chapters]) => {
      acc[book] = Object.entries(chapters).reduce((chapterAcc, [chapter, verses]) => {
        chapterAcc[chapter] = verses.filter((verse: any) =>
          `${verse.book} ${verse.chapter}:${verse.verse}`.toLowerCase().includes(bibleVerseSearch.toLowerCase())
        );
        return chapterAcc;
      }, {} as Record<string, any[]>);
      return acc;
    }, {} as Record<string, Record<string, any[]>>);
  }, [bibleVerses, bibleVerseSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(event.target as Node)) {
        setOpenGenre(false)
      }
      if (translationRef.current && !translationRef.current.contains(event.target as Node)) {
        setOpenTranslation(false)
      }
      if (bibleBookRef.current && !bibleBookRef.current.contains(event.target as Node)) {
        setOpenBibleBooks(false)
      }
      if (bibleVerseRef.current && !bibleVerseRef.current.contains(event.target as Node)) {
        setOpenBibleVerses(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleBibleVerseToggle = (verse: string) => {
    let updatedVerses: string[];
    if (selectedBibleVerses.includes(verse)) {
      updatedVerses = selectedBibleVerses.filter(v => v !== verse);
    } else {
      updatedVerses = [...selectedBibleVerses, verse];
    }
    setSelectedBibleVerses(updatedVerses);
    form.setValue('bible_verses', updatedVerses.join(', '), { shouldValidate: true });
    
    const isContinuous = areVersesContinuous(updatedVerses);
    form.setValue('is_continuous_passage', isContinuous, { shouldValidate: true });
  };

  // Effects
  useEffect(() => {
    if (!user) {
      toast.error("You need to be logged in to upload a song.", {
        duration: 5000,
        action: {
          label: "Login",
          onClick: () => router.push('/login?view=login'),
        },
      });
      router.push('/login?view=login');
    }
  }, [user, router]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (uploadedFiles.length > 0) {
        const data = JSON.stringify({ fileKeys: uploadedFiles });
        navigator.sendBeacon('/api/cleanup-unsubmitted-files', data);
        console.log('Sending cleanup request for files:', uploadedFiles);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [uploadedFiles]);

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

  useEffect(() => {
    console.log("Setting up form subscription");
    const subscription = form.watch(() => {
      console.log("Form changed");
      console.log("Form state:", form.formState);
      console.log("Is form valid?", form.formState.isValid);
      console.log("Form errors:", form.formState.errors);
    });

    return () => {
      console.log("Cleaning up form subscription");
      subscription.unsubscribe();
    };
  }, [form]);

  useEffect(() => {
    if (!watchAiUsedForLyrics) {
      form.setValue("lyric_ai_prompt", "");
    }
    form.trigger("lyric_ai_prompt");
  }, [watchAiUsedForLyrics, form]);
  
  // Move this useEffect outside of any conditional statements
  useEffect(() => {
    if (watchScriptureAdherence === "word_for_word" && watchAiUsedForLyrics) {
      form.setValue("ai_used_for_lyrics", false);
      toast.info("AI used for lyrics has been set to No as Word-for-word adherence was selected.", {
        duration: 5000,
        action: {
          label: "Close",
          onClick: () => toast.dismiss(),
        },
      });
    }
  }, [watchScriptureAdherence, watchAiUsedForLyrics, form]);

  useEffect(() => {
    if (selectedBibleVerses.length > 0) {
      const isContinuous = areVersesContinuous(selectedBibleVerses);
      form.setValue('is_continuous_passage', isContinuous, { shouldValidate: true });
    }
  }, [selectedBibleVerses, form]);

  if (!user) {
    return null // or a loading spinner if you prefer
  }

  const handleGenreToggle = (genre: string) => {
    let updatedGenres: string[];
    if (selectedGenres.includes(genre)) {
      updatedGenres = selectedGenres.filter(g => g !== genre);
    } else {
      updatedGenres = [...selectedGenres, genre];
    }
    setSelectedGenres(updatedGenres);
    form.setValue('genres', updatedGenres, { shouldValidate: true });
  }

  const clearGenres = () => {
    setSelectedGenres([]);
    form.setValue('genres', [], { shouldValidate: true });
  }

  const uploadFile = async (file: File, fileType: 'audio' | 'image') => {
    const fileExtension = file.name.split('.').pop();
    const contentType = file.type;
    const setProgress = fileType === 'audio' ? setAudioUploadProgress : setImageUploadProgress;
    const setStatus = fileType === 'audio' ? setAudioUploadStatus : setImageUploadStatus;

    // Check file size
    const maxSize = fileType === 'audio' ? MAX_AUDIO_FILE_SIZE : MAX_IMAGE_FILE_SIZE;
    if (file.size > maxSize) {
      const sizeInMB = maxSize / (1024 * 1024);
      toast.error(`File size exceeds the limit of ${sizeInMB}MB`);
      setStatus('error');
      return;
    }

    // Retrieve the title from the form
    const title = form.getValues("title") || file.name.split('.')[0];

    try {
      setStatus('uploading');
      // Include title and fileSize in the upload-url request
      const { data } = await axios.post('/api/upload-url', {
        fileType: file.type,
        fileExtension,
        title,
        userId: user?.id,
        fileSize: file.size,
      });

      console.log('Received signed URL:', data.signedUrl); // Add this line for debugging

      // Upload the file to S3
      const uploadResponse = await axios.put(data.signedUrl, file, {
        headers: {
          'Content-Type': contentType,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
          setProgress(percentCompleted);
        },
      });

      console.log('S3 upload response:', uploadResponse); // Add this line for debugging

      if (uploadResponse.status !== 200) {
        throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
      }

      setStatus('success');
      setUploadedFiles(prev => [...prev, data.fileKey]);
      console.log('File uploaded:', data.fileKey);

      // Set the corresponding form field
      if (fileType === 'audio') {
        form.setValue('audio_url', data.fileKey, { shouldValidate: false });
      } else if (fileType === 'image') {
        form.setValue('song_art_url', data.fileKey, { shouldValidate: false });
      }

      // Update this part
      // Get audio duration only if the file is an audio file
      if (fileType === 'audio') {
        // Create a temporary audio element to get duration without loading entire file
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(file);
        
        audio.addEventListener('loadedmetadata', () => {
          const duration = audio.duration;
          setAudioDuration(duration);
          console.log("Audio duration:", duration);
          // Clean up the object URL to free memory
          URL.revokeObjectURL(objectUrl);
        });
        
        audio.addEventListener('error', (e) => {
          console.error('Error loading audio metadata:', e);
          // Clean up the object URL even on error
          URL.revokeObjectURL(objectUrl);
        });
        
        audio.src = objectUrl;
      }

      return data.fileKey;
    } catch (error) {
      console.error('Error uploading file:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.response?.data);
      }
      setStatus('error');
      toast.error(`Upload failed: ${error.message}`);
      throw error;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Modify audio_url and song_art_url to use Cloudfront CDN
      const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
      const audioUrl = values.audio_url ? `${cdnUrl}${values.audio_url}` : undefined;
      const songArtUrl = values.song_art_url ? `${cdnUrl}${values.song_art_url}` : undefined;

      const formData = {
        ...values,
        audio_url: audioUrl,
        song_art_url: songArtUrl,
        uploaded_by: user?.id,
        duration: audioDuration ? Math.round(audioDuration) : undefined, // Add this line
      };

      // Send the form data to your backend
      const response = await axios.post('/api/submit-song', formData);

      if (response.status === 200 && response.data.songId) {
        toast.success('Song uploaded successfully!');
        setUploadedFiles([]);
        console.log('Form submitted, clearing uploaded files list');
        setHasShownValidMessage(false);
        router.push(`/Songs/${response.data.songId}`); // Redirect to the new song's page
      } else {
        throw new Error('Failed to submit song or get song ID');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error uploading song. Please try again.');
    }
  };

  // Add this debug function
  const debugForm = () => {
    console.log("Current form state:", form.formState);
    console.log("Current form values:", form.getValues());
    console.log("Is form valid?", form.formState.isValid);
    console.log("Form errors:", form.formState.errors);
    toast.info(`Form is ${form.formState.isValid ? 'valid' : 'invalid'}`);
  };

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit button clicked");
    setShowValidationMessages(true);
    
    const isValid = await form.trigger();
    console.log("Manual validation triggered, isValid:", isValid);
    console.log("Form values:", form.getValues());
    console.log("Form errors:", form.formState.errors);
    
    if (isValid) {
      console.log("Form is valid, submitting...");
      const formData = form.getValues();
      
      // Round the duration to the nearest integer
      formData.duration = audioDuration ? Math.round(audioDuration) : undefined;
      
      // Ensure genres is an array
      if (!Array.isArray(formData.genres)) {
        formData.genres = selectedGenres;
      }
      
      // Remove file objects and use URLs instead
      delete formData.audio_file;
      delete formData.song_art_file;

      // Check if audio_url is present
      if (!formData.audio_url) {
        toast.error('Please upload an audio file before submitting.');
        return;
      }

      // Add the uploaded_by field
      if (user && user.id) {
        formData.uploaded_by = user.id;
      } else {
        toast.error('User not authenticated. Please log in and try again.');
        return;
      }

      // Set is_journey_song based on songType
      formData.is_journey_song = songType === 'journey' || songType === 'both';
      
      // Include journey date if set
      if (journeyDate && (songType === 'journey' || songType === 'both')) {
        formData.journey_date = format(journeyDate, 'yyyy-MM-dd');
      }
      
      // Keep music_ai_generated for backward compatibility (derive from music_origin)
      formData.music_ai_generated = formData.music_origin === 'ai' || formData.music_origin === 'ai_cover_of_human';
      
      console.log("Submitting form data:", formData);
      setIsSubmitting(true);
      try {
        const response = await axios.post('/api/submit-song', formData);
        console.log("Server response:", response.data);
        if (response.status === 200 && response.data.songId) {
          toast.success('Song uploaded successfully!');
          setUploadedFiles([]);
          setHasShownValidMessage(false);
          router.push(`/Songs/${response.data.songId}`); // Redirect to the new song's page
        } else {
          throw new Error('Failed to submit song or get song ID');
        }
      } catch (error) {
        console.error("Error submitting form:", error.response?.data || error.message);
        if (error.response?.data?.missingFields) {
          const missingFieldsMessage = `Missing fields: ${error.response.data.missingFields.join(', ')}`;
          toast.error(missingFieldsMessage);
        } else {
          toast.error('Error uploading song. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log("Form is not valid, errors:", form.formState.errors);
      Object.entries(form.formState.errors).forEach(([key, value]) => {
        console.log(`Error in field ${key}:`, value);
      });
      toast.error("Please fill in all required fields correctly.");
    }
  };

  const steps = ["Song Type", "AI Info", "Song Info", "Bible Info", "Upload"]

  const handleAILyricsChange = (checked: boolean) => {
    if (watchScriptureAdherence === "word_for_word") {
      toast.info("Cannot enable AI for lyrics when Word-for-word adherence is selected.", {
        duration: 5000,
        action: {
          label: "Close",
          onClick: () => toast.dismiss(),
        },
      });
    } else {
      form.setValue("ai_used_for_lyrics", checked);
      if (!checked) {
        form.setValue("lyric_ai_prompt", "", { shouldValidate: true });
      } else {
        form.trigger("lyric_ai_prompt");
      }
    }
  };

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
    form.setValue('bible_books', updatedBooks.join(', '), { shouldValidate: true });
  }

  const clearBibleBooks = () => {
    setSelectedBibleBooks([]);
    setSelectedChapters({});
    form.setValue('bible_books', '', { shouldValidate: true });
  }

  const clearBibleVerses = () => {
    setSelectedBibleVerses([]);
    form.setValue('bible_verses', '', { shouldValidate: true });
  }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault(); // Prevent form submission
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCropImageUrl(imageUrl);
      setIsModalOpen(true);
      setPendingImageFile(file);
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob, metadata?: CropResultMetadata) => {
    const mimeType = metadata?.mimeType || croppedImageBlob.type || pendingImageFile?.type || 'image/jpeg'
    const suggestedName = metadata?.suggestedFileName
    const fallbackBase = pendingImageFile?.name ? stripFileExtension(pendingImageFile.name) : `cropped-image-${Date.now()}`
    const extension = suggestedName ? extractFileExtension(suggestedName) ?? getExtensionFromMimeType(mimeType) : getExtensionFromMimeType(mimeType)
    const fileName = suggestedName || `${fallbackBase}.${extension}`
    const croppedFile = new File([croppedImageBlob], fileName, { type: mimeType })
    setCroppedImage(croppedFile)
    setIsModalOpen(false)

    // Set the cropped image file in the form values
    form.setValue('song_art_file', croppedFile)

    setImageUploadStatus('uploading')
    setImageUploadProgress(0)
    try {
      await uploadFile(croppedFile, 'image')
      setImageUploadStatus('success')
    } catch (error) {
      setImageUploadStatus('error')
    }

    setPendingImageFile(null)
  }

  const handleCropCancel = () => {
    setCropImageUrl(null)
    setIsModalOpen(false)
    setPendingImageFile(null)
  }

  // Add this helper function to format the duration
  function formatDuration(durationInSeconds: number): string {
    const totalSeconds = Math.floor(durationInSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  if (!mounted) {
    return (
      <>
        <Head>
          <title>BibleChorus - Upload Songs</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="min-h-screen opacity-0" style={{ fontFamily: "'Manrope', sans-serif" }} />
      </>
    );
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
      <style jsx global>{`
        html, body {
          background-color: ${theme.bg} !important;
        }
        
        .upload-input {
          background-color: ${theme.inputBg} !important;
          border-color: ${theme.border} !important;
          color: ${theme.text} !important;
        }
        
        .upload-input:focus {
          border-color: ${theme.borderAccent} !important;
          box-shadow: 0 0 0 1px ${theme.borderHover} !important;
        }
        
        .upload-input::placeholder {
          color: ${theme.textMuted} !important;
        }
        
        .upload-card {
          background-color: ${theme.bgCard} !important;
          border-color: ${theme.border} !important;
        }
        
        .upload-label {
          color: ${theme.text} !important;
          font-family: 'Italiana', serif !important;
        }
        
        .upload-description {
          color: ${theme.textSecondary} !important;
        }
      `}</style>
      
      <Head>
        <title>BibleChorus - Upload Songs</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center mb-8 pt-8 sm:pt-12"
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 flex items-center justify-center"
              style={{ border: `1px solid ${theme.border}` }}
            >
              <UploadIcon className="w-5 h-5" style={{ color: theme.accent }} />
            </div>
            <div>
              <h1 
                className="text-3xl sm:text-4xl tracking-tight"
                style={{ fontFamily: "'Italiana', serif", color: theme.text }}
              >
                Upload Songs
              </h1>
              <p 
                className="text-sm mt-1"
                style={{ color: theme.textSecondary }}
              >
                Share your scripture songs with the community
              </p>
            </div>
            <UploadInfoDialog theme={theme} />
          </div>
          {progress === 100 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-12 px-8 rounded-none text-xs tracking-[0.2em] uppercase font-medium transition-all duration-300"
                style={{
                  backgroundColor: theme.accent,
                  color: isDark ? '#050505' : '#ffffff',
                  border: 'none',
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Song'}
              </Button>
            </motion.div>
          )}
        </motion.div>
        
        <FormProvider {...form}>
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            <UploadProgressBar onProgressChange={setProgress} theme={theme} />
            
            <Tabs value={steps[currentStep]} className="w-full">
              <TabsList 
                className="grid w-full grid-cols-5 h-auto p-1 rounded-none"
                style={{ 
                  backgroundColor: theme.bgCard,
                  border: `1px solid ${theme.border}`
                }}
              >
                {steps.map((step, index) => (
                  <TabsTrigger
                    key={step}
                    value={step}
                    onClick={() => setCurrentStep(index)}
                    className="text-xs sm:text-sm py-3 rounded-none transition-all duration-300 data-[state=active]:shadow-none"
                    style={{ 
                      color: currentStep === index ? theme.accent : theme.textSecondary,
                      backgroundColor: currentStep === index ? theme.hoverBg : 'transparent',
                      borderBottom: currentStep === index ? `2px solid ${theme.accent}` : '2px solid transparent',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    {step}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="Song Type">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div 
                    className="rounded-none p-6"
                    style={{ 
                      backgroundColor: theme.bgCard,
                      border: `1px solid ${theme.border}`
                    }}
                  >
                    <FormLabel 
                      className="text-lg mb-6 block tracking-wide"
                      style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                    >
                      What type of song is this?
                    </FormLabel>
                    <RadioGroup
                      value={songType}
                      onValueChange={(value: 'scripture' | 'journey' | 'both') => {
                        setSongType(value);
                        form.setValue('is_journey_song', value === 'journey' || value === 'both');
                        if (value === 'journey') {
                          form.setValue('lyrics_scripture_adherence', 'no_connection');
                        }
                      }}
                      className="space-y-4"
                    >
                      <div 
                        className="flex items-start space-x-4 rounded-none p-5 cursor-pointer transition-all duration-300"
                        style={{ 
                          border: `1px solid ${songType === 'scripture' ? theme.borderAccent : theme.border}`,
                          backgroundColor: songType === 'scripture' ? theme.hoverBg : 'transparent'
                        }}
                      >
                        <RadioGroupItem value="scripture" id="scripture" className="mt-1" style={{ borderColor: theme.accent }} />
                        <label htmlFor="scripture" className="cursor-pointer flex-1">
                          <div className="font-medium" style={{ color: theme.text }}>Scripture Song</div>
                          <div className="text-sm mt-1" style={{ color: theme.textSecondary }}>
                            A song directly based on Bible verses. The lyrics are derived from or closely follow specific scripture passages.
                          </div>
                        </label>
                      </div>
                      <div 
                        className="flex items-start space-x-4 rounded-none p-5 cursor-pointer transition-all duration-300"
                        style={{ 
                          border: `1px solid ${songType === 'journey' ? theme.borderAccent : theme.border}`,
                          backgroundColor: songType === 'journey' ? theme.hoverBg : 'transparent'
                        }}
                      >
                        <RadioGroupItem value="journey" id="journey" className="mt-1" style={{ borderColor: theme.accent }} />
                        <label htmlFor="journey" className="cursor-pointer flex-1">
                          <div className="font-medium" style={{ color: theme.text }}>Journey Song</div>
                          <div className="text-sm mt-1" style={{ color: theme.textSecondary }}>
                            A song from your Christian journey that may or may not have a direct scripture connection. This could be inspired by a dream, testimony, life milestone, or personal experience.
                          </div>
                        </label>
                      </div>
                      <div 
                        className="flex items-start space-x-4 rounded-none p-5 cursor-pointer transition-all duration-300"
                        style={{ 
                          border: `1px solid ${songType === 'both' ? theme.borderAccent : theme.border}`,
                          backgroundColor: songType === 'both' ? theme.hoverBg : 'transparent'
                        }}
                      >
                        <RadioGroupItem value="both" id="both" className="mt-1" style={{ borderColor: theme.accent }} />
                        <label htmlFor="both" className="cursor-pointer flex-1">
                          <div className="font-medium" style={{ color: theme.text }}>Both Scripture & Journey</div>
                          <div className="text-sm mt-1" style={{ color: theme.textSecondary }}>
                            A song that is both scripture-based and part of your personal journey. It combines Biblical text with your testimony or life experience.
                          </div>
                        </label>
                      </div>
                    </RadioGroup>
                  </div>

                  {(songType === 'journey' || songType === 'both') && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="rounded-none p-6 space-y-6"
                      style={{ 
                        backgroundColor: theme.bgCard,
                        border: `1px solid ${theme.border}`
                      }}
                    >
                      <FormLabel 
                        className="text-lg block tracking-wide"
                        style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                      >
                        Journey Details
                      </FormLabel>
                      
                      <FormField
                        control={form.control}
                        name="journey_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>When did this song originate?</FormLabel>
                            <div className="flex gap-2">
                              <Input
                                type="text"
                                placeholder="MM/DD/YYYY"
                                value={journeyDateInput}
                                onChange={(e) => {
                                  setJourneyDateInput(e.target.value);
                                }}
                                onBlur={(e) => {
                                  const value = e.target.value;
                                  if (!value) {
                                    setJourneyDate(undefined);
                                    setJourneyDateInput("");
                                    field.onChange(undefined);
                                    return;
                                  }
                                  const parsed = parse(value, "MM/dd/yyyy", new Date());
                                  if (isValid(parsed) && parsed <= new Date() && parsed.getFullYear() >= 1950) {
                                    setJourneyDate(parsed);
                                    setJourneyDateInput(format(parsed, "MM/dd/yyyy"));
                                    field.onChange(format(parsed, 'yyyy-MM-dd'));
                                  } else {
                                    if (journeyDate) {
                                      setJourneyDateInput(format(journeyDate, "MM/dd/yyyy"));
                                    } else {
                                      setJourneyDateInput("");
                                    }
                                  }
                                }}
                                className="flex-1"
                              />
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                  >
                                    <CalendarIcon className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                  <Calendar
                                    mode="single"
                                    selected={journeyDate}
                                    onSelect={(date) => {
                                      setJourneyDate(date);
                                      setJourneyDateInput(date ? format(date, "MM/dd/yyyy") : "");
                                      field.onChange(date ? format(date, 'yyyy-MM-dd') : undefined);
                                    }}
                                    disabled={(date) => date > new Date()}
                                    captionLayout="dropdown-buttons"
                                    fromYear={1950}
                                    toYear={new Date().getFullYear()}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <FormDescription>
                              Type a date (MM/DD/YYYY) or use the calendar. Pick when this song was first created or when the inspiration occurred.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="journey_song_origin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What inspired this song?</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select the inspiration for this song" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="prior_recording">A previously written song</SelectItem>
                                <SelectItem value="journal_entry">A journal entry</SelectItem>
                                <SelectItem value="dream">A dream</SelectItem>
                                <SelectItem value="testimony">A testimony</SelectItem>
                                <SelectItem value="life_milestone">A life milestone</SelectItem>
                                <SelectItem value="prophetic_word">A prayer or prophetic utterance</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="AI Info">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="ai_used_for_lyrics"
                    render={({ field }) => (
                      <FormItem 
                        className="flex flex-col space-y-4 rounded-none p-6"
                        style={{ 
                          backgroundColor: theme.bgCard,
                          border: `1px solid ${theme.border}`
                        }}
                      >
                        <div className="flex flex-row items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel 
                              className="text-base tracking-wide"
                              style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                            >
                              AI Used for Lyrics
                            </FormLabel>
                            <FormDescription style={{ color: theme.textSecondary }}>
                              Was AI used to generate the lyrics?
                            </FormDescription>
                          </div>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={handleAILyricsChange}
                                    disabled={watchScriptureAdherence === "word_for_word"}
                                    className="data-[state=checked]:bg-[#d4af37]"
                                  />
                                </FormControl>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent 
                              className="w-80 rounded-none"
                              style={{ 
                                backgroundColor: theme.bgCard,
                                border: `1px solid ${theme.border}`,
                                color: theme.textSecondary
                              }}
                            >
                              {watchScriptureAdherence === "word_for_word" ? (
                                <p>Cannot enable AI for lyrics when Word-for-word adherence is selected.</p>
                              ) : (
                                <p>Toggle to indicate if AI was used to generate the lyrics.</p>
                              )}
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                        {field.value && (
                          <FormField
                            control={form.control}
                            name="lyric_ai_prompt"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel style={{ color: theme.text }}>AI Lyric Prompt</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter the prompt used to generate the lyrics"
                                    className="resize-none upload-input rounded-none min-h-[100px]"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      if (showValidationMessages) {
                                        form.trigger("lyric_ai_prompt");
                                      }
                                    }}
                                  />
                                </FormControl>
                                {showValidationMessages && <FormMessage />}
                              </FormItem>
                            )}
                          />
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="music_origin"
                    render={({ field }) => (
                      <FormItem 
                        className="flex flex-col space-y-4 rounded-none p-6"
                        style={{ 
                          backgroundColor: theme.bgCard,
                          border: `1px solid ${theme.border}`
                        }}
                      >
                        <div className="space-y-1">
                          <FormLabel 
                            className="text-base tracking-wide"
                            style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                          >
                            Music Origin
                          </FormLabel>
                          <FormDescription style={{ color: theme.textSecondary }}>
                            How was the music for this song created?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value);
                              const isAI = value === 'ai' || value === 'ai_cover_of_human';
                              form.setValue("music_ai_generated", isAI, { shouldValidate: true });
                              if (!isAI) {
                                form.setValue("music_model_used", "", { shouldValidate: true });
                                form.setValue("music_ai_prompt", "", { shouldValidate: true });
                              } else {
                                form.trigger("music_model_used");
                                form.trigger("music_ai_prompt");
                              }
                            }}
                            value={field.value}
                            className="space-y-3"
                          >
                            <div 
                              className="flex items-center space-x-3 p-3 cursor-pointer transition-all duration-300"
                              style={{ 
                                border: `1px solid ${field.value === 'human' ? theme.borderAccent : theme.border}`,
                                backgroundColor: field.value === 'human' ? theme.hoverBg : 'transparent'
                              }}
                            >
                              <RadioGroupItem value="human" id="music-human" style={{ borderColor: theme.accent }} />
                              <label htmlFor="music-human" className="cursor-pointer" style={{ color: theme.text }}>Human Performance</label>
                            </div>
                            <div 
                              className="flex items-center space-x-3 p-3 cursor-pointer transition-all duration-300"
                              style={{ 
                                border: `1px solid ${field.value === 'ai' ? theme.borderAccent : theme.border}`,
                                backgroundColor: field.value === 'ai' ? theme.hoverBg : 'transparent'
                              }}
                            >
                              <RadioGroupItem value="ai" id="music-ai" style={{ borderColor: theme.accent }} />
                              <label htmlFor="music-ai" className="cursor-pointer" style={{ color: theme.text }}>AI Generated</label>
                            </div>
                            <div 
                              className="flex items-center space-x-3 p-3 cursor-pointer transition-all duration-300"
                              style={{ 
                                border: `1px solid ${field.value === 'ai_cover_of_human' ? theme.borderAccent : theme.border}`,
                                backgroundColor: field.value === 'ai_cover_of_human' ? theme.hoverBg : 'transparent'
                              }}
                            >
                              <RadioGroupItem value="ai_cover_of_human" id="music-ai-cover" style={{ borderColor: theme.accent }} />
                              <label htmlFor="music-ai-cover" className="cursor-pointer" style={{ color: theme.text }}>AI Cover of Human Original</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      {(watchMusicOrigin === 'ai' || watchMusicOrigin === 'ai_cover_of_human') && (
                        <>
                          <FormField
                            control={form.control}
                            name="music_model_used"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>AI Music Model</FormLabel>
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    if (showValidationMessages) {
                                      form.trigger("music_model_used");
                                    }
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select AI music model" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {AI_MUSIC_MODELS.map((model) => (
                                      <SelectItem key={model} value={model}>
                                        {model}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {showValidationMessages && <FormMessage />}
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="music_ai_prompt"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>AI Music Prompt</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter the prompt used to generate the music"
                                    className="resize-none"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      if (showValidationMessages) {
                                        form.trigger("music_ai_prompt");
                                      }
                                    }}
                                  />
                                </FormControl>
                                {showValidationMessages && <FormMessage />}
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </FormItem>
                  )}
                />
                </motion.div>
              </TabsContent>

              <TabsContent value="Song Info">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem 
                        className="rounded-none p-6"
                        style={{ 
                          backgroundColor: theme.bgCard,
                          border: `1px solid ${theme.border}`
                        }}
                      >
                        <FormLabel 
                          className="text-base tracking-wide"
                          style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                        >
                          Song Title
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter song title" 
                            {...field} 
                            value={field.value || ""}
                            className="upload-input rounded-none mt-2"
                          />
                        </FormControl>
                        <FormMessage className="form-message" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="artist"
                    render={({ field }) => (
                      <FormItem 
                        className="rounded-none p-6"
                        style={{ 
                          backgroundColor: theme.bgCard,
                          border: `1px solid ${theme.border}`
                        }}
                      >
                        <FormLabel 
                          className="text-base tracking-wide"
                          style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                        >
                          Artist (optional)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter artist name" 
                            {...field} 
                            value={field.value || ""}
                            className="upload-input rounded-none mt-2"
                          />
                        </FormControl>
                        <FormMessage className="form-message" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="genres"
                    render={({ field }) => (
                      <FormItem 
                        className="flex flex-col rounded-none p-6"
                        style={{ 
                          backgroundColor: theme.bgCard,
                          border: `1px solid ${theme.border}`
                        }}
                      >
                        <FormLabel 
                          className="text-base tracking-wide"
                          style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                        >
                          Genre(s)
                        </FormLabel>
                        <Popover open={openGenre} onOpenChange={setOpenGenre}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openGenre}
                                className="w-full justify-between rounded-none mt-2 upload-input"
                                style={{ 
                                  backgroundColor: theme.inputBg,
                                  borderColor: theme.border,
                                  color: selectedGenres.length > 0 ? theme.text : theme.textMuted
                                }}
                              >
                                {selectedGenres.length > 0
                                  ? `${selectedGenres.length} selected`
                                  : "Select genres..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0" style={{ color: theme.accent }} />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-full p-0 rounded-none"
                            style={{ 
                              backgroundColor: theme.bgCard,
                              border: `1px solid ${theme.border}`
                            }}
                          >
                            <div className="p-3">
                              <div className="flex items-center justify-between pb-3">
                                <Input
                                  placeholder="Search genres..."
                                  value={genreSearch}
                                  onChange={(e) => setGenreSearch(e.target.value)}
                                  className="mr-2 rounded-none upload-input"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={clearGenres}
                                  className="rounded-none"
                                  style={{ borderColor: theme.border, color: theme.textSecondary }}
                                >
                                  Clear
                                </Button>
                              </div>
                              <div className="max-h-[200px] overflow-y-auto">
                                {filteredGenres.map((genre) => (
                                  <div
                                    key={genre}
                                    className="flex cursor-pointer items-center px-3 py-2 transition-all duration-200"
                                    style={{ 
                                      backgroundColor: selectedGenres.includes(genre) ? theme.hoverBg : 'transparent',
                                      color: theme.text
                                    }}
                                    onClick={() => handleGenreToggle(genre)}
                                  >
                                    <div 
                                      className="mr-3 h-4 w-4 flex items-center justify-center"
                                      style={{ border: `1px solid ${selectedGenres.includes(genre) ? theme.accent : theme.border}` }}
                                    >
                                      {selectedGenres.includes(genre) && <Check className="h-3 w-3" style={{ color: theme.accent }} />}
                                    </div>
                                    {genre}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {selectedGenres.map((genre) => (
                            <div
                              key={genre}
                              className="px-3 py-1.5 text-sm flex items-center rounded-none"
                              style={{ 
                                backgroundColor: theme.hoverBg,
                                border: `1px solid ${theme.borderAccent}`,
                                color: theme.text
                              }}
                            >
                              {genre}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2 h-4 w-4 p-0"
                                onClick={() => handleGenreToggle(genre)}
                              >
                                <X className="h-3 w-3" style={{ color: theme.textSecondary }} />
                              </Button>
                            </div>
                          ))}
                          {selectedGenres.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearGenres}
                              className="rounded-none"
                              style={{ borderColor: theme.border, color: theme.textSecondary }}
                            >
                              Clear All
                            </Button>
                          )}
                        </div>
                        <FormMessage className="form-message" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lyrics"
                    render={({ field }) => (
                      <FormItem 
                        className="rounded-none p-6"
                        style={{ 
                          backgroundColor: theme.bgCard,
                          border: `1px solid ${theme.border}`
                        }}
                      >
                        <FormLabel 
                          className="text-base tracking-wide"
                          style={{ fontFamily: "'Italiana', serif", color: theme.text }}
                        >
                          Lyrics
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter song lyrics"
                            className="min-h-[200px] upload-input rounded-none mt-2"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage className="form-message" />
                      </FormItem>
                    )}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="Bible Info">
                <div className="flex flex-col space-y-0">
                  <div className="flex flex-col rounded-lg border p-4">
                    <FormField
                      control={form.control}
                      name="bible_books"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label">Bible Book(s) Included</FormLabel>
                          <Popover open={openBibleBooks} onOpenChange={setOpenBibleBooks}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={openBibleBooks}
                                  className="w-full justify-between"
                                >
                                  {selectedBibleBooks.length > 0
                                    ? `${selectedBibleBooks.length} selected`
                                    : "Select Bible books..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" ref={bibleBookRef}>
                              <div className="p-2">
                                <div className="flex items-center justify-between pb-2">
                                  <Input
                                    placeholder="Search Bible books..."
                                    value={bibleBookSearch}
                                    onChange={(e) => setBibleBookSearch(e.target.value)}
                                    className="mr-2"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearBibleBooks}
                                  >
                                    Clear
                                  </Button>
                                </div>
                                <div className="max-h-[200px] overflow-y-auto">
                                  {filteredBibleBooks().map((book) => (
                                    <div
                                      key={book}
                                      className={cn(
                                        "flex cursor-pointer items-center rounded-md px-2 py-1 hover:bg-accent",
                                        selectedBibleBooks.includes(book) && "bg-accent"
                                      )}
                                      onClick={() => handleBibleBookToggle(book)}
                                    >
                                      <div className="mr-2 h-4 w-4 border border-primary rounded flex items-center justify-center">
                                        {selectedBibleBooks.includes(book) && <Check className="h-3 w-3" />}
                                      </div>
                                      {book}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedBibleBooks.map((book) => (
                              <div
                                key={book}
                                className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-sm flex items-center"
                              >
                                {book}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-1 h-4 w-4 p-0"
                                  onClick={() => handleBibleBookToggle(book)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <FormMessage className="form-message" />
                        </FormItem>
                      )}
                    />

                    {selectedBibleBooks.length > 0 && (
                      <FormField
                        control={form.control}
                        name="bible_chapters"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label">Chapters</FormLabel>
                            <Popover open={openChapters} onOpenChange={setOpenChapters}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openChapters}
                                    className="w-full justify-between"
                                    disabled={selectedBibleBooks.length === 0}
                                  >
                                    {Object.values(selectedChapters).flat().length > 0
                                      ? `${Object.values(selectedChapters).flat().length} selected`
                                      : "Select chapters..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0" style={{ maxWidth: '80vw' }}>
                                <div className="p-2">
                                  <div className="flex items-center justify-between pb-2">
                                    <Input
                                      placeholder="Search chapters..."
                                      value={chapterSearch}
                                      onChange={(e) => setChapterSearch(e.target.value)}
                                      className="mr-2"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={clearChapters}
                                    >
                                      Clear All
                                    </Button>
                                  </div>
                                  <div className="max-h-[300px] overflow-y-auto">
                                    {isLoadingChapters ? (
                                      <div>Loading chapters...</div>
                                    ) : (
                                      Object.entries(filteredChapters()).map(([book, chapters]) => (
                                        <div key={book} className="mb-2">
                                          <h4 className="font-semibold mb-1">{book}</h4>
                                          <div className="flex flex-wrap gap-1">
                                            {chapters.map((chapter) => (
                                              <div
                                                key={`${book}-${chapter}`}
                                                className={cn(
                                                  "flex items-center rounded-md px-2 py-1 hover:bg-accent cursor-pointer",
                                                  (selectedChapters[book] || []).includes(chapter) && "bg-accent"
                                                )}
                                                onClick={() => handleChapterToggle(book, chapter)}
                                              >
                                                <div className="mr-2 h-4 w-4 border border-primary rounded flex items-center justify-center">
                                                  {(selectedChapters[book] || []).includes(chapter) && <Check className="h-3 w-3" />}
                                                </div>
                                                {chapter}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(selectedChapters).map(([book, chapters]) =>
                                chapters.map((chapter) => (
                                  <div
                                    key={`${book}-${chapter}`}
                                    className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-sm flex items-center"
                                  >
                                    {`${book} ${chapter}`}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="ml-1 h-4 w-4 p-0"
                                      onClick={() => handleChapterToggle(book, chapter)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))
                              )}
                            </div>
                            <FormMessage className="form-message" />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="bible_verses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label">Bible Verses Covered</FormLabel>
                          <Popover open={openBibleVerses} onOpenChange={setOpenBibleVerses}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={openBibleVerses}
                                  className="w-full justify-between"
                                  disabled={!selectedBibleBooks.length || !Object.keys(selectedChapters).length}
                                >
                                  {selectedBibleVerses.length > 0
                                    ? `${selectedBibleVerses.length} selected`
                                    : "Select Bible verses..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" style={{ maxWidth: '80vw' }}>
                              <div className="p-2">
                                <div className="flex items-center justify-between pb-2">
                                  <Input
                                    placeholder="Search Bible verses..."
                                    value={bibleVerseSearch}
                                    onChange={(e) => setBibleVerseSearch(e.target.value)}
                                    className="mr-2"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearBibleVerses}
                                  >
                                    Clear All
                                  </Button>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                  {isLoading ? (
                                    <div>Loading verses...</div>
                                  ) : (
                                    Object.entries(filteredBibleVerses()).map(([book, chapters]) => (
                                      <div key={book} className="mb-4">
                                        {Object.entries(chapters).map(([chapter, verses]) => (
                                          <div key={`${book}-${chapter}`} className="mb-2">
                                            <h4 className="font-semibold mb-1">{`${book} ${chapter}`}</h4>
                                            <div className="flex flex-wrap gap-1">
                                              {verses.map((verse: any) => (
                                                <div
                                                  key={`${book}-${chapter}-${verse.verse}`}
                                                  className={cn(
                                                    "flex items-center rounded-md px-2 py-1 hover:bg-accent cursor-pointer",
                                                    selectedBibleVerses.includes(`${book} ${chapter}:${verse.verse}`) && "bg-accent"
                                                  )}
                                                  onClick={() => handleBibleVerseToggle(`${book} ${chapter}:${verse.verse}`)}
                                                >
                                                  <div className="mr-2 h-4 w-4 border border-primary rounded flex items-center justify-center">
                                                    {selectedBibleVerses.includes(`${book} ${chapter}:${verse.verse}`) && <Check className="h-3 w-3" />}
                                                  </div>
                                                  {verse.verse}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedBibleVerses.map((verse) => (
                              <div
                                key={verse}
                                className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-sm flex items-center"
                              >
                                {verse}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-1 h-4 w-4 p-0"
                                  onClick={() => handleBibleVerseToggle(verse)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            {selectedBibleVerses.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={clearBibleVerses}
                                className="mt-1"
                              >
                                Clear All
                              </Button>
                            )}
                          </div>
                          <FormMessage className="form-message" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col rounded-lg border p-4">
                    <FormField
                      control={form.control}
                      name="bible_translation_used"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label">Bible Translation Used</FormLabel>
                          <Popover open={openTranslation} onOpenChange={setOpenTranslation}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={openTranslation}
                                  className="w-full justify-between"
                                >
                                  {field.value || "Select Bible translation..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" ref={translationRef}>
                              <div className="p-2">
                                <div className="flex items-center justify-between pb-2">
                                  <Input
                                    placeholder="Search translations..."
                                    value={translationSearch}
                                    onChange={(e) => setTranslationSearch(e.target.value)}
                                    className="mr-2"
                                  />
                                  {field.value && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        field.onChange('')
                                        setSelectedTranslation('')
                                      }}
                                    >
                                      Clear
                                    </Button>
                                  )}
                                </div>
                                <div className="max-h-[200px] overflow-y-auto">
                                  {filteredTranslations.map((translation) => (
                                    <div
                                      key={translation}
                                      className={cn(
                                        "flex cursor-pointer items-center rounded-md px-2 py-1 hover:bg-accent",
                                        field.value === translation && "bg-accent"
                                      )}
                                      onClick={() => {
                                        field.onChange(translation)
                                        setSelectedTranslation(translation)
                                        setOpenTranslation(false)
                                      }}
                                    >
                                      <div className="mr-2 h-4 w-4 border border-primary rounded flex items-center justify-center">
                                        {field.value === translation && <Check className="h-3 w-3" />}
                                      </div>
                                      {translation}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="form-message" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col rounded-lg border p-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="lyrics_scripture_adherence"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="form-label">Scripture Adherence</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (value === "word_for_word" && watchAiUsedForLyrics) {
                                form.setValue("ai_used_for_lyrics", false);
                                toast.info("AI used for lyrics has been set to No as Word-for-word adherence was selected.", {
                                  duration: 5000,
                                  action: {
                                    label: "Close",
                                    onClick: () => toast.dismiss(),
                                  },
                                });
                              }
                            }} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select adherence level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="word_for_word">
                                Word-for-word
                              </SelectItem>
                              <SelectItem value="close_paraphrase">
                                Close paraphrase
                              </SelectItem>
                              <SelectItem value="creative_inspiration">
                                Creative inspiration
                              </SelectItem>
                              <SelectItem value="somewhat_connected">
                                Somewhat Connected
                              </SelectItem>
                              <SelectItem value="no_connection">
                                No Scripture Connection
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="form-message" />
                        </FormItem>
                      )}
                    />
                    {(watchScriptureAdherence === 'somewhat_connected' || watchScriptureAdherence === 'no_connection') && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Songs with limited or no scripture connection will not appear on the main Listen page by default, but can be added to your Journey page.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="flex flex-col rounded-lg border p-4">
                    <FormField
                      control={form.control}
                      name="is_continuous_passage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Continuous Passage</FormLabel>
                            <FormDescription>
                              Is this a continuous passage of scripture?
                            </FormDescription>
                          </div>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={selectedBibleVerses.length > 0}
                                    aria-readonly={selectedBibleVerses.length > 0}
                                  />
                                </FormControl>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              {selectedBibleVerses.length > 0 ? (
                                field.value ? (
                                  <p>This is set to true because the selected Bible verses form a continuous passage.</p>
                                ) : (
                                  <p>This is set to false because the selected Bible verses do not form a continuous passage.</p>
                                )
                              ) : (
                                <p>Select Bible verses to determine if they form a continuous passage.</p>
                              )}
                            </HoverCardContent>
                          </HoverCard>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="Upload">
                {/* Audio File Upload */}
                <FormField
                  control={form.control}
                  name="audio_file"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border p-4">
                      <FormLabel className="form-label">Audio File</FormLabel>
                      <FormControl>
                        <div className="flex items-center justify-between">
                          <div className="flex-grow">
                            {audioUploadStatus === 'idle' ? (
                              <Input
                                type="file"
                                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.wma,.alac,.aiff,.dsd"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > MAX_AUDIO_FILE_SIZE) {
                                      toast.error("Audio file size exceeds the limit of 200MB");
                                      return;
                                    }

                                    // Get audio duration
                                    const reader = new FileReader();
                                    reader.onload = function (event) {
                                      const arrayBuffer = event.target!.result as ArrayBuffer;
                                      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                                      const audioContext = new AudioContext();
                                      audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
                                        const duration = audioBuffer.duration;
                                        setAudioDuration(duration);
                                        console.log("Audio duration:", duration);
                                      });
                                    };
                                    reader.readAsArrayBuffer(file);

                                    field.onChange(file);
                                    setAudioUploadStatus('uploading');
                                    setAudioUploadProgress(0);
                                    try {
                                      await uploadFile(file, 'audio');
                                      setAudioUploadStatus('success');
                                    } catch (error) {
                                      setAudioUploadStatus('error');
                                    }
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <FileIcon className="h-5 w-5 text-gray-500" />
                                <p className="text-sm text-gray-500">
                                  {field.value?.name}
                                  {audioDuration !== null && (
                                    <> - {formatDuration(audioDuration)}</>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                          {audioUploadStatus === 'success' && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={async () => {
                                try {
                                  const response = await axios.post('/api/delete-file', { fileKey: form.getValues('audio_url') });
                                  if (response.status === 200) {
                                    form.setValue('audio_file', undefined, { shouldValidate: true });
                                    form.setValue('audio_url', undefined, { shouldValidate: true });
                                    setAudioUploadStatus('idle');
                                    setAudioUploadProgress(0);
                                    setAudioDuration(null); // Reset audio duration
                                    toast.success('Audio file removed successfully');
                                    // Reset the file input
                                    const fileInput = document.querySelector('input[type="file"][accept="audio/*"]') as HTMLInputElement;
                                    if (fileInput) fileInput.value = '';
                                  } else {
                                    throw new Error(response.data.message || 'Failed to remove audio file');
                                  }
                                } catch (error) {
                                  console.error('Error removing audio file:', error.response?.data || error.message);
                                  toast.error(`Failed to remove audio file: ${error.response?.data?.message || error.message}`);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      {audioUploadStatus !== 'idle' && (
                        <div className="mt-2">
                          <Progress value={audioUploadProgress} className="w-full" />
                          <p className="text-sm mt-1">
                            {audioUploadStatus === 'uploading' && `Uploading: ${audioUploadProgress}%`}
                            {audioUploadStatus === 'success' && 'Upload successful!'}
                            {audioUploadStatus === 'error' && 'Upload failed. Please try again.'}
                          </p>
                        </div>
                      )}
                      <FormMessage className="form-message" />
                    </FormItem>
                  )}
                />

                {/* Song Art Upload */}
                <FormField
                  control={form.control}
                  name="song_art_file"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border p-4">
                      <FormLabel className="form-label">Song Art</FormLabel>
                      <FormControl>
                        <div className="flex items-center justify-between">
                          <div className="flex-grow">
                            {imageUploadStatus === 'idle' ? (
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <FileIcon className="h-5 w-5 text-gray-500" />
                                <p className="text-sm text-gray-500">{field.value?.name}</p>
                              </div>
                            )}
                          </div>
                          {imageUploadStatus === 'success' && croppedImage && (
                            <div className="flex items-center space-x-2">
                              <Image 
                                src={URL.createObjectURL(croppedImage)} 
                                alt="Uploaded Song Art" 
                                width={56} 
                                height={56} 
                                className="object-cover rounded" 
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={async () => {
                                  try {
                                    const response = await axios.post('/api/delete-file', { fileKey: form.getValues('song_art_url') });
                                    if (response.status === 200) {
                                      form.setValue('song_art_file', undefined, { shouldValidate: true });
                                      form.setValue('song_art_url', undefined, { shouldValidate: true });
                                      setImageUploadStatus('idle');
                                      setImageUploadProgress(0);
                                      setCroppedImage(null);
                                      toast.success('Song art removed successfully');
                                      // Reset the file input
                                      const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
                                      if (fileInput) fileInput.value = '';
                                    } else {
                                      throw new Error(response.data.message || 'Failed to remove song art');
                                    }
                                  } catch (error) {
                                    console.error('Error removing song art:', error.response?.data || error.message);
                                    toast.error(`Failed to remove song art: ${error.response?.data?.message || error.message}`);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      {imageUploadStatus !== 'idle' && (
                        <div className="mt-2">
                          <Progress value={imageUploadProgress} className="w-full" />
                          <p className="text-sm mt-1">
                            {imageUploadStatus === 'uploading' && `Uploading: ${imageUploadProgress}%`}
                            {imageUploadStatus === 'success' && 'Upload successful!'}
                            {imageUploadStatus === 'error' && 'Upload failed. Please try again.'}
                          </p>
                        </div>
                      )}
                      <FormMessage className="form-message" />
                    </FormItem>
                  )}
                />

                <Modal isOpen={isModalOpen} onClose={handleCropCancel}>
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
                </Modal>
              </TabsContent>
            </Tabs>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex justify-between items-center pb-8 sm:pb-12 mt-8"
            >
              {currentStep > 0 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  variant="outline"
                  className="h-12 px-6 rounded-none text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300"
                  style={{
                    borderColor: theme.border,
                    color: theme.text,
                    backgroundColor: 'transparent',
                  }}
                >
                  Previous
                </Button>
              ) : (
                <div />
              )}
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  className="h-12 px-6 rounded-none text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300"
                  style={{
                    backgroundColor: theme.accent,
                    color: isDark ? '#050505' : '#ffffff',
                    border: 'none',
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-12 px-8 rounded-none text-xs tracking-[0.2em] uppercase font-medium transition-all duration-300"
                  style={{
                    backgroundColor: progress === 100 ? theme.accent : theme.textMuted,
                    color: isDark ? '#050505' : '#ffffff',
                    border: 'none',
                    opacity: progress === 100 ? 1 : 0.7,
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Song'}
                </Button>
              )}
            </motion.div>
          </form>
        </FormProvider>
      </main>
    </div>
  )
}

export default Upload