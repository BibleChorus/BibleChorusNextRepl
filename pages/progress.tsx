"use client"

import { useEffect, useState } from "react"
import Head from "next/head"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"
import { ProgressStats } from "@/components/ProgressStats"
import { Filters, FilterOptions } from "@/components/Filters"

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
    usesAI: "all",
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
              <h2 className="text-xl font-semibold mb-4">Bible Coverage by Book</h2>
              {chartData && (
                <ChartContainer className="min-h-[400px]" config={{}}>
                  <BarChart data={[
                    ...(chartData["Old Testament"]?.books || []),
                    ...(chartData["New Testament"]?.books || [])
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="book" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="book_percentage" fill="#8884d8" />
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