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
import { Filter, X } from "lucide-react"

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

      <div className="sticky top-0 z-20 bg-gray-100 dark:bg-gray-800 shadow-md transition-all duration-300">
        {/* Header Section */}
        <div className={`container mx-auto px-4 transition-all duration-300 ${isHeaderVisible ? 'h-16' : 'h-12'}`}>
          <div className="flex items-center justify-between h-full">
            <h1 className={`text-2xl font-bold text-gray-800 dark:text-gray-100 transition-opacity duration-300 ${isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}>
              Progress Map
            </h1>
          </div>
        </div>

        {/* Filter Group Section */}
        {isFilterExpanded && (
          <div className="bg-gray-100 dark:bg-gray-800">
            <div className="container mx-auto px-4 py-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  onClick={() => setIsFilterExpanded(false)}
                  className="text-sm flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                  aria-label="Close filters"
                >
                  Close Filters
                  <X className="h-4 w-4 ml-1" />
                </button>
              </div>
              <Filters filterOptions={filterOptions} setFilterOptions={setFilterOptions} />
            </div>
          </div>
        )}

        {/* Filter Toggle Button */}
        {!isFilterExpanded && (
          <button
            onClick={() => setIsFilterExpanded(true)}
            className={`fixed right-4 z-20 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 ${
              isHeaderVisible ? 'top-16' : 'top-12'
            }`}
            aria-label="Expand filters"
          >
            <Filter className="h-5 w-5" />
          </button>
        )}
      </div>

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