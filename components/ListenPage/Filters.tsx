"use client"

import React, { Dispatch, SetStateAction, useState, useCallback, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, X, RefreshCw, Info, Mic, Music, Bot, Search, Tag, Book, AlignJustify, FileText, BookOpen, ChevronDown, Bookmark, Heart, Star, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { GENRES, BIBLE_BOOKS, BIBLE_TRANSLATIONS, AI_MUSIC_MODELS } from "@/lib/constants"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface FilterOptions {
  lyricsAdherence: string[]
  isContinuous: "all" | "true" | "false"
  aiMusic: "all" | "true" | "false"
  genres: string[]
  aiUsedForLyrics: "all" | "true" | "false"  // Updated from boolean
  musicModelUsed: string
  title: string
  artist: string
  bibleTranslation: string
  bibleBooks: string[]
  bibleChapters: { [book: string]: number[] }
  bibleVerses: string[]
  search: string
  showLikedSongs?: boolean;
  showBestMusically?: boolean;
  showBestLyrically?: boolean;
  showBestOverall?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  showMySongs: boolean;
}

interface FiltersProps {
  filterOptions: FilterOptions
  setFilterOptions: Dispatch<SetStateAction<FilterOptions>>
  setIsFilterExpanded: Dispatch<SetStateAction<boolean>>
}

export function Filters({ filterOptions, setFilterOptions, setIsFilterExpanded }: FiltersProps) {
  const [openLyricsAdherence, setOpenLyricsAdherence] = useState(false)
  const [openGenres, setOpenGenres] = useState(false)
  const [genreSearch, setGenreSearch] = useState('')
  const [openBibleBooks, setOpenBibleBooks] = useState(false)
  const [bibleBookSearch, setBibleBookSearch] = useState('')
  const [currentTab, setCurrentTab] = useState("AI Info")

  // State for Bible books
  const [openChapters, setOpenChapters] = useState(false)
  const [chapterSearch, setChapterSearch] = useState('')
  const [selectedChapters, setSelectedChapters] = useState<{ [book: string]: number[] }>(filterOptions.bibleChapters || {})

  // State for verses
  const [openBibleVerses, setOpenBibleVerses] = useState(false)
  const [bibleVerseSearch, setBibleVerseSearch] = useState('')
  const [selectedBibleVerses, setSelectedBibleVerses] = useState<string[]>(filterOptions.bibleVerses || [])

  // Add state for user interactions
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Handle window resize to adjust layout
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768); // Adjust breakpoint as needed
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to handle Like and Vote Type filters
  const toggleUserFilter = (key: keyof FilterOptions) => {
    setFilterOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Synchronize selectedChapters with filterOptions.bibleChapters
  useEffect(() => {
    setSelectedChapters(filterOptions.bibleChapters || {});
  }, [filterOptions.bibleChapters]);

  // Synchronize selectedBibleVerses with filterOptions.bibleVerses
  useEffect(() => {
    setSelectedBibleVerses(filterOptions.bibleVerses || []);
  }, [filterOptions.bibleVerses]);

  const handleChange = (key: keyof FilterOptions, value: any) => {
    const actualValue = value === '_empty_' ? '' : value;

    setFilterOptions((prev) => {
      const updatedFilters = { ...prev, [key]: actualValue };

      // If bibleBooks is cleared, reset bibleChapters and bibleVerses
      if (key === 'bibleBooks' && (value === '' || (Array.isArray(value) && value.length === 0))) {
        updatedFilters.bibleChapters = {};
        updatedFilters.bibleVerses = [];
        setSelectedChapters({});
        setSelectedBibleVerses([]);
      }

      // Synchronize the search term
      if (key === 'search') {
        setFilterOptions((prev) => ({ ...prev, search: value }))
      }

      return updatedFilters;
    });
  }

  const lyricsAdherenceOptions = [
    { value: "word_for_word", label: "Word for Word" },
    { value: "close_paraphrase", label: "Close Paraphrase" },
    { value: "creative_inspiration", label: "Creative Inspiration" },
  ]

  const toggleLyricsAdherence = (value: string) => {
    const currentValues = filterOptions.lyricsAdherence
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]
    handleChange('lyricsAdherence', newValues)
  }

  const filteredGenres = useCallback(() => {
    return GENRES.filter(genre =>
      genre.toLowerCase().includes(genreSearch.toLowerCase())
    )
  }, [genreSearch])

  const toggleGenre = (genre: string) => {
    const currentGenres = filterOptions.genres
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter((g) => g !== genre)
      : [...currentGenres, genre]
    handleChange('genres', newGenres)
  }

  const filteredBibleBooks = useCallback(() => {
    return BIBLE_BOOKS.filter(book =>
      book.toLowerCase().includes(bibleBookSearch.toLowerCase())
    )
  }, [bibleBookSearch])

  const toggleBibleBook = (book: string) => {
    const currentBooks = filterOptions.bibleBooks;
    const newBooks = currentBooks.includes(book)
      ? currentBooks.filter((b) => b !== book)
      : [...currentBooks, book];

    handleChange('bibleBooks', newBooks);

    // If no books are selected, clear chapters and verses
    if (newBooks.length === 0) {
      setSelectedChapters({});
      setSelectedBibleVerses([]);
      setFilterOptions((prev) => ({ ...prev, bibleChapters: {}, bibleVerses: [] }));
    }
  }

  const clearFilters = () => {
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
      bibleChapters: {},
      bibleVerses: [],
      search: "",
      showLikedSongs: false,
      showBestMusically: false,
      showBestLyrically: false,
      showBestOverall: false,
      sortBy: 'mostRecent',
      sortOrder: 'desc',
      showMySongs: false,
    })
  }

  const { data: availableChapters, isLoading: isLoadingChapters } = useQuery({
    queryKey: ['chapters', filterOptions.bibleBooks],
    queryFn: async () => {
      if (filterOptions.bibleBooks.length === 0) return {}
      const response = await axios.get('/api/chapters', {
        params: { books: filterOptions.bibleBooks.join(',') }
      })
      return response.data
    },
    enabled: filterOptions.bibleBooks.length > 0,
  })

  const handleChapterToggle = (book: string, chapter: number) => {
    setSelectedChapters((prev) => {
      const bookChapters = prev[book] || [];
      const newChapters = bookChapters.includes(chapter)
        ? bookChapters.filter((ch) => ch !== chapter)
        : [...bookChapters, chapter];

      const updatedChapters = { ...prev, [book]: newChapters };

      // Remove book key if no chapters are left
      if (newChapters.length === 0) {
        delete updatedChapters[book];
      }

      // Update filterOptions
      setFilterOptions((prevFilters) => {
        const updatedFilters = { ...prevFilters, bibleChapters: updatedChapters };

        // If no chapters are selected, clear verses
        if (Object.keys(updatedChapters).length === 0) {
          setSelectedBibleVerses([]);
          updatedFilters.bibleVerses = [];
        }

        return updatedFilters;
      });

      return updatedChapters;
    });
  }

  const { data: bibleVerses, isLoading: isLoadingVerses } = useQuery({
    queryKey: ['bibleVerses', filterOptions.bibleBooks, selectedChapters],
    queryFn: async () => {
      if (filterOptions.bibleBooks.length === 0) return {}
      const verses = await Promise.all(
        filterOptions.bibleBooks.flatMap(book => 
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
    enabled: filterOptions.bibleBooks.length > 0 && Object.keys(selectedChapters).length > 0,
  })

  const handleBibleVerseToggle = (verse: string) => {
    const updatedVerses = selectedBibleVerses.includes(verse)
      ? selectedBibleVerses.filter(v => v !== verse)
      : [...selectedBibleVerses, verse]
    setSelectedBibleVerses(updatedVerses)
    setFilterOptions(prev => ({ ...prev, bibleVerses: updatedVerses }))
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between mb-2 space-y-2 sm:space-y-0">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center space-x-1">
            <h2 className="text-sm font-semibold">Filters</h2>
            <Popover>
              <PopoverTrigger>
                <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent>
                <p className="text-xs">
                  Adjust filters to refine your song list.
                </p>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center space-x-1 sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-xs h-7 px-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterExpanded(false)}
              className="text-xs h-7 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Close
            </Button>
          </div>
        </div>

        {/* Like and Vote Type Icons */}
        <div className="flex items-center space-x-1 w-full sm:w-auto sm:justify-center justify-start">
          {/* Like Filter Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={filterOptions.showLikedSongs ? "secondary" : "outline"}
                size="icon"
                className="h-6 w-6"
                onClick={() => toggleUserFilter('showLikedSongs')}
              >
                <Heart className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Show Liked Songs</p>
            </TooltipContent>
          </Tooltip>

          {/* Vote Type Filter Icons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={filterOptions.showBestMusically ? "secondary" : "outline"}
                size="icon"
                className="h-6 w-6"
                onClick={() => toggleUserFilter('showBestMusically')}
              >
                <Music className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Best Musically Voted</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={filterOptions.showBestLyrically ? "secondary" : "outline"}
                size="icon"
                className="h-6 w-6"
                onClick={() => toggleUserFilter('showBestLyrically')}
              >
                <BookOpen className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Best Lyrically Voted</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={filterOptions.showBestOverall ? "secondary" : "outline"}
                size="icon"
                className="h-6 w-6"
                onClick={() => toggleUserFilter('showBestOverall')}
              >
                <Star className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Best Overall Voted</p>
            </TooltipContent>
          </Tooltip>

          {/* My Songs Filter Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={filterOptions.showMySongs ? "secondary" : "outline"}
                size="icon"
                className="h-6 w-6"
                onClick={() => toggleUserFilter('showMySongs')}
              >
                <User className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">My Songs</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Clear Filters and Close Filters Buttons (visible on larger screens) */}
        <div className="hidden sm:flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-1 h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFilterExpanded(false)}
            className="flex items-center gap-1 h-7 text-xs"
          >
            Close
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-8">
          <TabsTrigger value="AI Info" className="text-xs py-1 px-2">
            <Bot className="h-3 w-3 mr-1" />
            AI Info
          </TabsTrigger>
          <TabsTrigger value="Song Info" className="text-xs py-1 px-2">
            <Music className="h-3 w-3 mr-1" />
            Song Info
          </TabsTrigger>
          <TabsTrigger value="Bible Info" className="text-xs py-1 px-2">
            <Book className="h-3 w-3 mr-1" />
            Bible Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="AI Info" className="space-y-2">
          <FilterSelect
            title="Lyrics Source"
            value={filterOptions.aiUsedForLyrics}
            onChange={(value) => handleChange('aiUsedForLyrics', value)}
            options={[
              { value: "all", label: "All Lyrics Sources" },
              { value: "true", label: "AI Generated" },
              { value: "false", label: "Human Written" },
            ]}
            icon={<Mic className="h-4 w-4 mr-2" />}
          />
          <FilterSelect
            title="Music Source"
            value={filterOptions.aiMusic}
            onChange={(value) => handleChange('aiMusic', value)}
            options={[
              { value: "all", label: "All Music Sources" },
              { value: "true", label: "AI Generated" },
              { value: "false", label: "Human Composed" },
            ]}
            icon={<Music className="h-4 w-4 mr-2" />}
          />
          <FilterSelect
            title="AI Music Model"
            value={filterOptions.musicModelUsed}
            onChange={(value) => handleChange('musicModelUsed', value)}
            options={[
              { value: "", label: "All Models" },
              ...AI_MUSIC_MODELS.map(model => ({ value: model, label: model }))
            ]}
            icon={<Bot className="h-4 w-4 mr-2" />}
          />
        </TabsContent>

        <TabsContent value="Song Info" className="space-y-2">
          <div className="relative">
            <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search songs..."
              value={filterOptions.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="pl-6 h-7 text-xs"
            />
          </div>
          <Popover open={openGenres} onOpenChange={setOpenGenres}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openGenres}
                className="w-full justify-between h-7 text-xs"
              >
                <div className="flex items-center">
                  <Tag className="h-3 w-3 mr-1" />
                  {filterOptions.genres.length > 0
                    ? `${filterOptions.genres.length} genre(s) selected`
                    : "Select genres..."}
                </div>
                <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <div className="p-2">
                <div className="flex items-center justify-between pb-2">
                  <Input
                    placeholder="Search genres..."
                    value={genreSearch}
                    onChange={(e) => setGenreSearch(e.target.value)}
                    className="mr-2 h-7 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChange('genres', [])}
                    className="h-7 text-xs"
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
                        filterOptions.genres.includes(genre) && "bg-accent"
                      )}
                      onClick={() => toggleGenre(genre)}
                    >
                      <div className="mr-2 h-4 w-4 border border-primary rounded flex items-center justify-center">
                        {filterOptions.genres.includes(genre) && <Check className="h-3 w-3" />}
                      </div>
                      {genre}
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </TabsContent>

        <TabsContent value="Bible Info" className="space-y-2">
          <FilterSelect
            title="Bible Translation"
            value={filterOptions.bibleTranslation}
            onChange={(value) => handleChange('bibleTranslation', value)}
            options={[
              { value: "", label: "All Translations" },
              ...BIBLE_TRANSLATIONS.map(translation => ({ value: translation, label: translation }))
            ]}
            icon={<Book className="h-4 w-4 mr-2" />}
          />
          <Popover open={openLyricsAdherence} onOpenChange={setOpenLyricsAdherence}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openLyricsAdherence}
                className="w-full justify-between h-7 text-xs"
              >
                <div className="flex items-center">
                  <AlignJustify className="h-3 w-3 mr-1" />
                  {filterOptions.lyricsAdherence.length > 0
                    ? `${filterOptions.lyricsAdherence.length} selected`
                    : "Select lyrics adherence..."}
                </div>
                <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <div className="p-2">
                {lyricsAdherenceOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-center rounded-md px-2 py-1 hover:bg-accent",
                      filterOptions.lyricsAdherence.includes(option.value) && "bg-accent"
                    )}
                    onClick={() => toggleLyricsAdherence(option.value)}
                  >
                    <div className="mr-2 h-4 w-4 border border-primary rounded flex items-center justify-center">
                      {filterOptions.lyricsAdherence.includes(option.value) && <Check className="h-3 w-3" />}
                    </div>
                    {option.label}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <FilterSelect
            title="Passage Type"
            value={filterOptions.isContinuous}
            onChange={(value) => handleChange('isContinuous', value)}
            options={[
              { value: "all", label: "All Passage Types" },
              { value: "true", label: "Continuous" },
              { value: "false", label: "Non-continuous" },
            ]}
            icon={<FileText className="h-4 w-4 mr-2" />}
          />
          <Popover open={openBibleBooks} onOpenChange={setOpenBibleBooks}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openBibleBooks}
                className="w-full justify-between h-7 text-xs"
              >
                <div className="flex items-center">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {filterOptions.bibleBooks.length > 0
                    ? `${filterOptions.bibleBooks.length} book(s) selected`
                    : "Select Bible books..."}
                </div>
                <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <div className="p-2">
                <div className="flex items-center justify-between pb-2">
                  <Input
                    placeholder="Search Bible books..."
                    value={bibleBookSearch}
                    onChange={(e) => setBibleBookSearch(e.target.value)}
                    className="mr-2 h-7 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChange('bibleBooks', [])}
                    className="h-7 text-xs"
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
                        filterOptions.bibleBooks.includes(book) && "bg-accent"
                      )}
                      onClick={() => toggleBibleBook(book)}
                    >
                      <div className="mr-2 h-4 w-4 border border-primary rounded flex items-center justify-center">
                        {filterOptions.bibleBooks.includes(book) && <Check className="h-3 w-3" />}
                      </div>
                      {book}
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Chapters Selection */}
          {filterOptions.bibleBooks.length > 0 && (
            <Popover open={openChapters} onOpenChange={setOpenChapters}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openChapters}
                  className="w-full justify-between h-7 text-xs"
                >
                  <div className="flex items-center">
                    <Bookmark className="h-3 w-3 mr-1" />
                    {Object.values(selectedChapters).flat().length > 0
                      ? `${Object.values(selectedChapters).flat().length} chapter(s) selected`
                      : "Select chapters..."}
                  </div>
                  <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full max-w-[80vw] p-0"  // Updated here
                style={{ maxWidth: '80vw' }}        // Added inline style
              >
                <div className="p-2">
                  <div className="flex items-center justify-between pb-2">
                    <Input
                      placeholder="Search chapters..."
                      value={chapterSearch}
                      onChange={(e) => setChapterSearch(e.target.value)}
                      className="mr-2 h-7 text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedChapters({})
                        setFilterOptions(prev => ({ ...prev, bibleChapters: {} }))
                      }}
                      className="h-7 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {isLoadingChapters ? (
                      <div>Loading chapters...</div>
                    ) : (
                      Object.entries(availableChapters || {}).map(([book, chapters]) => (
                        <div key={book} className="mb-2">
                          <h4 className="font-semibold mb-1">{book}</h4>
                          <div className="flex flex-wrap gap-1">
                            {(chapters as number[]).filter(chapter => chapter.toString().includes(chapterSearch)).map((chapter) => (
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
          )}

          {/* Verses Selection */}
          {Object.keys(selectedChapters).length > 0 && (
            <Popover open={openBibleVerses} onOpenChange={setOpenBibleVerses}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openBibleVerses}
                  className="w-full justify-between h-7 text-xs"
                >
                  <div className="flex items-center">
                    <FileText className="h-3 w-3 mr-1" />
                    {selectedBibleVerses.length > 0
                      ? `${selectedBibleVerses.length} verse(s) selected`
                      : "Select Bible verses..."}
                  </div>
                  <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" style={{ maxWidth: '80vw' }}>
                <div className="p-2">
                  <div className="flex items-center justify-between pb-2">
                    <Input
                      placeholder="Search Bible verses..."
                      value={bibleVerseSearch}
                      onChange={(e) => setBibleVerseSearch(e.target.value)}
                      className="mr-2 h-7 text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBibleVerses([])
                        setFilterOptions(prev => ({ ...prev, bibleVerses: [] }))
                      }}
                      className="h-7 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {isLoadingVerses ? (
                      <div>Loading verses...</div>
                    ) : (
                      Object.entries(bibleVerses || {}).map(([book, chapters]) => (
                        <div key={book} className="mb-4">
                          {Object.entries(chapters).map(([chapter, verses]) => (
                            <div key={`${book}-${chapter}`} className="mb-2">
                              <h4 className="font-semibold mb-1">{`${book} ${chapter}`}</h4>
                              <div className="flex flex-wrap gap-1">
                                {(verses as any[]).filter((verse: any) =>
                                  verse.KJV_text.toLowerCase().includes(bibleVerseSearch.toLowerCase()) ||
                                  `${verse.book} ${verse.chapter}:${verse.verse}`.toLowerCase().includes(bibleVerseSearch.toLowerCase())
                                ).map((verse: any) => (
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
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

interface FilterSelectProps {
  title: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  icon: React.ReactNode
}

function FilterSelect({ title, value, onChange, options, icon }: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full h-8 text-xs">
        <div className="flex items-center">
          {React.cloneElement(icon as React.ReactElement, { className: "h-3 w-3 mr-1" })}
          <SelectValue placeholder={title} />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel className="text-xs">{title}</SelectLabel>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value || '_empty_'}
              className="text-xs"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}