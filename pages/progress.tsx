"use client"

import { useEffect, useState } from "react"
import Head from "next/head"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"
import { ProgressStats } from "@/components/ProgressStats"
import { Filters, FilterOptions } from "@/components/Filters"
import { Badge } from "@/components/ui/badge"

interface ChartData {
  "Old Testament": {
    books: Array<{
      book: string;
      verses_covered: number;
      filtered_verses_covered: number;
      total_verses: number;
      book_percentage: number;
      filtered_book_percentage: number;
    }>;
    testament_percentage: number;
    testament_verses_covered: number;
    testament_total_verses: number;
    filtered_testament_percentage: number;
    filtered_testament_verses_covered: number;
  };
  "New Testament": {
    books: Array<{
      book: string;
      verses_covered: number;
      filtered_verses_covered: number;
      total_verses: number;
      book_percentage: number;
      filtered_book_percentage: number;
    }>;
    testament_percentage: number;
    testament_verses_covered: number;
    testament_total_verses: number;
    filtered_testament_percentage: number;
    filtered_testament_verses_covered: number;
  };
  bibleTotal: {
    bible_percentage: number;
    bible_verses_covered: number;
    bible_total_verses: number;
    filtered_bible_percentage: number;
    filtered_bible_verses_covered: number;
  };
}

export default function Progress() {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    lyricsAdherence: "all",
    isContinuous: "all",
    aiMusic: "all",
  })

  useEffect(() => {
    // Fetch data from the API with applied filters
    const fetchData = async () => {
      const response = await fetch(`/api/progress?${new URLSearchParams(filterOptions as any)}`)
      const data = await response.json()
      setChartData(data)
    }
    fetchData()
  }, [filterOptions])

  const barChartData = chartData
    ? [...(chartData["Old Testament"]?.books || []), ...(chartData["New Testament"]?.books || [])]
        .map(book => ({
          book: book.book,
          filtered_book_percentage: Number(book.filtered_book_percentage.toFixed(2))
        }))
    : []

  const getFilterTags = (): string[] => {
    const tags: string[] = []
    if (filterOptions.lyricsAdherence !== "all") {
      tags.push(`Lyrics: ${filterOptions.lyricsAdherence.replace(/_/g, ' ')}`)
    }
    if (filterOptions.isContinuous !== "all") {
      tags.push(`Passage: ${filterOptions.isContinuous === "true" ? "Continuous" : "Non-continuous"}`)
    }
    if (filterOptions.aiMusic !== "all") {
      tags.push(`Music: ${filterOptions.aiMusic === "true" ? "AI" : "Human"}`)
    }
    return tags
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>BibleChorus - Progress Map</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Progress Map
        </h1>

        <Filters filterOptions={filterOptions} setFilterOptions={setFilterOptions} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {chartData && (
            <ProgressStats
              bibleTotal={chartData.bibleTotal}
              oldTestament={chartData["Old Testament"]}
              newTestament={chartData["New Testament"]}
            />
          )}

          <div className="lg:col-span-2">
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Bible Coverage by Book</h2>
                <div className="flex flex-wrap gap-2">
                  {getFilterTags().map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
              {chartData && (
                <ChartContainer className="min-h-[400px]" config={{}}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="book" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `${value.toFixed(2)}%`} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="filtered_book_percentage" fill="#8884d8" name="Filtered Coverage" />
                  </BarChart>
                </ChartContainer>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}