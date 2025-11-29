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
import { useTheme } from "next-themes"

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
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  
  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    separator: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(191, 161, 48, 0.2)',
  }

  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    lyricsAdherence: [],
    isContinuous: "all",
    aiMusic: "all",
  })

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`/api/progress?${new URLSearchParams(filterOptions as any)}`)
      const data = await response.json()
      setChartData(data)
    }
    fetchData()
  }, [filterOptions])

  const isSmallScreen = useMediaQuery("(max-width: 768px)")
  const isMobile = useMediaQuery("(max-width: 640px)")

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

  const mobileChartData = chartData
    ? barChartData
        .filter(book => book.filtered_book_percentage > 0)
        .sort((a, b) => b.filtered_book_percentage - a.filtered_book_percentage)
        .slice(0, 20)
    : []

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

      <div 
        className="min-h-screen transition-colors duration-300"
        style={{ backgroundColor: theme.bg }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden pb-20 pt-12"
        >
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0"
              style={{
                background: isDark 
                  ? 'radial-gradient(ellipse at 50% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 50%)'
                  : 'radial-gradient(ellipse at 50% 0%, rgba(191, 161, 48, 0.08) 0%, transparent 50%)'
              }}
            />
            <div 
              className="absolute inset-0"
              style={{
                background: isDark
                  ? 'radial-gradient(circle at 50% 120%, rgba(212, 175, 55, 0.05), transparent 60%)'
                  : 'radial-gradient(circle at 50% 120%, rgba(191, 161, 48, 0.05), transparent 60%)'
              }}
            />
          </div>

          <div className="relative z-10 container mx-auto px-2 sm:px-4">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-6"
              >
                <span 
                  className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-medium backdrop-blur-md shadow-lg"
                  style={{
                    backgroundColor: isDark ? 'rgba(212, 175, 55, 0.1)' : 'rgba(191, 161, 48, 0.1)',
                    border: `1px solid ${isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(191, 161, 48, 0.2)'}`,
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
                  <span 
                    className="font-semibold"
                    style={{ color: theme.accent, fontFamily: "'Manrope', sans-serif" }}
                  >
                    Progress Tracking
                  </span>
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
                style={{ fontFamily: "'Italiana', serif" }}
              >
                <span className="block mb-2" style={{ color: theme.text }}>Community</span>
                <span className="block relative">
                  <span style={{ color: theme.accent }}>
                    Progress
                  </span>
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="absolute -bottom-4 left-1/4 right-1/4 h-0.5 rounded-full origin-center"
                    style={{ backgroundColor: theme.accent }}
                  />
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-8 text-xl sm:text-2xl max-w-3xl mx-auto leading-relaxed"
                style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
              >
                Track our collective journey of setting 
                <span className="font-semibold" style={{ color: theme.text }}> Scripture to song</span> and 
                <span className="font-semibold" style={{ color: theme.text }}> covering God&apos;s Word</span>
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto"
            >
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                className="group relative backdrop-blur-xl rounded-2xl p-6 sm:p-8 text-center transition-all duration-500"
                style={{
                  backgroundColor: isDark ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ 
                    background: `radial-gradient(circle at center, ${isDark ? 'rgba(212, 175, 55, 0.08)' : 'rgba(191, 161, 48, 0.08)'}, transparent 70%)`
                  }}
                />
                <BookOpen className="relative w-10 h-10 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" style={{ color: theme.accent }} />
                <div className="relative text-4xl font-bold mb-2" style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}>{stats.totalVersesCovered.toLocaleString()}</div>
                <div className="relative text-sm font-medium" style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}>Verses Covered</div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                className="group relative backdrop-blur-xl rounded-2xl p-6 sm:p-8 text-center transition-all duration-500"
                style={{
                  backgroundColor: isDark ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ 
                    background: `radial-gradient(circle at center, ${isDark ? 'rgba(212, 175, 55, 0.08)' : 'rgba(191, 161, 48, 0.08)'}, transparent 70%)`
                  }}
                />
                <TrendingUp className="relative w-10 h-10 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" style={{ color: theme.accent }} />
                <div className="relative text-4xl font-bold mb-2" style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}>{stats.overallProgress.toFixed(1)}%</div>
                <div className="relative text-sm font-medium" style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}>Overall Progress</div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                className="group relative backdrop-blur-xl rounded-2xl p-6 sm:p-8 text-center transition-all duration-500"
                style={{
                  backgroundColor: isDark ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ 
                    background: `radial-gradient(circle at center, ${isDark ? 'rgba(212, 175, 55, 0.08)' : 'rgba(191, 161, 48, 0.08)'}, transparent 70%)`
                  }}
                />
                <TrendingUp className="relative w-10 h-10 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" style={{ color: theme.accent }} />
                <div className="relative text-4xl font-bold mb-2" style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}>{stats.booksWithProgress}</div>
                <div className="relative text-sm font-medium" style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}>Books with Songs</div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                className="group relative backdrop-blur-xl rounded-2xl p-6 sm:p-8 text-center transition-all duration-500"
                style={{
                  backgroundColor: isDark ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ 
                    background: `radial-gradient(circle at center, ${isDark ? 'rgba(212, 175, 55, 0.08)' : 'rgba(191, 161, 48, 0.08)'}, transparent 70%)`
                  }}
                />
                <Zap className="relative w-10 h-10 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" style={{ color: theme.accent }} />
                <div className="relative text-4xl font-bold mb-2" style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}>{stats.totalVerses.toLocaleString()}</div>
                <div className="relative text-sm font-medium" style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}>Total Bible Verses</div>
              </motion.div>
            </motion.div>

          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="sticky top-0 z-30 backdrop-blur-2xl shadow-lg"
          style={{
            backgroundColor: isDark ? 'rgba(10, 10, 10, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div className="container mx-auto px-2 sm:px-4">
            <div className={`flex items-center justify-between transition-all duration-300 ${isHeaderVisible ? 'h-16' : 'h-12'}`}>
              <div className="flex items-center gap-4">
                <h1 
                  className={`text-2xl font-bold transition-opacity duration-300 ${isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}
                  style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}
                >
                  Progress Map
                </h1>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isFilterExpanded && !isHeaderVisible && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ borderTop: `1px solid ${theme.border}` }}
              >
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
                  <div 
                    className="backdrop-blur-sm rounded-2xl p-4 sm:p-6"
                    style={{
                      backgroundColor: isDark ? 'rgba(10, 10, 10, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                      border: `1px solid ${theme.border}`,
                    }}
                  >
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

        <AnimatePresence>
          {isFilterExpanded && isHeaderVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
              onClick={() => setIsFilterExpanded(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-4xl mx-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div 
                  className="backdrop-blur-xl rounded-3xl p-4 sm:p-6 shadow-2xl"
                  style={{
                    backgroundColor: isDark ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <Filters 
                    filterOptions={filterOptions} 
                    setFilterOptions={setFilterOptions}
                    setIsFilterExpanded={setIsFilterExpanded}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isFilterExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFilterExpanded(true)}
            className={`fixed right-3 sm:right-6 z-40 p-3 sm:p-4 rounded-2xl text-white shadow-2xl transition-all duration-300 group ${
              isHeaderVisible ? 'top-20' : 'top-16'
            }`}
            style={{
              background: `linear-gradient(135deg, ${theme.accent}, ${isDark ? '#e5c349' : '#d4af37'})`,
            }}
            aria-label="Expand filters"
          >
            <Filter className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-6 transition-transform duration-300" />
            <span 
              className="absolute -top-2 -right-2 w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: theme.accent }}
            />
          </motion.button>
        )}

        <div className="container mx-auto px-2 sm:px-4 mt-8 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="backdrop-blur-2xl rounded-3xl shadow-2xl p-4 sm:p-8 md:p-10"
            style={{
              backgroundColor: isDark ? 'rgba(10, 10, 10, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              border: `1px solid ${theme.border}`,
            }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mb-6 sm:mb-10 p-4 sm:p-6 backdrop-blur-sm rounded-2xl"
              style={{
                backgroundColor: isDark ? 'rgba(212, 175, 55, 0.08)' : 'rgba(191, 161, 48, 0.08)',
                border: `1px solid ${isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(191, 161, 48, 0.2)'}`,
              }}
            >
              <div className="flex items-start gap-4">
                <div 
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(191, 161, 48, 0.2)' }}
                >
                  <Zap className="w-5 h-5" style={{ color: theme.accent }} />
                </div>
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: theme.text, fontFamily: "'Italiana', serif" }}>Community Progress Tracking</h3>
                  <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}>
                    This progress map visualizes the Bible verses covered by all songs uploaded to BibleChorus. 
                    It represents our community&apos;s collective effort in setting Scripture to music and shows 
                    how we&apos;re gradually covering God&apos;s Word through song.
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 sm:gap-10">
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

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <Card 
                  className="border-0 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden"
                  style={{
                    backgroundColor: isDark ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  <CardHeader 
                    className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 pb-6"
                    style={{
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, transparent 100%)'
                        : 'linear-gradient(135deg, rgba(191, 161, 48, 0.08) 0%, transparent 100%)',
                      borderBottom: `1px solid ${theme.border}`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="p-3 rounded-2xl backdrop-blur-sm"
                        style={{
                          backgroundColor: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(191, 161, 48, 0.15)',
                          border: `1px solid ${isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)'}`,
                        }}
                      >
                        <TrendingUp className="w-6 h-6" style={{ color: theme.accent }} />
                      </div>
                      <div>
                        <CardTitle 
                          className="text-2xl font-bold"
                          style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}
                        >
                          Bible Coverage by Book
                        </CardTitle>
                        <p className="text-sm mt-1" style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}>
                          Percentage of verses covered in each book of the Bible
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                      {getFilterTags().map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="flex items-center gap-2 px-3 py-1.5 backdrop-blur-sm transition-all duration-300 rounded-xl"
                          style={{
                            backgroundColor: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(191, 161, 48, 0.15)',
                            border: `1px solid ${isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)'}`,
                            color: theme.text,
                          }}
                        >
                          <span className="text-xs font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>{tag.label}</span>
                          <X
                            className="h-3 w-3 cursor-pointer transition-colors duration-200"
                            style={{ color: theme.textSecondary }}
                            onClick={() => removeFilter(tag.type, tag.value)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-8">
                    {chartData && (
                      <div className="relative">
                        <div 
                          className="absolute inset-0 rounded-2xl -m-2 sm:-m-4"
                          style={{
                            background: isDark 
                              ? 'radial-gradient(circle at center, rgba(212, 175, 55, 0.03), transparent 70%)'
                              : 'radial-gradient(circle at center, rgba(191, 161, 48, 0.03), transparent 70%)'
                          }}
                        />
                        <div className="relative">
                          {isMobile ? (
                            <div className="space-y-6">
                              <div className="flex items-center justify-center gap-2 mb-4">
                                <button
                                  onClick={() => setMobileChartView('top')}
                                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300`}
                                  style={{
                                    background: mobileChartView === 'top' 
                                      ? `linear-gradient(135deg, ${theme.accent}, ${isDark ? '#e5c349' : '#d4af37'})`
                                      : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                    color: mobileChartView === 'top' ? '#ffffff' : theme.textSecondary,
                                    fontFamily: "'Manrope', sans-serif",
                                  }}
                                >
                                  Top Books ({mobileChartData.length})
                                </button>
                                <button
                                  onClick={() => setMobileChartView('all')}
                                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300`}
                                  style={{
                                    background: mobileChartView === 'all' 
                                      ? `linear-gradient(135deg, ${theme.accent}, ${isDark ? '#e5c349' : '#d4af37'})`
                                      : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                    color: mobileChartView === 'all' ? '#ffffff' : theme.textSecondary,
                                    fontFamily: "'Manrope', sans-serif",
                                  }}
                                >
                                  All Books
                                </button>
                              </div>

                              {mobileChartView === 'top' ? (
                                <div className="space-y-3">
                                  {mobileChartData.map((book, index) => (
                                    <motion.div
                                      key={book.book}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.3, delay: index * 0.05 }}
                                      className="flex items-center justify-between p-3 sm:p-4 backdrop-blur-sm rounded-2xl transition-all duration-300"
                                      style={{
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                        border: `1px solid ${theme.border}`,
                                      }}
                                    >
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        <div 
                                          className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs sm:text-sm font-bold"
                                          style={{ 
                                            backgroundColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(191, 161, 48, 0.2)',
                                            color: theme.accent,
                                            fontFamily: "'Italiana', serif",
                                          }}
                                        >
                                          {index + 1}
                                        </div>
                                        <div>
                                          <h4 
                                            className="font-semibold text-sm sm:text-base"
                                            style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
                                          >
                                            {book.book}
                                          </h4>
                                          <div className="flex items-center gap-2 mt-1">
                                            <div 
                                              className="w-16 sm:w-20 h-2 rounded-full overflow-hidden"
                                              style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
                                            >
                                              <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(book.filtered_book_percentage, 100)}%` }}
                                                transition={{ duration: 0.8, delay: index * 0.05 }}
                                                className="h-full rounded-full"
                                                style={{ 
                                                  background: `linear-gradient(90deg, ${theme.accent}, ${isDark ? '#e5c349' : '#d4af37'})`
                                                }}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end text-right min-w-[60px] sm:min-w-[80px]">
                                        <div 
                                          className="text-base sm:text-lg font-bold leading-tight"
                                          style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}
                                        >
                                          {book.filtered_book_percentage.toFixed(1)}%
                                        </div>
                                        <div 
                                          className="text-xs leading-tight"
                                          style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
                                        >
                                          covered
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}

                                  {mobileChartData.length === 0 && (
                                    <div className="text-center py-12" style={{ color: theme.textSecondary }}>
                                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                      <p style={{ fontFamily: "'Manrope', sans-serif" }}>No books have been covered yet with the current filters.</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
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
                                      <linearGradient id="barGradientGold" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor={theme.accent} />
                                        <stop offset="100%" stopColor={isDark ? '#e5c349' : '#d4af37'} />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                                    <XAxis type="number" tickFormatter={(value) => `${value}%`} stroke={theme.textSecondary} />
                                    <YAxis 
                                      dataKey="book" 
                                      type="category" 
                                      width={70} 
                                      tick={{ fontSize: 9, fill: theme.textSecondary }}
                                      interval={0}
                                      tickFormatter={(value) => value.length > 7 ? value.slice(0, 7) + '...' : value}
                                    />
                                    <RechartsTooltip content={<ChartTooltipContent showPercentage />} />
                                    <Bar 
                                      dataKey="filtered_book_percentage" 
                                      fill="url(#barGradientGold)"
                                      name="Percent Covered:"
                                      radius={[0, 4, 4, 0]}
                                    />
                                  </BarChart>
                                </ChartContainer>
                              )}
                            </div>
                          ) : (
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
                                  <linearGradient id="barGradientGoldDesktop" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={theme.accent} />
                                    <stop offset="100%" stopColor={isDark ? '#e5c349' : '#d4af37'} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                                <XAxis 
                                  dataKey="book" 
                                  tick={{ fontSize: 11, fill: theme.textSecondary }} 
                                  angle={-40} 
                                  textAnchor="end" 
                                  interval={0} 
                                  height={55}
                                  tickFormatter={(value, index) => index % 5 === 0 ? value : ''}
                                />
                                <YAxis tickFormatter={(value) => `${value.toFixed(2)}%`} stroke={theme.textSecondary} />
                                <RechartsTooltip content={<ChartTooltipContent showPercentage />} />
                                <Bar 
                                  dataKey="filtered_book_percentage" 
                                  fill="url(#barGradientGoldDesktop)"
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
