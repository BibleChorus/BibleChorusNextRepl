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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { BIBLE_BOOKS, GENRES, AI_MUSIC_MODELS, BIBLE_TRANSLATIONS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery } from 'react-query'
import axios from 'axios'

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
  bible_verses: z.string().min(1, "At least one Bible verse is required"),

  // Step 4: Upload
  audio_file: z.instanceof(File).optional(),
  song_art_file: z.instanceof(File).optional(),
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
  const [currentStep, setCurrentStep] = useState(0)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ai_used_for_lyrics: false,
      music_ai_generated: false,
      is_continuous_passage: false,
      music_model_used: undefined,
      music_ai_prompt: undefined,
    },
    mode: "onChange", // This enables real-time validation
  })

  const [openGenre, setOpenGenre] = useState(false)
  const [openTranslation, setOpenTranslation] = useState(false)
  const [genreSearch, setGenreSearch] = useState('')
  const [translationSearch, setTranslationSearch] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])

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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values)
    // Handle form submission here
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowValidationMessages(true)
    form.handleSubmit(onSubmit)(e)
  }

  const steps = ["AI Info", "Song Info", "Bible Info", "Upload"]

  const watchAiUsedForLyrics = form.watch("ai_used_for_lyrics");

  useEffect(() => {
    if (!watchAiUsedForLyrics) {
      form.setValue("lyric_ai_prompt", undefined ?? "");
    }
    form.trigger("lyric_ai_prompt");
  }, [watchAiUsedForLyrics, form]);

  const [openBibleBooks, setOpenBibleBooks] = useState(false)
  const [bibleBookSearch, setBibleBookSearch] = useState('')
  const [selectedBibleBooks, setSelectedBibleBooks] = useState<string[]>([])

  const filteredBibleBooks = useCallback(() => {
    return BIBLE_BOOKS.filter(book =>
      book.toLowerCase().includes(bibleBookSearch.toLowerCase())
    )
  }, [bibleBookSearch])

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
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleBibleBookToggle = (book: string) => {
    let updatedBooks: string[];
    if (selectedBibleBooks.includes(book)) {
      updatedBooks = selectedBibleBooks.filter(b => b !== book);
    } else {
      updatedBooks = [...selectedBibleBooks, book];
    }
    setSelectedBibleBooks(updatedBooks);
    form.setValue('bible_books', updatedBooks.join(', '), { shouldValidate: true });
  }

  const clearBibleBooks = () => {
    setSelectedBibleBooks([]);
    form.setValue('bible_books', '', { shouldValidate: true });
  }

  const [openBibleVerses, setOpenBibleVerses] = useState(false)
  const [bibleVerseSearch, setBibleVerseSearch] = useState('')
  const [selectedBibleVerses, setSelectedBibleVerses] = useState<string[]>([])

  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null)

  const { data: bibleVerses, isLoading } = useQuery(
    ['bibleVerses', selectedBook, selectedChapter],
    async () => {
      if (!selectedBook) return []
      const response = await axios.get('/api/bible-verses', {
        params: { book: selectedBook, chapter: selectedChapter },
      })
      return response.data
    },
    { enabled: !!selectedBook }
  )

  const filteredBibleVerses = useCallback(() => {
    if (!bibleVerses) return []
    return bibleVerses.filter((verse: any) =>
      verse.KJV_text.toLowerCase().includes(bibleVerseSearch.toLowerCase()) ||
      `${verse.book} ${verse.chapter}:${verse.verse}`.toLowerCase().includes(bibleVerseSearch.toLowerCase())
    )
  }, [bibleVerses, bibleVerseSearch])

  const bibleVerseRef = useRef<HTMLDivElement>(null)

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
  }

  const clearBibleVerses = () => {
    setSelectedBibleVerses([]);
    form.setValue('bible_verses', '', { shouldValidate: true });
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>BibleChorus - Upload Songs</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-8 pt-4 sm:pt-6 md:pt-8 lg:pt-10 xl:pt-12">Upload Songs</h1>
        
        <FormProvider {...form}>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8">
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
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (!checked) {
                                form.setValue("lyric_ai_prompt", undefined ?? "", { shouldValidate: true });
                              } else {
                                form.trigger("lyric_ai_prompt");
                              }
                            }}
                          />
                        </FormControl>
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
                        <Input placeholder="Enter song title" {...field} />
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
                        <Input placeholder="Enter artist name" {...field} />
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
                <FormField
                  control={form.control}
                  name="bible_translation_used"
                  render={({ field }) => (
                    <FormItem className="flex flex-col rounded-lg border p-4">
                      <FormLabel className="form-label">Bible Translation</FormLabel>
                      <Popover open={openTranslation} onOpenChange={setOpenTranslation}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openTranslation}
                              className="w-full justify-between"
                            >
                              {field.value || "Select translation..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <div className="p-2">
                            <Input
                              placeholder="Search translation..."
                              value={translationSearch}
                              onChange={(e) => setTranslationSearch(e.target.value)}
                              className="mb-2"
                            />
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
                                    setOpenTranslation(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === translation ? "opacity-100" : "opacity-0"
                                    )}
                                  />
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
                <FormField
                  control={form.control}
                  name="lyrics_scripture_adherence"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border p-4">
                      <FormLabel className="form-label">Scripture Adherence</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormField
                  control={form.control}
                  name="is_continuous_passage"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="form-label text-sm sm:text-base">Continuous Passage</FormLabel>
                        <FormDescription>
                          Is this a continuous passage?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bible_books"
                  render={({ field }) => (
                    <FormItem className="flex flex-col rounded-lg border p-4">
                      <FormLabel className="form-label">Bible Book(s) Included</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          setSelectedBook(value)
                          setSelectedChapter(null)
                          field.onChange(value)
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a Bible book" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BIBLE_BOOKS.map((book) => (
                            <SelectItem key={book} value={book}>
                              {book}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="form-message" />
                    </FormItem>
                  )}
                />

                {selectedBook && (
                  <FormField
                    control={form.control}
                    name="bible_chapter"
                    render={({ field }) => (
                      <FormItem className="flex flex-col rounded-lg border p-4">
                        <FormLabel className="form-label">Chapter</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            setSelectedChapter(value)
                            field.onChange(value)
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a chapter" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 150 }, (_, i) => i + 1).map((chapter) => (
                              <SelectItem key={chapter} value={chapter.toString()}>
                                {chapter}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="form-message" />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="bible_verses"
                  render={({ field }) => (
                    <FormItem className="flex flex-col rounded-lg border p-4">
                      <FormLabel className="form-label">Bible Verses Covered</FormLabel>
                      <Popover open={openBibleVerses} onOpenChange={setOpenBibleVerses}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openBibleVerses}
                              className="w-full justify-between"
                              disabled={!selectedBook}
                            >
                              {selectedBibleVerses.length > 0
                                ? `${selectedBibleVerses.length} selected`
                                : "Select Bible verses..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" ref={bibleVerseRef}>
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
                                Clear
                              </Button>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto">
                              {isLoading ? (
                                <div>Loading...</div>
                              ) : (
                                filteredBibleVerses().map((verse: any) => (
                                  <div
                                    key={`${verse.book} ${verse.chapter}:${verse.verse}`}
                                    className={cn(
                                      "flex cursor-pointer items-center rounded-md px-2 py-1 hover:bg-accent",
                                      selectedBibleVerses.includes(`${verse.book} ${verse.chapter}:${verse.verse}`) && "bg-accent"
                                    )}
                                    onClick={() => handleBibleVerseToggle(`${verse.book} ${verse.chapter}:${verse.verse}`)}
                                  >
                                    <div className="mr-2 h-4 w-4 border border-primary rounded flex items-center justify-center">
                                      {selectedBibleVerses.includes(`${verse.book} ${verse.chapter}:${verse.verse}`) && <Check className="h-3 w-3" />}
                                    </div>
                                    {`${verse.book} ${verse.chapter}:${verse.verse}`}
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
                {/* Add more Bible-related fields here */}
              </TabsContent>

              <TabsContent value="Upload">
                <FormField
                  control={form.control}
                  name="audio_file"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border p-4">
                      <FormLabel className="form-label">Audio File</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => field.onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage className="form-message" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="song_art_file"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border p-4">
                      <FormLabel className="form-label">Song Art</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => field.onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage className="form-message" />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button
                type="button"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit">Submit</Button>
              )}
            </div>
          </form>
        </FormProvider>
      </main>
    </div>
  )
}