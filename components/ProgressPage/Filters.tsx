"use client"

import { Dispatch, SetStateAction } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

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
    <div className="flex flex-col sm:flex-row gap-4">
      <div>
        <p className="font-medium mb-2">Lyrics Adherence</p>
        <ToggleGroup
          type="single"
          value={filterOptions.lyricsAdherence}
          onValueChange={(value) =>
            setFilterOptions((prev) => ({ ...prev, lyricsAdherence: value as FilterOptions['lyricsAdherence'] }))
          }
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="word_for_word">Word for Word</ToggleGroupItem>
          <ToggleGroupItem value="close_paraphrase">Close Paraphrase</ToggleGroupItem>
          <ToggleGroupItem value="creative_inspiration">Creative Inspiration</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div>
        <p className="font-medium mb-2">Continuous Passage</p>
        <ToggleGroup
          type="single"
          value={filterOptions.isContinuous}
          onValueChange={(value) =>
            setFilterOptions((prev) => ({ ...prev, isContinuous: value as FilterOptions['isContinuous'] }))
          }
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="true">Yes</ToggleGroupItem>
          <ToggleGroupItem value="false">No</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div>
        <p className="font-medium mb-2">AI Music</p>
        <ToggleGroup
          type="single"
          value={filterOptions.aiMusic}
          onValueChange={(value) =>
            setFilterOptions((prev) => ({ ...prev, aiMusic: value as FilterOptions['aiMusic'] }))
          }
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="true">Yes</ToggleGroupItem>
          <ToggleGroupItem value="false">No</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}