import React from 'react'
import { PieChartCard } from './PieChartCard'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterOptions } from './Filters'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { X } from "lucide-react"

interface PieChartGroupProps {
  chartData: any // Replace 'any' with the actual type of your chartData
  filterOptions: FilterOptions
  removeFilter: (filterType: keyof FilterOptions, value?: string) => void
}

export function PieChartGroup({ chartData, filterOptions, removeFilter }: PieChartGroupProps) {
  const isSmallScreen = useMediaQuery("(max-width: 768px)")

  const getFilterTags = (): { type: keyof FilterOptions; label: string; value?: string }[] => {
    const tags: { type: keyof FilterOptions; label: string; value?: string }[] = []
    if (filterOptions.lyricsAdherence.length > 0) {
      filterOptions.lyricsAdherence.forEach(value => {
        tags.push({
          type: 'lyricsAdherence',
          label: `Lyrics: ${value.replace(/_/g, ' ')}`,
          value
        })
      })
    }
    if (filterOptions.isContinuous !== "all") {
      tags.push({
        type: 'isContinuous',
        label: `Passage: ${filterOptions.isContinuous === "true" ? "Continuous" : "Non-continuous"}`
      })
    }
    if (filterOptions.aiMusic !== "all") {
      tags.push({
        type: 'aiMusic',
        label: `Music: ${filterOptions.aiMusic === "true" ? "AI" : "Human"}`
      })
    }
    return tags
  }

  const pieCharts = [
    {
      title: "Entire Bible",
      description: `${chartData.bibleTotal.filtered_bible_verses_covered.toLocaleString()} / ${chartData.bibleTotal.bible_total_verses.toLocaleString()} verses`,
      data: [
        {
          name: "covered",
          value: chartData.bibleTotal.filtered_bible_verses_covered,
          fill: "hsl(var(--chart-purple))"
        },
        {
          name: "uncovered",
          value: chartData.bibleTotal.bible_total_verses - chartData.bibleTotal.filtered_bible_verses_covered,
          fill: "hsl(var(--chart-uncovered))"
        }
      ],
      totalVerses: chartData.bibleTotal.bible_total_verses
    },
    {
      title: "Old Testament",
      description: `${chartData["Old Testament"].filtered_testament_verses_covered.toLocaleString()} / ${chartData["Old Testament"].testament_total_verses.toLocaleString()} verses`,
      data: [
        {
          name: "covered",
          value: chartData["Old Testament"].filtered_testament_verses_covered,
          fill: "hsl(var(--chart-purple))"
        },
        {
          name: "uncovered",
          value: chartData["Old Testament"].testament_total_verses - chartData["Old Testament"].filtered_testament_verses_covered,
          fill: "hsl(var(--chart-uncovered))"
        }
      ],
      totalVerses: chartData["Old Testament"].testament_total_verses
    },
    {
      title: "New Testament",
      description: `${chartData["New Testament"].filtered_testament_verses_covered.toLocaleString()} / ${chartData["New Testament"].testament_total_verses.toLocaleString()} verses`,
      data: [
        {
          name: "covered",
          value: chartData["New Testament"].filtered_testament_verses_covered,
          fill: "hsl(var(--chart-purple))"
        },
        {
          name: "uncovered",
          value: chartData["New Testament"].testament_total_verses - chartData["New Testament"].filtered_testament_verses_covered,
          fill: "hsl(var(--chart-uncovered))"
        }
      ],
      totalVerses: chartData["New Testament"].testament_total_verses
    }
  ]

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">Bible Coverage Overview</CardTitle>
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
          {getFilterTags().map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {tag.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter(tag.type, tag.value)}
              />
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isSmallScreen ? (
          <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
            {pieCharts.map((chart, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>{chart.title}</AccordionTrigger>
                <AccordionContent>
                  <PieChartCard {...chart} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pieCharts.map((chart, index) => (
              <PieChartCard key={index} {...chart} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}