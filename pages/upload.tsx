import Head from 'next/head'
import { useState, useEffect, useRef, useCallback } from 'react'
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
import { Check, ChevronsUpDown, X, Trash2, File as FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { BIBLE_BOOKS, GENRES, AI_MUSIC_MODELS, BIBLE_TRANSLATIONS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery, QueryClientProvider, QueryClient } from 'react-query'
import axios from 'axios'
import { toast } from "sonner";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Progress } from "@/components/ui/progress"
import { ImageCropper } from '@/components/UploadPage/ImageCropper'
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '@/components/Modal'
import UploadProgressBar from '@/components/UploadPage/UploadProgressBar';
import GradientButton from '@/components/GradientButton'; // Import GradientButton
import UploadInfoDialog from '@/components/UploadPage/UploadInfoDialog';
import { useRouter } from 'next/router'

const MAX_AUDIO_FILE_SIZE = 200 * 1024 * 1024; // 200MB in bytes
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const formSchema = z.object({
  // Step 1: AI Info
  ai_used_for_lyrics: z.boolean(),
  music_ai_generated: z.boolean(),
  lyric_ai_prompt: z.string().optional(),
  music_model_used: z.string().optional(),
  music_ai_prompt: z.string().optional(),

  // Step 2: Song Info
  title: z.string().min(1, "Title is required"),
  artist: z.string().optional(),
  genres: z.array(z.string()).min(1, "At least one genre is required"),
  lyrics: z.string().min(1, "Lyrics are required"),

  // Step 3: Bible Info
  bible_translation_used: z.string().min(1, "Bible translation is required"),
  lyrics_scripture_adherence: z.enum([
    "word_for_word",
    "close_paraphrase",
    "creative_inspiration"
  ]),
  is_continuous_passage: z.boolean(),
  bible_books: z.string().min(1, "At least one Bible book is required"),
  bible_chapters: z.record(z.string(), z.array(z.number())).optional(),
  bible_verses: z.string().min(1, "At least one Bible verse is required"),

  // Step 4: Upload
  audio_file: z.instanceof(File).optional(),
  song_art_file: z.instanceof(File).optional(),

  // Include URLs after upload
  audio_url: z.string().optional(),
  song_art_url: z.string().optional(),

  // Added uploaded_by field
  uploaded_by: z.union([z.string(), z.number()]).optional(),
}).refine((data) => {
  if (data.ai_used_for_lyrics && (!data.lyric_ai_prompt || data.lyric_ai_prompt.trim().length === 0)) {
    return false;
  }
  if (data.music_ai_generated) {
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
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      toast.error("You need to be logged in to upload a song.", {
        duration: 5000,
        action: {
          label: "Login",
          onClick: () => router.push('/login?view=login'),
        },
      })
      router.push('/login?view=login')
    }
  }, [user, router])

  if (!user) {
    return null // or a loading spinner if you prefer
  }

  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0); // Add progress state

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: async (...args) => {
      const result = await zodResolver(formSchema)(...args);
      console.log("Zod resolver result:", result);
      return result;
    },
    defaultValues: {
      ai_used_for_lyrics: true,
      music_ai_generated: true,
      is_continuous_passage: false,
      music_model_used: undefined,
      music_ai_prompt: undefined,
      title: "",
      artist: "",
      lyrics: "",
      genres: [], // Initialize genres as an empty array
    },
    mode: "onBlur", // Change this from "onChange" to reduce unnecessary validations
  })

  const [openGenre, setOpenGenre] = useState(false)
  const [openTranslation, setOpenTranslation] = useState(false)
  const [genreSearch, setGenreSearch] = useState('')
  const [translationSearch, setTranslationSearch] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedTranslation, setSelectedTranslation] = useState<string>('')

  const filteredGenres = useCallback(() => {
    return GENRES.filter(genre =>
      genre.toLowerCase().includes(genreSearch.toLowerCase())
    )
  }, [genreSearch])

  const filteredTranslations = useCallback(() => {
    return BIBLE_TRANSLATIONS.filter(translation =>
      translation.toLowerCase().includes(translationSearch.toLowerCase())
    )
  }, [translationSearch])

  const genreRef = useRef<HTMLDivElement>(null)
  const translationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(event.target as Node)) {
        setOpenGenre(false)
      }
      if (translationRef.current && !translationRef.current.contains(event.target as Node)) {
        setOpenTranslation(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleGenreToggle = (genre: string) => {
    let updatedGenres: string[];
    if (selectedGenres.includes(genre)) {
      // Remove the genre if it's already selected
      updatedGenres = selectedGenres.filter(g => g !== genre);
    } else {
      // Add the genre if it's not already selected
      updatedGenres = [...selectedGenres, genre];
    }
    setSelectedGenres(updatedGenres);
    form.setValue('genres', updatedGenres, { shouldValidate: true });
  }

  const clearGenres = () => {
    setSelectedGenres([]);
    form.setValue('genres', [], { shouldValidate: true });
  }

  const [showValidationMessages, setShowValidationMessages] = useState(false)

  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [audioUploadStatus, setAudioUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [imageUploadStatus, setImageUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (uploadedFiles.length > 0) {
        const data = JSON.stringify({ fileKeys: uploadedFiles });
        navigator.sendBeacon('/api/cleanup-unsubmitted-files', data);
        
        // For debugging purposes
        console.log('Sending cleanup request for files:', uploadedFiles);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [uploadedFiles]);

  const [audioDuration, setAudioDuration] = useState<number | null>(null);

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

  const [hasShownValidMessage, setHasShownValidMessage] = useState(false);

  useEffect(() => {
    console.log("Setting up form subscription");
    const subscription = form.watch(() => {
      console.log("Form changed");
      console.log("Form state:", form.formState);
      console.log("Is form valid?", form.formState.isValid);
      console.log("Form errors:", form.formState.errors);
      
      // Remove the toast from here, we'll show it only on submit
    });

    return () => {
      console.log("Cleaning up form subscription");
      subscription.unsubscribe();
    };
  }, [form]);

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

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const steps = ["AI Info", "Song Info", "Bible Info", "Upload"]

  const watchAiUsedForLyrics = form.watch("ai_used_for_lyrics");
  const watchScriptureAdherence = form.watch("lyrics_scripture_adherence");

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
        form.setValue("lyric_ai_prompt", undefined ?? "", { shouldValidate: true });
      } else {
        form.trigger("lyric_ai_prompt");
      }
    }
  };

  useEffect(() => {
    if (watchScriptureAdherence === "word_for_word") {
      if (watchAiUsedForLyrics) {
        form.setValue("ai_used_for_lyrics", false);
        toast.info("AI used for lyrics has been set to No as Word-for-word adherence was selected.", {
          duration: 5000,
          action: {
            label: "Close",
            onClick: () => toast.dismiss(),
          },
        });
      }
    }
  }, [watchScriptureAdherence, watchAiUsedForLyrics, form]);

  useEffect(() => {
    if (!watchAiUsedForLyrics) {
      form.setValue("lyric_ai_prompt", undefined ?? "");
    }
    form.trigger("lyric_ai_prompt");
  }, [watchAiUsedForLyrics, form]);

  const [openBibleBooks, setOpenBibleBooks] = useState(false)
  const [bibleBookSearch, setBibleBookSearch] = useState('')
  const [selectedBibleBooks, setSelectedBibleBooks] = useState<string[]>([])
  const [selectedChapters, setSelectedChapters] = useState<{[book: string]: number[]}>({})

  const filteredBibleBooks = useCallback(() => {
    return BIBLE_BOOKS.filter(book =>
      book.toLowerCase().includes(bibleBookSearch.toLowerCase())
    )
  }, [bibleBookSearch])

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

  const [openChapters, setOpenChapters] = useState(false)
  const [chapterSearch, setChapterSearch] = useState('')

  const { data: availableChapters, isLoading: isLoadingChapters } = useQuery(
    ['chapters', selectedBibleBooks],
    async () => {
      if (selectedBibleBooks.length === 0) return {}
      const response = await axios.get('/api/chapters', {
        params: { books: selectedBibleBooks.join(',') }
      })
      return response.data
    },
    { enabled: selectedBibleBooks.length > 0 }
  )

  const filteredChapters = useCallback(() => {
    if (!availableChapters) return {}
    return Object.entries(availableChapters as Record<string, number[]>).reduce((acc, [book, chapters]) => {
      acc[book] = chapters.filter(chapter => 
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

  const [openBibleVerses, setOpenBibleVerses] = useState(false)
  const [bibleVerseSearch, setBibleVerseSearch] = useState('')
  const [selectedBibleVerses, setSelectedBibleVerses] = useState<string[]>([])

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

  const bibleVerseRef = useRef<HTMLDivElement>(null)
  const bibleBookRef = useRef<HTMLDivElement>(null)

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

  const clearBibleVerses = () => {
    setSelectedBibleVerses([]);
    form.setValue('bible_verses', '', { shouldValidate: true });
  }

  const areVersesContinuous = (verses: string[]) => {
    if (verses.length === 0) return false;
    const sortedVerses = verses.sort((a, b) => {
      const [bookA, chapterVerseA] = a.split(' ');
      const [bookB, chapterVerseB] = b.split(' ');
      if (bookA !== bookB) return bookA.localeCompare(bookB);
      const [chapterA, verseA] = chapterVerseA.split(':').map(Number);
      const [chapterB, verseB] = chapterVerseB.split(':').map(Number);
      
      if (chapterA !== chapterB) return chapterA - chapterB;
      return verseA - verseB;
    });

    let prevBook = '', prevChapter = 0, prevVerse = 0;
    for (let i = 0; i < sortedVerses.length; i++) {
      const [book, chapterVerse] = sortedVerses[i].split(' ');
      const [chapter, verse] = chapterVerse.split(':').map(Number);
      
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

  useEffect(() => {
    if (selectedBibleVerses.length > 0) {
      const isContinuous = areVersesContinuous(selectedBibleVerses);
      form.setValue('is_continuous_passage', isContinuous, { shouldValidate: true });
    }
  }, [selectedBibleVerses, form]);

  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<File | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault(); // Prevent form submission
    const file = e.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setCropImageUrl(imageUrl)
      setIsModalOpen(true)
      // Remove this line to avoid using the original image file
      // form.setValue('song_art_file', file)
    }
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    const croppedFile = new File([croppedImageBlob], 'cropped_image.jpg', { type: 'image/jpeg' })
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
  }

  const handleCropCancel = () => {
    setCropImageUrl(null)
    setIsModalOpen(false)
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>BibleChorus - Upload Songs</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="flex justify-between items-center mb-4 sm:mb-8 pt-4 sm:pt-6 md:pt-8 lg:pt-10 xl:pt-12">
          <div className="flex items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">Upload Songs</h1>
            <UploadInfoDialog />
          </div>
          {progress === 100 && (
            <GradientButton type="button" progress={progress} onClick={handleSubmit} isLoading={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </GradientButton>
          )}
        </div>
        
        <FormProvider {...form}>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8">
            <UploadProgressBar onProgressChange={setProgress} />
            
            <Tabs value={steps[currentStep]} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {steps.map((step, index) => (
                  <TabsTrigger
                    key={step}
                    value={step}
                    onClick={() => setCurrentStep(index)}
                  >
                    {step}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="AI Info">
                <FormField
                  control={form.control}
                  name="ai_used_for_lyrics"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-4 rounded-lg border p-4">
                      <div className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="form-label text-base">AI Used for Lyrics</FormLabel>
                          <FormDescription>
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
                                />
                              </FormControl>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
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
                              <FormLabel>AI Lyric Prompt</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter the prompt used to generate the lyrics"
                                  className="resize-none"
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
                  name="music_ai_generated"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-4 rounded-lg border p-4">
                      <div className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="form-label text-base">AI Generated Music</FormLabel>
                          <FormDescription>
                            Was the music generated by AI?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (!checked) {
                                form.setValue("music_model_used", "", { shouldValidate: true });
                                form.setValue("music_ai_prompt", "", { shouldValidate: true });
                              } else {
                                form.trigger("music_model_used");
                                form.trigger("music_ai_prompt");
                              }
                            }}
                          />
                        </FormControl>
                      </div>
                      {field.value && (
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
                {/* Add more AI-related fields here */}
              </TabsContent>

              <TabsContent value="Song Info">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border p-4">
                      <FormLabel className="form-label">Song Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter song title" 
                          {...field} 
                          value={field.value || ""}
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
                    <FormItem className="rounded-lg border p-4">
                      <FormLabel className="form-label">Artist (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter artist name" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage className="form-message" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="genres" // Update to 'genres'
                  render={({ field }) => (
                    <FormItem className="flex flex-col rounded-lg border p-4">
                      <FormLabel className="form-label">Genre(s)</FormLabel>
                      <Popover open={openGenre} onOpenChange={setOpenGenre}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openGenre}
                              className="w-full justify-between"
                            >
                              {selectedGenres.length > 0
                                ? `${selectedGenres.length} selected`
                                : "Select genres..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
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
                                    selectedGenres.includes(genre) && "bg-accent"
                                  )}
                                  onClick={() => handleGenreToggle(genre)}
                                >
                                  <div className="mr-2 h-4 w-4 border border-primary rounded flex items-center justify-center">
                                    {selectedGenres.includes(genre) && <Check className="h-3 w-3" />}
                                  </div>
                                  {genre}
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      {/* Update the display of selected genres */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedGenres.map((genre) => (
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
                        {selectedGenres.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearGenres}
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
                <FormField
                  control={form.control}
                  name="lyrics"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border p-4">
                      <FormLabel className="form-label">Lyrics</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter song lyrics"
                          className="min-h-[200px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage className="form-message" />
                    </FormItem>
                  )}
                />
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
                                  {filteredTranslations().map((translation) => (
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

                  <div className="flex flex-col rounded-lg border p-4">
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
                            </SelectContent>
                          </Select>
                          <FormMessage className="form-message" />
                        </FormItem>
                      )}
                    />
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
                                accept="audio/*"
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
                                  const response = await axios.delete('/api/delete-file', { data: { fileKey: form.getValues('audio_url') } });
                                  if (response.status === 200) {
                                    form.setValue('audio_file', undefined, { shouldValidate: true });
                                    form.setValue('audio_url', undefined, { shouldValidate: true });
                                    setAudioUploadStatus('idle');
                                    setAudioUploadProgress(0);
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
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const imageUrl = URL.createObjectURL(file)
                                    setCropImageUrl(imageUrl)
                                    setIsModalOpen(true)
                                    // Remove this line to avoid using the original image file
                                    // form.setValue('song_art_file', file)
                                  }
                                }}
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
                              <img src={URL.createObjectURL(croppedImage)} alt="Uploaded Song Art" className="w-14 h-14 object-cover rounded" />
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
                    />
                  )}
                </Modal>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between items-center pb-4 sm:pb-6 md:pb-8 lg:pb-10 xl:pb-12">
              {currentStep > 0 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                >
                  Previous
                </Button>
              ) : (
                <div /> // Empty div as placeholder when there's no Previous button
              )}
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                >
                  Next
                </Button>
              ) : (
                <GradientButton type="submit" progress={progress} onClick={handleSubmit} isLoading={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </GradientButton>
              )}
            </div>
          </form>
        </FormProvider>
      </main>
    </div>
  )
}

export default Upload