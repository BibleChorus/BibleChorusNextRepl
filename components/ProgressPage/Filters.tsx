"use client"

import { Dispatch, SetStateAction, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, X, RefreshCw, Info } from "lucide-react" // Updated import
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export interface FilterOptions {
  lyricsAdherence: string[]
  isContinuous: "all" | "true" | "false"
  aiMusic: "all" | "true" | "false"
}

interface FiltersProps {
  filterOptions: FilterOptions
  setFilterOptions: Dispatch<SetStateAction<FilterOptions>>
  setIsFilterExpanded: Dispatch<SetStateAction<boolean>> // Add this line
}

export function Filters({ filterOptions, setFilterOptions, setIsFilterExpanded }: FiltersProps) {
  const [openLyricsAdherence, setOpenLyricsAdherence] = useState(false)

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

  const clearFilters = () => {
    setFilterOptions({
      lyricsAdherence: [],
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
      className="space-y-6 relative"
    >
      {/* Small X button in top right corner */}
      <button
        onClick={() => setIsFilterExpanded(false)}
        className="absolute top-0 right-0 -mt-2 -mr-2 w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 shadow-lg z-10"
        aria-label="Close filters"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl">
            <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Filters</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Adjust filters to refine your view of Bible coverage progress
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
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Popover open={openLyricsAdherence} onOpenChange={setOpenLyricsAdherence}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openLyricsAdherence}
              className="w-full justify-between bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 rounded-xl h-12"
            >
              {filterOptions.lyricsAdherence.length > 0
                ? `${filterOptions.lyricsAdherence.length} selected`
                : "Select lyrics adherence..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[calc(100vw-2rem)] max-w-[300px] p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 rounded-xl" 
            side="bottom" 
            align="center"
            sideOffset={4}
            avoidCollisions={true}
            collisionPadding={16}
          >
            <div className="p-3">
              {lyricsAdherenceOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center rounded-xl px-3 py-2 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-all duration-200",
                    filterOptions.lyricsAdherence.includes(option.value) && "bg-emerald-500/10 dark:bg-emerald-500/20"
                  )}
                  onClick={() => toggleLyricsAdherence(option.value)}
                >
                  <div className="mr-3 h-4 w-4 border-2 border-emerald-500 rounded flex items-center justify-center">
                    {filterOptions.lyricsAdherence.includes(option.value) && <Check className="h-3 w-3 text-emerald-500" />}
                  </div>
                  <span className="text-sm font-medium">{option.label}</span>
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
      <SelectContent 
        className="w-[calc(100vw-2rem)] max-w-[300px] bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 rounded-xl"
        position="popper"
        side="bottom"
        align="center"
        sideOffset={4}
        avoidCollisions={true}
        collisionPadding={16}
      >
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