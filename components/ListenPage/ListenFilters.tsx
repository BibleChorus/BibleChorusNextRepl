"use client"

import { Dispatch, SetStateAction } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw, Info, X } from "lucide-react"
import { motion } from "framer-motion"
import { useTheme } from 'next-themes'

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    accentBgLight: isDark ? 'rgba(212, 175, 55, 0.1)' : 'rgba(191, 161, 48, 0.1)',
    accentBgMedium: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(191, 161, 48, 0.15)',
  };

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
          <div 
            className="p-2"
            style={{ 
              backgroundColor: theme.accentBgLight, 
              border: `1px solid ${theme.borderHover}` 
            }}
          >
            <Info className="h-5 w-5" style={{ color: theme.accent }} />
          </div>
          <div>
            <h2 
              className="text-lg font-bold"
              style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}
            >
              Filters
            </h2>
            <p 
              className="text-sm"
              style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
            >
              Refine your search to find the perfect songs
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2 transition-all duration-300"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${theme.border}`,
              color: theme.text,
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Clear Filters
          </Button>
          {setIsFilterExpanded && (
            <button
              onClick={() => setIsFilterExpanded(false)}
              className="text-sm flex items-center transition-colors duration-200 px-3 py-2"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                border: `1px solid ${theme.border}`,
                color: theme.textSecondary,
                fontFamily: "'Manrope', sans-serif",
              }}
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const theme = {
    text: isDark ? '#e5e5e5' : '#161616',
    accent: isDark ? '#d4af37' : '#bfa130',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
  };

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger 
        className="w-full transition-all duration-300 h-12"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          border: `1px solid ${theme.border}`,
          color: theme.text,
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        <SelectValue placeholder={title} />
      </SelectTrigger>
      <SelectContent 
        style={{
          backgroundColor: isDark ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          border: `1px solid ${theme.border}`,
        }}
      >
        <SelectGroup>
          <SelectLabel 
            className="font-semibold"
            style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}
          >
            {title}
          </SelectLabel>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="transition-all duration-200"
              style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
