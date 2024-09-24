"use client"

import { Dispatch, SetStateAction } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface FilterOptions {
  lyricsAdherence: "all" | "word_for_word" | "close_paraphrase" | "creative_inspiration"
  isContinuous: "all" | "true" | "false"
  aiMusic: "all" | "true" | "false"
}

interface FiltersProps {
  filterOptions: FilterOptions
  setFilterOptions: Dispatch<SetStateAction<FilterOptions>>
}

export function Filters({ filterOptions, setFilterOptions }: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <Select
        value={filterOptions.lyricsAdherence}
        onValueChange={(value) =>
          setFilterOptions((prev) => ({ ...prev, lyricsAdherence: value as FilterOptions['lyricsAdherence'] }))
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Lyrics Adherence" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Lyrics</SelectItem>
          <SelectItem value="word_for_word">Word for Word</SelectItem>
          <SelectItem value="close_paraphrase">Close Paraphrase</SelectItem>
          <SelectItem value="creative_inspiration">Creative Inspiration</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filterOptions.isContinuous}
        onValueChange={(value) =>
          setFilterOptions((prev) => ({ ...prev, isContinuous: value as FilterOptions['isContinuous'] }))
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Continuous Passage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Passages</SelectItem>
          <SelectItem value="true">Continuous</SelectItem>
          <SelectItem value="false">Non-continuous</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filterOptions.aiMusic}
        onValueChange={(value) =>
          setFilterOptions((prev) => ({ ...prev, aiMusic: value as FilterOptions['aiMusic'] }))
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="AI Music" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Music</SelectItem>
          <SelectItem value="true">AI Generated</SelectItem>
          <SelectItem value="false">Human Composed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}