"use client"

import { Dispatch, SetStateAction, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, X, RefreshCw, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"

export interface FilterOptions {
  lyricsAdherence: string[]
  isContinuous: "all" | "true" | "false"
  aiMusic: "all" | "true" | "false"
}

interface FiltersProps {
  filterOptions: FilterOptions
  setFilterOptions: Dispatch<SetStateAction<FilterOptions>>
  setIsFilterExpanded: Dispatch<SetStateAction<boolean>>
}

export function Filters({ filterOptions, setFilterOptions, setIsFilterExpanded }: FiltersProps) {
  const [openLyricsAdherence, setOpenLyricsAdherence] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

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
  }

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
      <button
        onClick={() => setIsFilterExpanded(false)}
        className="absolute top-0 right-0 -mt-2 -mr-2 w-8 h-8 flex items-center justify-center transition-all duration-200 rounded-full backdrop-blur-sm shadow-lg z-10"
        style={{
          color: theme.textSecondary,
          backgroundColor: isDark ? 'rgba(10, 10, 10, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          border: `1px solid ${theme.border}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.borderHover
          e.currentTarget.style.color = theme.accent
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.border
          e.currentTarget.style.color = theme.textSecondary
        }}
        aria-label="Close filters"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div 
            className="p-2 rounded-xl"
            style={{ 
              backgroundColor: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(191, 161, 48, 0.15)',
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
              Adjust filters to refine your view of Bible coverage progress
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2 backdrop-blur-sm transition-all duration-300 rounded-xl"
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
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Popover open={openLyricsAdherence} onOpenChange={setOpenLyricsAdherence}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openLyricsAdherence}
              className="w-full justify-between backdrop-blur-sm transition-all duration-300 rounded-xl h-12"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                border: `1px solid ${theme.border}`,
                color: theme.text,
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              {filterOptions.lyricsAdherence.length > 0
                ? `${filterOptions.lyricsAdherence.length} selected`
                : "Select lyrics adherence..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 max-w-[calc(100vw-2rem)] p-0 backdrop-blur-xl rounded-xl" 
            style={{
              backgroundColor: isDark ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${theme.border}`,
            }}
            side="bottom" 
            align="center"
            sideOffset={4}
            avoidCollisions={true}
            collisionPadding={8}
          >
            <div className="p-3">
              {lyricsAdherenceOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center rounded-xl px-3 py-2 transition-all duration-200"
                  )}
                  style={{
                    backgroundColor: filterOptions.lyricsAdherence.includes(option.value) 
                      ? isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(191, 161, 48, 0.15)'
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!filterOptions.lyricsAdherence.includes(option.value)) {
                      e.currentTarget.style.backgroundColor = isDark ? 'rgba(212, 175, 55, 0.1)' : 'rgba(191, 161, 48, 0.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!filterOptions.lyricsAdherence.includes(option.value)) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                  onClick={() => toggleLyricsAdherence(option.value)}
                >
                  <div 
                    className="mr-3 h-4 w-4 border-2 rounded flex items-center justify-center"
                    style={{ borderColor: theme.accent }}
                  >
                    {filterOptions.lyricsAdherence.includes(option.value) && (
                      <Check className="h-3 w-3" style={{ color: theme.accent }} />
                    )}
                  </div>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
                  >
                    {option.label}
                  </span>
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
          theme={theme}
          isDark={isDark}
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
          theme={theme}
          isDark={isDark}
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
  theme: {
    bg: string
    bgCard: string
    text: string
    textSecondary: string
    accent: string
    accentHover: string
    border: string
    borderHover: string
    hoverBg: string
  }
  isDark: boolean
}

function FilterSelect({ title, value, onChange, options, theme, isDark }: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger 
        className="w-full backdrop-blur-sm transition-all duration-300 rounded-xl h-12"
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
        className="w-80 max-w-[calc(100vw-2rem)] backdrop-blur-xl rounded-xl"
        style={{
          backgroundColor: isDark ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          border: `1px solid ${theme.border}`,
        }}
        position="popper"
        side="bottom"
        align="center"
        sideOffset={4}
        avoidCollisions={true}
        collisionPadding={8}
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
              className="transition-all duration-200 rounded-lg"
              style={{ 
                color: theme.text,
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
