"use client"

import { useEffect, useState } from "react"
import Head from "next/head"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"
import { ProgressStats } from "@/components/ProgressPage/ProgressStats"
import { Filters, FilterOptions } from "@/components/ProgressPage/Filters"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { Filter } from "lucide-react"

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

  const isSmallScreen = useMediaQuery("(max-width: 768px)")

  const [isFilterExpanded, setIsFilterExpanded] = useState(true)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsHeaderVisible(scrollPosition < 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const barChartData = chartData
    ? [...(chartData["Old Testament"]?.books || []), ...(chartData["New Testament"]?.books || [])]
        .map((book, index) => ({
          book: book.book,
          filtered_book_percentage: Number(book.filtered_book_percentage.toFixed(2)),
          index: index // Add index for label display logic
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

      <div 
        className={`sticky top-14 z-10 transition-all duration-300 ${
          isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
        }`}
      >
        <div className="bg-gray-100 dark:bg-gray-800 shadow-md">
          <div className="container mx-auto px-4 flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Progress Map
            </h1>
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        className={`fixed top-16 right-4 z-20 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300`}
        aria-label={isFilterExpanded ? "Collapse filters" : "Expand filters"}
      >
        <Filter className="h-5 w-5" />
      </button>

      {isFilterExpanded && (
        <div className="sticky top-14 z-10 bg-gray-100 dark:bg-gray-800 shadow-md">
          <div className="container mx-auto px-4 py-4 transition-all duration-300">
            <Filters filterOptions={filterOptions} setFilterOptions={setFilterOptions} />
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
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
                <ChartContainer className={`${isSmallScreen ? 'min-h-[400px]' : 'min-h-[400px]'} max-w-full overflow-x-auto`} config={{}}>
                  <BarChart
                    data={barChartData}
                    layout={isSmallScreen ? "vertical" : "horizontal"}
                    width={isSmallScreen ? 1500 : undefined}
                    height={isSmallScreen ? Math.max(750, barChartData.length * 20) : 400}
                    margin={isSmallScreen ? { top: 5, right: 30, left: 0, bottom: 5 } : { top: 5, right: 30, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    {isSmallScreen ? (
                      <>
                        <XAxis type="number" tickFormatter={(value) => `${value.toFixed(2)}%`} />
                        <YAxis 
                          dataKey="book" 
                          type="category" 
                          width={50} 
                          tick={{ fontSize: 7 }}
                          interval={0}
                          tickFormatter={(value, index) => index % 5 === 0 ? value : ''}
                        />
                      </>
                    ) : (
                      <>
                        <XAxis 
                          dataKey="book" 
                          tick={{ fontSize: 11 }} 
                          angle={-40} 
                          textAnchor="end" 
                          interval={0} 
                          height={55}
                          tickFormatter={(value, index) => index % 5 === 0 ? value : ''}
                        />
                        <YAxis tickFormatter={(value) => `${value.toFixed(2)}%`} />
                      </>
                    )}
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