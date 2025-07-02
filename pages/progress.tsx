"use client"

import React, { useEffect, useState } from "react"
import Head from "next/head"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Tooltip as RechartsTooltip, XAxis, YAxis, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Filters, FilterOptions } from "@/components/ProgressPage/Filters"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { Filter, X, HelpCircle, Sparkles, TrendingUp, BookOpen, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Separator } from "@/components/ui/separator"
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
  const isMobile = useMediaQuery("(max-width: 640px)")

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

  // For mobile, create grouped data with only books that have progress
  const mobileChartData = chartData
    ? barChartData
        .filter(book => book.filtered_book_percentage > 0)
        .sort((a, b) => b.filtered_book_percentage - a.filtered_book_percentage)
        .slice(0, 20) // Show top 20 books with progress
    : []

  // Mobile chart view state
  const [mobileChartView, setMobileChartView] = useState<'top' | 'all'>('top')

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

  // Calculate comprehensive stats
  const stats = chartData ? {
    totalVersesCovered: chartData.bibleTotal.filtered_bible_verses_covered,
    totalVerses: chartData.bibleTotal.bible_total_verses,
    overallProgress: chartData.bibleTotal.filtered_bible_percentage,
    oldTestamentProgress: chartData["Old Testament"].filtered_testament_percentage,
    newTestamentProgress: chartData["New Testament"].filtered_testament_percentage,
    booksWithProgress: [...(chartData["Old Testament"]?.books || []), ...(chartData["New Testament"]?.books || [])]
      .filter(book => book.filtered_book_percentage > 0).length
  } : {
    totalVersesCovered: 0,
    totalVerses: 0,
    overallProgress: 0,
    oldTestamentProgress: 0,
    newTestamentProgress: 0,
    booksWithProgress: 0
  }

  return (
    <>
      <Head>
        <title>BibleChorus - Progress Map</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-20 pt-12"
        >
          {/* Enhanced Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-teal-500/[0.06] to-cyan-500/[0.08] dark:from-emerald-500/[0.15] dark:via-teal-500/[0.12] dark:to-cyan-500/[0.15]"></div>
            <div className="absolute top-0 -left-8 w-96 h-96 bg-emerald-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
            <div className="absolute top-12 -right-8 w-80 h-80 bg-teal-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-12 left-32 w-96 h-96 bg-cyan-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(52,211,153,0.1),rgba(255,255,255,0))]"></div>
          </div>

          <div className="relative z-10 container mx-auto px-2 sm:px-4">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-cyan-500/20 backdrop-blur-md border border-emerald-500/20 dark:border-emerald-500/30 shadow-lg">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent font-semibold">
                    Progress Tracking
                  </span>
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
              >
                <span className="block text-slate-900 dark:text-white mb-2">Community</span>
                <span className="block relative">
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                    Progress
                  </span>
                  <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-full scale-x-0 animate-scale-x"></div>
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-8 text-xl text-slate-600 dark:text-slate-300 sm:text-2xl max-w-3xl mx-auto leading-relaxed"
              >
                Track our collective journey of setting 
                <span className="font-semibold text-slate-900 dark:text-white"> Scripture to song</span> and 
                <span className="font-semibold text-slate-900 dark:text-white"> covering God&apos;s Word</span>
              </motion.p>
            </div>

            {/* Enhanced Stats Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto"
            >
              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-6 sm:p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <BookOpen className="relative w-10 h-10 mx-auto mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent mb-2">{stats.totalVersesCovered.toLocaleString()}</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Verses Covered</div>
              </div>

              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-6 sm:p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <TrendingUp className="relative w-10 h-10 mx-auto mb-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent mb-2">{stats.overallProgress.toFixed(1)}%</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Overall Progress</div>
              </div>

              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-6 sm:p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <TrendingUp className="relative w-10 h-10 mx-auto mb-4 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-4xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent mb-2">{stats.booksWithProgress}</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Books with Songs</div>
              </div>

              <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-6 sm:p-8 text-center hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <Zap className="relative w-10 h-10 mx-auto mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">{stats.totalVerses.toLocaleString()}</div>
                <div className="relative text-sm font-medium text-slate-600 dark:text-slate-300">Total Bible Verses</div>
              </div>
            </motion.div>

            {/* Enhanced Floating Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="absolute top-16 right-16 hidden xl:block"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl backdrop-blur-sm animate-float shadow-xl"></div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="absolute bottom-16 left-16 hidden xl:block"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl backdrop-blur-sm animate-float animation-delay-2000 shadow-xl"></div>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Sticky Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="sticky top-0 z-30 bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border-b border-white/20 dark:border-slate-700/50 shadow-lg"
        >
          <div className="container mx-auto px-2 sm:px-4">
            <div className={`flex items-center justify-between transition-all duration-300 ${isHeaderVisible ? 'h-16' : 'h-12'}`}>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl backdrop-blur-sm border border-emerald-500/20 dark:border-emerald-500/30">
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className={`text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent transition-opacity duration-300 ${isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}>
                  Progress Map
                </h1>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-2 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 cursor-help">
                      <HelpCircle className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-sm">
                      This progress map shows the total Bible verses covered by all uploaded songs on BibleChorus. It reflects our community&apos;s collective effort in setting Scripture to music.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Enhanced Filter Section */}
          <AnimatePresence>
            {isFilterExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-white/20 dark:border-slate-700/50"
              >
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
                  <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-slate-700/30 p-4 sm:p-6">
                    <Filters 
                      filterOptions={filterOptions} 
                      setFilterOptions={setFilterOptions}
                      setIsFilterExpanded={setIsFilterExpanded}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Enhanced Filter Toggle Button */}
        {!isFilterExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsFilterExpanded(true)}
            className={`fixed right-3 sm:right-6 z-40 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 hover:scale-110 group ${
              isHeaderVisible ? 'top-20' : 'top-16'
            }`}
            aria-label="Expand filters"
          >
            <Filter className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-6 transition-transform duration-300" />
            <span className="absolute -top-2 -right-2 w-3 h-3 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full animate-pulse"></span>
          </motion.button>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-2 sm:px-4 -mt-8 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl p-4 sm:p-8 md:p-10"
          >
            {/* Enhanced Info Banner */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mb-6 sm:mb-10 p-4 sm:p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-cyan-500/20 backdrop-blur-sm border border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Community Progress Tracking</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    This progress map visualizes the Bible verses covered by all songs uploaded to BibleChorus. 
                    It represents our community&apos;s collective effort in setting Scripture to music and shows 
                    how we&apos;re gradually covering God&apos;s Word through song.
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 sm:gap-10">
              {/* Enhanced Pie Charts Section */}
              {chartData && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <PieChartGroup 
                    chartData={chartData} 
                    filterOptions={filterOptions} 
                    removeFilter={removeFilter}
                  />
                </motion.div>
              )}

              {/* Enhanced Bar Chart Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 pb-6 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10 border-b border-white/20 dark:border-slate-700/50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl backdrop-blur-sm border border-emerald-500/20 dark:border-emerald-500/30">
                        <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          Bible Coverage by Book
                        </CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Percentage of verses covered in each book of the Bible
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
                    {chartData && (
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 rounded-2xl -m-2 sm:-m-4"></div>
                        <div className="relative">
                          {isMobile ? (
                            // Mobile-optimized view
                            <div className="space-y-6">
                              {/* Mobile view toggle */}
                              <div className="flex items-center justify-center gap-2 mb-4">
                                <button
                                  onClick={() => setMobileChartView('top')}
                                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                                    mobileChartView === 'top'
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                                      : 'bg-white/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80'
                                  }`}
                                >
                                  Top Books ({mobileChartData.length})
                                </button>
                                <button
                                  onClick={() => setMobileChartView('all')}
                                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                                    mobileChartView === 'all'
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                                      : 'bg-white/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:hover:bg-slate-700/80'
                                  }`}
                                >
                                  All Books
                                </button>
                              </div>

                              {mobileChartView === 'top' ? (
                                // Top books list view - more readable on mobile
                                <div className="space-y-3">
                                  {mobileChartData.map((book, index) => (
                                    <motion.div
                                      key={book.book}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.3, delay: index * 0.05 }}
                                      className="flex items-center justify-between p-3 sm:p-4 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-slate-700/30 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300"
                                    >
                                                                              <div className="flex items-center gap-2 sm:gap-3">
                                          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                            {index + 1}
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
                                              {book.book}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                              <div className="w-16 sm:w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                              <div 
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(book.filtered_book_percentage, 100)}%` }}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                                                              <div className="flex flex-col items-end text-right min-w-[60px] sm:min-w-[80px]">
                                          <div className="text-base sm:text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight">
                                            {book.filtered_book_percentage.toFixed(1)}%
                                          </div>
                                          <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                                            covered
                                          </div>
                                        </div>
                                    </motion.div>
                                  ))}

                                  {mobileChartData.length === 0 && (
                                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                      <p>No books have been covered yet with the current filters.</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                // Compact chart view for all books
                                <ChartContainer
                                  className="min-h-[400px] max-w-full"
                                  config={{}}
                                >
                                  <BarChart
                                    data={barChartData}
                                    layout="vertical"
                                    width={400}
                                    height={Math.max(400, barChartData.length * 12)}
                                    margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
                                  >
                                    <defs>
                                      <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="50%" stopColor="#14b8a6" />
                                        <stop offset="100%" stopColor="#06b6d4" />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                                    <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                                    <YAxis 
                                      dataKey="book" 
                                      type="category" 
                                      width={70} 
                                      tick={{ fontSize: 9 }}
                                      interval={0}
                                      tickFormatter={(value) => value.length > 7 ? value.slice(0, 7) + '...' : value}
                                    />
                                    <RechartsTooltip content={<ChartTooltipContent showPercentage />} />
                                    <Bar 
                                      dataKey="filtered_book_percentage" 
                                      fill="url(#barGradient)"
                                      name="Percent Covered:"
                                      radius={[0, 4, 4, 0]}
                                    />
                                  </BarChart>
                                </ChartContainer>
                              )}
                            </div>
                          ) : (
                            // Desktop view (unchanged)
                            <ChartContainer
                              className="min-h-[400px] max-w-full overflow-x-auto"
                              config={{}}
                            >
                              <BarChart
                                data={barChartData}
                                layout="horizontal"
                                height={400}
                                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                              >
                                <defs>
                                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="50%" stopColor="#14b8a6" />
                                    <stop offset="100%" stopColor="#06b6d4" />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
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
                                <RechartsTooltip content={<ChartTooltipContent showPercentage />} />
                                <Bar 
                                  dataKey="filtered_book_percentage" 
                                  fill="url(#barGradient)"
                                  name="Percent Covered:"
                                  radius={[4, 4, 0, 0]}
                                >
                                  {barChartData.map((entry, index) => (
                                    <Cell key={`cell-${entry.book}-${index}`} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ChartContainer>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}