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
import { Check, ChevronsUpDown, X, Trash2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { BIBLE_BOOKS, GENRES, AI_MUSIC_MODELS, BIBLE_TRANSLATIONS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery } from 'react-query'
import axios from 'axios'
import { toast } from "sonner";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Progress } from "@/components/ui/progress"
import { ImageCropper } from '@/components/ImageCropper'
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '@/components/Modal'
import UploadProgressBar from '@/components/UploadProgressBar';
import GradientButton from '@/components/GradientButton'; // Import GradientButton
import UploadInfoDialog from '@/components/UploadInfoDialog';
import { useRouter } from 'next/router'

const MAX_AUDIO_FILE_SIZE = 200 * 1024 * 1024; // 200MB in bytes
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const formSchema = z.object({
  // Step 1: AI Info
  ai_used_for_lyrics: z.boolean(),
  music_ai_generated: z.boolean(),
  lyric_ai_prompt: z.string().min(1, "Lyric AI prompt is required"),
  music_model_used: z.string().min(1, "Music model is required"),
  music_ai_prompt: z.string().min(1, "Music AI prompt is required"),

  // Step 2: Song Info
  title: z.string().min(1, "Title is required"),
  artist: z.string().optional(),
  genre: z.string().min(1, "At least one genre is required"),
  lyrics: z.string().min(1, "Lyrics are required"),

  // Step 3: Bible Info
  bible_translation_used: z.string().min(1, "Bible translation is required"),
  lyrics_scripture_adherence: z.enum([
    "The lyrics follow the scripture word-for-word",
    "The lyrics closely follow the scripture passage",
    "The lyrics are creatively inspired by the scripture passage"
  ]),
  is_continuous_passage: z.boolean(),
  bible_book: z.string().min(1, "Bible book is required"),
  bible_chapter: z.string().min(1, "Chapter is required"),
  bible_verse_start: z.string().min(1, "Starting verse is required"),
  bible_verse_end: z.string().optional(),
  bible_books: z.string().min(1, "At least one Bible book is required"),
  bible_chapters: z.record(z.string(), z.array(z.number())).optional(),
  bible_verses: z.string().min(1, "At least one Bible verse is required"),

  // Step 4: Upload
  audio_file: z.instanceof(File).optional(),
  song_art_file: z.instanceof(File).optional(),

  // Include URLs after upload
  audio_url: z.string().optional(),
  song_art_url: z.string().optional(),
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

export default function Upload() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0); // Add progress state

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ai_used_for_lyrics: false,
      music_ai_generated: false,
      is_continuous_passage: false,
      music_model_used: '',
      music_ai_prompt: '',
      title: '',
      artist: '',
      genre: '',
      lyrics: '',
      bible_translation_used: '',
      lyrics_scripture_adherence: "The lyrics closely follow the scripture passage",
      lyric_ai_prompt: '',
    },
    mode: "onChange", // This enables real-time validation
  })

  // Add this separate effect for logging validation results
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      console.log('Form value changed:', name, value);
      console.log('Validation errors:', form.formState.errors);
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
    form.setValue('genre', updatedGenres.join(', '), { shouldValidate: true });
  }

  const clearGenres = () => {
    setSelectedGenres([]);
    form.setValue('genre', '', { shouldValidate: true });
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

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFileKey, setAudioFileKey] = useState<string | null>(null);
  const [imageFileKey, setImageFileKey] = useState<string | null>(null);

  const [audioFileName, setAudioFileName] = useState<string | null>(null)
  const [imageFileName, setImageFileName] = useState<string | null>(null)

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
      return null;
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

      console.log('Received signed URL:', data.signedUrl);

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

      console.log('S3 upload response:', uploadResponse);

      if (uploadResponse.status !== 200) {
        throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
      }

      setStatus('success');
      setUploadedFiles(prev => [...prev, data.fileKey]);
      console.log('File uploaded:', data.fileKey);

      if (fileType === 'audio') {
        setAudioFileKey(data.fileKey);
        setAudioFileName(file.name)
        form.setValue('audio_url', data.fileKey, { shouldValidate: true });
      } else {
        setImageFileKey(data.fileKey);
        setImageFileName(file.name)
        form.setValue('song_art_url', data.fileKey, { shouldValidate: true });
      }

      // Update overall form progress
      updateFormProgress();

      return data.fileKey;
    } catch (error) {
      console.error('Error uploading file:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.response?.data);
      }
      setStatus('error');
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
  };

  // Add this function to update the overall form progress
  const updateFormProgress = () => {
    const totalSteps = 4; // AI Info, Song Info, Bible Info, Upload
    let completedSteps = 0;

    // Check if AI Info is complete
    if (form.getValues('ai_used_for_lyrics') !== undefined &&
        form.getValues('music_ai_generated') !== undefined) {
      completedSteps++;
    }

    // Check if Song Info is complete
    if (form.getValues('title') && form.getValues('genre') && form.getValues('lyrics')) {
      completedSteps++;
    }

    // Check if Bible Info is complete
    if (form.getValues('bible_translation_used') && form.getValues('lyrics_scripture_adherence') &&
        selectedBibleVerses.length > 0) {
      completedSteps++;
    }

    // Check if Upload is complete
    if (form.getValues('audio_url') && form.getValues('song_art_url')) {
      completedSteps++;
    }

    const newProgress = (completedSteps / totalSteps) * 100;
    setProgress(newProgress);
  };

  const removeFile = async (fileType: 'audio' | 'image') => {
    const fileKey = fileType === 'audio' ? audioFileKey : imageFileKey;
    if (!fileKey) {
      console.error(`No ${fileType} file key found`);
      toast.error(`No ${fileType} file found to remove`);
      return;
    }

    try {
      const response = await axios.delete('/api/delete-file', { data: { fileKey } });
      if (response.status === 200) {
        if (fileType === 'audio') {
          setAudioFile(null);
          setAudioFileKey(null);
          setAudioFileName(null)
          setAudioUploadStatus('idle');
          setAudioUploadProgress(0);
          form.setValue('audio_url', undefined, { shouldValidate: true });
        } else {
          setImageFile(null);
          setImageFileKey(null);
          setImageFileName(null)
          setImageUploadStatus('idle');
          setImageUploadProgress(0);
          form.setValue('song_art_url', undefined, { shouldValidate: true });
          setCroppedImage(null);
        }
        toast.success(`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} file removed successfully`);
        // Reset the file input
        const fileInput = document.querySelector(`input[type="file"][accept="${fileType}/*"]`) as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(response.data.message || `Failed to remove ${fileType} file`);
      }
    } catch (error) {
      console.error(`Error removing ${fileType} file:`, error.response?.data || error.message);
      toast.error(`Failed to remove ${fileType} file: ${error.response?.data?.message || error.message}`);
    }
  };

  const router = useRouter()

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('onSubmit function called');
    try {
      setProgress(0);

      // Upload audio file if it exists
      let audioUrl = values.audio_url;
      if (audioFile) {
        audioUrl = await uploadFile(audioFile, 'audio');
        if (!audioUrl) {
          throw new Error('Failed to upload audio file');
        }
      }

      // Upload image file if it exists
      let imageUrl = values.song_art_url;
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'image');
        if (!imageUrl) {
          throw new Error('Failed to upload image file');
        }
      }

      const formData = {
        ...values,
        uploaded_by: user?.id,
        bible_verses: selectedBibleVerses,
        audio_url: audioUrl,
        song_art_url: imageUrl,
      };
      console.log('Form data:', formData);

      // Send the form data to your backend
      console.log('Sending POST request to /api/submit-song');
      const response = await axios.post('/api/submit-song', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!)
          setProgress(percentCompleted)
        }
      });
      console.log('Response received:', response);

      if (response.status === 200) {
        toast.success('Song uploaded successfully!')
        setUploadedFiles([]) // Clear the uploaded files list after successful submission
        console.log('Form submitted, clearing uploaded files list')
        
        // Redirect to the newly created song's page
        router.push(`/songs/${response.data.songId}`)
      } else {
        throw new Error(response.data.message || 'Failed to submit song')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.response?.data);
      }
      toast.error(`Error uploading song: ${error.response?.data?.message || error.message}`)
      setProgress(0)
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('handleSubmit called');
    setShowValidationMessages(true)
    form.handleSubmit(onSubmit)(e)
  }

  const steps = ["AI Info", "Song Info", "Bible Info", "Upload"]

  const watchAiUsedForLyrics = form.watch("ai_used_for_lyrics");
  const watchScriptureAdherence = form.watch("lyrics_scripture_adherence");

  const handleAILyricsChange = (checked: boolean) => {
    if (watchScriptureAdherence === "The lyrics follow the scripture word-for-word") {
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
    if (watchScriptureAdherence === "The lyrics follow the scripture word-for-word") {
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

  const { data: bibleVerses, isLoading } = useQuery(
    ['bibleVerses', selectedBibleBooks, selectedChapters],
    async () => {
      if (selectedBibleBooks.length === 0) return {}
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
  )

  const [openBibleVerses, setOpenBibleVerses] = useState(false)
  const [bibleVerseSearch, setBibleVerseSearch] = useState('')
  const [selectedBibleVerses, setSelectedBibleVerses] = useState<string[]>([])

  const filteredBibleVerses = useCallback(() => {
    if (!bibleVerses) return {}
    return Object.entries(bibleVerses).reduce((acc, [book, chapters]) => {
      acc[book] = Object.entries(chapters).reduce((chapterAcc, [chapter, verses]) => {
        chapterAcc[chapter] = verses.filter((verse: any) =>
          verse.KJV_text.toLowerCase().includes(bibleVerseSearch.toLowerCase()) ||
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

  // Update the handleFileChange function for image uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_FILE_SIZE) {
        toast.error("Image file size exceeds the limit of 5MB");
        return;
      }
      setImageFile(file);
      setCropImageUrl(URL.createObjectURL(file));
      setIsModalOpen(true);
    }
  };

  // Update the handleCropComplete function
  const handleCropComplete = async (croppedImageBlob: Blob) => {
    const croppedFile = new File([croppedImageBlob], 'cropped_image.jpg', { type: 'image/jpeg' });
    setCroppedImage(croppedFile);
    setIsModalOpen(false);
    
    setImageUploadStatus('uploading');
    setImageUploadProgress(0);
    try {
      const fileKey = await uploadFile(croppedFile, 'image');
      if (fileKey) {
        form.setValue('song_art_url', fileKey, { shouldValidate: true });
        setImageUploadStatus('success');
        updateFormProgress();
      }
    } catch (error) {
      setImageUploadStatus('error');
    }
  };

  const handleCropCancel = () => {
    setCropImageUrl(null)
    setIsModalOpen(false)
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
            <GradientButton type="submit" progress={progress} onClick={handleSubmit}>
              Submit
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
                                  disabled={watchScriptureAdherence === "The lyrics follow the scripture word-for-word"}
                                />
                              </FormControl>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            {watchScriptureAdherence === "The lyrics follow the scripture word-for-word" ? (
                              <p>Cannot enable AI for lyrics when Word-for-word adherence is selected.</p>
                            ) : (
                              <p>Toggle to indicate if AI was used to generate the lyrics.</p>
                            )}
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      {watchAiUsedForLyrics && (
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
                                      form.trigger();
                                    }
                                  }}
                                  required={form.watch("ai_used_for_lyrics")}
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
                                      form.trigger();
                                    }
                                  }}
                                  value={field.value}
                                  required={form.watch("music_ai_generated")}
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
                                        form.trigger();
                                      }
                                    }}
                                    required={form.watch("music_ai_generated")}
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
                          value={field.value || ''} // Ensure value is always defined
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
                          value={field.value || ''} // Ensure value is always defined
                        />
                      </FormControl>
                      <FormMessage className="form-message" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="genre"
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
                              if (value === "The lyrics follow the scripture word-for-word" && watchAiUsedForLyrics) {
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
                              <SelectItem value="The lyrics follow the scripture word-for-word">
                                Word-for-word
                              </SelectItem>
                              <SelectItem value="The lyrics closely follow the scripture passage">
                                Close paraphrase
                              </SelectItem>
                              <SelectItem value="The lyrics are creatively inspired by the scripture passage">
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
                        <div className="flex items-center space-x-2">
                          {audioFileName ? (
                            <div className="flex items-center space-x-2 bg-secondary p-2 rounded">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{audioFileName}</span>
                            </div>
                          ) : (
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
                                  setAudioFile(file);
                                  field.onChange(file);
                                  const fileKey = await uploadFile(file, 'audio');
                                  if (fileKey) {
                                    form.setValue('audio_url', fileKey, { shouldValidate: true });
                                    setAudioFileName(file.name);
                                    updateFormProgress();
                                  }
                                }
                              }}
                            />
                          )}
                          {audioUploadStatus === 'success' && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => removeFile('audio')}
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
                        <div className="flex items-center space-x-2">
                          {imageFileName ? (
                            <div className="flex items-center space-x-2 bg-secondary p-2 rounded">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{imageFileName}</span>
                            </div>
                          ) : (
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > MAX_IMAGE_FILE_SIZE) {
                                    toast.error("Image file size exceeds the limit of 5MB");
                                    return;
                                  }
                                  setImageFile(file);
                                  handleFileChange(e);
                                }
                              }}
                            />
                          )}
                          {imageUploadStatus === 'success' && croppedImage && (
                            <>
                              <img src={URL.createObjectURL(croppedImage)} alt="Uploaded Song Art" className="w-14 h-14 object-cover rounded" />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeFile('image')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </FormControl>
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
              </TabsContent>
            </Tabs>

            <div className="flex justify-between items-center">
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
                <GradientButton type="submit" progress={progress} onClick={handleSubmit}>
                  Submit
                </GradientButton>
              )}
            </div>
          </form>
        </FormProvider>
      </main>
    </div>
  )
}