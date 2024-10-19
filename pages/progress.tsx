"use client"

import { useEffect, useState } from "react"
import Head from "next/head"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Tooltip as RechartsTooltip, XAxis, YAxis, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressStats } from "@/components/ProgressPage/ProgressStats"
import { Filters, FilterOptions } from "@/components/ProgressPage/Filters"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { Filter, X, Info, RefreshCw, HelpCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { PieChartGroup } from "@/components/ProgressPage/PieChartGroup"
import { BIBLE_BOOKS } from "@/lib/constants"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
    lyricsAdherence: [],
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

  // Change the initial state of isFilterExpanded to false
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
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
    ? BIBLE_BOOKS.map((book) => {
        const bookData = [...(chartData["Old Testament"]?.books || []), ...(chartData["New Testament"]?.books || [])]
          .find((b) => b.book === book);
        return {
          book: book,
          filtered_book_percentage: bookData ? Number(bookData.filtered_book_percentage.toFixed(2)) : 0,
        };
      })
    : []

  const removeFilter = (filterType: keyof FilterOptions, value?: string) => {
    setFilterOptions((prev) => {
      if (filterType === 'lyricsAdherence' && value) {
        return {
          ...prev,
          lyricsAdherence: prev.lyricsAdherence.filter(v => v !== value)
        }
      } else {
        return {
          ...prev,
          [filterType]: filterType === 'lyricsAdherence' ? [] : 'all'
        }
      }
    })
  }

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

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>BibleChorus - Progress Map</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Header Section */}
        <div className={`container mx-auto px-4 transition-all duration-300 ${isHeaderVisible ? 'h-16' : 'h-12'}`}>
          <div className="flex items-center justify-between h-full">
            <h1 className={`text-2xl font-bold text-foreground transition-opacity duration-300 ${isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}>
              Progress Map
            </h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-5 w-5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    This progress map shows the total Bible verses covered by all uploaded songs on BibleChorus. It reflects our community&apos;s collective effort in setting Scripture to music.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Filter Group Section */}
        <AnimatePresence>
          {isFilterExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
              <div className="container mx-auto px-4 py-4">
                <Filters 
                  filterOptions={filterOptions} 
                  setFilterOptions={setFilterOptions}
                  setIsFilterExpanded={setIsFilterExpanded} // Add this line
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Toggle Button */}
        {!isFilterExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsFilterExpanded(true)}
            className={`fixed right-4 z-20 p-2 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all duration-300 ${
              isHeaderVisible ? 'top-16' : 'top-12'
            }`}
            aria-label="Expand filters"
          >
            <Filter className="h-5 w-5" />
          </motion.button>
        )}
        <Separator />
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="text-sm text-muted-foreground mb-4">
          This progress map visualizes the Bible verses covered by all songs uploaded to BibleChorus. It represents our community&apos;s collective effort in setting Scripture to music.
        </div>
        
        <div className="grid grid-cols-1 gap-6 mt-6">
          {chartData && (
            <PieChartGroup 
              chartData={chartData} 
              filterOptions={filterOptions} 
              removeFilter={removeFilter}
            />
          )}

          <Card className="w-full">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Bible Coverage by Book</CardTitle>
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
              {chartData && (
                <ChartContainer
                  className={`${isSmallScreen ? 'min-h-[400px]' : 'min-h-[400px]'} max-w-full overflow-x-auto`}
                  config={{}}
                >
                  <BarChart
                    key={`bar-chart-${isSmallScreen ? 'vertical' : 'horizontal'}`} // Add key prop here
                    data={barChartData}
                    layout={isSmallScreen ? "vertical" : "horizontal"}
                    width={isSmallScreen ? 750 : undefined}
                    height={isSmallScreen ? Math.max(750, barChartData.length * 20) : 400}
                    margin={isSmallScreen ? { top: 5, right: 20, left: -43, bottom: 5 } : { top: 5, right: 30, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    {isSmallScreen ? (
                      <>
                        <XAxis type="number" tickFormatter={(value) => `${value.toFixed(2)}%`} />
                        <YAxis 
                          dataKey="book" 
                          type="category" 
                          width={100} 
                          tick={{ fontSize: 8 }}
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
                    <RechartsTooltip content={<ChartTooltipContent showPercentage />} />
                    <Bar 
                      dataKey="filtered_book_percentage" 
                      fill="#8884d8" 
                      name="Percent Covered:"
                    >
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${entry.book}-${index}`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
