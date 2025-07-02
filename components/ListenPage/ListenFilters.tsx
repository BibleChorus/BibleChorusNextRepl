"use client"

import { Dispatch, SetStateAction } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw, Info, X } from "lucide-react"
import { motion } from "framer-motion"

export interface FilterOptions {
  lyricsAdherence: "all" | "word_for_word" | "close_paraphrase" | "creative_inspiration"
  isContinuous: "all" | "true" | "false"
  aiMusic: "all" | "true" | "false"
}

interface FiltersProps {
  filterOptions: FilterOptions
  setFilterOptions: Dispatch<SetStateAction<FilterOptions>>
  setIsFilterExpanded?: Dispatch<SetStateAction<boolean>>
}

export function Filters({ filterOptions, setFilterOptions, setIsFilterExpanded }: FiltersProps) {
  const handleChange = (key: keyof FilterOptions, value: string) => {
    setFilterOptions((prev) => ({ ...prev, [key]: value as any }))
  }

  const clearFilters = () => {
    setFilterOptions({
      lyricsAdherence: "all",
      isContinuous: "all",
      aiMusic: "all",
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl">
            <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Filters</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Refine your search to find the perfect songs
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 rounded-xl"
          >
            <RefreshCw className="h-4 w-4" />
            Clear Filters
          </Button>
          {setIsFilterExpanded && (
            <button
              onClick={() => setIsFilterExpanded(false)}
              className="text-sm flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-700/80 px-3 py-2 rounded-xl"
              aria-label="Close filters"
            >
              Close Filters
              <X className="h-4 w-4 ml-1" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FilterSelect
          title="Lyrics Adherence"
          value={filterOptions.lyricsAdherence}
          onChange={(value) => handleChange('lyricsAdherence', value)}
          options={[
            { value: "all", label: "All Lyric Types" },
            { value: "word_for_word", label: "Word for Word" },
            { value: "close_paraphrase", label: "Close Paraphrase" },
            { value: "creative_inspiration", label: "Creative Inspiration" },
          ]}
        />
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
      <SelectTrigger className="w-full bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 rounded-xl h-12">
        <SelectValue placeholder={title} />
      </SelectTrigger>
      <SelectContent className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 rounded-xl">
        <SelectGroup>
          <SelectLabel className="text-emerald-600 dark:text-emerald-400 font-semibold">{title}</SelectLabel>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-all duration-200 rounded-lg"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}