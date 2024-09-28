"use client"

import { Dispatch, SetStateAction } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select"
import { motion } from "framer-motion"

export interface FilterOptions {
  lyricsAdherence: "all" | "word_for_word" | "close_paraphrase" | "creative_inspiration"
  isContinuous: "all" | "true" | "false"
  aiMusic: "all" | "true" | "false"
  // Add more filter options here in the future
}

interface FiltersProps {
  filterOptions: FilterOptions
  setFilterOptions: Dispatch<SetStateAction<FilterOptions>>
}

export function Filters({ filterOptions, setFilterOptions }: FiltersProps) {
  const handleChange = (key: keyof FilterOptions, value: string) => {
    setFilterOptions((prev) => ({ ...prev, [key]: value as any }))
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        {/* Add more filter selects here in the future */}
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