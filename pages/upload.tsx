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
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { BIBLE_BOOKS, GENRES, AI_MUSIC_MODELS, BIBLE_TRANSLATIONS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z.object({
  // Step 1: AI Info
  ai_used_for_lyrics: z.boolean(),
  music_ai_generated: z.boolean(),
  lyric_ai_prompt: z.string().optional(),
  music_ai_prompt: z.string().optional(),
  music_model_used: z.string().optional(),

  // Step 2: Song Info
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  genre: z.string().min(1, "Genre is required"),
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

  // Step 4: Upload
  audio_file: z.instanceof(File).optional(),
  song_art_file: z.instanceof(File).optional(),
})

export default function Upload() {
  const [currentStep, setCurrentStep] = useState(0)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ai_used_for_lyrics: false,
      music_ai_generated: false,
      is_continuous_passage: false,
    },
    mode: "onChange", // This enables real-time validation
  })

  const [openGenre, setOpenGenre] = useState(false)
  const [openTranslation, setOpenTranslation] = useState(false)
  const [genreSearch, setGenreSearch] = useState('')
  const [translationSearch, setTranslationSearch] = useState('')

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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values)
    // Handle form submission here
  }

  const steps = ["AI Info", "Song Info", "Bible Info", "Upload"]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>BibleChorus - Upload Songs</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-8 pt-4 sm:pt-6 md:pt-8 lg:pt-10 xl:pt-12">Upload Songs</h1>
        
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-8">
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="form-label text-base">AI Used for Lyrics</FormLabel>
                        <FormDescription>
                          Was AI used to generate the lyrics?
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
                  name="music_ai_generated"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="form-label text-base">AI Generated Music</FormLabel>
                        <FormDescription>
                          Was the music generated by AI?
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
                      <FormLabel className="form-label">Artist</FormLabel>
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
                      <FormLabel className="form-label">Genre</FormLabel>
                      <Popover open={openGenre} onOpenChange={setOpenGenre}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openGenre}
                              className="w-full justify-between"
                            >
                              {field.value || "Select genre..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <div className="p-2">
                            <Input
                              placeholder="Search genre..."
                              value={genreSearch}
                              onChange={(e) => setGenreSearch(e.target.value)}
                              className="mb-2"
                            />
                            <div className="max-h-[200px] overflow-y-auto">
                              {filteredGenres().map((genre) => (
                                <div
                                  key={genre}
                                  className={cn(
                                    "flex cursor-pointer items-center rounded-md px-2 py-1 hover:bg-accent",
                                    field.value === genre && "bg-accent"
                                  )}
                                  onClick={() => {
                                    field.onChange(genre)
                                    setOpenGenre(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === genre ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {genre}
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