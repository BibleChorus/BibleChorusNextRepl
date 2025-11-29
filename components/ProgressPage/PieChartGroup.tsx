import React from 'react'
import { PieChartCard } from './PieChartCard'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterOptions } from './Filters'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { X } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

interface PieChartGroupProps {
  chartData: any
  filterOptions: FilterOptions
  removeFilter: (filterType: keyof FilterOptions, value?: string) => void
}

export function PieChartGroup({ chartData, filterOptions, removeFilter }: PieChartGroupProps) {
  const isSmallScreen = useMediaQuery("(max-width: 768px)")
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

  const pieCharts = [
    {
      title: "Entire Bible",
      description: `${chartData.bibleTotal.filtered_bible_verses_covered.toLocaleString()} / ${chartData.bibleTotal.bible_total_verses.toLocaleString()} verses`,
      data: [
        {
          name: "covered",
          value: chartData.bibleTotal.filtered_bible_verses_covered,
          fill: theme.accent
        },
        {
          name: "uncovered",
          value: chartData.bibleTotal.bible_total_verses - chartData.bibleTotal.filtered_bible_verses_covered,
          fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
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
          fill: theme.accent
        },
        {
          name: "uncovered",
          value: chartData["Old Testament"].testament_total_verses - chartData["Old Testament"].filtered_testament_verses_covered,
          fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
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
          fill: theme.accent
        },
        {
          name: "uncovered",
          value: chartData["New Testament"].testament_total_verses - chartData["New Testament"].filtered_testament_verses_covered,
          fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      ],
      totalVerses: chartData["New Testament"].testament_total_verses
    }
  ]

  return (
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
            <div 
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: theme.accent }}
            />
          </div>
          <div>
            <CardTitle 
              className="text-2xl font-bold"
              style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}
            >
              Bible Coverage Overview
            </CardTitle>
            <p 
              className="text-sm mt-1"
              style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
            >
              Scripture coverage breakdown by testament
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
              <span 
                className="text-xs font-medium"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {tag.label}
              </span>
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
            {isSmallScreen ? (
              <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
                {pieCharts.map((chart, index) => (
                  <AccordionItem 
                    value={`item-${index}`} 
                    key={index} 
                    style={{ borderColor: theme.border }}
                  >
                    <AccordionTrigger 
                      className="text-lg font-semibold hover:no-underline"
                      style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}
                    >
                      {chart.title}
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <PieChartCard {...chart} />
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {pieCharts.map((chart, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="backdrop-blur-sm rounded-2xl p-4 sm:p-6 transition-all duration-300"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <PieChartCard {...chart} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
