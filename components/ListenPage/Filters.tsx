"use client"

import { Dispatch, SetStateAction, useState, useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, X, RefreshCw, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { GENRES } from "@/lib/constants"

export interface FilterOptions {
  lyricsAdherence: string[]
  isContinuous: "all" | "true" | "false"
  aiMusic: "all" | "true" | "false"
  genres: string[] // Add this line
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

  const handleChange = (key: keyof FilterOptions, value: any) => {
    setFilterOptions((prev) => ({ ...prev, [key]: value }))
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

  const clearFilters = () => {
    setFilterOptions({
      lyricsAdherence: [],
      isContinuous: "all",
      aiMusic: "all",
      genres: [], // Add this line
    })
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold">Filters</h2>
          <Popover>
            <PopoverTrigger>
              <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
            </PopoverTrigger>
            <PopoverContent>
              <p className="text-sm">
                Adjust filters to refine your song list.
              </p>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Clear Filters
          </Button>
          <button
            onClick={() => setIsFilterExpanded(false)}
            className="text-sm flex items-center text-muted-foreground hover:text-foreground"
            aria-label="Close filters"
          >
            Close Filters
            <X className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Popover open={openLyricsAdherence} onOpenChange={setOpenLyricsAdherence}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openLyricsAdherence}
              className="w-full justify-between"
            >
              {filterOptions.lyricsAdherence.length > 0
                ? `${filterOptions.lyricsAdherence.length} selected`
                : "Select lyrics adherence..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
        />
        <Popover open={openGenres} onOpenChange={setOpenGenres}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openGenres}
              className="w-full justify-between"
            >
              {filterOptions.genres.length > 0
                ? `${filterOptions.genres.length} genre(s) selected`
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
                  onClick={() => handleChange('genres', [])}
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
      </div>
    </motion.div>
  )
}

interface FilterSelectProps {
  title: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

function FilterSelect({ title, value, onChange, options }: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={title} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{title}</SelectLabel>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}