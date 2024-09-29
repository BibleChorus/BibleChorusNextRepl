import React from 'react'
import { PieChartCard } from './PieChartCard'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterOptions } from './Filters'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useMediaQuery } from "@/hooks/useMediaQuery"

interface PieChartGroupProps {
  chartData: any // Replace 'any' with the actual type of your chartData
  filterOptions: FilterOptions
}

export function PieChartGroup({ chartData, filterOptions }: PieChartGroupProps) {
  const isSmallScreen = useMediaQuery("(max-width: 768px)")

  const getFilterTags = (): string[] => {
    const tags: string[] = []
    if (filterOptions.lyricsAdherence.length > 0) {
      const formattedAdherence = filterOptions.lyricsAdherence
        .map(adherence => adherence.replace(/_/g, ' '))
        .join(', ');
      tags.push(`Lyrics: ${formattedAdherence}`);
    }
    if (filterOptions.isContinuous !== "all") {
      tags.push(`Passage: ${filterOptions.isContinuous === "true" ? "Continuous" : "Non-continuous"}`)
    }
    if (filterOptions.aiMusic !== "all") {
      tags.push(`Music: ${filterOptions.aiMusic === "true" ? "AI" : "Human"}`)
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
            <Badge key={index} variant="secondary">{tag}</Badge>
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