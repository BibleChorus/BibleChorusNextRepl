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
    <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 pb-6 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl backdrop-blur-sm border border-emerald-500/20 dark:border-emerald-500/30">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Bible Coverage Overview</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Scripture coverage breakdown by testament
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
          {getFilterTags().map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 rounded-xl"
            >
              <span className="text-xs font-medium">{tag.label}</span>
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors duration-200"
                onClick={() => removeFilter(tag.type, tag.value)}
              />
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 rounded-2xl -m-2 sm:-m-4"></div>
          <div className="relative">
            {isSmallScreen ? (
              <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
                {pieCharts.map((chart, index) => (
                  <AccordionItem value={`item-${index}`} key={index} className="border-white/20 dark:border-slate-700/30">
                    <AccordionTrigger className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hover:no-underline">{chart.title}</AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <PieChartCard {...chart} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {pieCharts.map((chart, index) => (
                    <div key={index} className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-slate-700/30 p-4 sm:p-6 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300">
                    <PieChartCard {...chart} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}